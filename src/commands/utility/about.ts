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
      `${EMOJIS.BOT} عن بوت جيت هَبوت (GitHubot)`,
      'بوت متكامل للمطورين وفرق البرمجة يتيح فحص مستودعات GitHub وإدارتها عبر OAuth، والبحث في حزم NPM، وتصفح التوثيق البرمجي، ومراقبة حالة الخدمات السحابية لحظياً.'
    )
      .setColor(COLORS.PRIMARY)
      .setThumbnail(client.user?.displayAvatarURL() || null);

    embed.addFields(
      {
        name: '🤖 إصدار البوت',
        value: '`v1.0.0` (Production)',
        inline: true,
      },
      {
        name: '👨‍💻 المطور (Developer)',
        value: '**Dark**',
        inline: true,
      },
      {
        name: '⏱️ مدة التشغيل (Uptime)',
        value: `\`${uptime}\``,
        inline: true,
      },
      {
        name: '🌐 عدد السيرفرات',
        value: `**${formatNumber(guildCount)}** سيرفر`,
        inline: true,
      },
      {
        name: '👥 الأعضاء والمستخدمين',
        value: `**${formatNumber(userCount)}** عضو`,
        inline: true,
      },
      {
        name: '⚡ الأوامر المتاحة',
        value: `**${client.commands.size}** أمر Slash`,
        inline: true,
      },
      {
        name: '📚 بيئة التشغيل',
        value: `• **Discord.js:** \`v${djsVersion}\`\n• **Node.js:** \`${process.version}\`\n• **TypeScript:** \`v5.7\``,
        inline: true,
      },
      {
        name: '💾 الذاكرة والتخزين المؤقت',
        value: `• **Heap:** ${formatBytes(memoryUsage.heapUsed)}\n• **الكاش:** ${cacheStats.size} عنصر\n• **Hit Rate:** ${cacheStats.hitRate.toFixed(1)}%`,
        inline: true,
      }
    );

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel('مستودع GitHub')
        .setStyle(ButtonStyle.Link)
        .setURL('https://github.com/omarsaber6545-hue/githubot')
        .setEmoji(EMOJIS.GITHUB),
      new ButtonBuilder()
        .setLabel('توثيق Discord.js')
        .setStyle(ButtonStyle.Link)
        .setURL('https://discord.js.org')
        .setEmoji(EMOJIS.DOCS)
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  },
};
