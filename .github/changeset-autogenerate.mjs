import { execSync } from 'child_process';
import fs from 'fs';

const commitMessage = execSync('git log -1 --format=%s').toString().trim();

let changeType = null;
if (commitMessage.includes('BREAKING CHANGE:')) {
  changeType = 'major';
} else if (commitMessage.startsWith('feat')) {
  changeType = 'minor';
} else if (commitMessage.startsWith('fix')) {
  changeType = 'patch';
}

if (changeType) {
  const packageName = "nextjs-fortress";
  const description = commitMessage.replace(/^(feat|fix)(\([^)]+\))?: /, '');

  const changesetContent = `---\n'${packageName}': ${changeType}\n---\n\n${description}\n`;
  
  if (!fs.existsSync('.changeset')) {
    fs.mkdirSync('.changeset');
  }
  
  const fileName = `.changeset/auto-${Date.now()}.md`;
  fs.writeFileSync(fileName, changesetContent);
  console.log(`Changeset file created: ${fileName}`);
} else {
  console.log('No version-triggering commit (feat/fix) detected. Skipping changeset.');
}