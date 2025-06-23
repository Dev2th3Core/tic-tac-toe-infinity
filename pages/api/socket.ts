import { Server as NetServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { NextApiRequest, NextApiResponse } from 'next';
import { Player } from '../../app/components/bots/types';
import { Game } from './game';
import { Logger, ErrorHandler, PlayerError, GameStateError } from './errors';
import { kv } from '@vercel/kv';

interface GameState {
  players: { id: string, symbol: Player }[];
  board: Player[][];
  currentPlayer: Player;
  gridSize: number;
  winStreak: number;
  filledCells: number;
}

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
  game: InstanceType<typeof Game>,
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
const createGame = async (io: SocketIOServer, opponentId: string, socketId: string, requestId: string) => {
  const gameId = generateGameId(opponentId, socketId);
  logger.info('Creating new game', { gameId, players: [opponentId, socketId], requestId });
  
  const firstPlayer: Player = Math.random() < 0.5 ? 'X' : 'O';
  const secondPlayer: Player = firstPlayer === 'X' ? 'O' : 'X';
  
  const game = new Game([
    { id: opponentId, symbol: firstPlayer },
    { id: socketId, symbol: secondPlayer }
  ]);
  
  await kv.set(`game:${gameId}`, game.getState());
  await kv.set(`player:${socketId}`, gameId);
  await kv.set(`player:${opponentId}`, gameId);
  logger.info('Game created and added to active games', { gameId, requestId });

  // Notify first player (opponent)
  io.to(opponentId).emit('gameFound', { 
    gameId, 
    opponent: socketId,
    isFirstPlayer: true,
    currentPlayer: firstPlayer,
    playerSymbol: firstPlayer
  });

  // Notify second player (current socket)
  io.to(socketId).emit('gameFound', { 
    gameId, 
    opponent: opponentId,
    isFirstPlayer: false,
    currentPlayer: firstPlayer,
    playerSymbol: secondPlayer
  });
  logger.info('Game found notifications sent', { gameId, requestId });
};

// Handle winning move
const handleWinningMove = async (
  io: SocketIOServer,
  game: InstanceType<typeof Game>,
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
    await kv.del(`player:${opponent.id}`);
  }
  io.to(currentPlayer.id).emit('moveMade', moverData);
  await kv.del(`player:${currentPlayer.id}`);
  
  await kv.del(`game:${data.gameId}`);
};

// Handle regular move
const handleRegularMove = async (
  io: SocketIOServer,
  game: InstanceType<typeof Game>,
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

  await kv.set(`game:${data.gameId}`, game.getState());

  // Send appropriate data to each player
  const opponent = game.getOpponent(currentPlayer.id);
  if (opponent) {
    io.to(opponent.id).emit('moveMade', opponentData);
  }
  io.to(currentPlayer.id).emit('moveMade', moverData);
};

// Handle player disconnection
const handleDisconnection = async (io: SocketIOServer, socketId: string) => {
  logger.info('Client disconnected', { socketId });
  
  await kv.lrem('waiting_players', 1, socketId);

  const gameId = await kv.get<string>(`player:${socketId}`);
  if (gameId) {
    const gameState = await kv.get<GameState>(`game:${gameId}`);
    if (gameState) {
      const game = Game.fromState(gameState);
      const opponent = game.getOpponent(socketId);
      if (opponent) {
        logger.info('Notifying opponent of disconnection', {
          gameId,
          disconnectedPlayer: socketId,
          opponent: opponent.id
        });
        io.to(opponent.id).emit('opponentDisconnected');
        await kv.del(`player:${opponent.id}`);
      }
      logger.info('Removing game', { gameId });
      await kv.del(`game:${gameId}`);
    }
    await kv.del(`player:${socketId}`);
  }
};

export default function handler(req: NextApiRequest, res: ResponseWithSocket) {
  if (!(res.socket.server as any).io) {
    const httpServer: NetServer = res.socket.server as any;
    const io = new SocketIOServer(httpServer, {
      path: '/api/socket',
    });

    io.on('connection', (socket) => {
      logger.info('Client connected', { socketId: socket.id });

      // Handle player looking for a game
      socket.on('findGame', async () => {
        const requestId = generateRequestId();
        try {
          logger.info('Player looking for game', { socketId: socket.id, requestId });
          
          const opponentId: string | null = await kv.lpop('waiting_players');
          
          if (opponentId && opponentId !== socket.id) {
            try {
              await createGame(io, opponentId, socket.id, requestId);
            } catch (error) {
              logger.error('Error creating game', error as Error, { gameId: generateGameId(opponentId, socket.id), requestId });
              socket.emit('error', 'Failed to create game');
              await kv.lpush('waiting_players', opponentId); // requeue opponent
            }
          } else {
            logger.info('No opponent found, adding to waiting list', { socketId: socket.id, requestId });
            await kv.rpush('waiting_players', socket.id);
            socket.emit('waitingForOpponent');
          }
        } catch (error) {
          logger.error('Error in findGame handler', error as Error, { socketId: socket.id, requestId });
          socket.emit('error', 'An error occurred while finding a game');
        }
      });

      // Handle game moves
      socket.on('makeMove', async (data) => {
        const requestId = generateRequestId();
        try {
          // Rate limiting check
          if (!checkRateLimit(socket.id)) {
            logger.warn('Rate limit exceeded', { socketId: socket.id, requestId });
            socket.emit('error', 'Too many moves. Please wait a moment.');
            return;
          }

          logger.info('Move received', { data, socketId: socket.id, requestId });
          
          const gameState = await kv.get<GameState>(`game:${data.gameId}`);
          if (!gameState) {
            throw new GameStateError(`Game ${data.gameId} not found`);
          }

          const game = Game.fromState(gameState);

          // Get current player's symbol
          const currentPlayer = game!.getPlayers().find(p => p.id === socket.id);
          if (!currentPlayer) throw new PlayerError('Player not found in game');

          // Make the move
          const moveSuccess = game!.makeMove(data.row, data.col, currentPlayer.symbol);
          if (!moveSuccess) {
            logger.warn('Invalid move attempted', { data, socketId: socket.id, requestId });
            return;
          }

          // Handle move based on whether it's a winning move
          if (data.isWinningMove === true) {
            await handleWinningMove(io, game!, data, currentPlayer, requestId);
          } else {
            await handleRegularMove(io, game!, data, currentPlayer, requestId);
          }
        } catch (error) {
          logger.error('Error processing move', error as Error, { data, socketId: socket.id, requestId });
          socket.emit('error', error instanceof Error ? error.message : 'An error occurred while processing the move');
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => handleDisconnection(io, socket.id));
    });

    (res.socket.server as any).io = io;
  }
  res.end();
} 