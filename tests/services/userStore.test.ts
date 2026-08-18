import { describe, expect, it, afterAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { UserStore } from '../../src/services/userStore.js';

describe('UserStore', () => {
  const testDir = './data_test';
  const store = new UserStore(testDir);

  afterAll(() => {
    try {
      if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true, force: true });
      }
    } catch {}
  });

  it('saves and retrieves encrypted user token', () => {
    const discordUserId = 'user_12345';
    const plainToken = 'gho_secret_token_123';
    const profile = { login: 'octocat', id: 583231, avatar_url: 'https://github.com/octocat.png' };

    store.saveUser(discordUserId, plainToken, profile);

    expect(store.isConnected(discordUserId)).toBe(true);

    const user = store.getUser(discordUserId);
    expect(user).toBeDefined();
    expect(user?.githubUsername).toBe('octocat');
    expect(user?.encryptedGitHubToken).not.toBe(plainToken);

    const decrypted = store.getDecryptedToken(discordUserId);
    expect(decrypted).toBe(plainToken);
  });

  it('deletes user record properly', () => {
    const discordUserId = 'user_delete_test';
    store.saveUser(discordUserId, 'token_xyz', { login: 'tester', id: 999 });

    expect(store.isConnected(discordUserId)).toBe(true);

    const deleted = store.deleteUser(discordUserId);
    expect(deleted).toBe(true);
    expect(store.isConnected(discordUserId)).toBe(false);
    expect(store.getDecryptedToken(discordUserId)).toBeNull();
  });
});
