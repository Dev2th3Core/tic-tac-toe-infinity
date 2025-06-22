import React from 'react';
import { Player } from './types';

interface GameBoardProps {
  board: Player[][];
  gridSize: number;
  winner: Player | 'Draw' | null;
  isBotThinking: boolean;
  isMultiplayer: boolean;
  isMyTurn: boolean;
  onCellClick: (row: number, col: number) => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  board,
  gridSize,
  winner,
  isBotThinking,
  isMultiplayer,
  isMyTurn,
  onCellClick,
}) => {
  // Calculate text size based on grid size
  const getTextSize = () => {
    const level = Math.floor(gridSize / 3);
    if (level >= 3 && level < 6) {
      return 'text-lg'; // Smaller text for larger grids
    }
    else if (level >= 6){
      return 'text-sm';
    }
    return 'text-2xl'; // Default size for smaller grids
  };

  return (
    <div
      className="grid gap-1 bg-gray-100 dark:bg-gray-700 p-2 rounded-xl max-w-[400px] max-h-[400px] w-full"
      style={{
        gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
      }}
    >
      {board.map((row, rowIndex) =>
        row.map((cell, colIndex) => (
          <button
            key={`${rowIndex}-${colIndex}`}
            onClick={() => onCellClick(rowIndex, colIndex)}
            className={`aspect-square w-full h-full flex items-center justify-center font-bold border-2 rounded-xl transition-colors duration-200
              ${getTextSize()}
              ${
                cell
                  ? cell === 'X'
                    ? 'text-blue-500 dark:text-blue-400'
                    : 'text-red-500 dark:text-red-400'
                  : 'text-gray-400 dark:text-gray-500'
              }
              ${
                winner
                  ? 'border-gray-300 dark:border-gray-600'
                  : 'border-gray-400 dark:border-gray-500 hover:border-gray-500 dark:hover:border-gray-400'
              }
              ${
                isBotThinking || (isMultiplayer && !isMyTurn)
                  ? 'cursor-not-allowed'
                  : 'cursor-pointer'
              }
              bg-white dark:bg-gray-800
            `}
            disabled={isBotThinking || (isMultiplayer && !isMyTurn)}
          >
            {cell}
          </button>
        ))
      )}
    </div>
  );
}; 