import { describe, expect, it } from 'vitest';
import {
  decryptToken,
  encryptToken,
  generateOAuthState,
  verifyOAuthState,
} from '../../src/utils/crypto.js';

describe('Crypto Utility', () => {
  describe('AES-256-GCM Token Encryption', () => {
    it('encrypts and decrypts tokens accurately', () => {
      const original = 'ghp_secret_access_token_1234567890abcdef';
      const encrypted = encryptToken(original);

      expect(encrypted).not.toBe(original);
      expect(encrypted.split(':').length).toBe(3); // iv:authTag:ciphertext

      const decrypted = decryptToken(encrypted);
      expect(decrypted).toBe(original);
    });

    it('generates different ciphertexts for the same input (unique IVs)', () => {
      const token = 'gho_my_github_token_xyz';
      const enc1 = encryptToken(token);
      const enc2 = encryptToken(token);

      expect(enc1).not.toBe(enc2);
      expect(decryptToken(enc1)).toBe(token);
      expect(decryptToken(enc2)).toBe(token);
    });

    it('throws error when ciphertext is tampered with', () => {
      const encrypted = encryptToken('sensitive_data');
      const parts = encrypted.split(':');
      // Tamper ciphertext
      parts[2] = parts[2].substring(0, parts[2].length - 2) + 'ff';
      const tampered = parts.join(':');

      expect(() => decryptToken(tampered)).toThrow();
    });
  });

  describe('OAuth State Signing and Verification', () => {
    it('generates valid state and verifies user ID correctly', () => {
      const discordUserId = '123456789012345678';
      const state = generateOAuthState(discordUserId);

      expect(typeof state).toBe('string');
      const verifiedUserId = verifyOAuthState(state);
      expect(verifiedUserId).toBe(discordUserId);
    });

    it('rejects tampered OAuth state', () => {
      const state = generateOAuthState('999888777');
      const tampered = state.slice(0, -4) + 'abcd';

      expect(verifyOAuthState(tampered)).toBeNull();
    });

    it('rejects expired OAuth state', () => {
      const state = generateOAuthState('123456');
      // Verify with 0ms max age
      expect(verifyOAuthState(state, -1000)).toBeNull();
    });
  });
});
