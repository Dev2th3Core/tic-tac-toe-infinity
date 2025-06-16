import { Server as NetServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { NextApiRequest, NextApiResponse } from 'next';
import { Player } from '../components/bots/types';
import { Game } from './game';
import { Logger, ErrorHandler, PlayerError } from './errors';

// Define the type for the server with Socket.IO
type ServerWithSocketIO = NetServer & {
  io?: SocketIOServer;
};

// Define the type for the response with socket
type ResponseWithSocket = NextApiResponse & {
  socket: {
    server: ServerWithSocketIO;
  };
};

// In-memory storage for game state
const waitingPlayers: string[] = [];
const activeGames: Map<string, Game> = new Map();

// Rate limiting
const RATE_LIMIT_WINDOW = 1000; // 1 second
const MAX_MOVES_PER_WINDOW = 5;
const playerMoveCounts = new Map<string, { count: number, timestamp: number }>();

// Initialize logger and error handler
const logger = Logger.getInstance();
const errorHandler = ErrorHandler.getInstance();

// Helper function to generate consistent game ID
const generateGameId = (player1: string, player2: string): string => {
  // Sort player IDs to ensure consistent game ID regardless of who joins first
  return [player1, player2].sort().join('-');
};

// Helper function to generate request ID
const generateRequestId = (): string => {
  return Math.random().toString(36).substring(2, 15);
};

// Rate limiting check
const checkRateLimit = (playerId: string): boolean => {
  const now = Date.now();
  const playerData = playerMoveCounts.get(playerId);

  if (!playerData || now - playerData.timestamp > RATE_LIMIT_WINDOW) {
    playerMoveCounts.set(playerId, { count: 1, timestamp: now });
    return true;
  }

  if (playerData.count >= MAX_MOVES_PER_WINDOW) {
    return false;
  }

  playerData.count++;
  return true;
};

// Helper function to generate move data
const generateMoveData = (
  game: Game,
  currentPlayer: { id: string, symbol: Player },
  data: any,
  isMover: boolean,
  isWinner: boolean = false
) => {
  const commonData = {
    currentPlayer: game.getCurrentPlayer(),
    isBoardFull: game.isBoardFull(),
    newGridSize: game.getGridSize(),
    isWinner,
    winner: isWinner ? currentPlayer.symbol : undefined
  };

  if (isMover) {
    return commonData;
  }

  return {
    ...commonData,
    row: data.row,
    col: data.col,
    player: currentPlayer.symbol,
    playerId: currentPlayer.id
  };
};

// Game creation and player matching
const createGame = (io: SocketIOServer, opponentId: string, socketId: string, requestId: string) => {
  const gameId = generateGameId(opponentId, socketId);
  logger.info('Creating new game', { gameId, players: [opponentId, socketId], requestId });
  
  const firstPlayer: Player = Math.random() < 0.5 ? 'X' : 'O';
  const secondPlayer: Player = firstPlayer === 'X' ? 'O' : 'X';
  
  const game = new Game([
    { id: opponentId, symbol: firstPlayer },
    { id: socketId, symbol: secondPlayer }
  ]);
  
  activeGames.set(gameId, game);
  logger.info('Game created and added to active games', { gameId, requestId });

  // Notify first player (opponent)
  const firstPlayerData = { 
    gameId, 
    opponent: socketId,
    isFirstPlayer: true,
    currentPlayer: firstPlayer,
    playerSymbol: firstPlayer
  };
  io.to(opponentId).emit('gameFound', firstPlayerData);

  // Notify second player (current socket)
  const secondPlayerData = { 
    gameId, 
    opponent: opponentId,
    isFirstPlayer: false,
    currentPlayer: firstPlayer,
    playerSymbol: secondPlayer
  };
  io.to(socketId).emit('gameFound', secondPlayerData);
  logger.info('Game found notifications sent', { gameId, requestId });
};

// Handle winning move
const handleWinningMove = (
  io: SocketIOServer,
  game: Game,
  data: any,
  currentPlayer: { id: string, symbol: Player },
  requestId: string
) => {
  logger.info('Winning move detected, ending game', { gameId: data.gameId, requestId });
  
  // Generate move data for both players
  const moverData = generateMoveData(game, currentPlayer, data, true, true);
  const opponentData = generateMoveData(game, currentPlayer, data, false, true);

  // Send appropriate data to each player
  const opponent = game.getOpponent(currentPlayer.id);
  if (opponent) {
    io.to(opponent.id).emit('moveMade', opponentData);
  }
  io.to(currentPlayer.id).emit('moveMade', moverData);

  activeGames.delete(data.gameId);
};

// Handle regular move
const handleRegularMove = (
  io: SocketIOServer,
  game: Game,
  data: any,
  currentPlayer: { id: string, symbol: Player },
  requestId: string
) => {
  // Generate move data for both players
  const moverData = generateMoveData(game, currentPlayer, data, true);
  const opponentData = generateMoveData(game, currentPlayer, data, false);
  
  const wasBoardFull = game.isBoardFull();
  if (wasBoardFull) {
    logger.info('Board is full, expanding grid', { gameId: data.gameId, requestId });
    game.expandBoard();
    moverData.newGridSize = game.getGridSize();
    opponentData.newGridSize = game.getGridSize();
  }

  // Send appropriate data to each player
  const opponent = game.getOpponent(currentPlayer.id);
  if (opponent) {
    io.to(opponent.id).emit('moveMade', opponentData);
  }
  io.to(currentPlayer.id).emit('moveMade', moverData);
};

// Handle player disconnection
const handleDisconnection = (io: SocketIOServer, socketId: string) => {
  logger.info('Client disconnected', { socketId });
  
  // Remove from waiting list if present
  const waitingIndex = waitingPlayers.indexOf(socketId);
  if (waitingIndex !== -1) {
    logger.info('Removing from waiting list', { socketId });
    waitingPlayers.splice(waitingIndex, 1);
  }

  // Handle active games
  activeGames.forEach((game, gameId) => {
    if (game.getPlayers().some(p => p.id === socketId)) {
      const opponent = game.getOpponent(socketId);
      if (opponent) {
        logger.info('Notifying opponent of disconnection', {
          gameId,
          disconnectedPlayer: socketId,
          opponent: opponent.id
        });
        io.to(opponent.id).emit('opponentDisconnected');
      }
      logger.info('Removing game', { gameId });
      activeGames.delete(gameId);
    }
  });
};

export default function handler(req: NextApiRequest, res: ResponseWithSocket) {
  if (!res.socket.server.io) {
    const httpServer: NetServer = res.socket.server;
    const io = new SocketIOServer(httpServer, {
      path: '/api/socket',
      addTrailingSlash: false,
    });

    io.on('connection', (socket) => {
      logger.info('Client connected', { socketId: socket.id });

      // Handle player looking for a game
      socket.on('findGame', () => {
        const requestId = generateRequestId();
        try {
          logger.info('Player looking for game', { socketId: socket.id, requestId });
          logger.debug('Current waiting players', { waitingPlayers, requestId });

          if (waitingPlayers.length > 0) {
            const opponentId = waitingPlayers.shift()!;
            try {
              createGame(io, opponentId, socket.id, requestId);
            } catch (error) {
              logger.error('Error creating game', error as Error, { gameId: generateGameId(opponentId, socket.id), requestId });
              socket.emit('error', 'Failed to create game');
            }
          } else {
            logger.info('No opponent found, adding to waiting list', { socketId: socket.id, requestId });
            waitingPlayers.push(socket.id);
            socket.emit('waitingForOpponent');
          }
        } catch (error) {
          logger.error('Error in findGame handler', error as Error, { socketId: socket.id, requestId });
          socket.emit('error', 'An error occurred while finding a game');
        }
      });

      // Handle game moves
      socket.on('makeMove', (data) => {
        const requestId = generateRequestId();
        try {
          // Rate limiting check
          if (!checkRateLimit(socket.id)) {
            logger.warn('Rate limit exceeded', { socketId: socket.id, requestId });
            socket.emit('error', 'Too many moves. Please wait a moment.');
            return;
          }

          logger.info('Move received', { data, socketId: socket.id, requestId });
          
          // Validate game exists
          const game = activeGames.get(data.gameId);
          errorHandler.validateGameState(game, data.gameId);

          // Get current player's symbol
          const currentPlayer = game!.getPlayerBySymbol(game!.getCurrentPlayer());
          if (!currentPlayer || currentPlayer.id !== socket.id) {
            throw new PlayerError(`Not player's turn: ${socket.id}`);
          }

          // Make the move
          const moveSuccess = game!.makeMove(data.row, data.col, currentPlayer.symbol);
          if (!moveSuccess) {
            logger.warn('Invalid move attempted', { data, socketId: socket.id, requestId });
            return;
          }

          // Handle move based on whether it's a winning move
          if (data.isWinningMove === true) {
            handleWinningMove(io, game!, data, currentPlayer, requestId);
          } else {
            handleRegularMove(io, game!, data, currentPlayer, requestId);
          }
        } catch (error) {
          logger.error('Error processing move', error as Error, { data, socketId: socket.id, requestId });
          socket.emit('error', error instanceof Error ? error.message : 'An error occurred while processing the move');
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => handleDisconnection(io, socket.id));
    });

    res.socket.server.io = io;
  }
  res.end();
} 