import { BotClient } from '../client/BotClient.js';
import { handleErrorEvents } from './error.js';
import { handleInteractionCreate } from './interactionCreate.js';
import { handleReady } from './ready.js';

export function registerEvents(client: BotClient): void {
  handleReady(client);
  handleInteractionCreate(client);
  handleErrorEvents(client);
}
