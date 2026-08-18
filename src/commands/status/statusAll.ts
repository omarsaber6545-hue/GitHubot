import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from 'discord.js';
import { BotClient } from '../../client/BotClient.js';
import { COLORS, EMOJIS } from '../../config/constants.js';
import { statusService } from '../../services/statusService.js';
import { Command } from '../../types/command.js';
import { AppEmbedBuilder } from '../../utils/embedBuilder.js';
import { formatDiscordTimestamp } from '../../utils/formatters.js';

export const statusAllCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('status-all')
    .setDescription('عرض لوحة متابعة شاملة لحالة جميع خدمات ومنصات المطورين'),
  category: 'Status',
  description: 'عرض لوحة مباشرة لحالة GitHub, NPM, Discord, Cloudflare, Vercel معاً.',
  cooldown: 5,

  async execute(interaction: ChatInputCommandInteraction, _client: BotClient) {
    await interaction.deferReply();

    try {
      const allStatuses = await statusService.getAllServicesStatus();

      const hasOutages = allStatuses.some(
        (s) => s.indicator === 'major' || s.indicator === 'critical'
      );
      const hasMinor = allStatuses.some((s) => s.indicator === 'minor');

      let overallEmoji: string = EMOJIS.OPERATIONAL;
      let overallColor: number = COLORS.SUCCESS;
      let overallText = 'All developer systems are currently operational.';

      if (hasOutages) {
        overallEmoji = EMOJIS.MAJOR_OUTAGE;
        overallColor = COLORS.ERROR;
        overallText = 'One or more services are experiencing major outages!';
      } else if (hasMinor) {
        overallEmoji = EMOJIS.DEGRADED;
        overallColor = COLORS.WARNING;
        overallText = 'Some services are experiencing partial degradation.';
      }

      const embed = AppEmbedBuilder.base(
        `${overallEmoji} Developer Services Status Overview`,
        `**Overview:** ${overallText}`
      ).setColor(overallColor);

      for (const service of allStatuses) {
        let emoji: string = EMOJIS.OPERATIONAL;
        if (service.indicator === 'minor') emoji = EMOJIS.DEGRADED;
        if (service.indicator === 'major' || service.indicator === 'critical') emoji = EMOJIS.MAJOR_OUTAGE;
        if (service.indicator === 'maintenance') emoji = EMOJIS.MAINTENANCE;
        if (service.indicator === 'unknown') emoji = EMOJIS.UNKNOWN;

        const incidentNote =
          service.activeIncidents.length > 0
            ? `\n└ 🚨 *${service.activeIncidents.length} active incident(s)*`
            : '';

        embed.addFields({
          name: `${emoji} ${service.name}`,
          value: `**Status:** ${service.description}${incidentNote}\n[Open Status Page](${service.url})`,
          inline: true,
        });
      }

      embed.addFields({
        name: `${EMOJIS.CLOCK} Last Checked`,
        value: `${formatDiscordTimestamp(new Date(), 'T')} (${formatDiscordTimestamp(new Date(), 'R')})`,
        inline: false,
      });

      const buttons = allStatuses.map((s) =>
        new ButtonBuilder()
          .setLabel(s.name)
          .setStyle(ButtonStyle.Link)
          .setURL(s.url)
      );

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(buttons.slice(0, 5));

      await interaction.editReply({ embeds: [embed], components: [row] });
    } catch (error: any) {
      const errEmbed = AppEmbedBuilder.error(
        'Status Overview Failed',
        error.message || 'Failed to fetch status overview.'
      );
      await interaction.editReply({ embeds: [errEmbed] });
    }
  },
};
