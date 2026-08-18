import fs from 'node:fs';
import path from 'node:path';
import { decryptToken, encryptToken } from '../utils/crypto.js';
import { logger } from '../utils/logger.js';

export interface UserAuthRecord {
  discordUserId: string;
  encryptedGitHubToken: string;
  githubUsername: string;
  githubUserId: number;
  githubAvatarUrl?: string;
  connectedAt: string;
  updatedAt: string;
}

export class UserStore {
  private filePath: string;
  private users: Map<string, UserAuthRecord> = new Map();

  constructor(storageDir = './data') {
    this.filePath = path.join(storageDir, 'user_auth.json');
    this.init(storageDir);
  }

  private init(storageDir: string): void {
    try {
      if (!fs.existsSync(storageDir)) {
        fs.mkdirSync(storageDir, { recursive: true });
      }

      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf8');
        const data = JSON.parse(raw);
        if (Array.isArray(data)) {
          for (const item of data) {
            this.users.set(item.discordUserId, item);
          }
        }
      }
    } catch (err) {
      logger.error('Failed to initialize user storage:', err);
    }
  }

  private persist(): void {
    try {
      const records = Array.from(this.users.values());
      fs.writeFileSync(this.filePath, JSON.stringify(records, null, 2), 'utf8');
    } catch (err) {
      logger.error('Failed to persist user storage:', err);
    }
  }

  /**
   * Encrypt and store user GitHub OAuth credentials
   */
  public saveUser(
    discordUserId: string,
    plainAccessToken: string,
    githubProfile: { login: string; id: number; avatar_url?: string }
  ): UserAuthRecord {
    const encrypted = encryptToken(plainAccessToken);
    const now = new Date().toISOString();

    const existing = this.users.get(discordUserId);
    const record: UserAuthRecord = {
      discordUserId,
      encryptedGitHubToken: encrypted,
      githubUsername: githubProfile.login,
      githubUserId: githubProfile.id,
      githubAvatarUrl: githubProfile.avatar_url,
      connectedAt: existing ? existing.connectedAt : now,
      updatedAt: now,
    };

    this.users.set(discordUserId, record);
    this.persist();
    logger.info(`User ${discordUserId} connected GitHub account @${githubProfile.login}`);
    return record;
  }

  /**
   * Check if a Discord user has an authenticated GitHub account
   */
  public isConnected(discordUserId: string): boolean {
    return this.users.has(discordUserId);
  }

  /**
   * Get user auth record
   */
  public getUser(discordUserId: string): UserAuthRecord | undefined {
    return this.users.get(discordUserId);
  }

  /**
   * Get decrypted GitHub access token for user
   */
  public getDecryptedToken(discordUserId: string): string | null {
    const record = this.users.get(discordUserId);
    if (!record) return null;

    try {
      return decryptToken(record.encryptedGitHubToken);
    } catch (err) {
      logger.error(`Failed to decrypt token for user ${discordUserId}:`, err);
      return null;
    }
  }

  /**
   * Remove/disconnect user GitHub connection
   */
  public deleteUser(discordUserId: string): boolean {
    const deleted = this.users.delete(discordUserId);
    if (deleted) {
      this.persist();
      logger.info(`Disconnected GitHub account for Discord user ${discordUserId}`);
    }
    return deleted;
  }
}

// Export singleton instance
export const userStore = new UserStore();
