import {
  ActionRowBuilder,
  AutocompleteInteraction,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from 'discord.js';
import { BotClient } from '../../client/BotClient.js';
import { COLORS, EMOJIS, SUPPORTED_DOCS_TECHS } from '../../config/constants.js';
import { docsService } from '../../services/docsService.js';
import { Command } from '../../types/command.js';
import { AppEmbedBuilder } from '../../utils/embedBuilder.js';
import { truncateText } from '../../utils/formatters.js';

export const docsCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('docs')
    .setDescription('البحث في التوثيق البرمجي للغات وأطر العمل الشائعة')
    .addStringOption((option) =>
      option
        .setName('query')
        .setDescription('الموضوع أو الدالة أو الكلمة المراد البحث عنها (مثال: array map, useState)')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('technology')
        .setDescription('تصفية النتائج حسب لغة البرمجة أو إطار العمل (JS, Python, React, Docker)')
        .setRequired(false)
        .setAutocomplete(true)
    ),
  category: 'Docs',
  description: 'البحث في التوثيق البرمجي لـ JS, TS, Python, React, Next.js, Docker, Git, etc.',
  cooldown: 3,

  async autocomplete(interaction: AutocompleteInteraction, _client: BotClient) {
    const focusedValue = interaction.options.getFocused().toLowerCase();
    const filtered = SUPPORTED_DOCS_TECHS.filter(
      (tech) =>
        tech.id.toLowerCase().includes(focusedValue) ||
        tech.name.toLowerCase().includes(focusedValue)
    ).slice(0, 25);

    await interaction.respond(
      filtered.map((tech) => ({
        name: `${tech.icon} ${tech.name}`,
        value: tech.id,
      }))
    );
  },

  async execute(interaction: ChatInputCommandInteraction, _client: BotClient) {
    const query = interaction.options.getString('query', true).trim();
    const technology = interaction.options.getString('technology')?.trim();

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
      const results = await docsService.searchDocs(query, technology || undefined);

      if (!results || results.length === 0) {
        const noResults = AppEmbedBuilder.warning(
          'No Documentation Found',
          `Could not find documentation matching \`${query}\`${technology ? ` in **${technology}**` : ''}.`
        );
        await interaction.editReply({ embeds: [noResults] });
        return;
      }

      const techObj = SUPPORTED_DOCS_TECHS.find((t) => t.id === technology);
      const titleSuffix = techObj ? ` (${techObj.name})` : '';

      const embed = AppEmbedBuilder.base(
        `${EMOJIS.DOCS} Documentation Search: "${query}"${titleSuffix}`,
        `Top reference results for developer documentation:`
      ).setColor(COLORS.DOCS);

      const buttons: ButtonBuilder[] = [];

      for (let i = 0; i < results.length; i++) {
        const doc = results[i];
        const icon = doc.icon || EMOJIS.DOCS;

        embed.addFields({
          name: `${i + 1}. ${icon} ${doc.title}`,
          value: `${truncateText(doc.description, 140)}\n└ [Read on ${doc.website}](${doc.url})`,
          inline: false,
        });

        if (buttons.length < 5) {
          buttons.push(
            new ButtonBuilder()
              .setLabel(`Result #${i + 1}`)
              .setStyle(ButtonStyle.Link)
              .setURL(doc.url)
              .setEmoji(icon)
          );
        }
      }

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(buttons);

      await interaction.editReply({ embeds: [embed], components: [row] });
    } catch (error: any) {
      const errEmbed = AppEmbedBuilder.error(
        'Docs Search Failed',
        error.message || 'An error occurred while searching developer documentation.'
      );
      await interaction.editReply({ embeds: [errEmbed] });
    }
  },
};
