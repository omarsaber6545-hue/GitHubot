import { Command } from '../types/command.js';
import { githubCommand } from './github/github.js';
import { githubUserCommand } from './github/githubUser.js';
import { commitsCommand } from './github/commits.js';
import { releaseCommand } from './github/release.js';
import { githubVisibilityCommand } from './github/githubVisibility.js';
import { githubAuthCommand } from './github/githubAuth.js';
import { npmCommand } from './npm/npm.js';
import { npmSearchCommand } from './npm/npmSearch.js';
import { docsCommand } from './docs/docs.js';
import { statusCommand } from './status/status.js';
import { statusAllCommand } from './status/statusAll.js';
import { helpCommand } from './utility/help.js';
import { pingCommand } from './utility/ping.js';
import { aboutCommand } from './utility/about.js';

export const allCommands: Command[] = [
  // GitHub
  githubCommand,
  githubUserCommand,
  commitsCommand,
  releaseCommand,
  githubVisibilityCommand,
  githubAuthCommand,

  // NPM
  npmCommand,
  npmSearchCommand,

  // Docs
  docsCommand,

  // Status
  statusCommand,
  statusAllCommand,

  // Utility
  helpCommand,
  pingCommand,
  aboutCommand,
];

export {
  githubCommand,
  githubUserCommand,
  commitsCommand,
  releaseCommand,
  githubVisibilityCommand,
  githubAuthCommand,
  npmCommand,
  npmSearchCommand,
  docsCommand,
  statusCommand,
  statusAllCommand,
  helpCommand,
  pingCommand,
  aboutCommand,
};
