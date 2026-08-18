import {
  Client,
  ClientOptions,
  Collection,
  GatewayIntentBits,
  Partials,
} from 'discord.js';
import { Command } from '../types/command.js';
import { CooldownManager } from '../utils/cooldownManager.js';
import { logger } from '../utils/logger.js';

export class BotClient extends Client {
  public commands: Collection<string, Command> = new Collection();
  public cooldowns: CooldownManager = new CooldownManager();
  public startedAt: Date = new Date();

  constructor(options?: Partial<ClientOptions>) {
    super({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
      ],
      partials: [Partials.Channel, Partials.Message],
      ...options,
    });
  }

  /**
   * Register a command into the bot client registry
   */
  public registerCommand(command: Command): void {
    if (this.commands.has(command.data.name)) {
      logger.warn(`Overwriting command registration: ${command.data.name}`);
    }
    this.commands.set(command.data.name, command);
  }

  /**
   * Register an array of commands
   */
  public registerCommands(commands: Command[]): void {
    for (const cmd of commands) {
      this.registerCommand(cmd);
    }
    logger.info(`Registered ${commands.length} slash commands in memory.`);
  }

  /**
   * Calculate uptime duration in milliseconds
   */
  public getUptimeMs(): number {
    return Date.now() - this.startedAt.getTime();
  }
}
