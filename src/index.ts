import { BotClient } from './client/BotClient.js';
import { allCommands } from './commands/index.js';
import { env } from './config/env.js';
import { registerEvents } from './events/index.js';
import { oauthServer } from './services/oauthServer.js';
import { logger } from './utils/logger.js';

async function bootstrap() {
  logger.info('Initializing Discord Developer Assistant Bot...');

  // Start OAuth server
  await oauthServer.start();

  // Create Bot client
  const client = new BotClient();

  // Register commands & event listeners
  client.registerCommands(allCommands);
  registerEvents(client);

  // Graceful shutdown handling
  const handleShutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Shutting down gracefully...`);
    try {
      oauthServer.stop();
      client.destroy();
      logger.success('Discord client & OAuth server disconnected cleanly.');
      process.exit(0);
    } catch (err) {
      logger.error('Error during shutdown:', err);
      process.exit(1);
    }
  };

  process.on('SIGINT', () => handleShutdown('SIGINT'));
  process.on('SIGTERM', () => handleShutdown('SIGTERM'));

  // Connect to Discord
  if (!env.DISCORD_TOKEN) {
    logger.error('FATAL: DISCORD_TOKEN is not defined in environment or .env file.');
    logger.info('Please copy .env.example to .env and configure your bot credentials.');
    process.exit(1);
  }

  try {
    await client.login(env.DISCORD_TOKEN);
  } catch (error) {
    logger.error('Failed to log in to Discord API:', error);
    process.exit(1);
  }
}

bootstrap();
