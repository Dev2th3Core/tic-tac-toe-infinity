export type Player = 'X' | 'O';

export interface GameState {
  board: Player[][];
  currentPlayer: Player;
  winner: Player | 'Draw' | null;
  gridSize: number;
  winStreak: number;
}

export interface GameControls {
  isBotEnabled: boolean;
  isMultiplayer: boolean;
  isWaiting: boolean;
  errorMessage: string | null;
}

export interface GameStatus {
  winner: Player | 'Draw' | null;
  currentPlayer: Player;
  isMultiplayer: boolean;
  isMyTurn: boolean;
} 