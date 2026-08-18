import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from 'discord.js';
import { BotClient } from '../../client/BotClient.js';
import { COLORS, EMOJIS } from '../../config/constants.js';
import { env } from '../../config/env.js';
import { githubAuthService } from '../../services/githubAuthService.js';
import { githubService } from '../../services/githubService.js';
import { userStore } from '../../services/userStore.js';
import { Command } from '../../types/command.js';
import { AppEmbedBuilder } from '../../utils/embedBuilder.js';
import { truncateText } from '../../utils/formatters.js';

interface VisibilitySession {
  userId: string;
  githubUsername: string;
  userAccessToken: string;
  allRepos: Array<{ id: number; name: string; full_name: string; private: boolean; description: string | null }>;
  selectedRepoFullName?: string | '__ALL__';
  targetPrivate?: boolean;
  createdAt: number;
}

// Active user sessions (expires in 5 minutes)
const activeSessions = new Map<string, VisibilitySession>();

// Cleanup expired sessions every minute
setInterval(() => {
  const now = Date.now();
  for (const [id, session] of activeSessions.entries()) {
    if (now - session.createdAt > 5 * 60 * 1000) {
      activeSessions.delete(id);
    }
  }
}, 60_000);

export const githubVisibilityCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('github-visibility')
    .setDescription('إدارة وتغيير خصوصية مستودعاتك في جيت هب (عام / خاص) عبر OAuth'),
  category: 'GitHub',
  description: 'تغيير خصوصية مستودع محدد أو جميع المستودعات دفعة واحدة بأمان.',
  cooldown: 5,

  async execute(interaction: ChatInputCommandInteraction, _client: BotClient) {
    const discordUserId = interaction.user.id;

    // 1. Check if GitHub OAuth App is configured in .env
    if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
      const configEmbed = AppEmbedBuilder.warning(
        '⚠️ إعداد GitHub OAuth غير مكتمل',
        'لم يتم إعداد بيانات تطبيق GitHub OAuth (`GITHUB_CLIENT_ID` و `GITHUB_CLIENT_SECRET`) في ملف `.env`.\n\n' +
        '**خطوات التفعيل السريعة (في 30 ثانية):**\n' +
        '1️⃣ افتح الرابط: [GitHub Developer Settings](https://github.com/settings/developers)\n' +
        '2️⃣ اضغط على **New OAuth App**.\n' +
        '3️⃣ ضع **Homepage URL**: `http://localhost:3000`\n' +
        '4️⃣ ضع **Authorization callback URL**: `http://localhost:3000/auth/github/callback`\n' +
        '5️⃣ انسخ `Client ID` و `Client Secret` وضعهما في ملف `.env`.'
      );

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setLabel('فتح صفحة إعدادات GitHub OAuth')
          .setStyle(ButtonStyle.Link)
          .setURL('https://github.com/settings/applications/new')
          .setEmoji(EMOJIS.GITHUB)
      );

      await interaction.reply({ embeds: [configEmbed], components: [row], ephemeral: true });
      return;
    }

    // 2. Check if user is authenticated with GitHub OAuth
    const userRecord = userStore.getUser(discordUserId);
    const token = userStore.getDecryptedToken(discordUserId);

    if (!userRecord || !token) {
      const authUrl = githubAuthService.getAuthorizationUrl(discordUserId);

      const connectEmbed = AppEmbedBuilder.base(
        '🔐 ربط حساب GitHub مطلوب',
        'لإدارة خصوصية مستودعاتك بأمان، يجب ربط حساب GitHub الخاص بك عبر OAuth.\n\n' +
        '**الصلاحيات المطلوبة:**\n' +
        '• `repo` — قراءة وتعديل خصوصية المستودعات بناءً على اختيارك فقط.\n\n' +
        '🔒 **الأمان والخصوصية:**\n' +
        '• التوكن مشفر بالكامل باستخدام **AES-256-GCM**.\n' +
        '• لن يتم الوصول إلا للمستودعات التابعة لحسابك الشخصي.'
      )
        .setColor(COLORS.GITHUB)
        .setFooter({
          text: 'Developer Assistant • GitHub OAuth',
          iconURL: 'https://github.githubassets.com/favicons/favicon.png',
        });

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setLabel('🔗 ربط حساب GitHub')
          .setStyle(ButtonStyle.Link)
          .setURL(authUrl)
          .setEmoji(EMOJIS.GITHUB)
      );

      await interaction.reply({ embeds: [connectEmbed], components: [row], ephemeral: true });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      // 2. Fetch all repositories owned by the authenticated GitHub user
      const repos = await githubService.getUserOwnedRepositories(token);

      if (repos.length === 0) {
        const noReposEmbed = AppEmbedBuilder.warning(
          'No Owned Repositories Found',
          `No repositories owned by **@${userRecord.githubUsername}** were found on GitHub.`
        );
        await interaction.editReply({ embeds: [noReposEmbed] });
        return;
      }

      // Save session
      const sessionId = `vis_${discordUserId}_${Date.now()}`;
      activeSessions.set(sessionId, {
        userId: discordUserId,
        githubUsername: userRecord.githubUsername,
        userAccessToken: token,
        allRepos: repos,
        createdAt: Date.now(),
      });

      const publicCount = repos.filter((r) => !r.private).length;
      const privateCount = repos.filter((r) => r.private).length;

      // 3. Display Repository Selection Select Menu
      const embed = AppEmbedBuilder.base(
        '🔒 GitHub Repository Visibility Manager',
        `Authenticated as **@${userRecord.githubUsername}**\n\n` +
        `Please select a repository to change its visibility, or choose **ALL REPOSITORIES**:`
      )
        .setColor(COLORS.GITHUB)
        .addFields(
          {
            name: '🌐 Public Repos',
            value: `**${publicCount}**`,
            inline: true,
          },
          {
            name: '🔒 Private Repos',
            value: `**${privateCount}**`,
            inline: true,
          },
          {
            name: '📦 Total Owned',
            value: `**${repos.length}**`,
            inline: true,
          }
        );

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(`gh-vis-select-repo:${sessionId}`)
        .setPlaceholder('📂 Choose a repository or select ALL REPOSITORIES...');

      // Special Option: ALL REPOSITORIES
      selectMenu.addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel(`📚 ALL REPOSITORIES (${repos.length} total)`)
          .setValue('__ALL__')
          .setDescription(`Change visibility for all ${repos.length} repositories`)
          .setEmoji('📚')
      );

      // Add individual repositories (up to 24 repos in select menu)
      const displayRepos = repos.slice(0, 24);
      for (const r of displayRepos) {
        const visEmoji = r.private ? '🔒' : '🌐';
        const visText = r.private ? 'Private' : 'Public';
        const desc = r.description ? truncateText(r.description, 60) : `Currently ${visText}`;

        selectMenu.addOptions(
          new StringSelectMenuOptionBuilder()
            .setLabel(`${r.name} (${visText})`)
            .setValue(r.full_name)
            .setDescription(desc)
            .setEmoji(visEmoji)
        );
      }

      const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

      await interaction.editReply({ embeds: [embed], components: [row] });
    } catch (error: any) {
      const errEmbed = AppEmbedBuilder.error(
        'Failed to Fetch Repositories',
        error.message || 'Could not fetch your GitHub repositories. Please try reconnecting your account.'
      );
      await interaction.editReply({ embeds: [errEmbed] });
    }
  },

  async handleSelectMenu(interaction, _client) {
    if (!interaction.customId.startsWith('gh-vis-select-repo:') && !interaction.customId.startsWith('gh-vis-select-action:')) {
      return;
    }

    const [actionType, sessionId] = interaction.customId.split(':');
    const session = activeSessions.get(sessionId);

    if (!session) {
      const expiredEmbed = AppEmbedBuilder.warning(
        'Session Expired',
        'This visibility management session has expired. Please run `/github visibility` again.'
      );
      await interaction.update({ embeds: [expiredEmbed], components: [] });
      return;
    }

    // Security check: Only original user can interact
    if (interaction.user.id !== session.userId) {
      await interaction.reply({
        content: '❌ You are not authorized to interact with another user’s repository session.',
        ephemeral: true,
      });
      return;
    }

    // Step 1: Handle Repo Selection
    if (actionType === 'gh-vis-select-repo') {
      const selectedValue = interaction.values[0];
      session.selectedRepoFullName = selectedValue;

      const isAll = selectedValue === '__ALL__';
      const targetLabel = isAll ? `All ${session.allRepos.length} repositories` : `\`${selectedValue}\``;

      let currentVisText = 'Mixed';
      if (!isAll) {
        const found = session.allRepos.find((r) => r.full_name === selectedValue);
        currentVisText = found?.private ? '🔒 Private' : '🌐 Public';
      } else {
        const pub = session.allRepos.filter((r) => !r.private).length;
        const priv = session.allRepos.filter((r) => r.private).length;
        currentVisText = `🌐 ${pub} Public / 🔒 ${priv} Private`;
      }

      const embed = AppEmbedBuilder.base(
        '⚙️ Select Target Visibility',
        `Selected Target: **${targetLabel}**\n` +
        `Current Status: **${currentVisText}**\n\n` +
        `Choose the new visibility level you want to apply:`
      ).setColor(COLORS.GITHUB);

      const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`gh-vis-set:public:${sessionId}`)
          .setLabel(isAll ? '🌐 Make ALL Public' : '🌐 Make Public')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`gh-vis-set:private:${sessionId}`)
          .setLabel(isAll ? '🔒 Make ALL Private' : '🔒 Make Private')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId(`gh-vis-cancel:${sessionId}`)
          .setLabel('❌ Cancel')
          .setStyle(ButtonStyle.Secondary)
      );

      await interaction.update({ embeds: [embed], components: [buttons] });
    }
  },

  async handleButton(interaction, _client) {
    if (!interaction.customId.startsWith('gh-vis-set:') &&
        !interaction.customId.startsWith('gh-vis-confirm:') &&
        !interaction.customId.startsWith('gh-vis-cancel:')) {
      return;
    }

    const parts = interaction.customId.split(':');
    const action = parts[0];
    const param = parts[1];
    const sessionId = parts[2] || parts[1];

    const session = activeSessions.get(sessionId);

    if (!session) {
      const expiredEmbed = AppEmbedBuilder.warning(
        'Session Expired',
        'This session has expired. Please run `/github visibility` again.'
      );
      await interaction.update({ embeds: [expiredEmbed], components: [] });
      return;
    }

    // Security check
    if (interaction.user.id !== session.userId) {
      await interaction.reply({
        content: '❌ You are not authorized to interact with this session.',
        ephemeral: true,
      });
      return;
    }

    // Cancel action
    if (action === 'gh-vis-cancel') {
      activeSessions.delete(sessionId);
      const cancelEmbed = AppEmbedBuilder.base(
        '🚫 Operation Cancelled',
        'Repository visibility update was cancelled. No changes were made.'
      ).setColor(COLORS.MUTED);

      await interaction.update({ embeds: [cancelEmbed], components: [] });
      return;
    }

    // Step 2: User picked Public or Private -> Show Confirmation
    if (action === 'gh-vis-set') {
      const targetPrivate = param === 'private';
      session.targetPrivate = targetPrivate;

      const isAll = session.selectedRepoFullName === '__ALL__';
      const targetLabel = isAll
        ? `All ${session.allRepos.length} Repositories`
        : `\`${session.selectedRepoFullName}\``;

      const newVisText = targetPrivate ? '🔒 Private' : '🌐 Public';
      let currentVisText = 'Mixed';

      let affectedCount = 0;
      if (isAll) {
        affectedCount = session.allRepos.filter((r) => r.private !== targetPrivate).length;
        const pub = session.allRepos.filter((r) => !r.private).length;
        const priv = session.allRepos.filter((r) => r.private).length;
        currentVisText = `🌐 ${pub} Public / 🔒 ${priv} Private`;
      } else {
        const found = session.allRepos.find((r) => r.full_name === session.selectedRepoFullName);
        currentVisText = found?.private ? '🔒 Private' : '🌐 Public';
        affectedCount = found?.private !== targetPrivate ? 1 : 0;
      }

      const confirmEmbed = new EmbedBuilder()
        .setColor(targetPrivate ? COLORS.WARNING : COLORS.ERROR)
        .setTitle('⚠️ Confirm Repository Visibility Change')
        .setDescription(
          `Are you sure you want to change the visibility of **${targetLabel}** to **${newVisText}**?\n\n` +
          `• **Repositories Selected:** ${targetLabel}\n` +
          `• **Affected Repositories:** \`${affectedCount}\` repo(s) will be modified\n` +
          `• **Current Visibility:** ${currentVisText}\n` +
          `• **New Visibility:** **${newVisText}**\n\n` +
          `⚠️ **Important Notice:**\n` +
          (targetPrivate
            ? 'Making repositories **Private** will restrict access to only you and authorized collaborators.'
            : 'Making repositories **Public** will expose your source code, commits, and issue trackers to the entire internet.')
        )
        .setFooter({
          text: 'Developer Assistant • Confirmation Required',
          iconURL: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/26a0.png',
        })
        .setTimestamp();

      const confirmButtons = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`gh-vis-confirm:${sessionId}`)
          .setLabel('✅ Confirm & Apply Changes')
          .setStyle(targetPrivate ? ButtonStyle.Primary : ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId(`gh-vis-cancel:${sessionId}`)
          .setLabel('❌ Cancel')
          .setStyle(ButtonStyle.Secondary)
      );

      await interaction.update({ embeds: [confirmEmbed], components: [confirmButtons] });
      return;
    }

    // Step 3: User clicked [Confirm] -> Apply changes!
    if (action === 'gh-vis-confirm') {
      const targetPrivate = session.targetPrivate ?? false;
      const isAll = session.selectedRepoFullName === '__ALL__';

      const loadingEmbed = AppEmbedBuilder.loading(
        isAll
          ? `Applying visibility update to ${session.allRepos.length} repositories... Please wait.`
          : `Updating visibility for \`${session.selectedRepoFullName}\`...`
      );

      await interaction.update({ embeds: [loadingEmbed], components: [] });

      const startTime = Date.now();

      try {
        let successful: string[] = [];
        let failed: Array<{ repo: string; error: string }> = [];

        if (isAll) {
          const result = await githubService.batchUpdateVisibility(
            session.userAccessToken,
            session.allRepos,
            targetPrivate
          );
          successful = result.successful;
          failed = result.failed;
        } else {
          const repoFullName = session.selectedRepoFullName!;
          const parts = repoFullName.split('/');
          try {
            await githubService.updateRepositoryVisibility(
              session.userAccessToken,
              parts[0],
              parts[1],
              targetPrivate
            );
            successful.push(repoFullName);
          } catch (err: any) {
            failed.push({ repo: repoFullName, error: err.message });
          }
        }

        const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
        const newVisFormatted = targetPrivate ? '🔒 Private' : '🌐 Public';
        const prevVisFormatted = targetPrivate ? '🌐 Public' : '🔒 Private';

        const resultEmbed = AppEmbedBuilder.base(
          '🎉 Repository Visibility Update Complete',
          `Successfully processed visibility changes for **@${session.githubUsername}** in \`${durationSec}s\`:`
        )
          .setColor(failed.length === 0 ? COLORS.SUCCESS : COLORS.WARNING)
          .addFields(
            {
              name: '✅ Successfully Updated',
              value: `**${successful.length}** repository(s)`,
              inline: true,
            },
            {
              name: '❌ Failed / Skipped',
              value: `**${failed.length}** repository(s)`,
              inline: true,
            },
            {
              name: '🔄 Visibility Transition',
              value: `${prevVisFormatted} ➡️ **${newVisFormatted}**`,
              inline: true,
            }
          );

        // List successful repos if 1-10
        if (successful.length > 0 && successful.length <= 8) {
          resultEmbed.addFields({
            name: '📋 Updated Repositories',
            value: successful.map((r) => `• [${r}](https://github.com/${r})`).join('\n'),
            inline: false,
          });
        }

        // List failures if any
        if (failed.length > 0) {
          const failLines = failed.slice(0, 8).map((f) => `• \`${f.repo}\`: ${truncateText(f.error, 80)}`);
          resultEmbed.addFields({
            name: '⚠️ Failed Repositories',
            value: failLines.join('\n'),
            inline: false,
          });
        }

        // Cleanup session
        activeSessions.delete(sessionId);

        await interaction.editReply({ embeds: [resultEmbed], components: [] });
      } catch (execError: any) {
        const errorEmbed = AppEmbedBuilder.error(
          'Visibility Update Failed',
          execError.message || 'An error occurred while updating repository visibility.'
        );
        await interaction.editReply({ embeds: [errorEmbed], components: [] });
      }
    }
  },
};
