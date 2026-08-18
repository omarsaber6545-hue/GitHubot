import { Events } from 'discord.js';
import { BotClient } from '../client/BotClient.js';
import { logger } from '../utils/logger.js';

export function handleErrorEvents(client: BotClient): void {
  client.on(Events.Error, (error) => {
    logger.error('Discord client encountered an error:', error);
  });

  client.on(Events.Warn, (warning) => {
    logger.warn(`Discord client warning: ${warning}`);
  });

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Promise Rejection:', reason);
  });

  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
  });
}
