import { Events, Interaction } from 'discord.js';
import { BotClient } from '../client/BotClient.js';
import { env } from '../config/env.js';
import { AppEmbedBuilder } from '../utils/embedBuilder.js';
import { logger } from '../utils/logger.js';

export function handleInteractionCreate(client: BotClient): void {
  client.on(Events.InteractionCreate, async (interaction: Interaction) => {
    try {
      // 1. Handle Slash Command Interactions
      if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);

        if (!command) {
          logger.warn(`Received unknown command: /${interaction.commandName}`);
          const err = AppEmbedBuilder.error(
            'Command Not Recognized',
            `The command \`/${interaction.commandName}\` does not exist on this bot.`
          );
          await interaction.reply({ embeds: [err], ephemeral: true });
          return;
        }

        // Check Cooldown
        const cooldownSeconds = command.cooldown ?? env.DEFAULT_COOLDOWN_SECONDS;
        const timeLeft = client.cooldowns.check(
          command.data.name,
          interaction.user.id,
          cooldownSeconds
        );

        if (timeLeft > 0) {
          const cooldownEmbed = AppEmbedBuilder.warning(
            'Command On Cooldown',
            `Please wait **${timeLeft}s** before using \`/${command.data.name}\` again.`
          );
          await interaction.reply({ embeds: [cooldownEmbed], ephemeral: true });
          return;
        }

        // Log command execution
        logger.command(
          interaction.user.tag,
          interaction.commandName,
          interaction.guild?.name
        );

        // Execute Command
        try {
          await command.execute(interaction, client);
        } catch (error: any) {
          logger.error(`Error executing command /${interaction.commandName}:`, error);

          const errorEmbed = AppEmbedBuilder.error(
            'Command Execution Error',
            error.message || 'An unexpected internal error occurred while executing this command.'
          );

          if (interaction.deferred || interaction.replied) {
            await interaction.editReply({ embeds: [errorEmbed], components: [] });
          } else {
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
          }
        }
        return;
      }

      // 2. Handle Autocomplete Interactions
      if (interaction.isAutocomplete()) {
        const command = client.commands.get(interaction.commandName);
        if (command?.autocomplete) {
          try {
            await command.autocomplete(interaction, client);
          } catch (error) {
            logger.error(`Autocomplete error for /${interaction.commandName}:`, error);
          }
        }
        return;
      }

      // 3. Handle Select Menu Interactions
      if (interaction.isStringSelectMenu()) {
        for (const cmd of client.commands.values()) {
          if (cmd.handleSelectMenu) {
            try {
              await cmd.handleSelectMenu(interaction, client);
            } catch (error: any) {
              logger.error(`Select menu handler error:`, error);
            }
          }
        }
        return;
      }

      // 4. Handle Button Interactions
      if (interaction.isButton()) {
        for (const cmd of client.commands.values()) {
          if (cmd.handleButton) {
            try {
              await cmd.handleButton(interaction, client);
            } catch (error: any) {
              logger.error(`Button handler error:`, error);
            }
          }
        }
        return;
      }
    } catch (unhandledError) {
      logger.error('Unhandled interaction error:', unhandledError);
    }
  });
}
