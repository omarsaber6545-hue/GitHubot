import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from 'discord.js';
import { BotClient } from '../../client/BotClient.js';
import { COLORS, EMOJIS } from '../../config/constants.js';
import { npmService } from '../../services/npmService.js';
import { Command } from '../../types/command.js';
import { AppEmbedBuilder } from '../../utils/embedBuilder.js';
import {
  formatDiscordTimestamp,
  formatNumber,
} from '../../utils/formatters.js';

export const npmCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('npm')
    .setDescription('البحث عن معلومات حزمة في NPM والتحميلات الأسبوعية والمكتبات التابعة')
    .addStringOption((option) =>
      option
        .setName('package')
        .setDescription('اسم حزمة NPM (مثال: express, lodash, discord.js)')
        .setRequired(true)
    ),
  category: 'NPM',
  description: 'عرض إصدار الحزمة، التحميلات الأسبوعية، التبعيات، المطور، والرخصة.',
  cooldown: 3,

  async execute(interaction: ChatInputCommandInteraction, _client: BotClient) {
    const rawPackage = interaction.options.getString('package', true).trim();

    // Validate package name format (supports scoped packages @scope/pkg)
    const validPkgRegex = /^(?:@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/i;
    if (!validPkgRegex.test(rawPackage)) {
      const errorEmbed = AppEmbedBuilder.error(
        'Invalid Package Name',
        `\`${rawPackage}\` is not a valid NPM package name.`,
        'Example valid names: `react`, `discord.js`, `@tanstack/react-query`.'
      );
      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      return;
    }

    await interaction.deferReply();

    try {
      const pkg = await npmService.getPackage(rawPackage);

      const embed = AppEmbedBuilder.base(
        `${EMOJIS.NPM} ${pkg.name} \`v${pkg.version}\``,
        pkg.description
      )
        .setColor(COLORS.NPM)
        .setURL(pkg.npmUrl);

      if (pkg.maintainer.avatarUrl) {
        embed.setThumbnail(pkg.maintainer.avatarUrl);
      }

      embed.addFields(
        {
          name: `${EMOJIS.DOWNLOAD} Weekly Downloads`,
          value: `**${formatNumber(pkg.weeklyDownloads)}**`,
          inline: true,
        },
        {
          name: '📦 Dependencies',
          value: `${pkg.dependenciesCount} direct`,
          inline: true,
        },
        {
          name: `${EMOJIS.LICENSE} License`,
          value: pkg.license,
          inline: true,
        },
        {
          name: '👤 Maintainer',
          value: pkg.maintainer.name,
          inline: true,
        },
        {
          name: `${EMOJIS.CLOCK} Last Published`,
          value: `${formatDiscordTimestamp(pkg.lastPublishDate, 'd')} (${formatDiscordTimestamp(pkg.lastPublishDate, 'R')})`,
          inline: true,
        },
        {
          name: '📘 TypeScript Types',
          value: pkg.types ? '✅ Built-in' : '⚪ @types needed',
          inline: true,
        }
      );

      // Add keywords if available
      if (pkg.keywords && pkg.keywords.length > 0) {
        const keywordTags = pkg.keywords
          .slice(0, 8)
          .map((k) => `\`${k}\``)
          .join(' ');
        embed.addFields({
          name: '🏷️ Keywords',
          value: keywordTags,
          inline: false,
        });
      }

      // Action Buttons
      const buttons: ButtonBuilder[] = [
        new ButtonBuilder()
          .setLabel('View on NPM')
          .setStyle(ButtonStyle.Link)
          .setURL(pkg.npmUrl)
          .setEmoji(EMOJIS.NPM),
      ];

      if (pkg.repositoryUrl) {
        buttons.push(
          new ButtonBuilder()
            .setLabel('Repository')
            .setStyle(ButtonStyle.Link)
            .setURL(pkg.repositoryUrl)
            .setEmoji(EMOJIS.GITHUB)
        );
      }

      // Bundlephobia link for bundle size
      buttons.push(
        new ButtonBuilder()
          .setLabel('Bundle Size')
          .setStyle(ButtonStyle.Link)
          .setURL(`https://bundlephobia.com/package/${encodeURIComponent(pkg.name)}`)
          .setEmoji('⚡')
      );

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(buttons);

      await interaction.editReply({ embeds: [embed], components: [row] });
    } catch (error: any) {
      if (error.details?.isNotFound) {
        const notFoundEmbed = AppEmbedBuilder.error(
          'Package Not Found',
          `Package \`${rawPackage}\` could not be found on the NPM registry.`,
          'Check the package name spelling or try `/npm-search` to find packages.'
        );
        await interaction.editReply({ embeds: [notFoundEmbed] });
        return;
      }

      const errEmbed = AppEmbedBuilder.error(
        'NPM Lookup Failed',
        error.message || 'An unexpected error occurred while querying the NPM registry.'
      );
      await interaction.editReply({ embeds: [errEmbed] });
    }
  },
};
