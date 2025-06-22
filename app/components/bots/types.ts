export type Player = 'X' | 'O' | null;

export type BotLevel = 'expert';

export interface BotMove {
  row: number;
  col: number;
}

export interface BotStrategy {
  findMove: (grid: Player[][], player: Player, gridSize: number, winStreak: number) => BotMove;
  name: string;
  description: string;
} 