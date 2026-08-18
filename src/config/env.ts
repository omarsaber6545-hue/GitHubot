import dotenv from 'dotenv';
import { z } from 'zod';

// Load .env file
dotenv.config();

const envSchema = z.object({
  DISCORD_TOKEN: z.string().min(1, { message: 'DISCORD_TOKEN is required to run the bot' }),
  CLIENT_ID: z.string().min(1, { message: 'CLIENT_ID is required for registering slash commands' }),
  GUILD_ID: z.string().optional(),
  GITHUB_TOKEN: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  AUTH_ENCRYPTION_KEY: z.string().optional(),
  AUTH_CALLBACK_URL: z.string().default('http://localhost:3000/auth/github/callback'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DEFAULT_COOLDOWN_SECONDS: z.coerce.number().default(3),
  PORT: z.coerce.number().default(3000),
});

export type EnvConfig = z.infer<typeof envSchema>;

function parseEnv(): EnvConfig {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    if (process.env.NODE_ENV !== 'test') {
      console.error('❌ Environment configuration error:');
      for (const error of result.error.errors) {
        console.error(`  - ${error.path.join('.')}: ${error.message}`);
      }
      console.warn('⚠️ Please check your .env file or environment variables.');
    }
    return {
      DISCORD_TOKEN: process.env.DISCORD_TOKEN || '',
      CLIENT_ID: process.env.CLIENT_ID || '',
      GUILD_ID: process.env.GUILD_ID,
      GITHUB_TOKEN: process.env.GITHUB_TOKEN,
      GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
      GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
      AUTH_ENCRYPTION_KEY: process.env.AUTH_ENCRYPTION_KEY,
      AUTH_CALLBACK_URL: process.env.AUTH_CALLBACK_URL || 'http://localhost:3000/auth/github/callback',
      NODE_ENV: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
      DEFAULT_COOLDOWN_SECONDS: Number(process.env.DEFAULT_COOLDOWN_SECONDS) || 3,
      PORT: Number(process.env.PORT) || 3000,
    };
  }

  return result.data;
}

export const env = parseEnv();
