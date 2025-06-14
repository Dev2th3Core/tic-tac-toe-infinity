'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Player } from './game/types';
import { getBotStrategy } from './bots/botFactory';
import gameSocket from '../../lib/socket';
import { generateEmptyGrid, calculateWinStreak, checkWinner } from './game/utils';
import { GameBoard } from './game/GameBoard';
import { GameControls } from './game/GameControls';
import { GameStatus } from './game/GameStatus';
import { StartMenu, GameMode } from './game/StartMenu';
import { Lobby } from './game/Lobby';

export default function TicTacToe() {
  const [gameMode, setGameMode] = useState<GameMode | null>(null);
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
  const [showLobby, setShowLobby] = useState(false);

  // Update refs when state changes
  useEffect(() => {
    currentWinStreakRef.current = winStreak;
    currentGridSizeRef.current = gridSize;
    console.log('[Game] State updated:', { winStreak, gridSize });
  }, [winStreak, gridSize]);

  // Set up socket event handlers
  useEffect(() => {
    if (!isMultiplayer) return;

    gameSocket.setOnConnectionEstablished(() => {
      console.log('[Game] Connection established');
    });

    gameSocket.setOnGameFound((data) => {
      setIsWaiting(false);
      setIsMultiplayer(true);
      setShowLobby(false);
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
  }, [isMultiplayer]);

  const handleGameModeSelect = (mode: GameMode) => {
    setGameMode(mode);
    setBoard(generateEmptyGrid(3));
    setWinner(null);
    setGameCount(prev => prev + 1);
    setCurrentPlayer(gameCount % 2 === 0 ? 'X' : 'O');
    setErrorMessage(null);

    switch (mode) {
      case 'bot':
        setIsBotEnabled(true);
        setIsMultiplayer(false);
        break;
      case 'single':
        setIsBotEnabled(false);
        setIsMultiplayer(false);
        break;
      case 'multiplayer':
        setIsBotEnabled(false);
        setIsMultiplayer(true);
        setShowLobby(true);
        break;
    }
  };

  const handleLobbyStart = () => {
    gameSocket.findGame();
  };

  const handleLobbyCancel = () => {
    setShowLobby(false);
    setIsMultiplayer(false);
    gameSocket.disconnect();
    setGameMode(null);
  };

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

  const handleReset = () => {
    setGameMode(null);
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

  if (!gameMode) {
    return (
      <div className="bg-background text-foreground h-screen shadow-md transition-colors duration-200 flex flex-col items-center justify-center p-4">
        <StartMenu onGameModeSelect={handleGameModeSelect} />
      </div>
    );
  }

  return (
    <div className="bg-background text-foreground h-screen shadow-md transition-colors duration-200 flex flex-col items-center justify-center p-4">
      {showLobby && (
        <Lobby
          onGameStart={handleLobbyStart}
          onCancel={handleLobbyCancel}
        />
      )}

      <GameStatus
        gridSize={gridSize}
        winStreak={winStreak}
        winner={winner}
        currentPlayer={currentPlayer}
        isMultiplayer={isMultiplayer}
        isMyTurn={isMyTurn()}
        isWaiting={isWaiting}
        errorMessage={errorMessage}
      />

      <GameControls
        onReset={handleReset}
      />

      <GameBoard
        board={board}
        gridSize={gridSize}
        winner={winner}
        isBotThinking={isBotThinking}
        isMultiplayer={isMultiplayer}
        isMyTurn={isMyTurn()}
        onCellClick={handleCellClick}
      />
    </div>
  );
}
