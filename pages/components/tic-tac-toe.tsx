'use client';
import React, { useState } from 'react';
import clsx from 'clsx';

type Player = 'X' | 'O' | null;

const generateEmptyGrid = (size: number): Player[][] =>
  Array.from({ length: size }, () => Array(size).fill(null));

export default function TicTacToe() {
  const [gridSize, setGridSize] = useState(3);
  const [winStreak, setWinStreak] = useState(3);
  const [board, setBoard] = useState(generateEmptyGrid(3));
  const [currentPlayer, setCurrentPlayer] = useState<Player>('X');
  const [winner, setWinner] = useState<Player | 'Draw' | null>(null);

  const handleCellClick = (row: number, col: number) => {
    if (board[row][col] || winner) return;

    const newBoard = board.map(r => [...r]);
    newBoard[row][col] = currentPlayer;
    setBoard(newBoard);

    if (checkWinner(newBoard, row, col, currentPlayer!)) {
      setWinner(currentPlayer);
    } else if (newBoard.flat().every(cell => cell !== null)) {
      // Expand grid and center old content
      const newSize = gridSize + 4;
      const expandedBoard = generateEmptyGrid(newSize);
      const offset = Math.floor((newSize - gridSize) / 2);

      for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
          expandedBoard[i + offset][j + offset] = newBoard[i][j];
        }
      }

      setGridSize(newSize);
      setWinStreak(winStreak + 1);
      setBoard(expandedBoard);
    } else {
      setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X');
    }
  };

  const checkWinner = (grid: Player[][], r: number, c: number, player: Player) => {
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

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h1 className="text-2xl font-bold mb-4">Tic Tac Toe — {gridSize}x{gridSize} (Win: {winStreak})</h1>
      {winner && (
        <div className="mt-4 text-lg font-semibold">
          {winner === 'Draw' ? "It's a draw!" : `Winner: ${winner}`}
        </div>
      )}
      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}
      >
        {board.map((row, rIdx) =>
          row.map((cell, cIdx) => (
            <button
              key={`${rIdx}-${cIdx}`}
              className={clsx(
                'w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 text-xl md:text-2xl font-bold border border-gray-500 bg-white hover:bg-gray-200',
              )}
              onClick={() => handleCellClick(rIdx, cIdx)}
            >
              {cell}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
