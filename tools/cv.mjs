// Prints tools/cv.html to public/cv/Luca-Scattolin-CV.pdf with headless Chrome.
// ponytail: macOS Chrome path hardcoded like og-images.mjs, pass CHROME=/path/to/chrome elsewhere.
import process from 'node:process';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const output = fileURLToPath(new URL('../public/cv/Luca-Scattolin-CV.pdf', import.meta.url));

execFileSync(CHROME, [
  '--headless=new',
  '--no-pdf-header-footer',
  '--allow-file-access-from-files',
  `--print-to-pdf=${output}`,
  new URL('cv.html', import.meta.url).href,
]);
