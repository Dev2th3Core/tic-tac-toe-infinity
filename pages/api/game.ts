import { Player } from '../components/bots/types';
import { Logger, ErrorHandler } from './errors';

export class Game {
  private players: { id: string, symbol: Player }[];
  private board: Player[][];
  private currentPlayer: Player;
  private gridSize: number;
  private winStreak: number;
  private logger: Logger;
  private errorHandler: ErrorHandler;
  private filledCells: number;

  constructor(
    players: { id: string, symbol: Player }[],
    gridSize: number = 3,
    winStreak: number = 3
  ) {
    this.players = players;
    this.gridSize = gridSize;
    this.winStreak = winStreak;
    this.board = Array(gridSize).fill(null).map(() => Array(gridSize).fill(null));
    this.currentPlayer = players[0].symbol;
    this.logger = Logger.getInstance();
    this.errorHandler = ErrorHandler.getInstance();
    this.filledCells = 0;

    this.logger.info('Game initialized', {
      players: players.map(p => ({ id: p.id, symbol: p.symbol })),
      gridSize,
      winStreak,
      currentPlayer: this.currentPlayer
    });
  }

  // Getters
  getBoard(): Player[][] {
    return this.board.map(row => [...row]);
  }

  getCurrentPlayer(): Player {
    return this.currentPlayer;
  }

  getGridSize(): number {
    return this.gridSize;
  }

  getWinStreak(): number {
    return this.winStreak;
  }

  getPlayers(): { id: string, symbol: Player }[] {
    return [...this.players];
  }

  // Game logic methods
  isValidMove(row: number, col: number): boolean {
    try {
      this.errorHandler.validateMove(row, col, this.gridSize);
      return this.board[row][col] === null;
    } catch (error) {
      this.logger.debug('Invalid move attempted', { row, col, error });
      return false;
    }
  }

  makeMove(row: number, col: number, player: Player): boolean {
    this.logger.debug('Attempting move', { 
      row, 
      col, 
      player, 
      currentPlayer: this.currentPlayer 
    });

    if (!this.isValidMove(row, col)) {
      this.logger.warn('Invalid move attempted', { row, col, player });
      return false;
    }

    if (player !== this.currentPlayer) {
      this.logger.warn('Wrong player attempted move', { 
        attemptedBy: player, 
        currentPlayer: this.currentPlayer 
      });
      return false;
    }

    this.board[row][col] = player;
    this.filledCells++;
    this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';

    this.logger.info('Move made successfully', {
      row,
      col,
      player,
      newCurrentPlayer: this.currentPlayer,
      filledCells: this.filledCells,
      totalCells: this.gridSize * this.gridSize
    });

    return true;
  }

  isBoardFull(): boolean {
    const isFull = this.filledCells === this.gridSize * this.gridSize;
    this.logger.debug('Board full check', {
      isFull,
      filledCells: this.filledCells,
      totalCells: this.gridSize * this.gridSize
    });
    return isFull;
  }

  expandBoard(): void {
    this.logger.info('Starting board expansion', {
      currentSize: this.gridSize,
      filledCells: this.filledCells,
      totalCells: this.gridSize * this.gridSize
    });

    const newGridSize = this.gridSize + 4;
    const expandedBoard = Array(newGridSize).fill(null).map(() => Array(newGridSize).fill(null));
    const offset = Math.floor((newGridSize - this.gridSize) / 2);

    this.logger.debug('Expansion parameters', {
      newGridSize,
      offset,
      oldBoardSize: this.gridSize
    });

    // Copy existing board to center of new board
    for (let i = 0; i < this.gridSize; i++) {
      for (let j = 0; j < this.gridSize; j++) {
        expandedBoard[i + offset][j + offset] = this.board[i][j];
      }
    }

    this.board = expandedBoard;
    this.gridSize = newGridSize;
    this.winStreak = this.calculateWinStreak(newGridSize);

    this.logger.info('Board expansion complete', {
      newGridSize: this.gridSize,
      newWinStreak: this.winStreak,
      filledCells: this.filledCells,
      totalCells: this.gridSize * this.gridSize
    });
  }

  private calculateWinStreak(size: number): number {
    if (size <= 5) return 3;
    if (size <= 7) return 5;
    if (size <= 9) return 6;
    return Math.ceil(size / 2);
  }

  getPlayerBySymbol(symbol: Player): { id: string, symbol: Player } | undefined {
    const player = this.players.find(p => p.symbol === symbol);
    if (!player) {
      this.logger.warn('Player not found by symbol', { symbol });
    }
    return player;
  }

  getOpponent(playerId: string): { id: string, symbol: Player } | undefined {
    const opponent = this.players.find(p => p.id !== playerId);
    if (!opponent) {
      this.logger.warn('Opponent not found', { playerId });
    }
    return opponent;
  }
} 