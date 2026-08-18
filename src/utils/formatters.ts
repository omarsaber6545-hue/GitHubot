/**
 * Formatting helpers for UI presentation and data transformation
 */

/**
 * Format large numbers into human-readable compact strings (e.g. 12.4k, 3.2M)
 */
export function formatNumber(num: number): string {
  if (isNaN(num)) return '0';
  if (num < 1000) return num.toLocaleString();

  const units = ['', 'k', 'M', 'B', 'T'];
  const order = Math.floor(Math.log10(Math.abs(num)) / 3);
  const unitName = units[order] || '';
  const scaled = num / Math.pow(10, order * 3);

  return `${scaled.toFixed(scaled >= 10 || scaled % 1 === 0 ? 0 : 1)}${unitName}`;
}

/**
 * Format bytes / kilobytes into human-readable size (e.g. 450 KB, 12.3 MB)
 * GitHub API returns repo size in KB, so specify `isKilobytes: true` when parsing repo.size
 */
export function formatBytes(bytesOrKb: number, isKilobytes = false): string {
  let bytes = isKilobytes ? bytesOrKb * 1024 : bytesOrKb;
  if (isNaN(bytes) || bytes <= 0) return '0 B';

  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const val = bytes / Math.pow(1024, i);
  const formattedVal = val % 1 === 0 ? val.toFixed(0) : val.toFixed(1);

  return `${formattedVal} ${sizes[i]}`;
}

/**
 * Format Date into Discord Timestamp tag e.g. <t:1700000000:R>
 */
export function formatDiscordTimestamp(
  dateInput: string | number | Date,
  style: 'R' | 'F' | 'd' | 't' | 'D' | 'T' = 'R'
): string {
  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return 'N/A';
    const unix = Math.floor(date.getTime() / 1000);
    return `<t:${unix}:${style}>`;
  } catch {
    return 'N/A';
  }
}

/**
 * Truncate long strings cleanly without splitting in the middle of words
 */
export function truncateText(text: string | null | undefined, maxLength: number, suffix = '...'): string {
  if (!text) return '';
  const trimmed = text.trim();
  if (trimmed.length <= maxLength) return trimmed;

  const targetLength = maxLength - suffix.length;
  let truncated = trimmed.slice(0, targetLength);
  const lastSpace = truncated.lastIndexOf(' ');
  if (lastSpace > targetLength * 0.7) {
    truncated = truncated.slice(0, lastSpace);
  }
  return `${truncated}${suffix}`;
}

/**
 * Format duration in milliseconds to human string (e.g. 2d 5h 12m 30s)
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;

  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);

  return parts.join(' ');
}

/**
 * Format latency with status indicator
 */
export function formatLatency(ms: number): { text: string; emoji: string; status: string } {
  if (ms < 0) return { text: 'N/A', emoji: '⚪', status: 'Unknown' };
  if (ms <= 120) return { text: `${Math.round(ms)}ms`, emoji: '🟢', status: 'Excellent' };
  if (ms <= 250) return { text: `${Math.round(ms)}ms`, emoji: '🟡', status: 'Good' };
  return { text: `${Math.round(ms)}ms`, emoji: '🔴', status: 'High' };
}

/**
 * Sanitize and validate GitHub owner/repo input
 */
export function parseGitHubRepo(input: string): { owner: string; repo: string } | null {
  if (!input) return null;
  // Handle formats: "owner/repo", "https://github.com/owner/repo", "git@github.com:owner/repo.git"
  let cleaned = input.trim();
  cleaned = cleaned.replace(/^https?:\/\/github\.com\//i, '');
  cleaned = cleaned.replace(/^git@github\.com:/i, '');
  cleaned = cleaned.replace(/\.git$/i, '');
  cleaned = cleaned.replace(/^\/+|\/+$/g, '');

  const parts = cleaned.split('/');
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return null;
  }

  // Check valid GitHub username/repo characters
  const validSegment = /^[a-zA-Z0-9._-]+$/;
  if (!validSegment.test(parts[0]) || !validSegment.test(parts[1])) {
    return null;
  }

  return { owner: parts[0], repo: parts[1] };
}
