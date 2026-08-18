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

export const commitsCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('commits')
    .setDescription('عرض آخر الكوميتات وتاريخ التعديلات لمستودع جيت هب')
    .addStringOption((option) =>
      option
        .setName('repo')
        .setDescription('اسم المستودع بصيغة owner/repo (مثال: facebook/react)')
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName('count')
        .setDescription('عدد الكوميتات المراد عرضها (من 1 إلى 10، الافتراضي 5)')
        .setMinValue(1)
        .setMaxValue(10)
        .setRequired(false)
    ),
  category: 'GitHub',
  description: 'عرض آخر التعديلات والكوميتات وأسماء المبرمجين وتواريخها.',
  cooldown: 3,

  async execute(interaction: ChatInputCommandInteraction, _client: BotClient) {
    const rawRepo = interaction.options.getString('repo', true);
    const count = interaction.options.getInteger('count') || 5;
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
      const commits = await githubService.getCommits(parsed.owner, parsed.repo, count);

      if (!commits || commits.length === 0) {
        const emptyEmbed = AppEmbedBuilder.warning(
          'No Commits Found',
          `Repository \`${parsed.owner}/${parsed.repo}\` has no commits on its default branch.`
        );
        await interaction.editReply({ embeds: [emptyEmbed] });
        return;
      }

      const repoUrl = `https://github.com/${parsed.owner}/${parsed.repo}`;
      const embed = AppEmbedBuilder.base(
        `${EMOJIS.COMMIT} Latest Commits in ${parsed.owner}/${parsed.repo}`,
        `Displaying the last **${commits.length}** commit${commits.length > 1 ? 's' : ''}:`
      )
        .setColor(COLORS.GITHUB)
        .setURL(`${repoUrl}/commits`);

      const commitLines = commits.map((commit, index) => {
        const shortSha = commit.sha.substring(0, 7);
        const firstLine = commit.commit.message.split('\n')[0];
        const truncatedMsg = truncateText(firstLine, 65);
        const author = commit.author?.login || commit.commit.author.name;
        const relativeTime = formatDiscordTimestamp(commit.commit.author.date, 'R');

        return `**${index + 1}.** [\`${shortSha}\`](${commit.html_url}) ${truncatedMsg}\n　└ *by* **${author}** (${relativeTime})`;
      });

      embed.setDescription(commitLines.join('\n\n'));

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setLabel('View All Commits')
          .setStyle(ButtonStyle.Link)
          .setURL(`${repoUrl}/commits`)
          .setEmoji(EMOJIS.COMMIT),
        new ButtonBuilder()
          .setLabel('Repository')
          .setStyle(ButtonStyle.Link)
          .setURL(repoUrl)
          .setEmoji(EMOJIS.GITHUB)
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
        'Failed to Fetch Commits',
        error.message || 'An unexpected error occurred while querying commits.'
      );
      await interaction.editReply({ embeds: [errEmbed] });
    }
  },
};
