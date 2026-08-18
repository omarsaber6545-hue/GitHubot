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
  formatBytes,
  formatDiscordTimestamp,
  formatNumber,
  parseGitHubRepo,
  truncateText,
} from '../../utils/formatters.js';

export const githubCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('github')
    .setDescription('عرض إحصائيات ومعلومات تفصيلية عن مستودع جيت هب')
    .addStringOption((option) =>
      option
        .setName('repo')
        .setDescription('اسم المستودع بصيغة owner/repo (مثال: facebook/react)')
        .setRequired(true)
    ),
  category: 'GitHub',
  description: 'عرض إحصائيات المستودع، لغة البرمجة، النجوم، الفروك، وآخر إصدار وكوميت.',
  cooldown: 3,

  async execute(interaction: ChatInputCommandInteraction, _client: BotClient) {
    const rawRepo = interaction.options.getString('repo', true);
    const parsed = parseGitHubRepo(rawRepo);

    if (!parsed) {
      const errorEmbed = AppEmbedBuilder.error(
        'Invalid Repository Format',
        `The repository identifier \`${rawRepo}\` is invalid.`,
        'Please use the format `owner/repo` (e.g., `facebook/react`, `microsoft/typescript`, `nodejs/node`).'
      );
      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      return;
    }

    await interaction.deferReply();

    try {
      const repo = await githubService.getRepository(parsed.owner, parsed.repo);

      const embed = AppEmbedBuilder.base(
        `${EMOJIS.GITHUB} ${repo.full_name}`,
        repo.description || '*No description provided for this repository.*'
      )
        .setColor(COLORS.GITHUB)
        .setURL(repo.html_url)
        .setThumbnail(repo.owner.avatar_url);

      // Main stats grid
      embed.addFields(
        {
          name: `${EMOJIS.STAR} Stars`,
          value: formatNumber(repo.stargazers_count),
          inline: true,
        },
        {
          name: `${EMOJIS.FORK} Forks`,
          value: formatNumber(repo.forks_count),
          inline: true,
        },
        {
          name: `${EMOJIS.ISSUE} Open Issues`,
          value: formatNumber(repo.open_issues_count),
          inline: true,
        },
        {
          name: `${EMOJIS.LANGUAGE} Primary Language`,
          value: repo.language || 'Not specified',
          inline: true,
        },
        {
          name: `${EMOJIS.FILE_SIZE} Repo Size`,
          value: formatBytes(repo.size, true),
          inline: true,
        },
        {
          name: `${EMOJIS.LICENSE} License`,
          value: repo.license?.name || repo.license?.spdx_id || 'None',
          inline: true,
        },
        {
          name: `${EMOJIS.CALENDAR} Created Date`,
          value: `${formatDiscordTimestamp(repo.created_at, 'd')} (${formatDiscordTimestamp(repo.created_at, 'R')})`,
          inline: true,
        },
        {
          name: `${EMOJIS.CLOCK} Last Updated`,
          value: `${formatDiscordTimestamp(repo.updated_at, 'd')} (${formatDiscordTimestamp(repo.pushed_at || repo.updated_at, 'R')})`,
          inline: true,
        }
      );

      // Latest Release Information
      if (repo.latestRelease) {
        embed.addFields({
          name: `${EMOJIS.RELEASE} Latest Release`,
          value: `[**${repo.latestRelease.tag_name}**](${repo.latestRelease.html_url}) ${
            repo.latestRelease.name ? `— ${truncateText(repo.latestRelease.name, 35)}` : ''
          } (${formatDiscordTimestamp(repo.latestRelease.published_at, 'R')})`,
          inline: false,
        });
      } else {
        embed.addFields({
          name: `${EMOJIS.RELEASE} Latest Release`,
          value: '*No published releases*',
          inline: false,
        });
      }

      // Latest Commit Information
      if (repo.latestCommit) {
        const shortSha = repo.latestCommit.sha.substring(0, 7);
        const commitMsg = truncateText(repo.latestCommit.commit.message.split('\n')[0], 60);
        const authorName = repo.latestCommit.author?.login || repo.latestCommit.commit.author.name;
        const commitDate = formatDiscordTimestamp(repo.latestCommit.commit.author.date, 'R');

        embed.addFields({
          name: `${EMOJIS.COMMIT} Latest Commit`,
          value: `[\`${shortSha}\`](${repo.latestCommit.html_url}) ${commitMsg}\n└ By **${authorName}** ${commitDate}`,
          inline: false,
        });
      }

      // Interactive Action Buttons
      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setLabel('View on GitHub')
          .setStyle(ButtonStyle.Link)
          .setURL(repo.html_url)
          .setEmoji(EMOJIS.GITHUB),
        new ButtonBuilder()
          .setLabel('Releases')
          .setStyle(ButtonStyle.Link)
          .setURL(`${repo.html_url}/releases`)
          .setEmoji(EMOJIS.RELEASE),
        new ButtonBuilder()
          .setLabel('Issues')
          .setStyle(ButtonStyle.Link)
          .setURL(`${repo.html_url}/issues`)
          .setEmoji(EMOJIS.ISSUE)
      );

      await interaction.editReply({ embeds: [embed], components: [row] });
    } catch (error: any) {
      if (error.details?.isNotFound) {
        const notFoundEmbed = AppEmbedBuilder.error(
          'Repository Not Found',
          `Could not find repository \`${parsed.owner}/${parsed.repo}\`.`,
          'Check the spelling and make sure the repository is public.'
        );
        await interaction.editReply({ embeds: [notFoundEmbed] });
        return;
      }

      const errEmbed = AppEmbedBuilder.error(
        'GitHub Lookup Failed',
        error.message || 'An unexpected error occurred while querying the GitHub API.'
      );
      await interaction.editReply({ embeds: [errEmbed] });
    }
  },
};
