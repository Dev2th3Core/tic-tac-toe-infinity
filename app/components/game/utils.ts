import { Player } from './types';

export const generateEmptyGrid = (size: number): Player[][] =>
  Array.from({ length: size }, () => Array(size).fill(null));

export const calculateWinStreak = (size: number): number => {
  if (size <= 5) return 3;
  if (size <= 7) return 5;
  if (size <= 9) return 6;
  return Math.ceil(size / 2);
};

export const checkWinner = (
  grid: Player[][],
  r: number,
  c: number,
  player: Player,
  currentWinStreak: number,
  currentGridSize: number
): boolean => {
  const directions = [
    [0, 1], [1, 0], [1, 1], [1, -1],
  ];

  for (const [dr, dc] of directions) {
    let count = 1;
    let streak = [[r, c]];

    // Check forward direction
    for (let i = 1; i < currentWinStreak; i++) {
      const nr = r + dr * i;
      const nc = c + dc * i;
      if (nr >= 0 && nr < currentGridSize && nc >= 0 && nc < currentGridSize && grid[nr][nc] === player) {
        count++;
        streak.push([nr, nc]);
      } else {
        break;
      }
    }

    // Check backward direction
    for (let i = 1; i < currentWinStreak; i++) {
      const nr = r - dr * i;
      const nc = c - dc * i;
      if (nr >= 0 && nr < currentGridSize && nc >= 0 && nc < currentGridSize && grid[nr][nc] === player) {
        count++;
        streak.push([nr, nc]);
      } else {
        break;
      }
    }

    if (count >= currentWinStreak) {
      return true;
    }
  }

  return false;
};

export const getWinningLine = (
  grid: Player[][],
  r: number,
  c: number,
  player: Player,
  currentWinStreak: number,
  currentGridSize: number
): [number, number][] | null => {
  const directions = [
    [0, 1], [1, 0], [1, 1], [1, -1],
  ];

  for (const [dr, dc] of directions) {
    let count = 1;
    let streak: [number, number][] = [[r, c]];

    // Check forward direction
    for (let i = 1; i < currentWinStreak; i++) {
      const nr = r + dr * i;
      const nc = c + dc * i;
      if (nr >= 0 && nr < currentGridSize && nc >= 0 && nc < currentGridSize && grid[nr][nc] === player) {
        count++;
        streak.push([nr, nc]);
      } else {
        break;
      }
    }

    // Check backward direction
    for (let i = 1; i < currentWinStreak; i++) {
      const nr = r - dr * i;
      const nc = c - dc * i;
      if (nr >= 0 && nr < currentGridSize && nc >= 0 && nc < currentGridSize && grid[nr][nc] === player) {
        count++;
        streak.push([nr, nc]);
      } else {
        break;
      }
    }

    if (count >= currentWinStreak) {
      // Sort the streak to ensure consistent ordering
      streak.sort((a, b) => {
        if (a[0] !== b[0]) return a[0] - b[0];
        return a[1] - b[1];
      });
      return streak;
    }
  }

  return null;
}; 