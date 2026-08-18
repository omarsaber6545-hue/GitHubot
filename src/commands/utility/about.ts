import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  version as djsVersion,
} from 'discord.js';
import { BotClient } from '../../client/BotClient.js';
import { COLORS, EMOJIS } from '../../config/constants.js';
import { cacheService } from '../../services/cacheService.js';
import { Command } from '../../types/command.js';
import { AppEmbedBuilder } from '../../utils/embedBuilder.js';
import { formatBytes, formatDuration, formatNumber } from '../../utils/formatters.js';

export const aboutCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('about')
    .setDescription('عرض معلومات وإحصائيات البوت ومواصفات النظام وعدد السيرفرات'),
  category: 'Utility',
  description: 'عرض معمارية البوت، إحصائيات الذاكرة، وعدد السيرفرات والمستخدمين.',
  cooldown: 3,

  async execute(interaction: ChatInputCommandInteraction, client: BotClient) {
    const memoryUsage = process.memoryUsage();
    const uptime = formatDuration(client.getUptimeMs());
    const guildCount = client.guilds.cache.size;
    const userCount = client.guilds.cache.reduce((acc, guild) => acc + (guild.memberCount || 0), 0);
    const cacheStats = cacheService.getStats();

    const embed = AppEmbedBuilder.base(
      `${EMOJIS.BOT} About Developer Assistant Bot`,
      'A production-grade developer assistant built for software engineering teams and programming communities. Provides instant access to GitHub repositories, NPM packages, documentation searches, and real-time infrastructure service health.'
    )
      .setColor(COLORS.PRIMARY)
      .setThumbnail(client.user?.displayAvatarURL() || null);

    embed.addFields(
      {
        name: '🤖 Bot Version',
        value: '`v1.0.0` (Production)',
        inline: true,
      },
      {
        name: '👨‍💻 Developer & Team',
        value: 'Google DeepMind Team',
        inline: true,
      },
      {
        name: '⏱️ Process Uptime',
        value: `\`${uptime}\``,
        inline: true,
      },
      {
        name: '🌐 Server Count',
        value: `**${formatNumber(guildCount)}** guild${guildCount === 1 ? '' : 's'}`,
        inline: true,
      },
      {
        name: '👥 Users Served',
        value: `**${formatNumber(userCount)}** members`,
        inline: true,
      },
      {
        name: '⚡ Commands Registered',
        value: `**${client.commands.size}** slash commands`,
        inline: true,
      },
      {
        name: '📚 Library & Runtime',
        value: `• **Discord.js:** \`v${djsVersion}\`\n• **Node.js:** \`${process.version}\`\n• **TypeScript:** \`v5.7\``,
        inline: true,
      },
      {
        name: '💾 Memory & Cache',
        value: `• **Heap Used:** ${formatBytes(memoryUsage.heapUsed)}\n• **Cache Size:** ${cacheStats.size} items\n• **Hit Rate:** ${cacheStats.hitRate.toFixed(1)}%`,
        inline: true,
      }
    );

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel('GitHub Source')
        .setStyle(ButtonStyle.Link)
        .setURL('https://github.com')
        .setEmoji(EMOJIS.GITHUB),
      new ButtonBuilder()
        .setLabel('Discord.js Docs')
        .setStyle(ButtonStyle.Link)
        .setURL('https://discord.js.org')
        .setEmoji(EMOJIS.DOCS)
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  },
};
