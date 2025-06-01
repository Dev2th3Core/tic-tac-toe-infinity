'use client';
import React, { useState, useEffect, useRef } from 'react';
import clsx from 'clsx';
import { Player } from './bots/types';
import { getBotStrategy } from './bots/botFactory';
import gameSocket from '../../lib/socket';

const generateEmptyGrid = (size: number): Player[][] =>
  Array.from({ length: size }, () => Array(size).fill(null));

export default function TicTacToe() {
  const [gridSize, setGridSize] = useState(3);
  const [winStreak, setWinStreak] = useState(3);
  const currentWinStreakRef = useRef(3);
  const currentGridSizeRef = useRef(3);
  const [board, setBoard] = useState(generateEmptyGrid(3));
  const [currentPlayer, setCurrentPlayer] = useState<Player>('X');
  const [winner, setWinner] = useState<Player | 'Draw' | null>(null);
  const [isBotEnabled, setIsBotEnabled] = useState(false);
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [gameCount, setGameCount] = useState(0);
  const [isMultiplayer, setIsMultiplayer] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Calculate win streak based on grid size
  const calculateWinStreak = (size: number): number => {
    if (size <= 5) return 3;
    if (size <= 7) return 5;
    if (size <= 9) return 6;
    return Math.ceil(size / 2);
  };

  // Update refs when state changes
  useEffect(() => {
    currentWinStreakRef.current = winStreak;
    currentGridSizeRef.current = gridSize;
    console.log('[Game] State updated:', { winStreak, gridSize });
  }, [winStreak, gridSize]);

  // Set up socket event handlers
  useEffect(() => {
    gameSocket.setOnGameFound((data) => {
      setIsWaiting(false);
      setIsMultiplayer(true);
      // Reset game state for new multiplayer game
      setGridSize(3);
      currentGridSizeRef.current = 3;
      const newWinStreak = calculateWinStreak(3);
      setWinStreak(newWinStreak);
      currentWinStreakRef.current = newWinStreak;
      setBoard(generateEmptyGrid(3));
      setWinner(null);
      // Set current player based on who goes first
      setCurrentPlayer(data.currentPlayer);
    });

    gameSocket.setOnWaiting(() => {
      console.log('[Game] Waiting for opponent');
      setIsWaiting(true);
      setErrorMessage(null);
    });

    gameSocket.setOnOpponentDisconnected(() => {
      console.log('[Game] Opponent disconnected');
      setIsMultiplayer(false);
      setIsWaiting(false);
      setWinner('Draw');
      setErrorMessage('Opponent disconnected');
    });

    gameSocket.setOnMoveMade((data) => {
      // Get the updated board state from the socket client
      const gameState = gameSocket.getGameState();
      
      // Handle grid expansion if needed
      if (data.isBoardFull && data.newGridSize) {
        setGridSize(data.newGridSize);
        currentGridSizeRef.current = data.newGridSize;
        const newWinStreak = calculateWinStreak(data.newGridSize);
        setWinStreak(newWinStreak);
        currentWinStreakRef.current = newWinStreak;
      }

      // Update board and current player
      setBoard(gameState.board);
      setCurrentPlayer(data.currentPlayer);

      // Check for winner after move
      if (data.isWinner && data.winner) {
        console.log('[Game] Winner found in multiplayer:', data.winner);
        setWinner(data.winner);
      } else if (data.row !== undefined && data.col !== undefined && data.player) {
        // Only check for winner if we have the move details (opponent data)
        if (checkWinner(gameState.board, data.row, data.col, data.player, currentWinStreakRef.current, currentGridSizeRef.current)) {
          console.log('[Game] Winner found in multiplayer:', data.player);
          setWinner(data.player);
        }
      }
    });

    gameSocket.setOnError((message) => {
      console.log('[Game] Error received:', message);
      setErrorMessage(message);
    });

    // Cleanup on component unmount
    return () => {
      console.log('[Game] Cleaning up socket connection');
      gameSocket.disconnect();
    };
  }, []);

  const handleCellClick = (row: number, col: number) => {
    if (board[row][col] || winner || isBotThinking) {
      console.log('[Game] Invalid move: cell occupied or game ended');
      return;
    }
    
    if (isMultiplayer) {
      // Create a temporary board to check for winner
      const tempBoard = board.map(r => [...r]);
      tempBoard[row][col] = currentPlayer;
      
      // Check if this move would result in a win
      const isWinningMove = checkWinner(tempBoard, row, col, currentPlayer, currentWinStreakRef.current, currentGridSizeRef.current);
      console.log('[Game] Move check:', { isWinningMove, currentPlayer });
      
      // For multiplayer, send move to server with win status
      console.log('[Game] Sending move to server');
      gameSocket.makeMove(row, col, isWinningMove);
    } else {
      // For single player/bot
      console.log('[Game] Making local move');
      const newBoard = board.map(r => [...r]);
      newBoard[row][col] = currentPlayer;
      setBoard(newBoard);

      if (checkWinner(newBoard, row, col, currentPlayer!, currentWinStreakRef.current, currentGridSizeRef.current)) {
        console.log('[Game] Winner found in single player:', currentPlayer);
        setWinner(currentPlayer);
      } else if (newBoard.flat().every(cell => cell !== null)) {
        console.log('[Game] Expanding grid in single player');
        // Expand grid and center old content
        const newSize = currentGridSizeRef.current + 4;
        const expandedBoard = generateEmptyGrid(newSize);
        const offset = Math.floor((newSize - currentGridSizeRef.current) / 2);

        for (let i = 0; i < currentGridSizeRef.current; i++) {
          for (let j = 0; j < currentGridSizeRef.current; j++) {
            expandedBoard[i + offset][j + offset] = newBoard[i][j];
          }
        }
        setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X');
        setGridSize(newSize);
        currentGridSizeRef.current = newSize;
        const newWinStreak = calculateWinStreak(newSize);
        setWinStreak(newWinStreak);
        currentWinStreakRef.current = newWinStreak;
        setBoard(expandedBoard);
      } else {
        setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X');
      }
    }
  };

  const checkWinner = (grid: Player[][], r: number, c: number, player: Player, currentWinStreak: number, currentGridSize: number) => {
    console.log('[Game] Checking winner:', {
      position: [r, c],
      player,
      currentWinStreak,
      currentGridSize
    });

    const directions = [
      [0, 1], [1, 0], [1, 1], [1, -1],
    ];

    for (const [dr, dc] of directions) {
      let count = 1;  // Start with 1 for the current cell
      let streak = [[r, c]];  // Initialize streak with current position
      console.log('[Game] direction:', [dr, dc]);

      // Check forward direction
      for (let i = 1; i < currentWinStreak; i++) {
        const nr = r + dr * i;
        const nc = c + dc * i;
        console.log('[Game] Checking forward:', {
          i,
          nr,
          nc,
          value: grid[nr]?.[nc],
          expected: player,
          inBounds: nr >= 0 && nr < currentGridSize && nc >= 0 && nc < currentGridSize,
          gridSize: currentGridSize
        });
        if (nr >= 0 && nr < currentGridSize && nc >= 0 && nc < currentGridSize && grid[nr][nc] === player) {
          count++;
          console.log('[Game] match found increasing count', count);
          streak.push([nr, nc]);
        } else {
          break;
        }
      }

      // Check backward direction
      for (let i = 1; i < currentWinStreak; i++) {
        const nr = r - dr * i;
        const nc = c - dc * i;
        console.log('[Game] Checking backward:', {
          i,
          nr,
          nc,
          value: grid[nr]?.[nc],
          expected: player,
          inBounds: nr >= 0 && nr < currentGridSize && nc >= 0 && nc < currentGridSize,
          gridSize: currentGridSize
        });
        if (nr >= 0 && nr < currentGridSize && nc >= 0 && nc < currentGridSize && grid[nr][nc] === player) {
          count++;
          console.log('[Game] match found increasing count', count);
          streak.push([nr, nc]);
        } else {
          break;
        }
      }

      console.log('[Game] Direction check:', {
        direction: [dr, dc],
        count,
        currentWinStreak,
        streak,
        grid: grid.map(row => row.map(cell => cell || ' '))
      });

      if (count >= currentWinStreak) {
        console.log('[Game] Winner found:', {
          player,
          count,
          currentWinStreak,
          direction: [dr, dc],
          streak
        });
        return true;
      }
    }

    return false;
  };

  const makeBotMove = () => {
    if (!isBotEnabled || currentPlayer !== 'O' || winner) return;

    setIsBotThinking(true);
    const botStrategy = getBotStrategy('expert');
    const { row, col } = botStrategy.findMove(board, 'O', gridSize, winStreak);
    
    // Add a small delay to make the thinking animation visible
    setTimeout(() => {
      handleCellClick(row, col);
      setIsBotThinking(false);
    }, 500);
  };

  const handleBotToggle = () => {
    if (!isBotEnabled) {
      // Reset the game state
      setBoard(generateEmptyGrid(gridSize));
      setWinner(null);
      // Increment game count and set first player based on even/odd
      setGameCount(prev => prev + 1);
      setCurrentPlayer(gameCount % 2 === 0 ? 'X' : 'O');
    }
    setIsBotEnabled(!isBotEnabled);
    setIsMultiplayer(false);
    setErrorMessage(null);
  };

  const handleMultiplayerToggle = () => {
    if (!isMultiplayer) {
      gameSocket.findGame();
    } else {
      setIsMultiplayer(false);
      gameSocket.resetGameState();
    }
    setErrorMessage(null);
  };

  const handleReset = () => {
    setGridSize(3);
    setWinStreak(calculateWinStreak(3));
    setBoard(generateEmptyGrid(3));
    setWinner(null);
    setGameCount(prev => prev + 1);
    setCurrentPlayer(gameCount % 2 === 0 ? 'X' : 'O');
    if (isMultiplayer) {
      setIsMultiplayer(false);
      gameSocket.resetGameState();
    }
    setErrorMessage(null);
  };

  // Effect to trigger bot move when it's bot's turn
  useEffect(() => {
    if (isBotEnabled && currentPlayer === 'O' && !winner) {
      makeBotMove();
    }
  }, [currentPlayer, isBotEnabled, winner]);

  const isMyTurn = () => {
    if (!isMultiplayer) return true;
    const gameState = gameSocket.getGameState();
    
    if (!gameState.currentPlayer || !gameState.playerSymbol) {
      console.log('[Game] Warning: currentPlayer or playerSymbol is undefined');
      return false;
    }
    
    return gameState.currentPlayer === gameState.playerSymbol;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h1 className="text-2xl font-bold mb-4">
        Level {Math.floor(gridSize/3)} (Grid: {gridSize}x{gridSize}, Win: {winStreak})
      </h1>
      <div className="flex gap-4 mb-4">
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          onClick={handleBotToggle}
          disabled={isMultiplayer}
        >
          {isBotEnabled ? 'Disable Bot' : 'Enable Bot'}
        </button>
        <button
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
          onClick={handleMultiplayerToggle}
          disabled={isBotEnabled}
        >
          {isMultiplayer ? 'Leave Game' : 'Find Game'}
        </button>
        {winner && (
          <button
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
            onClick={handleReset}
          >
            New Game
          </button>
        )}
      </div>
      {errorMessage && (
        <div className="mb-4 text-lg font-semibold text-red-600">
          {errorMessage}
        </div>
      )}
      {isWaiting && (
        <div className="mb-4 text-lg font-semibold text-purple-600 animate-pulse">
          Waiting for opponent...
        </div>
      )}
      {isMultiplayer && !isWaiting && (
        <div className="text-xl font-bold mb-4">
          {winner ? (
            <div className="text-green-500">Winner: {winner}</div>
          ) : (
            <div className={isMyTurn() ? 'text-blue-500' : 'text-red-500'}>
              {isMyTurn() ? 'Your turn' : 'Opponent\'s turn'}
              <div className="text-sm text-gray-600">
                (You are {gameSocket.getGameState().playerSymbol} - ID: {gameSocket.getGameState().socketId?.slice(0, 6)})
              </div>
            </div>
          )}
        </div>
      )}
      {isBotThinking && !isMultiplayer ? (
        <div className="mb-4 text-lg font-semibold text-blue-600 animate-pulse">
          Bot's turn
        </div>
      ) : !isMultiplayer && !isBotEnabled && (
        <div className="mb-4 text-lg font-semibold text-blue-600">
          Your turn
        </div>
      )}
      {winner && (
        <div className="mt-4 text-lg font-semibold">
          {winner === 'Draw' ? "It's a draw!" : `Winner: ${winner}`}
        </div>
      )}
      <div 
        className="grid gap-1" 
        style={{ 
          display: 'grid',
          gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
          gap: '4px',
          padding: '4px',
          backgroundColor: '#f3f4f6',
          borderRadius: '8px'
        }}
      >
        {board.map((row, i) =>
          row.map((cell, j) => (
            <button
              key={`${i}-${j}`}
              className={`w-16 h-16 border-2 border-gray-300 text-2xl font-bold ${
                board[i][j] ? 'cursor-not-allowed' : 'hover:bg-gray-100'
              } ${!isMyTurn() ? 'cursor-not-allowed opacity-50' : ''}`}
              onClick={() => handleCellClick(i, j)}
              disabled={board[i][j] !== null || winner !== null || !isMyTurn()}
              style={{
                aspectRatio: '1',
                backgroundColor: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {board[i][j]}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
