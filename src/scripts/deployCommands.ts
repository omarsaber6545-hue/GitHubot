import { REST, Routes } from 'discord.js';
import { allCommands } from '../commands/index.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

async function deploySlashCommands() {
  if (!env.DISCORD_TOKEN) {
    logger.error('Cannot deploy commands: DISCORD_TOKEN is missing in .env');
    process.exit(1);
  }

  if (!env.CLIENT_ID) {
    logger.error('Cannot deploy commands: CLIENT_ID is missing in .env');
    process.exit(1);
  }

  const commandsData = allCommands.map((command) => command.data.toJSON());
  const rest = new REST({ version: '10' }).setToken(env.DISCORD_TOKEN);

  try {
    logger.info(`Starting deployment of ${commandsData.length} application (/) commands...`);

    if (env.GUILD_ID) {
      // Guild-specific registration (instantly visible in server)
      logger.info(`Deploying to Guild ID: ${env.GUILD_ID}...`);
      const result: any = await rest.put(
        Routes.applicationGuildCommands(env.CLIENT_ID, env.GUILD_ID),
        { body: commandsData }
      );
      logger.success(`Successfully registered ${result.length} commands to guild (${env.GUILD_ID})!`);
    } else {
      // Global registration (takes ~1 hour to propagate across all Discord servers)
      logger.info('Deploying globally to all Discord servers...');
      const result: any = await rest.put(
        Routes.applicationCommands(env.CLIENT_ID),
        { body: commandsData }
      );
      logger.success(`Successfully registered ${result.length} global application commands!`);
    }
  } catch (error) {
    logger.error('Failed to deploy application commands:', error);
    process.exit(1);
  }
}

deploySlashCommands();
