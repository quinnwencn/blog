import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

const owner = process.env.GITHUB_REPOSITORY_OWNER;
const repo = process.env.GITHUB_REPOSITORY?.split('/')[1];
const token = process.env.GITHUB_TOKEN;
const labels = (process.env.BLOG_ISSUE_LABELS || 'blog,post')
  .split(',')
  .map((label) => label.trim())
  .filter(Boolean);

const outputDir = path.join(process.cwd(), 'source', '_posts', 'issues');

function slugify(value) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'issue';
}

function escapeYaml(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function hasFrontMatter(markdown) {
  return markdown.trimStart().startsWith('---\n');
}

function labelNames(issue) {
  return issue.labels
    .map((label) => (typeof label === 'string' ? label : label.name))
    .filter(Boolean);
}

function issueToMarkdown(issue) {
  const body = issue.body || '';
  if (hasFrontMatter(body)) {
    return `${body.trim()}\n\n[source issue](${issue.html_url})\n`;
  }

  const issueLabels = labelNames(issue);
  const tags = issueLabels.filter((label) => !labels.includes(label));
  const tagBlock = tags.length
    ? tags.map((tag) => `  - "${escapeYaml(tag)}"`).join('\n')
    : '  - github-issue';

  return `---\ntitle: "${escapeYaml(issue.title)}"\ndate: ${issue.created_at.replace('T', ' ').replace('Z', '')}\nupdated: ${issue.updated_at.replace('T', ' ').replace('Z', '')}\ntags:\n${tagBlock}\ncategories:\n  - issues\nissue: ${issue.number}\nsource: ${issue.html_url}\n---\n\n${body.trim()}\n\n[source issue](${issue.html_url})\n`;
}

async function fetchIssuesForLabel(label) {
  const url = new URL(`https://api.github.com/repos/${owner}/${repo}/issues`);
  url.searchParams.set('state', 'open');
  url.searchParams.set('labels', label);
  url.searchParams.set('per_page', '100');

  const response = await fetch(url, {
    headers: {
      accept: 'application/vnd.github+json',
      authorization: `Bearer ${token}`,
      'x-github-api-version': '2022-11-28'
    }
  });

  if (!response.ok) {
    throw new Error(`GitHub Issues API failed for label "${label}": ${response.status} ${await response.text()}`);
  }

  return response.json();
}

if (!owner || !repo || !token) {
  await rm(outputDir, { recursive: true, force: true });
  console.log('No GitHub Actions repository context found; skipped issue sync.');
  process.exit(0);
}

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });

const byNumber = new Map();
for (const label of labels) {
  const issues = await fetchIssuesForLabel(label);
  for (const issue of issues) {
    if (!issue.pull_request) {
      byNumber.set(issue.number, issue);
    }
  }
}

for (const issue of byNumber.values()) {
  const filename = `${issue.number}-${slugify(issue.title)}.md`;
  await writeFile(path.join(outputDir, filename), issueToMarkdown(issue), 'utf8');
}

console.log(`Synced ${byNumber.size} issue post(s).`);
