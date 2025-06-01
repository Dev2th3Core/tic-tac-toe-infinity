import { BotLevel, BotStrategy } from './types';
import { expertBot } from './expertBot';

const botStrategies: Record<BotLevel, BotStrategy> = {
  expert: expertBot,
};

export const getBotStrategy = (level: BotLevel): BotStrategy => {
  return botStrategies[level];
};

export const getAvailableBotLevels = (): BotLevel[] => {
  return Object.keys(botStrategies) as BotLevel[];
}; 