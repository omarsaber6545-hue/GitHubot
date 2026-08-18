import { describe, expect, it } from 'vitest';
import { GitHubService } from '../../src/services/githubService.js';

describe('GitHubService', () => {
  const service = new GitHubService();

  it('fetches public repository details for expressjs/express', async () => {
    const repo = await service.getRepository('expressjs', 'express');
    expect(repo.full_name.toLowerCase()).toBe('expressjs/express');
    expect(repo.stargazers_count).toBeGreaterThan(1000);
    expect(repo.html_url).toContain('github.com/expressjs/express');
  });

  it('fetches user profile for torvalds', async () => {
    const user = await service.getUser('torvalds');
    expect(user.login.toLowerCase()).toBe('torvalds');
    expect(user.public_repos).toBeGreaterThan(0);
    expect(user.avatar_url).toBeDefined();
  });
});
