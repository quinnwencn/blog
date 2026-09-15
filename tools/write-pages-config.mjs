import { writeFile } from 'node:fs/promises';

const repository = process.env.GITHUB_REPOSITORY;

if (!repository) {
  console.log('No GitHub repository context found; skipped Pages config generation.');
  process.exit(0);
}

const [owner, repo] = repository.split('/');
const isUserSite = repo.toLowerCase() === `${owner.toLowerCase()}.github.io`;
const url = isUserSite ? `https://${repo}` : `https://${owner}.github.io/${repo}`;
const root = isUserSite ? '/' : `/${repo}/`;

await writeFile(
  '_config.github.yml',
  `url: ${url}\nroot: ${root}\n`,
  'utf8'
);

console.log(`Generated GitHub Pages config: url=${url}, root=${root}`);
