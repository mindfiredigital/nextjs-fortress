const { execSync } = require('child_process');

execSync('npx changeset version', { stdio: 'inherit' });

execSync('pnpm install --lockfile-only', { stdio: 'inherit' });

console.log('Versions and pnpm-lock.yaml updated.');