import axios from 'axios';
import { env } from '../config/env.js';
import { generateOAuthState, verifyOAuthState } from '../utils/crypto.js';
import { logger } from '../utils/logger.js';
import { userStore } from './userStore.js';

export interface GitHubOAuthTokens {
  access_token: string;
  token_type: string;
  scope: string;
}

export interface GitHubAuthenticatedUser {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  name: string | null;
  email: string | null;
}

export class GitHubAuthService {
  /**
   * Get GitHub OAuth Authorization URL for a Discord user
   */
  public getAuthorizationUrl(discordUserId: string): string {
    const clientId = env.GITHUB_CLIENT_ID || 'GITHUB_CLIENT_ID_PLACEHOLDER';
    const state = generateOAuthState(discordUserId);
    const redirectUri = encodeURIComponent(env.AUTH_CALLBACK_URL);
    // Scope 'repo' is required to modify repository visibility (read/write access to public and private repos)
    const scope = encodeURIComponent('repo read:user user:email');

    return `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}`;
  }

  /**
   * Exchange OAuth authorization code for GitHub access token
   */
  public async exchangeCodeForToken(code: string, state: string): Promise<{
    discordUserId: string;
    accessToken: string;
    profile: GitHubAuthenticatedUser;
  }> {
    const discordUserId = verifyOAuthState(state);
    if (!discordUserId) {
      throw new Error('Invalid or expired OAuth state parameter. Please restart the authorization process.');
    }

    if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
      throw new Error('GitHub OAuth is not configured. Missing GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET in .env.');
    }

    // Request access token from GitHub
    const tokenResponse = await axios.post<GitHubOAuthTokens>(
      'https://github.com/login/oauth/access_token',
      {
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: env.AUTH_CALLBACK_URL,
      },
      {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'Discord-Developer-Assistant-Bot/1.0.0',
        },
      }
    );

    const tokenData = tokenResponse.data;
    if (!tokenData.access_token) {
      logger.error('Failed GitHub token exchange:', tokenData);
      throw new Error('Failed to retrieve access token from GitHub OAuth.');
    }

    // Fetch authenticated user profile
    const profileResponse = await axios.get<GitHubAuthenticatedUser>('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'Discord-Developer-Assistant-Bot/1.0.0',
      },
    });

    const profile = profileResponse.data;

    // Securely encrypt and save in user store
    userStore.saveUser(discordUserId, tokenData.access_token, profile);

    return {
      discordUserId,
      accessToken: tokenData.access_token,
      profile,
    };
  }
}

// Export singleton instance
export const githubAuthService = new GitHubAuthService();
