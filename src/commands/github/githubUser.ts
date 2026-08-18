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
import { formatDiscordTimestamp, formatNumber } from '../../utils/formatters.js';

export const githubUserCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('github-user')
    .setDescription('عرض الملف الشخصي وإحصائيات مستخدم في جيت هب')
    .addStringOption((option) =>
      option
        .setName('username')
        .setDescription('اسم المستخدم في جيت هب (مثال: torvalds, gaearon)')
        .setRequired(true)
    ),
  category: 'GitHub',
  description: 'عرض بروفايل جيت هب، صورة الحساب، النبذة، المتابعين، والمستودعات العامة.',
  cooldown: 3,

  async execute(interaction: ChatInputCommandInteraction, _client: BotClient) {
    const rawUsername = interaction.options.getString('username', true).trim();
    const cleanUsername = rawUsername.replace(/^@/, '');

    if (!/^[a-zA-Z0-9-]{1,39}$/.test(cleanUsername)) {
      const errorEmbed = AppEmbedBuilder.error(
        'Invalid Username',
        `\`${rawUsername}\` is not a valid GitHub username format.`,
        'GitHub usernames can only contain alphanumeric characters and hyphens.'
      );
      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      return;
    }

    await interaction.deferReply();

    try {
      const user = await githubService.getUser(cleanUsername);

      const embed = AppEmbedBuilder.base(
        `${EMOJIS.USER} ${user.name ? `${user.name} (@${user.login})` : `@${user.login}`}`,
        user.bio || '*No bio provided.*'
      )
        .setColor(COLORS.GITHUB)
        .setURL(user.html_url)
        .setThumbnail(user.avatar_url);

      embed.addFields(
        {
          name: `${EMOJIS.NPM} Public Repos`,
          value: formatNumber(user.public_repos),
          inline: true,
        },
        {
          name: `${EMOJIS.FOLLOWERS} Followers`,
          value: formatNumber(user.followers),
          inline: true,
        },
        {
          name: `${EMOJIS.FOLLOWERS} Following`,
          value: formatNumber(user.following),
          inline: true,
        },
        {
          name: `${EMOJIS.CALENDAR} Account Created`,
          value: `${formatDiscordTimestamp(user.created_at, 'd')} (${formatDiscordTimestamp(user.created_at, 'R')})`,
          inline: true,
        }
      );

      // Additional profile details if present
      const additionalDetails: string[] = [];
      if (user.company) additionalDetails.push(`🏢 **Company:** ${user.company}`);
      if (user.location) additionalDetails.push(`📍 **Location:** ${user.location}`);
      if (user.blog) additionalDetails.push(`🌐 **Website:** [${user.blog.replace(/^https?:\/\//, '')}](${user.blog.startsWith('http') ? user.blog : `https://${user.blog}`})`);
      if (user.twitter_username) additionalDetails.push(`🐦 **Twitter/X:** [@${user.twitter_username}](https://twitter.com/${user.twitter_username})`);

      if (additionalDetails.length > 0) {
        embed.addFields({
          name: 'ℹ️ Profile Details',
          value: additionalDetails.join('\n'),
          inline: false,
        });
      }

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setLabel('View GitHub Profile')
          .setStyle(ButtonStyle.Link)
          .setURL(user.html_url)
          .setEmoji(EMOJIS.GITHUB),
        new ButtonBuilder()
          .setLabel('View Repositories')
          .setStyle(ButtonStyle.Link)
          .setURL(`${user.html_url}?tab=repositories`)
          .setEmoji('📂')
      );

      await interaction.editReply({ embeds: [embed], components: [row] });
    } catch (error: any) {
      if (error.details?.isNotFound) {
        const notFoundEmbed = AppEmbedBuilder.error(
          'User Not Found',
          `Could not find GitHub user \`${cleanUsername}\`.`,
          'Please verify the username and try again.'
        );
        await interaction.editReply({ embeds: [notFoundEmbed] });
        return;
      }

      const errEmbed = AppEmbedBuilder.error(
        'GitHub User Lookup Failed',
        error.message || 'An unexpected error occurred while querying the GitHub API.'
      );
      await interaction.editReply({ embeds: [errEmbed] });
    }
  },
};
