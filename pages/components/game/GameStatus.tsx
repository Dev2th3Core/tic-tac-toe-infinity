import React, { useEffect, useState } from 'react';
import { Player } from './types';
import confetti from 'canvas-confetti';

interface GameStatusProps {
  gridSize: number;
  winStreak: number;
  winner: Player | 'Draw' | null;
  currentPlayer: Player;
  isMultiplayer: boolean;
  isMyTurn: boolean;
  isWaiting: boolean;
  errorMessage: string | null;
}

interface StatusModalProps {
  type: 'win' | 'loss' | 'draw' | 'error';
  message: string;
  onClose: () => void;
}

const StatusModal: React.FC<StatusModalProps> = ({ type, message, onClose }) => {
  useEffect(() => {
    if (type === 'win') {
      // Subtle confetti animation
      const duration = 2 * 1000;
      const animationEnd = Date.now() + duration;

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 20 * (timeLeft / duration);
        
        confetti({
          startVelocity: 20,
          spread: 180,
          ticks: 40,
          zIndex: 0,
          particleCount,
          origin: { x: 0.5, y: 0.8 },
          colors: ['#4CAF50', '#2196F3', '#9C27B0']
        });
      }, 250);
    }

    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => {
      clearTimeout(timer);
    };
  }, [type, onClose]);

  const getModalContent = () => {
    const baseClasses = "text-center transform transition-all duration-500";
    
    switch (type) {
      case 'win':
        return (
          <div className={`${baseClasses} animate-fade-in`}>
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">Victory</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">{message}</p>
          </div>
        );
      case 'loss':
        return (
          <div className={`${baseClasses} animate-fade-in`}>
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">Defeat</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">{message}</p>
          </div>
        );
      case 'draw':
        return (
          <div className={`${baseClasses} animate-fade-in`}>
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h8m0 0v8m0-8l-8 8m8-8l8 8" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">Draw</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">{message}</p>
          </div>
        );
      case 'error':
        return (
          <div className={`${baseClasses} animate-fade-in`}>
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">Error</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">{message}</p>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl transform transition-all duration-300 scale-100 hover:scale-105">
        {getModalContent()}
        <button
          onClick={onClose}
          className="mt-8 w-full py-3 px-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg transition-colors duration-200 font-medium"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export const GameStatus: React.FC<GameStatusProps> = ({
  gridSize,
  winStreak,
  winner,
  currentPlayer,
  isMultiplayer,
  isMyTurn,
  isWaiting,
  errorMessage,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState<{ type: 'win' | 'loss' | 'draw' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (errorMessage) {
      setModalContent({ type: 'error', message: errorMessage });
      setShowModal(true);
    }
  }, [errorMessage]);

  useEffect(() => {
    console.log("isMultiplayer " + isMultiplayer + " Current Player " + currentPlayer);
    if (winner) {
      if (winner === 'Draw') {
        setModalContent({ 
          type: 'draw', 
          message: "The game ended in a draw!" 
        });
      } else if (isMultiplayer) {
        const isWinner = !isMyTurn;
        setModalContent({ 
          type: isWinner ? 'win' : 'loss',
          message: isWinner 
            ? "Congratulations! You won the game!" 
            : "Better luck next time!"
        });
      } else {
        setModalContent({ 
          type: 'win',
          message: `Player ${winner} Wins!`
        });
      }
      setShowModal(true);
    }
  }, [winner, currentPlayer, isMultiplayer]);

  return (
    <>
      {showModal && modalContent && (
        <StatusModal
          type={modalContent.type}
          message={modalContent.message}
          onClose={() => setShowModal(false)}
        />
      )}

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">
            Level {Math.floor(gridSize/3)} (Grid: {gridSize}x{gridSize}, Win: {winStreak})
          </h1>
          <div className="text-xl">
            {isMultiplayer
              ? isMyTurn
                ? "Your Turn"
                : "Opponent's Turn"
              : `Current Player: ${currentPlayer}`}
          </div>
        </div>
      </div>

      {isMultiplayer && isWaiting && (
        <div className="mb-4 p-2 bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-100 rounded-md">
          Waiting for opponent...
        </div>
      )}
    </>
  );
}; 