import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from 'discord.js';
import { BotClient } from '../../client/BotClient.js';
import {
  COLORS,
  EMOJIS,
  STATUS_SERVICES,
  SupportedStatusService,
} from '../../config/constants.js';
import { statusService } from '../../services/statusService.js';
import { Command } from '../../types/command.js';
import { AppEmbedBuilder } from '../../utils/embedBuilder.js';
import { formatDiscordTimestamp } from '../../utils/formatters.js';

export const statusCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('status')
    .setDescription('فحص الحالة التشغيلية والأعطال لخدمات المطورين والمنصات السحابية')
    .addStringOption((option) =>
      option
        .setName('service')
        .setDescription('اختر الخدمة أو المنصة المراد فحصها')
        .setRequired(true)
        .addChoices(
          { name: '🐙 GitHub (جيت هب)', value: 'github' },
          { name: '📦 NPM Registry (حزم إن بي إم)', value: 'npm' },
          { name: '🤖 Discord API (ديسكورد)', value: 'discord' },
          { name: '☁️ Cloudflare (كلاود فلير)', value: 'cloudflare' },
          { name: '▲ Vercel (فيرسل)', value: 'vercel' }
        )
    ),
  category: 'Status',
  description: 'عرض الحالة اللحظية، حالة السيرفرات، والأعطال النشطة للمنصات.',
  cooldown: 3,

  async execute(interaction: ChatInputCommandInteraction, _client: BotClient) {
    const serviceKey = interaction.options.getString('service', true) as SupportedStatusService;
    const serviceMeta = STATUS_SERVICES[serviceKey];

    if (!serviceMeta) {
      const err = AppEmbedBuilder.error('Invalid Service', `Unknown service \`${serviceKey}\`.`);
      await interaction.reply({ embeds: [err], ephemeral: true });
      return;
    }

    await interaction.deferReply();

    try {
      const status = await statusService.getServiceStatus(serviceKey);

      let statusEmoji: string = EMOJIS.OPERATIONAL;
      let embedColor: number = COLORS.SUCCESS;

      if (status.indicator === 'minor') {
        statusEmoji = EMOJIS.DEGRADED;
        embedColor = COLORS.WARNING;
      } else if (status.indicator === 'major' || status.indicator === 'critical') {
        statusEmoji = EMOJIS.MAJOR_OUTAGE;
        embedColor = COLORS.ERROR;
      } else if (status.indicator === 'maintenance') {
        statusEmoji = EMOJIS.MAINTENANCE;
        embedColor = COLORS.PRIMARY;
      } else if (status.indicator === 'unknown') {
        statusEmoji = EMOJIS.UNKNOWN;
        embedColor = COLORS.MUTED;
      }

      const embed = AppEmbedBuilder.base(
        `${statusEmoji} ${status.name} Service Status`,
        `**Current State:** ${status.description}`
      )
        .setColor(embedColor)
        .setURL(status.url)
        .setThumbnail(status.icon);

      embed.addFields({
        name: `${EMOJIS.CLOCK} Last Checked`,
        value: `${formatDiscordTimestamp(status.updatedAt, 'T')} (${formatDiscordTimestamp(status.updatedAt, 'R')})`,
        inline: true,
      });

      // Show active incidents if any
      if (status.activeIncidents.length > 0) {
        const incidentLines = status.activeIncidents.map(
          (inc) =>
            `⚠️ **${inc.name}**\n└ Impact: \`${inc.impact}\` • Status: \`${inc.status}\` • [Incident Link](${inc.shortlink})`
        );
        embed.addFields({
          name: '🚨 Active Incidents',
          value: incidentLines.join('\n\n'),
          inline: false,
        });
      } else {
        embed.addFields({
          name: '🚨 Active Incidents',
          value: '✅ *No active incidents reported.*',
          inline: true,
        });
      }

      // Show affected components if degraded
      if (status.components.length > 0) {
        const compLines = status.components.map(
          (comp) => `• **${comp.name}**: \`${comp.status}\``
        );
        embed.addFields({
          name: '🔧 Component Status Details',
          value: compLines.join('\n'),
          inline: false,
        });
      }

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setLabel(`Official ${status.name} Status Page`)
          .setStyle(ButtonStyle.Link)
          .setURL(status.url)
          .setEmoji(statusEmoji)
      );

      await interaction.editReply({ embeds: [embed], components: [row] });
    } catch (error: any) {
      const errEmbed = AppEmbedBuilder.error(
        'Status Check Failed',
        error.message || `Failed to fetch status for ${serviceMeta.name}.`
      );
      await interaction.editReply({ embeds: [errEmbed] });
    }
  },
};
