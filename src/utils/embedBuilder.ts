import { EmbedBuilder } from 'discord.js';
import { COLORS, EMOJIS } from '../config/constants.js';

export class AppEmbedBuilder {
  /**
   * Creates a standardized base embed with footer, timestamp, and bot styling
   */
  public static base(title?: string, description?: string): EmbedBuilder {
    const embed = new EmbedBuilder()
      .setColor(COLORS.PRIMARY)
      .setTimestamp();

    if (title) embed.setTitle(title);
    if (description) embed.setDescription(description);

    embed.setFooter({
      text: 'Developer Assistant',
      iconURL: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f916.png',
    });

    return embed;
  }

  /**
   * Create an error embed for failed commands, 404s, or validation errors
   */
  public static error(title: string, description: string, hint?: string): EmbedBuilder {
    const embed = new EmbedBuilder()
      .setColor(COLORS.ERROR)
      .setTitle(`${EMOJIS.CROSS} ${title}`)
      .setDescription(description)
      .setTimestamp();

    if (hint) {
      embed.addFields({
        name: '💡 Helpful Tip',
        value: hint,
        inline: false,
      });
    }

    embed.setFooter({
      text: 'Developer Assistant • Error',
      iconURL: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/274c.png',
    });

    return embed;
  }

  /**
   * Create a warning embed (e.g. rate limit, cooldown, partial data)
   */
  public static warning(title: string, description: string): EmbedBuilder {
    return new EmbedBuilder()
      .setColor(COLORS.WARNING)
      .setTitle(`${EMOJIS.WARNING_ICON} ${title}`)
      .setDescription(description)
      .setTimestamp()
      .setFooter({
        text: 'Developer Assistant • Notice',
        iconURL: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/26a0.png',
      });
  }

  /**
   * Create a success embed
   */
  public static success(title: string, description: string): EmbedBuilder {
    return new EmbedBuilder()
      .setColor(COLORS.SUCCESS)
      .setTitle(`${EMOJIS.CHECK} ${title}`)
      .setDescription(description)
      .setTimestamp()
      .setFooter({
        text: 'Developer Assistant',
        iconURL: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/2705.png',
      });
  }

  /**
   * Create a loading embed for deferred interactions
   */
  public static loading(message = 'Fetching data...'): EmbedBuilder {
    return new EmbedBuilder()
      .setColor(COLORS.MUTED)
      .setDescription(`⏳ ${message}`);
  }
}
