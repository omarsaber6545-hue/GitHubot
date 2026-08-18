import { execSync } from 'node:child_process';
import { userStore } from '../services/userStore.js';

async function main() {
  const token = userStore.getDecryptedToken('1512205578015871048');
  if (!token) {
    console.error('No token found for user.');
    process.exit(1);
  }

  try {
    execSync('git config user.name "omarsaber6545-hue"');
    execSync('git config user.email "omarsaber6545@users.noreply.github.com"');
    execSync('git add .');
    execSync('git commit -m "feat: initial release of GitHubot - Arabic Discord Developer Bot"');
    execSync('git branch -M main');

    try {
      execSync('git remote remove origin');
    } catch {}

    const authRemote = `https://${token}@github.com/omarsaber6545-hue/githubot.git`;
    execSync(`git remote add origin ${authRemote}`);

    console.log('Pushing code to https://github.com/omarsaber6545-hue/githubot ...');
    const pushOutput = execSync('git push -u origin main --force', { stdio: 'pipe' });
    console.log(pushOutput.toString());

    // Clean remote URL so token is not saved in plain text in .git/config
    execSync('git remote set-url origin https://github.com/omarsaber6545-hue/githubot.git');
    console.log('✅ Successfully pushed to GitHub!');
  } catch (error: any) {
    console.error('Error during git push:', error.message, error.stderr?.toString());
    process.exit(1);
  }
}

main();
