import React, { useEffect, useState } from 'react';

interface LobbyProps {
  onGameStart: () => void;
  onCancel: () => void;
}

export const Lobby: React.FC<LobbyProps> = ({ onGameStart, onCancel }) => {
  const [isConnecting, setIsConnecting] = useState(true);
  const [connectionTime, setConnectionTime] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setConnectionTime(prev => prev + 1);
    }, 1000);

    // Simulate connection delay
    const connectionTimer = setTimeout(() => {
      setIsConnecting(false);
    }, 2000);

    return () => {
      clearInterval(timer);
      clearTimeout(connectionTimer);
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
          Game Lobby
        </h2>
        
        {isConnecting ? (
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="text-gray-600 dark:text-gray-300">
              Establishing connection...
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-300">
              Connection established! Ready to find an opponent.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={onCancel}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onGameStart}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                Find Opponent
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 