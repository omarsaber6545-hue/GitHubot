import { ActivityType, Events } from 'discord.js';
import { BotClient } from '../client/BotClient.js';
import { logger } from '../utils/logger.js';

export function handleReady(client: BotClient): void {
  client.once(Events.ClientReady, (readyClient) => {
    logger.success(`🚀 Logged in as ${readyClient.user.tag} (ID: ${readyClient.user.id})`);
    logger.info(`Ready in ${readyClient.guilds.cache.size} server(s) serving ${readyClient.users.cache.size} user(s).`);

    // Rotate rich presence activities
    const activities = [
      { name: '/help • Developer Assistant', type: ActivityType.Playing },
      { name: 'GitHub & NPM packages', type: ActivityType.Watching },
      { name: 'Developer documentation', type: ActivityType.Listening },
      { name: '/status • Infrastructure health', type: ActivityType.Competing },
    ];

    let activityIndex = 0;
    const updatePresence = () => {
      const current = activities[activityIndex];
      readyClient.user.setActivity(current.name, { type: current.type });
      activityIndex = (activityIndex + 1) % activities.length;
    };

    updatePresence();
    setInterval(updatePresence, 30_000); // Rotate every 30 seconds
  });
}
