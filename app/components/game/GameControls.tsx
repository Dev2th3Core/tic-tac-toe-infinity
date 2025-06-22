import React from 'react';

interface GameControlsProps {
  onReset: () => void;
}

export const GameControls: React.FC<GameControlsProps> = ({
  onReset,
}) => {
  return (
    <div className="mb-4 flex gap-4">
      <button
        onClick={onReset}
        className="btn btn-primary rounded-xl"
      >
        New Game
      </button>
    </div>
  );
}; 