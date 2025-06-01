// Custom error types
export class GameError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'GameError';
  }
}

export class ValidationError extends GameError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class GameStateError extends GameError {
  constructor(message: string) {
    super(message, 'GAME_STATE_ERROR');
    this.name = 'GameStateError';
  }
}

export class PlayerError extends GameError {
  constructor(message: string) {
    super(message, 'PLAYER_ERROR');
    this.name = 'PlayerError';
  }
}

// Log levels
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

// Log entry interface
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
  error?: Error;
  requestId?: string;
}

// Logger class
export class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];
  private readonly MAX_LOGS = 1000;

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private log(level: LogLevel, message: string, data?: any, error?: Error, requestId?: string) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      error,
      requestId
    };

    this.logs.push(entry);
    if (this.logs.length > this.MAX_LOGS) {
      this.logs.shift();
    }

    // Console output with colors
    const color = this.getColorForLevel(level);
    console.log(
      `%c[${level}]%c ${message}`,
      `color: ${color}; font-weight: bold`,
      'color: inherit',
      data || '',
      error || ''
    );
  }

  private getColorForLevel(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG:
        return '#6c757d';
      case LogLevel.INFO:
        return '#0d6efd';
      case LogLevel.WARN:
        return '#ffc107';
      case LogLevel.ERROR:
        return '#dc3545';
      default:
        return '#000000';
    }
  }

  debug(message: string, data?: any, requestId?: string) {
    this.log(LogLevel.DEBUG, message, data, undefined, requestId);
  }

  info(message: string, data?: any, requestId?: string) {
    this.log(LogLevel.INFO, message, data, undefined, requestId);
  }

  warn(message: string, data?: any, requestId?: string) {
    this.log(LogLevel.WARN, message, data, undefined, requestId);
  }

  error(message: string, error?: Error, data?: any, requestId?: string) {
    this.log(LogLevel.ERROR, message, data, error, requestId);
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
  }
}

// Error handler
export class ErrorHandler {
  private static instance: ErrorHandler;
  private logger: Logger;

  private constructor() {
    this.logger = Logger.getInstance();
  }

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  handleError(error: Error, context: string, requestId?: string) {
    if (error instanceof GameError) {
      this.logger.error(`[${error.code}] ${error.message}`, error, { context }, requestId);
    } else {
      this.logger.error(`Unexpected error: ${error.message}`, error, { context }, requestId);
    }
    return {
      error: true,
      code: error instanceof GameError ? error.code : 'UNKNOWN_ERROR',
      message: error.message
    };
  }

  validateMove(row: number, col: number, gridSize: number): void {
    if (row < 0 || row >= gridSize || col < 0 || col >= gridSize) {
      throw new ValidationError(`Invalid move: position (${row}, ${col}) is out of bounds`);
    }
  }

  validatePlayerTurn(currentPlayer: string, playerId: string, expectedPlayerId: string): void {
    if (playerId !== expectedPlayerId) {
      throw new PlayerError(`Player ${playerId} attempted to move out of turn`);
    }
  }

  validateGameState(game: any, gameId: string): void {
    if (!game) {
      throw new GameStateError(`Game ${gameId} not found`);
    }
  }
} 