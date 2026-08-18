import http from 'node:http';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { githubAuthService } from './githubAuthService.js';

export class OAuthServer {
  private server: http.Server | null = null;

  public start(): Promise<void> {
    return new Promise((resolve) => {
      this.server = http.createServer(async (req, res) => {
        try {
          const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

          // 1. Healthcheck
          if (url.pathname === '/health') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'ok', time: new Date().toISOString() }));
            return;
          }

          // 2. OAuth Start endpoint (/auth/github?user=DISCORD_USER_ID)
          if (url.pathname === '/auth/github') {
            const discordUserId = url.searchParams.get('user');
            if (!discordUserId) {
              res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
              res.end(this.renderErrorPage('Missing Discord User ID in request.'));
              return;
            }

            const authUrl = githubAuthService.getAuthorizationUrl(discordUserId);
            res.writeHead(302, { Location: authUrl });
            res.end();
            return;
          }

          // 3. OAuth Callback endpoint (/auth/github/callback?code=...&state=...)
          if (url.pathname === '/auth/github/callback') {
            const code = url.searchParams.get('code');
            const state = url.searchParams.get('state');
            const error = url.searchParams.get('error');
            const errorDesc = url.searchParams.get('error_description');

            if (error) {
              res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
              res.end(this.renderErrorPage(`GitHub Authorization Denied: ${errorDesc || error}`));
              return;
            }

            if (!code || !state) {
              res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
              res.end(this.renderErrorPage('Missing authorization code or state parameter.'));
              return;
            }

            try {
              const result = await githubAuthService.exchangeCodeForToken(code, state);
              res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
              res.end(this.renderSuccessPage(result.profile.login));
              return;
            } catch (err: any) {
              logger.error('OAuth callback exchange failed:', err);
              res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
              res.end(this.renderErrorPage(err.message || 'Authentication processing error.'));
              return;
            }
          }

          // 404 for other routes
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('Not Found');
        } catch (serverError: any) {
          logger.error('HTTP Server Internal Error:', serverError);
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end('Internal Server Error');
        }
      });

      this.server.listen(env.PORT, () => {
        logger.info(`OAuth HTTP server listening on port ${env.PORT} (Callback: ${env.AUTH_CALLBACK_URL})`);
        resolve();
      });
    });
  }

  public stop(): void {
    if (this.server) {
      this.server.close();
      logger.info('OAuth HTTP server stopped.');
    }
  }

  private renderSuccessPage(githubUsername: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GitHub Connected — Developer Assistant</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #0f172a;
      color: #f8fafc;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
    }
    .card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 16px;
      padding: 40px;
      max-width: 480px;
      text-align: center;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
    }
    .icon {
      font-size: 56px;
      margin-bottom: 16px;
    }
    h1 {
      font-size: 24px;
      color: #38bdf8;
      margin-bottom: 12px;
    }
    p {
      color: #94a3b8;
      line-height: 1.6;
      margin-bottom: 24px;
    }
    .badge {
      display: inline-block;
      background: #0f766e;
      color: #2dd4bf;
      padding: 6px 14px;
      border-radius: 9999px;
      font-weight: 600;
      font-size: 14px;
      margin-bottom: 20px;
    }
    .footer {
      font-size: 13px;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">🎉</div>
    <div class="badge">Connected as @${githubUsername}</div>
    <h1>GitHub Account Connected!</h1>
    <p>Your GitHub account has been authenticated with the Discord Developer Assistant Bot. You can now manage your repository visibility safely via Discord.</p>
    <div class="footer">You can safely close this browser window and return to Discord.</div>
  </div>
</body>
</html>`;
  }

  private renderErrorPage(message: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Connection Failed — Developer Assistant</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #0f172a;
      color: #f8fafc;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
    }
    .card {
      background: #1e293b;
      border: 1px solid #ef4444;
      border-radius: 16px;
      padding: 40px;
      max-width: 480px;
      text-align: center;
    }
    .icon {
      font-size: 56px;
      margin-bottom: 16px;
    }
    h1 {
      font-size: 22px;
      color: #ef4444;
      margin-bottom: 12px;
    }
    p {
      color: #94a3b8;
      line-height: 1.6;
      margin-bottom: 24px;
    }
    .footer {
      font-size: 13px;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">❌</div>
    <h1>Authorization Failed</h1>
    <p>${message}</p>
    <div class="footer">Please try running <code>/github visibility</code> in Discord again to re-authenticate.</div>
  </div>
</body>
</html>`;
  }
}

export const oauthServer = new OAuthServer();
