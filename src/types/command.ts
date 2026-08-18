import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  SlashCommandSubcommandsOnlyBuilder,
  AutocompleteInteraction,
  ButtonInteraction,
  StringSelectMenuInteraction,
} from 'discord.js';
import type { BotClient } from '../client/BotClient.js';

export type CommandCategory = 'GitHub' | 'NPM' | 'Docs' | 'Status' | 'Utility';

export interface Command {
  data:
    | SlashCommandBuilder
    | SlashCommandOptionsOnlyBuilder
    | SlashCommandSubcommandsOnlyBuilder
    | Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'>;
  category: CommandCategory;
  description: string;
  cooldown?: number; // In seconds, defaults to 3
  execute: (interaction: ChatInputCommandInteraction, client: BotClient) => Promise<void>;
  autocomplete?: (interaction: AutocompleteInteraction, client: BotClient) => Promise<void>;
  handleButton?: (interaction: ButtonInteraction, client: BotClient) => Promise<void>;
  handleSelectMenu?: (interaction: StringSelectMenuInteraction, client: BotClient) => Promise<void>;
}
