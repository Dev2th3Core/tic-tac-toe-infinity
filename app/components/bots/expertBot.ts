import { BotStrategy, Player } from './types';

interface GameState {
  grid: Player[][];
  lastMove: { row: number; col: number } | null;
  player: Player;
  depth: number;
}

const checkWinner = (grid: Player[][], r: number, c: number, player: Player, winStreak: number): boolean => {
  const directions = [
    [0, 1], [1, 0], [1, 1], [1, -1],
  ];

  for (const [dr, dc] of directions) {
    let count = 1;

    for (let i = 1; i < winStreak; i++) {
      const nr = r + dr * i, nc = c + dc * i;
      if (grid[nr]?.[nc] === player) count++;
      else break;
    }

    for (let i = 1; i < winStreak; i++) {
      const nr = r - dr * i, nc = c - dc * i;
      if (grid[nr]?.[nc] === player) count++;
      else break;
    }

    if (count >= winStreak) return true;
  }

  return false;
};

// Check for potential winning patterns
const checkPotentialWin = (grid: Player[][], r: number, c: number, player: Player, winStreak: number): number => {
  const directions = [
    [0, 1], [1, 0], [1, 1], [1, -1],
  ];
  let maxCount = 0;

  for (const [dr, dc] of directions) {
    let count = 1;
    let emptySpaces = 0;

    // Check forward direction
    for (let i = 1; i < winStreak; i++) {
      const nr = r + dr * i, nc = c + dc * i;
      if (grid[nr]?.[nc] === player) count++;
      else if (grid[nr]?.[nc] === null) emptySpaces++;
      else break;
    }

    // Check backward direction
    for (let i = 1; i < winStreak; i++) {
      const nr = r - dr * i, nc = c - dc * i;
      if (grid[nr]?.[nc] === player) count++;
      else if (grid[nr]?.[nc] === null) emptySpaces++;
      else break;
    }

    // If we have enough pieces and empty spaces to complete the win streak
    if (count + emptySpaces >= winStreak) {
      maxCount = Math.max(maxCount, count);
    }
  }

  return maxCount;
};

// Memoization cache for game states
const memoCache = new Map<string, { score: number; move: { row: number; col: number } | null }>();

const getStateKey = (state: GameState): string => {
  return `${state.grid.map(row => row.join('')).join('')}-${state.player}-${state.depth}`;
};

const evaluatePosition = (
  state: GameState,
  gridSize: number,
  winStreak: number,
  maxDepth: number
): { score: number; move: { row: number; col: number } | null } => {
  const stateKey = getStateKey(state);
  if (memoCache.has(stateKey)) {
    return memoCache.get(stateKey)!;
  }

  // Base cases
  if (state.depth >= maxDepth) {
    return { score: 0, move: null };
  }

  if (state.lastMove && checkWinner(state.grid, state.lastMove.row, state.lastMove.col, state.player, winStreak)) {
    return { score: state.player === 'O' ? 1 : -1, move: null };
  }

  // Check for draw
  if (state.grid.flat().every(cell => cell !== null)) {
    return { score: 0, move: null };
  }

  const opponent = state.player === 'X' ? 'O' : 'X';
  let bestScore = state.player === 'O' ? -Infinity : Infinity;
  let bestMove: { row: number; col: number } | null = null;

  // Try all possible moves
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      if (!state.grid[i][j]) {
        // Make move
        const newGrid = state.grid.map(row => [...row]);
        newGrid[i][j] = state.player;

        // Check if this move creates a winning pattern
        const patternCount = checkPotentialWin(newGrid, i, j, state.player, winStreak);
        const opponentPatternCount = checkPotentialWin(newGrid, i, j, opponent, winStreak);

        // Evaluate resulting position
        const result = evaluatePosition(
          {
            grid: newGrid,
            lastMove: { row: i, col: j },
            player: opponent,
            depth: state.depth + 1
          },
          gridSize,
          winStreak,
          maxDepth
        );

        // Adjust score based on pattern counts
        let adjustedScore = result.score;
        if (state.player === 'O') {
          adjustedScore += patternCount * 0.1; // Bonus for creating patterns
          adjustedScore -= opponentPatternCount * 0.2; // Penalty for opponent's patterns
        } else {
          adjustedScore -= patternCount * 0.1;
          adjustedScore += opponentPatternCount * 0.2;
        }

        // Update best score and move
        if (state.player === 'O') {
          if (adjustedScore > bestScore) {
            bestScore = adjustedScore;
            bestMove = { row: i, col: j };
          }
        } else {
          if (adjustedScore < bestScore) {
            bestScore = adjustedScore;
            bestMove = { row: i, col: j };
          }
        }
      }
    }
  }

  const result = { score: bestScore, move: bestMove };
  memoCache.set(stateKey, result);
  return result;
};

export const expertBot: BotStrategy = {
  name: 'Expert Bot',
  description: 'A highly strategic bot that uses dynamic programming to predict and block opponent\'s winning moves',
  findMove: (grid: Player[][], player: Player, gridSize: number, winStreak: number) => {
    // Clear memoization cache for new game state
    memoCache.clear();

    const opponent = player === 'X' ? 'O' : 'X';

    // Check if this is the first move (board is empty)
    const isFirstMove = grid.flat().every(cell => cell === null || cell === 'X');
    if (isFirstMove) {
      // Get all possible first moves
      const possibleMoves = [];
      
      // Add center
      const center = Math.floor(gridSize / 2);
      possibleMoves.push({ row: center, col: center });
      
      // Add corners
      possibleMoves.push({ row: 0, col: 0 });
      possibleMoves.push({ row: 0, col: gridSize - 1 });
      possibleMoves.push({ row: gridSize - 1, col: 0 });
      possibleMoves.push({ row: gridSize - 1, col: gridSize - 1 });
      
      // Add edge positions
      for (let i = 1; i < gridSize - 1; i++) {
        possibleMoves.push({ row: 0, col: i }); // top edge
        possibleMoves.push({ row: gridSize - 1, col: i }); // bottom edge
        possibleMoves.push({ row: i, col: 0 }); // left edge
        possibleMoves.push({ row: i, col: gridSize - 1 }); // right edge
      }
      
      // Randomly select one of the possible moves
      const randomIndex = Math.floor(Math.random() * possibleMoves.length);
      console.log(randomIndex);
      return possibleMoves[randomIndex];
    }
    
    // Then, check if we need to block opponent's winning move
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        if (!grid[i][j]) {
          grid[i][j] = opponent;
          if (checkWinner(grid, i, j, opponent, winStreak)) {
            grid[i][j] = null;
            return { row: i, col: j };
          }
          grid[i][j] = null;
        }
      }
    }

    // First, check if we can win in the next move
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        if (!grid[i][j]) {
          grid[i][j] = player;
          if (checkWinner(grid, i, j, player, winStreak)) {
            grid[i][j] = null;
            return { row: i, col: j };
          }
          grid[i][j] = null;
        }
      }
    }

    // Check for opponent's potential winning patterns
    let bestBlockingMove: { row: number; col: number } | null = null;
    let maxOpponentPattern = 0;

    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        if (!grid[i][j]) {
          const patternCount = checkPotentialWin(grid, i, j, opponent, winStreak);
          if (patternCount > maxOpponentPattern) {
            maxOpponentPattern = patternCount;
            bestBlockingMove = { row: i, col: j };
          }
        }
      }
    }

    // If opponent has a strong pattern, block it
    if (maxOpponentPattern >= winStreak - 2 && bestBlockingMove) {
      return bestBlockingMove;
    }

    // Use dynamic programming to find the best move
    const maxDepth = Math.min(3, Math.ceil(gridSize * gridSize / 4)); // Adjust depth based on grid size

    // Find our best winning move
    const ourState: GameState = {
      grid: grid.map(row => [...row]),
      lastMove: null,
      player: player,
      depth: 0
    };

    const ourResult = evaluatePosition(ourState, gridSize, winStreak, maxDepth);

    if (ourResult.move) {
      return ourResult.move;
    }

    // Fallback: take center if available
    const center = Math.floor(gridSize / 2);
    if (!grid[center][center]) {
      return { row: center, col: center };
    }

    // Take any available position
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        if (!grid[i][j]) {
          return { row: i, col: j };
        }
      }
    }

    return { row: 0, col: 0 }; // Fallback, should never reach here
  }
}; 