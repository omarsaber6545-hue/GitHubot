import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from 'discord.js';
import { BotClient } from '../../client/BotClient.js';
import { COLORS, EMOJIS } from '../../config/constants.js';
import { env } from '../../config/env.js';
import { githubAuthService } from '../../services/githubAuthService.js';
import { userStore } from '../../services/userStore.js';
import { Command } from '../../types/command.js';
import { AppEmbedBuilder } from '../../utils/embedBuilder.js';
import { formatDiscordTimestamp } from '../../utils/formatters.js';

export const githubAuthCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('github-auth')
    .setDescription('ربط أو إدارة حساب جيت هب عبر OAuth للتحكم في المستودعات')
    .addStringOption((option) =>
      option
        .setName('action')
        .setDescription('اختر الإجراء: عرض الحالة، الربط، أو إلغاء الربط')
        .setRequired(false)
        .addChoices(
          { name: '📊 عرض الحالة (Status)', value: 'status' },
          { name: '🔗 ربط الحساب (Connect)', value: 'connect' },
          { name: '🔌 إلغاء ربط الحساب (Disconnect)', value: 'disconnect' }
        )
    ),
  category: 'GitHub',
  description: 'إدارة جلسة مصادقة GitHub OAuth وحالة الحساب المربوط.',
  cooldown: 3,

  async execute(interaction: ChatInputCommandInteraction, _client: BotClient) {
    const discordUserId = interaction.user.id;
    const action = interaction.options.getString('action') || 'status';

    const userRecord = userStore.getUser(discordUserId);
    const authUrl = githubAuthService.getAuthorizationUrl(discordUserId);

    if (action === 'disconnect') {
      if (!userRecord) {
        const notConnected = AppEmbedBuilder.warning(
          'Not Connected',
          'You do not have a connected GitHub account to disconnect.'
        );
        await interaction.reply({ embeds: [notConnected], ephemeral: true });
        return;
      }

      userStore.deleteUser(discordUserId);
      const disconnectedEmbed = AppEmbedBuilder.success(
        'GitHub Account Disconnected',
        `Successfully disconnected and deleted your GitHub OAuth credentials for **@${userRecord.githubUsername}**.`
      );
      await interaction.reply({ embeds: [disconnectedEmbed], ephemeral: true });
      return;
    }

    if (action === 'connect' || !userRecord) {
      if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
        const configEmbed = AppEmbedBuilder.warning(
          '⚠️ إعداد GitHub OAuth غير مكتمل',
          'لم يتم تعيين `GITHUB_CLIENT_ID` و `GITHUB_CLIENT_SECRET` في ملف `.env`.\n\n' +
          'لإنشاء تطبيق OAuth على GitHub:\n' +
          '1. افتح: [GitHub Developer Settings](https://github.com/settings/applications/new)\n' +
          '2. أنشئ New OAuth App مع الـ Callback URL: `http://localhost:3000/auth/github/callback`\n' +
          '3. انسخ Client ID و Client Secret في `.env`.'
        );
        await interaction.reply({ embeds: [configEmbed], ephemeral: true });
        return;
      }

      const connectEmbed = AppEmbedBuilder.base(
        '🔗 ربط حساب GitHub الخاص بك',
        'قم بربط حسابك في GitHub لإدارة خصوصية مستودعاتك مباشرة من ديسكورد.\n\n' +
        '**الصلاحيات المطلوبة:**\n' +
        '• `repo` — قراءة وتعديل خصوصية المستودعات.\n\n' +
        '🔒 **أمان تام:** لا نطلب ولا نحفظ كلمات المرور أبداً، وتوكنات الوصول مشفرة بالكامل.'
      )
        .setColor(COLORS.GITHUB);

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setLabel('المصادقة عبر GitHub')
          .setStyle(ButtonStyle.Link)
          .setURL(authUrl)
          .setEmoji(EMOJIS.GITHUB)
      );

      await interaction.reply({ embeds: [connectEmbed], components: [row], ephemeral: true });
      return;
    }

    // Status
    const embed = AppEmbedBuilder.base(
      '🔐 GitHub Account Status',
      `Your Discord account is connected to GitHub user **[@${userRecord.githubUsername}](https://github.com/${userRecord.githubUsername})**.`
    )
      .setColor(COLORS.GITHUB)
      .setThumbnail(userRecord.githubAvatarUrl || null)
      .addFields(
        {
          name: '👤 GitHub Username',
          value: `\`${userRecord.githubUsername}\``,
          inline: true,
        },
        {
          name: '🆔 GitHub ID',
          value: `\`${userRecord.githubUserId}\``,
          inline: true,
        },
        {
          name: '📅 Connected Since',
          value: `${formatDiscordTimestamp(userRecord.connectedAt, 'd')} (${formatDiscordTimestamp(userRecord.connectedAt, 'R')})`,
          inline: true,
        },
        {
          name: '🔒 Security',
          value: 'Token encrypted with AES-256-GCM',
          inline: true,
        }
      );

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel('Re-authenticate')
        .setStyle(ButtonStyle.Link)
        .setURL(authUrl)
        .setEmoji(EMOJIS.GITHUB),
      new ButtonBuilder()
        .setLabel('Manage Repositories')
        .setStyle(ButtonStyle.Secondary)
        .setCustomId('gh-auth-go-visibility')
        .setEmoji('🔒')
    );

    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
  },

  async handleButton(interaction, _client) {
    if (interaction.customId === 'gh-auth-go-visibility') {
      await interaction.reply({
        content: '👉 Run `/github-visibility` to manage your repositories!',
        ephemeral: true,
      });
    }
  },
};
