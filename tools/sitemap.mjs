// Writes dist/sitemap.xml after `vite build` (see package.json's "build"), with each page's
// <lastmod> taken from the last commit that touched its HTML file - so the date is never
// edited by hand and never lies. The deploy checks out the full history (fetch-depth: 0 in
// .github/workflows) for exactly this: a shallow clone would date every page to today.
// ponytail: dates follow the page's HTML only; copy that lives in src/content.js does not
// move them. Add the content.js path per page if that ever matters.
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const SITE = 'https://lucascattolin.com';
// privacy.html and 404.html stay out on purpose: nothing there to rank
const PAGES = [
  { file: 'index.html', path: '/', priority: '1.0' },
  { file: 'vivatech.html', path: '/vivatech.html', priority: '0.8' },
  { file: 'pipeline-projects.html', path: '/pipeline-projects.html', priority: '0.8' },
  { file: 'company-brain.html', path: '/company-brain.html', priority: '0.8' },
  { file: 'homelab.html', path: '/homelab.html', priority: '0.5' },
];

const lastmod = (file) =>
  execFileSync('git', ['log', '-1', '--format=%cs', '--', file], { encoding: 'utf8' }).trim() ||
  new Date().toISOString().slice(0, 10); // not committed yet

const urls = PAGES.map(
  ({ file, path, priority }) => `  <url>
    <loc>${SITE}${path}</loc>
    <lastmod>${lastmod(file)}</lastmod>
    <priority>${priority}</priority>
  </url>`,
).join('\n');

writeFileSync(
  'dist/sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`,
);
console.log('dist/sitemap.xml');
