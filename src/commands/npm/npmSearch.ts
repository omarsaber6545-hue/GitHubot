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
import { npmService } from '../../services/npmService.js';
import { Command } from '../../types/command.js';
import { AppEmbedBuilder } from '../../utils/embedBuilder.js';
import { formatNumber, truncateText } from '../../utils/formatters.js';

export const npmSearchCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('npm-search')
    .setDescription('البحث في متجر حزم NPM ومقارنة النتائج والتحميلات')
    .addStringOption((option) =>
      option
        .setName('query')
        .setDescription('كلمة البحث عن الحزم (مثال: discord, orm, web framework)')
        .setRequired(true)
    ),
  category: 'NPM',
  description: 'البحث عن حزم NPM ومقارنة عدد التحميلات وتفاصيل الحزمة.',
  cooldown: 3,

  async execute(interaction: ChatInputCommandInteraction, _client: BotClient) {
    const query = interaction.options.getString('query', true).trim();

    if (query.length < 2) {
      const err = AppEmbedBuilder.warning(
        'Query Too Short',
        'Please enter a search query with at least 2 characters.'
      );
      await interaction.reply({ embeds: [err], ephemeral: true });
      return;
    }

    await interaction.deferReply();

    try {
      const results = await npmService.searchPackages(query, 5);

      if (!results || results.length === 0) {
        const noResultsEmbed = AppEmbedBuilder.warning(
          'No Packages Found',
          `No NPM packages matched your query \`${query}\`.`
        );
        await interaction.editReply({ embeds: [noResultsEmbed] });
        return;
      }

      const embed = AppEmbedBuilder.base(
        `${EMOJIS.SEARCH} NPM Search Results: "${query}"`,
        `Found **${results.length}** top matching packages on NPM:`
      ).setColor(COLORS.NPM);

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('npm-search-select')
        .setPlaceholder('📦 Select a package to inspect full details...');

      for (let i = 0; i < results.length; i++) {
        const pkg = results[i];
        const downloadsFormatted = formatNumber(pkg.weeklyDownloads);

        embed.addFields({
          name: `${i + 1}. ${pkg.name} \`v${pkg.version}\` (${EMOJIS.DOWNLOAD} ${downloadsFormatted}/wk)`,
          value: `${truncateText(pkg.description, 120)}\n└ [View on NPM](${pkg.npmUrl}) • By \`${pkg.publisher.username}\``,
          inline: false,
        });

        // Add option to select menu
        selectMenu.addOptions(
          new StringSelectMenuOptionBuilder()
            .setLabel(`${pkg.name} (v${pkg.version})`)
            .setDescription(truncateText(pkg.description, 80) || 'NPM package')
            .setValue(pkg.name)
            .setEmoji(EMOJIS.NPM)
        );
      }

      const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

      await interaction.editReply({ embeds: [embed], components: [row] });
    } catch (error: any) {
      const errEmbed = AppEmbedBuilder.error(
        'NPM Search Failed',
        error.message || 'An error occurred while searching NPM registry packages.'
      );
      await interaction.editReply({ embeds: [errEmbed] });
    }
  },

  async handleSelectMenu(interaction: StringSelectMenuInteraction, _client: BotClient) {
    if (interaction.customId !== 'npm-search-select') return;

    const selectedPkgName = interaction.values[0];
    if (!selectedPkgName) return;

    await interaction.deferReply({ ephemeral: false });

    try {
      const pkg = await npmService.getPackage(selectedPkgName);

      const embed = AppEmbedBuilder.base(
        `${EMOJIS.NPM} ${pkg.name} \`v${pkg.version}\``,
        pkg.description
      )
        .setColor(COLORS.NPM)
        .setURL(pkg.npmUrl);

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
        }
      );

      await interaction.editReply({ embeds: [embed] });
    } catch (error: any) {
      const errEmbed = AppEmbedBuilder.error(
        'Failed to Load Package',
        `Could not load details for \`${selectedPkgName}\`.`
      );
      await interaction.editReply({ embeds: [errEmbed] });
    }
  },
};
