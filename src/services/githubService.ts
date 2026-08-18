import axios from 'axios';
import { CACHE_TTLS } from '../config/constants.js';
import { env } from '../config/env.js';
import { GitHubCommit, GitHubRelease, GitHubRepo, GitHubUser } from '../types/github.js';
import { RestClient } from '../utils/restClient.js';
import { cacheService } from './cacheService.js';

export interface GitHubRepoDetailed extends GitHubRepo {
  latestRelease?: GitHubRelease | null;
  latestCommit?: GitHubCommit | null;
}

export class GitHubService {
  private restClient: RestClient;

  constructor() {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
    };

    if (env.GITHUB_TOKEN) {
      headers['Authorization'] = `token ${env.GITHUB_TOKEN}`;
    }

    this.restClient = new RestClient('https://api.github.com', headers);
  }

  /**
   * Fetch complete repository information including latest release and latest commit
   */
  public async getRepository(owner: string, repo: string): Promise<GitHubRepoDetailed> {
    const cacheKey = `gh:repo:${owner.toLowerCase()}/${repo.toLowerCase()}`;

    return cacheService.getOrFetch(
      cacheKey,
      async () => {
        const repoData = await this.restClient.get<GitHubRepo>(`/repos/${owner}/${repo}`);

        // Concurrently fetch latest commit and latest release (gracefully catch if none exist)
        const [latestRelease, latestCommit] = await Promise.all([
          this.getLatestRelease(owner, repo).catch(() => null),
          this.getLatestCommit(owner, repo).catch(() => null),
        ]);

        return {
          ...repoData,
          latestRelease,
          latestCommit,
        };
      },
      CACHE_TTLS.GITHUB_REPO
    );
  }

  /**
   * Fetch GitHub User profile
   */
  public async getUser(username: string): Promise<GitHubUser> {
    const cacheKey = `gh:user:${username.toLowerCase()}`;

    return cacheService.getOrFetch(
      cacheKey,
      async () => {
        return this.restClient.get<GitHubUser>(`/users/${username}`);
      },
      CACHE_TTLS.GITHUB_USER
    );
  }

  /**
   * Fetch latest commits for a repository
   */
  public async getCommits(owner: string, repo: string, perPage = 5): Promise<GitHubCommit[]> {
    const cacheKey = `gh:commits:${owner.toLowerCase()}/${repo.toLowerCase()}:${perPage}`;

    return cacheService.getOrFetch(
      cacheKey,
      async () => {
        return this.restClient.get<GitHubCommit[]>(`/repos/${owner}/${repo}/commits?per_page=${perPage}`);
      },
      CACHE_TTLS.GITHUB_COMMITS
    );
  }

  /**
   * Fetch a single latest commit
   */
  public async getLatestCommit(owner: string, repo: string): Promise<GitHubCommit | null> {
    const commits = await this.getCommits(owner, repo, 1);
    return commits.length > 0 ? commits[0] : null;
  }

  /**
   * Fetch latest release for a repository
   */
  public async getLatestRelease(owner: string, repo: string): Promise<GitHubRelease | null> {
    const cacheKey = `gh:release:${owner.toLowerCase()}/${repo.toLowerCase()}`;

    return cacheService.getOrFetch(
      cacheKey,
      async () => {
        try {
          return await this.restClient.get<GitHubRelease>(`/repos/${owner}/${repo}/releases/latest`);
        } catch (error: any) {
          // If no official releases, return null
          if (error.details?.status === 404) {
            return null;
          }
          throw error;
        }
      },
      CACHE_TTLS.GITHUB_RELEASE
    );
  }

  /**
   * Fetch all repositories owned by the authenticated GitHub user
   */
  public async getUserOwnedRepositories(
    userAccessToken: string
  ): Promise<Array<{ id: number; name: string; full_name: string; private: boolean; description: string | null; html_url: string; stargazers_count: number }>> {
    const allRepos: Array<{ id: number; name: string; full_name: string; private: boolean; description: string | null; html_url: string; stargazers_count: number }> = [];
    let page = 1;
    const perPage = 100;

    while (true) {
      const response = await axios.get<any[]>('https://api.github.com/user/repos', {
        params: {
          affiliation: 'owner',
          per_page: perPage,
          page,
          sort: 'updated',
        },
        headers: {
          Authorization: `Bearer ${userAccessToken}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'Discord-Developer-Assistant-Bot/1.0.0',
        },
      });

      const repos = response.data;
      if (!repos || repos.length === 0) break;

      for (const r of repos) {
        // Double-check owner permissions
        if (r.permissions?.admin || r.owner?.type === 'User') {
          allRepos.push({
            id: r.id,
            name: r.name,
            full_name: r.full_name,
            private: !!r.private,
            description: r.description || null,
            html_url: r.html_url,
            stargazers_count: r.stargazers_count || 0,
          });
        }
      }

      if (repos.length < perPage) break;
      page++;
    }

    return allRepos;
  }

  /**
   * Update visibility of a single repository
   */
  public async updateRepositoryVisibility(
    userAccessToken: string,
    owner: string,
    repo: string,
    isPrivate: boolean
  ): Promise<{ name: string; full_name: string; private: boolean; html_url: string }> {
    try {
      const response = await axios.patch(
        `https://api.github.com/repos/${owner}/${repo}`,
        { private: isPrivate },
        {
          headers: {
            Authorization: `Bearer ${userAccessToken}`,
            Accept: 'application/vnd.github.v3+json',
            'User-Agent': 'Discord-Developer-Assistant-Bot/1.0.0',
          },
        }
      );

      // Invalidate cache for this repo
      cacheService.delete(`gh:repo:${owner.toLowerCase()}/${repo.toLowerCase()}`);

      return response.data;
    } catch (error: any) {
      const status = error.response?.status;
      const message = error.response?.data?.message || error.message;

      if (status === 403) {
        throw new Error(`Permission denied: You do not have admin permissions to modify visibility for "${owner}/${repo}".`);
      } else if (status === 422) {
        throw new Error(`Cannot change visibility for "${owner}/${repo}": ${message}`);
      }
      throw new Error(`Failed to change visibility for "${owner}/${repo}": ${message}`);
    }
  }

  /**
   * Batch update repository visibility with rate-limiting safety
   */
  public async batchUpdateVisibility(
    userAccessToken: string,
    repos: Array<{ name: string; full_name: string; private: boolean }>,
    targetPrivate: boolean,
    onProgress?: (processed: number, total: number) => void
  ): Promise<{
    successful: string[];
    failed: Array<{ repo: string; error: string }>;
    totalProcessed: number;
  }> {
    const successful: string[] = [];
    const failed: Array<{ repo: string; error: string }> = [];

    // Filter to only repositories that actually need a change
    const toChange = repos.filter((r) => r.private !== targetPrivate);

    let processed = 0;
    for (const item of toChange) {
      try {
        const parts = item.full_name.split('/');
        const owner = parts[0];
        const repo = parts[1];

        await this.updateRepositoryVisibility(userAccessToken, owner, repo, targetPrivate);
        successful.push(item.full_name);
      } catch (err: any) {
        failed.push({
          repo: item.full_name,
          error: err.message || 'Unknown error',
        });
      }

      processed++;
      if (onProgress) {
        onProgress(processed, toChange.length);
      }

      // Safe pacing delay (250ms) to avoid triggering secondary rate-limits
      await new Promise((resolve) => setTimeout(resolve, 250));
    }

    return {
      successful,
      failed,
      totalProcessed: toChange.length,
    };
  }
}

// Export singleton instance
export const githubService = new GitHubService();
