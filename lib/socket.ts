import { io, Socket } from 'socket.io-client';
import { Player } from '../pages/components/bots/types';

// Game state interface
interface GameState {
  gameId: string | null;
  opponent: string | null;
  isFirstPlayer: boolean;
  isWaiting: boolean;
  currentPlayer: Player;
  playerSymbol: Player;
  board: Player[][];
  socketId: string | null;
  gridSize: number;
  winStreak: number;
}

class GameSocket {
  private socket: Socket | null = null;
  private gameState: GameState = {
    gameId: null,
    opponent: null,
    isFirstPlayer: false,
    isWaiting: false,
    currentPlayer: 'X',
    playerSymbol: 'X',
    board: Array(3).fill(null).map(() => Array(3).fill(null)),
    socketId: null,
    gridSize: 3,
    winStreak: 3
  };

  // Callbacks for game events
  private onGameFoundCallback: ((data: { 
    gameId: string, 
    opponent: string, 
    isFirstPlayer: boolean,
    currentPlayer: Player,
    playerSymbol: Player
  }) => void) | null = null;
  private onWaitingCallback: (() => void) | null = null;
  private onOpponentDisconnectedCallback: (() => void) | null = null;
  private onMoveMadeCallback: ((data: {
    // Common fields for both mover and opponent
    currentPlayer: Player,
    isBoardFull?: boolean,
    newGridSize?: number,
    isWinner: boolean,
    winner?: Player,
    // Fields only for opponent data
    row?: number,
    col?: number,
    player?: Player,
    playerId?: string
  }) => void) | null = null;
  private onErrorCallback: ((message: string) => void) | null = null;

  // Add this new method to track the last move
  private lastMove: { row: number, col: number, player: Player } | null = null;

  constructor() {
    // Initialize socket connection
    this.socket = io({
      path: '/api/socket',
    });

    // Set up socket event listeners
    this.socket.on('connect', () => {
      console.log('[Socket] Connected to server');
      if (this.socket?.id) {
        this.gameState.socketId = this.socket.id;
        console.log('[Socket] Socket ID assigned:', this.socket.id);
      }
    });

    this.socket.on('gameFound', (data) => {
      console.log('[Socket] Game found event received:', data);
      
      // Initialize complete game state
      const newGameState: GameState = {
        gameId: data.gameId,
        opponent: data.opponent,
        isFirstPlayer: data.isFirstPlayer,
        isWaiting: false,
        currentPlayer: data.currentPlayer,
        playerSymbol: data.playerSymbol,
        board: Array(3).fill(null).map(() => Array(3).fill(null)),
        socketId: this.gameState.socketId,
        gridSize: 3,
        winStreak: 3
      };
      
      console.log('[Socket] Initializing new game state:', newGameState);
      this.gameState = newGameState;
      
      if (this.onGameFoundCallback) {
        console.log('[Socket] Calling game found callback with:', data);
        this.onGameFoundCallback(data);
      }
    });

    this.socket.on('waitingForOpponent', () => {
      console.log('[Socket] Waiting for opponent');
      this.gameState.isWaiting = true;
      if (this.onWaitingCallback) {
        this.onWaitingCallback();
      }
    });

    this.socket.on('opponentDisconnected', () => {
      console.log('[Socket] Opponent disconnected');
      this.resetGameState();
      if (this.onOpponentDisconnectedCallback) {
        this.onOpponentDisconnectedCallback();
      }
    });

    this.socket.on('moveMade', (data) => {
      console.log('[Socket] Move made event received:', data);
      console.log('[Socket] Current game state before update:', this.gameState);
      
      // Check if this is a mover data (no row/col) or opponent data
      const isMoverData = !('row' in data);
      
      // Update the board with the new move for both mover and opponent
      if (!isMoverData && data.row !== undefined && data.col !== undefined && data.player) {
        // For opponent data, use the provided move
        this.updateBoard(data.row, data.col, data.player);
      } else if (isMoverData) {
        // For mover data, we need to get the last move from the game state
        const lastMove = this.getLastMove();
        if (lastMove) {
          this.updateBoard(lastMove.row, lastMove.col, lastMove.player);
        }
      }
      
      // Update current player (common for both)
      this.gameState.currentPlayer = data.currentPlayer;
      
      // Handle grid expansion if needed (common for both)
      if (data.isBoardFull && data.newGridSize) {
        console.log('[Socket] Expanding grid:', {
          newSize: data.newGridSize,
          currentBoard: this.gameState.board
        });
        
        // Create new expanded board
        const expandedBoard = Array(data.newGridSize).fill(null).map(() => Array(data.newGridSize).fill(null));
        const offset = Math.floor((data.newGridSize - this.gameState.gridSize) / 2);

        // Copy existing board to center of new board
        for (let i = 0; i < this.gameState.gridSize; i++) {
          for (let j = 0; j < this.gameState.gridSize; j++) {
            expandedBoard[i + offset][j + offset] = this.gameState.board[i][j];
          }
        }

        // Update game state with expanded board
        this.gameState.board = expandedBoard;
        this.gameState.gridSize = data.newGridSize;
        
        console.log('[Socket] Grid expanded:', {
          newSize: data.newGridSize,
          newBoard: expandedBoard,
          oldSize: this.gameState.gridSize
        });
      }
      
      console.log('[Socket] Updated game state after move:', {
        gridSize: this.gameState.gridSize,
        boardSize: this.gameState.board.length,
        fullGameState: this.gameState
      });
      
      if (this.onMoveMadeCallback) {
        this.onMoveMadeCallback(data);
      }
    });

    this.socket.on('error', (message) => {
      console.log('[Socket] Error received:', message);
      if (this.onErrorCallback) {
        this.onErrorCallback(message);
      }
    });
  }

  // Method to find a game
  findGame() {
    console.log('[Socket] Finding game...');
    if (this.socket) {
      this.socket.emit('findGame');
    }
  }

  // Method to make a move
  makeMove(row: number, col: number, isWinningMove: boolean = false) {
    if (!this.socket || !this.gameState.gameId) {
      console.error('[Socket] Cannot make move: socket or game not initialized');
      return;
    }

    // Store the last move
    this.lastMove = {
      row,
      col,
      player: this.gameState.playerSymbol
    };

    console.log('[Socket] Making move:', {
      row,
      col,
      gameId: this.gameState.gameId,
      isWinningMove
    });

    this.socket.emit('makeMove', {
      gameId: this.gameState.gameId,
      row,
      col,
      isWinningMove
    });
  }

  // Method to check if a move is from this client
  isMyMove(playerId: string): boolean {
    return this.gameState.socketId === playerId;
  }

  // Method to reset game state
  resetGameState() {
    console.log('[Socket] Resetting game state');
    this.gameState = {
      gameId: null,
      opponent: null,
      isFirstPlayer: false,
      isWaiting: false,
      currentPlayer: 'X',
      playerSymbol: 'X',
      board: Array(3).fill(null).map(() => Array(3).fill(null)),
      socketId: this.gameState.socketId,
      gridSize: 3,
      winStreak: 3
    };
    console.log('[Socket] Game state reset:', this.gameState);
  }

  // Method to update board state
  updateBoard(row: number, col: number, player: Player) {
    const newBoard = this.gameState.board.map(r => [...r]);
    newBoard[row][col] = player;
    this.gameState.board = newBoard;
  }

  // Method to expand grid
  expandGrid(newSize: number, newWinStreak: number) {
    const expandedBoard = Array(newSize).fill(null).map(() => Array(newSize).fill(null));
    const offset = Math.floor((newSize - this.gameState.gridSize) / 2);

    // Copy existing board to center of new board
    for (let i = 0; i < this.gameState.gridSize; i++) {
      for (let j = 0; j < this.gameState.gridSize; j++) {
        expandedBoard[i + offset][j + offset] = this.gameState.board[i][j];
      }
    }

    this.gameState.board = expandedBoard;
    this.gameState.gridSize = newSize;
    this.gameState.winStreak = newWinStreak;
  }

  // Method to get the last move
  private getLastMove(): { row: number, col: number, player: Player } | null {
    return this.lastMove;
  }

  // Setter methods for callbacks
  setOnGameFound(callback: (data: { 
    gameId: string, 
    opponent: string, 
    isFirstPlayer: boolean,
    currentPlayer: Player,
    playerSymbol: Player
  }) => void) {
    this.onGameFoundCallback = callback;
  }

  setOnWaiting(callback: () => void) {
    this.onWaitingCallback = callback;
  }

  setOnOpponentDisconnected(callback: () => void) {
    this.onOpponentDisconnectedCallback = callback;
  }

  setOnMoveMade(callback: (data: {
    // Common fields for both mover and opponent
    currentPlayer: Player,
    isBoardFull?: boolean,
    newGridSize?: number,
    isWinner: boolean,
    winner?: Player,
    // Fields only for opponent data
    row?: number,
    col?: number,
    player?: Player,
    playerId?: string
  }) => void) {
    this.onMoveMadeCallback = callback;
  }

  setOnError(callback: (message: string) => void) {
    this.onErrorCallback = callback;
  }

  // Getter for game state
  getGameState(): GameState {
    return { ...this.gameState };
  }

  // Cleanup method
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

// Create a singleton instance
const gameSocket = new GameSocket();

export default gameSocket; 