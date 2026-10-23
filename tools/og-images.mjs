// Renders one 1200x630 JPG social preview per page from tools/og-image.html.
// Run from the repo root: node tools/og-images.mjs
// Needs Google Chrome (headless screenshot) and ImageMagick (PNG -> JPG).
// ponytail: macOS Chrome path hardcoded, pass CHROME=/path/to/chrome elsewhere.
import { execFileSync } from 'node:child_process';
import process from 'node:process';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const root = resolve('.');
const img = (p) => `file://${join(root, 'public', p)}`;

// out: written to public/images/og/<out>.jpg, referenced by that page's og:image
const PAGES = [
  {
    out: 'home',
    kicker: 'Luca Scattolin',
    title: 'Bringing ideas to life with *3D*.',
    desc: '3D Technical Artist & Creative Technologist. 3D pipelines, real-time experiences, renders and configurators.',
    img: img('images/Profile_pic_cutout.webp'),
    photo: '1',
  },
  {
    out: 'vivatech',
    kicker: 'Work · Interactive installation',
    title: 'Vivatech Interactive Experience',
    desc: 'Real-time experience for Thélios at the LVMH Dream Gallery, Vivatech Paris.',
    img: img('images/vivatech-10.jpg'),
  },
  {
    out: 'pipeline-projects',
    kicker: 'Work · Pipeline tools',
    title: 'Pipeline Projects',
    desc: 'In-house tools for Maya, Unreal Engine, Omniverse and PowerPoint, built for the 3D R&D team at Thélios.',
    img: img('images/pipeline-projects-cover.webp'),
    fit: 'contain',
  },
  {
    out: 'company-brain',
    kicker: 'Work · AI assistant',
    title: 'Company Brain',
    desc: 'A self-hosted AI assistant that answers questions about our products from the company systems.',
    img: img('images/company-brain-cover.svg'),
    fit: 'contain',
  },
  {
    out: 'homelab',
    kicker: 'Personal · Self-hosting',
    title: 'Homelab',
    desc: 'A two-node Proxmox cluster and a NAS in a 3D-printed rack, running media, backups, automation and an AI agent.',
    img: img('images/homelab-rack.webp'),
    pos: 'center 35%',
  },
];

mkdirSync(join(root, 'public/images/og'), { recursive: true });
const tmp = mkdtempSync(join(tmpdir(), 'og-'));
for (const { out, ...params } of PAGES) {
  const url = `file://${join(root, 'tools/og-image.html')}?${new URLSearchParams(params)}`;
  const png = join(tmp, `${out}.png`);
  execFileSync(
    CHROME,
    [
      '--headless=new',
      '--allow-file-access-from-files',
      '--hide-scrollbars',
      `--user-data-dir=${join(tmp, 'profile')}`,
      '--window-size=1200,630',
      '--virtual-time-budget=3000',
      `--screenshot=${png}`,
      url,
    ],
    { stdio: 'ignore' },
  );
  const jpg = join(root, 'public/images/og', `${out}.jpg`);
  execFileSync('magick', [png, '-strip', '-quality', '86', jpg]);
  console.log(`public/images/og/${out}.jpg`);
}
rmSync(tmp, { recursive: true, force: true });
