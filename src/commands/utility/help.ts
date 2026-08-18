import {
  ActionRowBuilder,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
  StringSelectMenuOptionBuilder,
} from 'discord.js';
import { BotClient } from '../../client/BotClient.js';
import { COLORS, EMOJIS } from '../../config/constants.js';
import { Command, CommandCategory } from '../../types/command.js';
import { AppEmbedBuilder } from '../../utils/embedBuilder.js';

export const helpCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('عرض دليل أوامر البوت والمساعدة التفاعلية')
    .addStringOption((option) =>
      option
        .setName('command')
        .setDescription('اسم الأمر للحصول على شرح مفصل له (مثال: github, npm)')
        .setRequired(false)
    ),
  category: 'Utility',
  description: 'دليل الأوامر التفاعلي وشرح استخدام جميع ميزات البوت.',
  cooldown: 2,

  async execute(interaction: ChatInputCommandInteraction, client: BotClient) {
    const specificCommandName = interaction.options.getString('command')?.toLowerCase().trim();

    if (specificCommandName) {
      const cmd = client.commands.get(specificCommandName);
      if (!cmd) {
        const notFound = AppEmbedBuilder.error(
          'Command Not Found',
          `Command \`/${specificCommandName}\` does not exist.`,
          'Use `/help` without arguments to see all available commands.'
        );
        await interaction.reply({ embeds: [notFound], ephemeral: true });
        return;
      }

      const embed = AppEmbedBuilder.base(
        `Command Guide: \`/${cmd.data.name}\``,
        cmd.description
      )
        .setColor(COLORS.PRIMARY)
        .addFields(
          {
            name: '📁 Category',
            value: `\`${cmd.category}\``,
            inline: true,
          },
          {
            name: '⏱️ Cooldown',
            value: `${cmd.cooldown || 3} seconds`,
            inline: true,
          },
          {
            name: '📝 Description',
            value: cmd.data.description,
            inline: false,
          }
        );

      await interaction.reply({ embeds: [embed] });
      return;
    }

    // Render full category overview
    const embed = buildMainHelpEmbed(client);
    const row = buildHelpCategorySelectMenu();

    await interaction.reply({ embeds: [embed], components: [row] });
  },

  async handleSelectMenu(interaction: StringSelectMenuInteraction, client: BotClient) {
    if (interaction.customId !== 'help-category-select') return;

    const selectedCategory = interaction.values[0] as CommandCategory | 'all';

    if (selectedCategory === 'all') {
      const embed = buildMainHelpEmbed(client);
      const row = buildHelpCategorySelectMenu();
      await interaction.update({ embeds: [embed], components: [row] });
      return;
    }

    const commandsInCategory = Array.from(client.commands.values()).filter(
      (c) => c.category === selectedCategory
    );

    const categoryIcons: Record<CommandCategory, string> = {
      GitHub: EMOJIS.GITHUB,
      NPM: EMOJIS.NPM,
      Docs: EMOJIS.DOCS,
      Status: EMOJIS.STATUS,
      Utility: EMOJIS.BOT,
    };

    const embed = AppEmbedBuilder.base(
      `${categoryIcons[selectedCategory] || '📁'} ${selectedCategory} Commands`,
      `Here are the available commands in the **${selectedCategory}** module:`
    ).setColor(COLORS.PRIMARY);

    for (const cmd of commandsInCategory) {
      embed.addFields({
        name: `\`/${cmd.data.name}\``,
        value: `${cmd.description} *(Cooldown: ${cmd.cooldown || 3}s)*`,
        inline: false,
      });
    }

    const row = buildHelpCategorySelectMenu(selectedCategory);
    await interaction.update({ embeds: [embed], components: [row] });
  },
};

function buildMainHelpEmbed(client: BotClient) {
  const embed = AppEmbedBuilder.base(
    `${EMOJIS.BOT} Developer Assistant — Command Manual`,
    'Welcome! This bot provides instant developer tools, GitHub stats, NPM insights, documentation lookup, and live infrastructure status.'
  ).setColor(COLORS.PRIMARY);

  const categories: CommandCategory[] = ['GitHub', 'NPM', 'Docs', 'Status', 'Utility'];

  for (const cat of categories) {
    const cmds = Array.from(client.commands.values())
      .filter((c) => c.category === cat)
      .map((c) => `\`/${c.data.name}\``)
      .join(', ');

    const catIcon =
      cat === 'GitHub'
        ? EMOJIS.GITHUB
        : cat === 'NPM'
        ? EMOJIS.NPM
        : cat === 'Docs'
        ? EMOJIS.DOCS
        : cat === 'Status'
        ? EMOJIS.STATUS
        : EMOJIS.BOT;

    embed.addFields({
      name: `${catIcon} ${cat} (${Array.from(client.commands.values()).filter((c) => c.category === cat).length})`,
      value: cmds || 'None',
      inline: false,
    });
  }

  embed.setFooter({
    text: '💡 Tip: Select a category from the dropdown menu below for detailed usage.',
    iconURL: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f4a1.png',
  });

  return embed;
}

function buildHelpCategorySelectMenu(currentCategory?: string) {
  const menu = new StringSelectMenuBuilder()
    .setCustomId('help-category-select')
    .setPlaceholder('📂 Browse commands by category...')
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel('Overview (All Categories)')
        .setValue('all')
        .setDescription('View full list of all available commands')
        .setEmoji('📋')
        .setDefault(currentCategory === 'all'),
      new StringSelectMenuOptionBuilder()
        .setLabel('GitHub Commands')
        .setValue('GitHub')
        .setDescription('/github, /github-user, /commits, /release')
        .setEmoji(EMOJIS.GITHUB)
        .setDefault(currentCategory === 'GitHub'),
      new StringSelectMenuOptionBuilder()
        .setLabel('NPM Commands')
        .setValue('NPM')
        .setDescription('/npm, /npm-search')
        .setEmoji(EMOJIS.NPM)
        .setDefault(currentCategory === 'NPM'),
      new StringSelectMenuOptionBuilder()
        .setLabel('Documentation Commands')
        .setValue('Docs')
        .setDescription('/docs (MDN, Python, React, Docker, etc.)')
        .setEmoji(EMOJIS.DOCS)
        .setDefault(currentCategory === 'Docs'),
      new StringSelectMenuOptionBuilder()
        .setLabel('Service Status Commands')
        .setValue('Status')
        .setDescription('/status, /status-all (GitHub, NPM, Discord, etc.)')
        .setEmoji(EMOJIS.STATUS)
        .setDefault(currentCategory === 'Status'),
      new StringSelectMenuOptionBuilder()
        .setLabel('Utility Commands')
        .setValue('Utility')
        .setDescription('/help, /ping, /about')
        .setEmoji(EMOJIS.BOT)
        .setDefault(currentCategory === 'Utility')
    );

  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu);
}
