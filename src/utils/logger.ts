/**
 * Colorized structured logger for production bot logs
 */

const ANSI = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
};

function formatTimestamp(): string {
  const now = new Date();
  return `${ANSI.gray}[${now.toISOString()}]${ANSI.reset}`;
}

export const logger = {
  info: (message: string, ...args: unknown[]) => {
    console.log(`${formatTimestamp()} ${ANSI.blue}[INFO]${ANSI.reset} ${message}`, ...args);
  },
  success: (message: string, ...args: unknown[]) => {
    console.log(`${formatTimestamp()} ${ANSI.green}[SUCCESS]${ANSI.reset} ${message}`, ...args);
  },
  warn: (message: string, ...args: unknown[]) => {
    console.warn(`${formatTimestamp()} ${ANSI.yellow}[WARN]${ANSI.reset} ${message}`, ...args);
  },
  error: (message: string, error?: unknown) => {
    console.error(`${formatTimestamp()} ${ANSI.red}[ERROR]${ANSI.reset} ${message}`);
    if (error) {
      if (error instanceof Error && error.stack) {
        console.error(`${ANSI.gray}${error.stack}${ANSI.reset}`);
      } else {
        console.error(error);
      }
    }
  },
  debug: (message: string, ...args: unknown[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`${formatTimestamp()} ${ANSI.magenta}[DEBUG]${ANSI.reset} ${message}`, ...args);
    }
  },
  command: (user: string, commandName: string, guildName?: string) => {
    const guildInfo = guildName ? `in ${ANSI.cyan}${guildName}${ANSI.reset}` : 'in DMs';
    console.log(
      `${formatTimestamp()} ${ANSI.yellow}[CMD]${ANSI.reset} ${ANSI.bright}${user}${ANSI.reset} ran ${ANSI.green}/${commandName}${ANSI.reset} ${guildInfo}`
    );
  },
};
