import React, { useEffect, useState } from 'react';

interface LobbyProps {
  onGameStart: () => void;
  onCancel: () => void;
}

export const Lobby: React.FC<LobbyProps> = ({ onGameStart, onCancel }) => {
  const [isConnecting, setIsConnecting] = useState(true);
  const [isFindingOpponent, setIsFindingOpponent] = useState(false);
  const [connectionTime, setConnectionTime] = useState(0);
  const [searchTime, setSearchTime] = useState(30);
  const [searchTimeout, setSearchTimeout] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setConnectionTime(prev => prev + 1);
    }, 500);

    // Simulate connection delay
    const connectionTimer = setTimeout(() => {
      setIsConnecting(false);
    }, 2000);

    return () => {
      clearInterval(timer);
      clearTimeout(connectionTimer);
    };
  }, []);

  // Timer effect for finding opponent
  useEffect(() => {
    let searchTimer: NodeJS.Timeout;
    
    if (isFindingOpponent && !searchTimeout) {
      searchTimer = setInterval(() => {
        setSearchTime(prev => {
          if (prev <= 1) {
            setIsFindingOpponent(false);
            setSearchTimeout(true);
            return 30;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (searchTimer) {
        clearInterval(searchTimer);
      }
    };
  }, [isFindingOpponent, searchTimeout]);

  const handleFindOpponent = () => {
    setIsFindingOpponent(true);
    setSearchTimeout(false);
    setSearchTime(30);
    onGameStart();
  };

  const handleCancel = () => {
    setIsFindingOpponent(false);
    setSearchTimeout(false);
    setSearchTime(30);
    onCancel();
  };

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
              {searchTimeout 
                ? "No opponent found. Please try again."
                : "Connection established! Ready to find an opponent."}
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleFindOpponent}
                disabled={isFindingOpponent}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px] flex items-center justify-center gap-2"
              >
                {isFindingOpponent ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Finding Opponent... ({searchTime}s)
                  </>
                ) : (
                  'Find Opponent'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 