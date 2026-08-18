import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from 'discord.js';
import { BotClient } from '../../client/BotClient.js';
import { COLORS, EMOJIS } from '../../config/constants.js';
import { Command } from '../../types/command.js';
import { AppEmbedBuilder } from '../../utils/embedBuilder.js';
import { formatDuration, formatLatency } from '../../utils/formatters.js';

export const pingCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('فحص سرعة استجابة البوت وبنج ديسكورد API'),
  category: 'Utility',
  description: 'عرض بنج ديسكورد وسرعة اتصال WebSocket ومدة تشغيل البوت.',
  cooldown: 2,

  async execute(interaction: ChatInputCommandInteraction, client: BotClient) {
    const startTime = Date.now();
    await interaction.deferReply();
    const restLatency = Date.now() - startTime;

    const wsLatency = client.ws.ping;
    const wsFormatted = formatLatency(wsLatency);
    const restFormatted = formatLatency(restLatency);
    const uptime = formatDuration(client.getUptimeMs());

    const embed = AppEmbedBuilder.base(
      `${EMOJIS.PING} Pong! System Diagnostics`,
      'Real-time connectivity and latency measurements:'
    )
      .setColor(COLORS.SUCCESS)
      .addFields(
        {
          name: '📡 WebSocket Heartbeat',
          value: `${wsFormatted.emoji} **${wsFormatted.text}** (${wsFormatted.status})`,
          inline: true,
        },
        {
          name: '⚡ Discord REST API',
          value: `${restFormatted.emoji} **${restFormatted.text}** (${restFormatted.status})`,
          inline: true,
        },
        {
          name: '⏱️ Bot Uptime',
          value: `\`${uptime}\``,
          inline: true,
        }
      );

    await interaction.editReply({ embeds: [embed] });
  },
};
