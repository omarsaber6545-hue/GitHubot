import crypto from 'node:crypto';
import { env } from '../config/env.js';

// Derive 32-byte key from configured encryption key or fallback
function getEncryptionKey(): Buffer {
  const secret = env.AUTH_ENCRYPTION_KEY || env.DISCORD_TOKEN || 'developer-assistant-default-key-32b';
  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Encrypt sensitive plain-text (like GitHub access tokens) using AES-256-GCM
 * Returns string format: "iv:authTag:encryptedData" in hex
 */
export function encryptToken(plainText: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypt AES-256-GCM encrypted token string
 */
export function decryptToken(encryptedString: string): string {
  const parts = encryptedString.split(':');
  if (parts.length !== 3) {
    throw new Error('Malformed encrypted token format.');
  }

  const [ivHex, authTagHex, encryptedHex] = parts;
  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Generate a signed CSRF state parameter for OAuth containing Discord user ID and timestamp
 */
export function generateOAuthState(discordUserId: string): string {
  const timestamp = Date.now();
  const payload = `${discordUserId}:${timestamp}`;
  const key = getEncryptionKey();
  const signature = crypto.createHmac('sha256', key).update(payload).digest('hex');

  return Buffer.from(`${payload}:${signature}`).toString('base64url');
}

/**
 * Verify and unpack signed OAuth state parameter
 * Returns discordUserId if valid, or null if expired/tampered
 */
export function verifyOAuthState(stateString: string, maxAgeMs = 15 * 60 * 1000): string | null {
  try {
    const decoded = Buffer.from(stateString, 'base64url').toString('utf8');
    const parts = decoded.split(':');
    if (parts.length !== 3) return null;

    const [discordUserId, timestampStr, signature] = parts;
    const timestamp = parseInt(timestampStr, 10);

    if (isNaN(timestamp) || Date.now() - timestamp > maxAgeMs) {
      return null; // Expired
    }

    const payload = `${discordUserId}:${timestampStr}`;
    const key = getEncryptionKey();
    const expectedSignature = crypto.createHmac('sha256', key).update(payload).digest('hex');

    // Constant-time comparison
    if (!crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSignature, 'hex'))) {
      return null;
    }

    return discordUserId;
  } catch {
    return null;
  }
}
