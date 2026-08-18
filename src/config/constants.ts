/**
 * Application Constants
 * Design tokens, colors, emojis, external endpoints, and TTL settings
 */

export const COLORS = {
  PRIMARY: 0x5865F2, // Discord Blurple
  SUCCESS: 0x57F287, // Discord Green
  WARNING: 0xFEE75C, // Discord Yellow
  ERROR: 0xED4245,   // Discord Red
  GITHUB: 0x24292E,  // GitHub Dark
  NPM: 0xCB3837,     // NPM Red
  DOCS: 0x0096D6,    // Docs Cyan
  STATUS: 0x2ECC71,  // Status Emerald
  MUTED: 0x72767D,   // Muted Gray
  PURPLE: 0x9B59B6,  // Accent Purple
} as const;

export const EMOJIS = {
  // Brand & Services
  GITHUB: '🐙',
  NPM: '📦',
  DOCS: '📚',
  STATUS: '⚡',
  SEARCH: '🔍',
  HELP: '💡',
  BOT: '🤖',
  PING: '🏓',

  // Status Indicators
  OPERATIONAL: '🟢',
  DEGRADED: '🟡',
  MAJOR_OUTAGE: '🔴',
  MAINTENANCE: '🔵',
  UNKNOWN: '⚪',

  // GitHub & Dev metrics
  STAR: '⭐',
  FORK: '🍴',
  ISSUE: '🐛',
  PULL_REQUEST: '🔀',
  COMMIT: '📝',
  RELEASE: '🏷️',
  USER: '👤',
  FOLLOWERS: '👥',
  LANGUAGE: '💻',
  CALENDAR: '📅',
  LINK: '🔗',
  DOWNLOAD: '📥',
  LICENSE: '⚖️',
  FILE_SIZE: '💾',
  SECURITY: '🛡️',
  CLOCK: '⏱️',
  ARROW_RIGHT: '➡️',
  CHECK: '✅',
  CROSS: '❌',
  WARNING_ICON: '⚠️',
  INFO: 'ℹ️',
  FIRE: '🔥',
} as const;

export const CACHE_TTLS = {
  // In milliseconds
  GITHUB_REPO: 10 * 60 * 1000,    // 10 minutes
  GITHUB_USER: 15 * 60 * 1000,    // 15 minutes
  GITHUB_COMMITS: 5 * 60 * 1000,  // 5 minutes
  GITHUB_RELEASE: 10 * 60 * 1000, // 10 minutes
  NPM_PACKAGE: 15 * 60 * 1000,    // 15 minutes
  NPM_SEARCH: 5 * 60 * 1000,      // 5 minutes
  DOCS_SEARCH: 60 * 60 * 1000,    // 1 hour
  STATUS_PAGE: 3 * 60 * 1000,     // 3 minutes
} as const;

export const API_TIMEOUT_MS = 8000;

export const STATUS_SERVICES = {
  github: {
    name: 'GitHub',
    url: 'https://www.githubstatus.com',
    apiUrl: 'https://www.githubstatus.com/api/v2/summary.json',
    icon: 'https://github.githubassets.com/favicons/favicon.png',
  },
  npm: {
    name: 'NPM',
    url: 'https://status.npmjs.org',
    apiUrl: 'https://status.npmjs.org/api/v2/summary.json',
    icon: 'https://static-production.npmjs.com/b0f1a8318363653b3aeab4d571608622.png',
  },
  discord: {
    name: 'Discord',
    url: 'https://discordstatus.com',
    apiUrl: 'https://discordstatus.com/api/v2/summary.json',
    icon: 'https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0a6a49cf127bf92de1e2_icon_clyde_blurple_RGB.png',
  },
  cloudflare: {
    name: 'Cloudflare',
    url: 'https://www.cloudflarestatus.com',
    apiUrl: 'https://www.cloudflarestatus.com/api/v2/summary.json',
    icon: 'https://www.cloudflare.com/favicon.ico',
  },
  vercel: {
    name: 'Vercel',
    url: 'https://www.vercel-status.com',
    apiUrl: 'https://www.vercel-status.com/api/v2/summary.json',
    icon: 'https://vercel.com/favicon.ico',
  },
} as const;

export type SupportedStatusService = keyof typeof STATUS_SERVICES;

export const SUPPORTED_DOCS_TECHS = [
  { id: 'javascript', name: 'JavaScript (MDN)', domain: 'developer.mozilla.org', icon: '🟨' },
  { id: 'typescript', name: 'TypeScript', domain: 'www.typescriptlang.org', icon: '🔷' },
  { id: 'nodejs', name: 'Node.js', domain: 'nodejs.org', icon: '🟩' },
  { id: 'python', name: 'Python', domain: 'docs.python.org', icon: '🐍' },
  { id: 'discordjs', name: 'Discord.js', domain: 'discord.js.org', icon: '🤖' },
  { id: 'react', name: 'React', domain: 'react.dev', icon: '⚛️' },
  { id: 'nextjs', name: 'Next.js', domain: 'nextjs.org', icon: '▲' },
  { id: 'express', name: 'Express', domain: 'expressjs.com', icon: '🚂' },
  { id: 'git', name: 'Git', domain: 'git-scm.com', icon: '🌿' },
  { id: 'docker', name: 'Docker', domain: 'docs.docker.com', icon: '🐳' },
  { id: 'rust', name: 'Rust', domain: 'doc.rust-lang.org', icon: '🦀' },
  { id: 'go', name: 'Go (Golang)', domain: 'pkg.go.dev', icon: '🐹' },
  { id: 'tailwindcss', name: 'Tailwind CSS', domain: 'tailwindcss.com', icon: '🎨' },
  { id: 'vue', name: 'Vue.js', domain: 'vuejs.org', icon: '💚' },
] as const;
