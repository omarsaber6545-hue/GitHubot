import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from 'discord.js';
import { BotClient } from '../../client/BotClient.js';
import { COLORS, EMOJIS } from '../../config/constants.js';
import { githubService } from '../../services/githubService.js';
import { Command } from '../../types/command.js';
import { AppEmbedBuilder } from '../../utils/embedBuilder.js';
import {
  formatDiscordTimestamp,
  parseGitHubRepo,
  truncateText,
} from '../../utils/formatters.js';

export const releaseCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('release')
    .setDescription('عرض تفاصيل وملاحظات آخر إصدار (Release) لمستودع جيت هب')
    .addStringOption((option) =>
      option
        .setName('repo')
        .setDescription('اسم المستودع بصيغة owner/repo (مثال: vercel/next.js)')
        .setRequired(true)
    ),
  category: 'GitHub',
  description: 'عرض وسم الإصدار الأخير، ملاحظات التحديث، وتاريخ النشر والملفات المرفقة.',
  cooldown: 3,

  async execute(interaction: ChatInputCommandInteraction, _client: BotClient) {
    const rawRepo = interaction.options.getString('repo', true);
    const parsed = parseGitHubRepo(rawRepo);

    if (!parsed) {
      const errorEmbed = AppEmbedBuilder.error(
        'Invalid Repository Format',
        `The repository identifier \`${rawRepo}\` is invalid.`,
        'Please use the format `owner/repo` (e.g., `facebook/react`).'
      );
      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      return;
    }

    await interaction.deferReply();

    try {
      const release = await githubService.getLatestRelease(parsed.owner, parsed.repo);

      if (!release) {
        const noReleaseEmbed = AppEmbedBuilder.warning(
          'No Releases Found',
          `Repository \`${parsed.owner}/${parsed.repo}\` has not published any official releases on GitHub yet.`
        );
        await interaction.editReply({ embeds: [noReleaseEmbed] });
        return;
      }

      const releaseTitle = release.name || release.tag_name;
      const cleanBody = release.body ? truncateText(release.body.replace(/<!--[\s\S]*?-->/g, ''), 750) : '*No release notes provided.*';

      const embed = AppEmbedBuilder.base(
        `${EMOJIS.RELEASE} ${parsed.owner}/${parsed.repo} — ${release.tag_name}`,
        cleanBody
      )
        .setColor(COLORS.GITHUB)
        .setURL(release.html_url)
        .setThumbnail(release.author.avatar_url);

      embed.addFields(
        {
          name: '🏷️ Version Tag',
          value: `\`${release.tag_name}\``,
          inline: true,
        },
        {
          name: '👤 Published By',
          value: `**${release.author.login}**`,
          inline: true,
        },
        {
          name: `${EMOJIS.CALENDAR} Release Date`,
          value: `${formatDiscordTimestamp(release.published_at, 'd')} (${formatDiscordTimestamp(release.published_at, 'R')})`,
          inline: true,
        },
        {
          name: '📦 Assets Count',
          value: `${release.assets.length} binary asset${release.assets.length === 1 ? '' : 's'}`,
          inline: true,
        },
        {
          name: '🔖 Release Status',
          value: release.prerelease ? '⚠️ Pre-release' : '✅ Stable',
          inline: true,
        }
      );

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setLabel('View Release on GitHub')
          .setStyle(ButtonStyle.Link)
          .setURL(release.html_url)
          .setEmoji(EMOJIS.RELEASE),
        new ButtonBuilder()
          .setLabel('All Releases')
          .setStyle(ButtonStyle.Link)
          .setURL(`https://github.com/${parsed.owner}/${parsed.repo}/releases`)
          .setEmoji('📋')
      );

      await interaction.editReply({ embeds: [embed], components: [row] });
    } catch (error: any) {
      if (error.details?.isNotFound) {
        const notFoundEmbed = AppEmbedBuilder.error(
          'Repository Not Found',
          `Could not find repository \`${parsed.owner}/${parsed.repo}\`.`
        );
        await interaction.editReply({ embeds: [notFoundEmbed] });
        return;
      }

      const errEmbed = AppEmbedBuilder.error(
        'Failed to Fetch Release',
        error.message || 'An unexpected error occurred while querying the release API.'
      );
      await interaction.editReply({ embeds: [errEmbed] });
    }
  },
};
