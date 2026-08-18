import { describe, expect, it } from 'vitest';
import {
  formatBytes,
  formatDiscordTimestamp,
  formatDuration,
  formatLatency,
  formatNumber,
  parseGitHubRepo,
  truncateText,
} from '../../src/utils/formatters.js';

describe('Formatters Utility', () => {
  describe('formatNumber', () => {
    it('formats small numbers with commas', () => {
      expect(formatNumber(450)).toBe('450');
      expect(formatNumber(999)).toBe('999');
    });

    it('formats thousands with k suffix', () => {
      expect(formatNumber(1000)).toBe('1k');
      expect(formatNumber(1500)).toBe('1.5k');
      expect(formatNumber(45300)).toBe('45k');
      expect(formatNumber(125400)).toBe('125k');
    });

    it('formats millions with M suffix', () => {
      expect(formatNumber(1000000)).toBe('1M');
      expect(formatNumber(2400000)).toBe('2.4M');
    });
  });

  describe('formatBytes', () => {
    it('formats bytes correctly', () => {
      expect(formatBytes(500)).toBe('500 B');
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1024 * 1024 * 5.5)).toBe('5.5 MB');
    });

    it('formats kilobytes when isKilobytes is true', () => {
      expect(formatBytes(1024, true)).toBe('1 MB');
      expect(formatBytes(512, true)).toBe('512 KB');
    });
  });

  describe('formatDiscordTimestamp', () => {
    it('formats ISO dates to Discord timestamp tags', () => {
      const result = formatDiscordTimestamp('2024-01-01T00:00:00Z', 'R');
      expect(result).toMatch(/^<t:\d+:R>$/);
    });

    it('returns N/A on invalid date', () => {
      expect(formatDiscordTimestamp('invalid-date')).toBe('N/A');
    });
  });

  describe('truncateText', () => {
    it('returns short text unchanged', () => {
      expect(truncateText('Hello World', 20)).toBe('Hello World');
    });

    it('truncates long text and adds suffix', () => {
      const long = 'This is a very long description that needs to be truncated cleanly';
      const truncated = truncateText(long, 25);
      expect(truncated.length).toBeLessThanOrEqual(25);
      expect(truncated.endsWith('...')).toBe(true);
    });
  });

  describe('parseGitHubRepo', () => {
    it('parses valid owner/repo strings', () => {
      expect(parseGitHubRepo('facebook/react')).toEqual({ owner: 'facebook', repo: 'react' });
      expect(parseGitHubRepo('microsoft/TypeScript')).toEqual({ owner: 'microsoft', repo: 'TypeScript' });
    });

    it('parses full GitHub URLs', () => {
      expect(parseGitHubRepo('https://github.com/nodejs/node')).toEqual({ owner: 'nodejs', repo: 'node' });
      expect(parseGitHubRepo('https://github.com/vercel/next.js.git')).toEqual({ owner: 'vercel', repo: 'next.js' });
    });

    it('returns null on invalid formats', () => {
      expect(parseGitHubRepo('invalid-no-slash')).toBeNull();
      expect(parseGitHubRepo('a/b/c')).toBeNull();
      expect(parseGitHubRepo('')).toBeNull();
    });
  });

  describe('formatDuration', () => {
    it('formats ms to readable duration', () => {
      expect(formatDuration(500)).toBe('500ms');
      expect(formatDuration(15000)).toBe('15s');
      expect(formatDuration(65000)).toBe('1m 5s');
      expect(formatDuration(3665000)).toBe('1h 1m 5s');
    });
  });

  describe('formatLatency', () => {
    it('categorizes ping latency with emojis', () => {
      expect(formatLatency(45).emoji).toBe('🟢');
      expect(formatLatency(150).emoji).toBe('🟡');
      expect(formatLatency(400).emoji).toBe('🔴');
    });
  });
});
