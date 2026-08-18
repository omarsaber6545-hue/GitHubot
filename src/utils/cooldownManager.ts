import { Collection } from 'discord.js';

export class CooldownManager {
  // Map of commandName -> (userId -> expirationTimestamp in ms)
  private cooldowns: Collection<string, Collection<string, number>> = new Collection();

  /**
   * Check if a user is on cooldown for a given command.
   * Returns remaining seconds if on cooldown, or 0 if allowed.
   */
  public check(commandName: string, userId: string, cooldownSeconds: number): number {
    if (cooldownSeconds <= 0) return 0;

    if (!this.cooldowns.has(commandName)) {
      this.cooldowns.set(commandName, new Collection());
    }

    const now = Date.now();
    const timestamps = this.cooldowns.get(commandName)!;
    const cooldownAmount = cooldownSeconds * 1000;

    if (timestamps.has(userId)) {
      const expirationTime = timestamps.get(userId)!;
      if (now < expirationTime) {
        const timeLeft = (expirationTime - now) / 1000;
        return Number(timeLeft.toFixed(1));
      }
    }

    // Set new cooldown timestamp
    timestamps.set(userId, now + cooldownAmount);
    setTimeout(() => timestamps.delete(userId), cooldownAmount);

    return 0;
  }

  /**
   * Clear cooldown for a specific user and command
   */
  public clear(commandName: string, userId: string): void {
    const timestamps = this.cooldowns.get(commandName);
    if (timestamps) {
      timestamps.delete(userId);
    }
  }

  /**
   * Clear all active cooldowns
   */
  public clearAll(): void {
    this.cooldowns.clear();
  }
}
