import React from 'react';

export type GameMode = 'bot' | 'single' | 'multiplayer';

interface StartMenuProps {
  onGameModeSelect: (mode: GameMode) => void;
}

export const StartMenu: React.FC<StartMenuProps> = ({ onGameModeSelect }) => {
  return (
    <div className="flex flex-col items-center justify-center gap-6 p-8 bg-background text-foreground rounded-lg shadow-2xl">
      <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold mb-4">
        Tic Tac Toe Infinity
      </h1>
      
      <div className="grid grid-cols-1 gap-4 w-full max-w-md">
        <button
          onClick={() => onGameModeSelect('bot')}
          className="btn btn-primary text-lg py-4 px-8"
        >
          Play vs Bot
        </button>
        
        <button
          onClick={() => onGameModeSelect('single')}
          className="btn btn-secondary text-lg py-4 px-8"
        >
          Single Player
        </button>
        
        <button
          onClick={() => onGameModeSelect('multiplayer')}
          className="btn btn-secondary text-lg py-4 px-8"
        >
          Multiplayer
        </button>
      </div>

      <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
        <p>Select a game mode to start playing!</p>
        <ul className="list-disc list-inside mt-2">
          <li>Play vs Bot: Challenge our AI opponent</li>
          <li>Single Player: Play against yourself</li>
          <li>Multiplayer: Play with friends online</li>
        </ul>
      </div>
    </div>
  );
}; 