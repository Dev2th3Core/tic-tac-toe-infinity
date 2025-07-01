import React, { useEffect, useState, useRef } from 'react';
import { Player } from './types';
import confetti from 'canvas-confetti';
import { FiArrowUpCircle, FiCheckCircle, FiXCircle, FiMinusCircle, FiAlertCircle } from 'react-icons/fi';

// Generic StatusPopup component
const StatusPopup: React.FC<{
  show: boolean;
  type: 'level' | 'win' | 'loss' | 'draw' | 'error';
  title: string;
  message: string;
  onClose?: () => void;
  autoDismiss?: boolean;
  duration?: number;
}> = ({ show, type, title, message, onClose, autoDismiss = false, duration = 1800 }) => {
  useEffect(() => {
    if (show && autoDismiss) {
      const timer = setTimeout(() => {
        onClose && onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, autoDismiss, duration, onClose]);

  if (!show) return null;

  // Icon and color by type
  const iconMap: Record<string, React.ReactNode> = {
    level: <FiArrowUpCircle className="w-12 h-12 text-blue-400" />,
    win: <FiCheckCircle className="w-12 h-12 text-green-500" />,
    loss: <FiXCircle className="w-12 h-12 text-red-500" />,
    draw: <FiMinusCircle className="w-12 h-12 text-yellow-500" />,
    error: <FiAlertCircle className="w-12 h-12 text-orange-500" />,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
      <div
        className={`pointer-events-auto bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-10 py-8 rounded-2xl shadow-2xl text-3xl font-bold flex flex-col items-center animate-fade-in-out`}
        style={{ minWidth: 320 }}
      >
        <div className="mb-2">{iconMap[type]}</div>
        <div>{title}</div>
        <div className="mt-4 text-lg font-medium text-center text-blue-600 dark:text-blue-300">{message}</div>
        {(!autoDismiss && onClose) && (
          <button
            onClick={onClose}
            className="mt-8 w-full py-3 px-4 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg transition-colors duration-200 font-medium"
          >
            Close
          </button>
        )}
      </div>
      <style jsx>{`
        .animate-fade-in-out {
          animation: fadeInOut ${duration}ms;
        }
        @keyframes fadeInOut {
          0% { opacity: 0; transform: scale(0.9); }
          10% { opacity: 1; transform: scale(1.05); }
          90% { opacity: 1; transform: scale(1.05); }
          100% { opacity: 0; transform: scale(0.9); }
        }
      `}</style>
    </div>
  );
};

interface GameStatusProps {
  gridSize: number;
  winStreak: number;
  winner: Player | 'Draw' | null;
  currentPlayer: Player;
  isMultiplayer: boolean;
  isMyTurn: boolean;
  isWaiting: boolean;
  errorMessage: string | null;
  playerSymbol: string | null
}

export const GameStatus: React.FC<GameStatusProps> = ({
  gridSize,
  winStreak,
  winner,
  currentPlayer,
  isMultiplayer,
  isMyTurn,
  isWaiting,
  errorMessage,
  playerSymbol
}) => {
  const [showLevelPopup, setShowLevelPopup] = useState(false);
  const prevGridSize = useRef(gridSize);

  // Modal state for win/loss/draw/error
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusModalProps, setStatusModalProps] = useState<{
    type: 'win' | 'loss' | 'draw' | 'error';
    title: string;
    message: string;
  } | null>(null);

  // Level up popup logic
  useEffect(() => {
    if (gridSize !== prevGridSize.current) {
      setShowLevelPopup(true);
      prevGridSize.current = gridSize;
      const timer = setTimeout(() => setShowLevelPopup(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [gridSize]);

  // Win/loss/draw/error modal logic
  useEffect(() => {
    if (errorMessage) {
      setStatusModalProps({
        type: 'error',
        title: 'Error',
        message: errorMessage,
      });
      setShowStatusModal(true);
    }
  }, [errorMessage]);

  useEffect(() => {
    if (winner) {
      if (winner === 'Draw') {
        setStatusModalProps({
          type: 'draw',
          title: 'Draw',
          message: 'The game ended in a draw!',
        });
      } else {
        setStatusModalProps({
          type: isMultiplayer ? winner === playerSymbol ? 'win' : 'loss' : 'win',
          title: isMultiplayer ? winner === playerSymbol ? 'Victory' : 'Defeat' : 'Victory',
          message: `Player ${winner} Wins!`,
        });
      }
      setShowStatusModal(true);
    }
  }, [winner]);

  console.log("isMultiplayer: " + isMultiplayer);

  return (
    <>
      <StatusPopup
        show={showLevelPopup}
        type="level"
        title={`Level ${Math.floor(gridSize/3)}`}
        message={`Win Condition: Get ${winStreak} in a row to win!`}
        autoDismiss
        duration={1800}
      />
      {statusModalProps && (
        <StatusPopup
          show={showStatusModal}
          type={statusModalProps.type}
          title={statusModalProps.title}
          message={statusModalProps.message}
          onClose={() => setShowStatusModal(false)}
        />
      )}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="text-xl">
            To Win: {winStreak} Streak
          </div>
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