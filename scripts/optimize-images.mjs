/* One-off image optimizer. Run with `npm run optimize:images`, then commit the
   files it writes — it is deliberately NOT wired into the build.

   Why not a prebuild step: these are hand-authored source assets that change
   maybe twice a year. Regenerating them on every Netlify build would burn CI
   time and make the deployed bytes depend on the sharp version of the day. The
   yt-thumbs prebuild has to run at build time because it pulls from a remote
   that we don't control; this doesn't.

   Two problems it fixes, both flagged by Lighthouse "Improve image delivery":

   1. Intrinsic size far above display size. The worst offender was a partner
      logo shipped at 3840x2160 to be drawn 110x62. Everything here gets capped
      at roughly 3x its largest CSS display size, which covers DPR-3 phones.

   2. PNG for artwork that WebP encodes far smaller. All the logos are flat
      artwork with alpha, which is close to the WebP best case.

   Originals are left in place and never overwritten — logo.png in particular is
   still referenced by the Organization JSON-LD, where a PNG is the safer bet
   for consumers that aren't browsers. */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const IMG = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public/assets/img');

/* `to` is relative to public/assets/img. `width`/`height` cap the output; sharp
   keeps the aspect ratio and never enlarges.

   `mode` picks the encoder settings, and the split matters a lot here:

     'photo'  — plain lossy WebP. For the machine render and the dashboard
                screenshots, which are continuous-tone and hide artifacts.
     'art'    — near-lossless WebP. For the flat logos and standards marks.
                Plain lossy is a bad fit for hard edges against transparency:
                it spends bits smoothing the very edges that make a logo look
                crisp, and still came out ~30% larger than near-lossless in
                testing (logo.png: 12.2K at q90 vs 8.5K near-lossless, and the
                near-lossless one is the one that looks right).

   Heights on the 'art' jobs are set to ~3x the largest size each mark is drawn
   at, which is the ceiling for the DPR-3 phones in the Lighthouse profile. */
const JOBS = [
  // --- LCP hero. Rendered at 64vw on mobile and min(55.5vw, 708px) on desktop,
  // so 1500w is right for desktop DPR-2 but ~6x more pixels than a phone uses.
  { from: 'media/hero-cubeten-crop.webp', to: 'media/hero-cubeten-crop-480.webp', width: 480, mode: 'photo' },
  { from: 'media/hero-cubeten-crop.webp', to: 'media/hero-cubeten-crop-760.webp', width: 760, mode: 'photo' },

  // --- Dashboard slider. Drawn at ~497px wide; 1080w stays for DPR-2 desktop.
  { from: 'media/dashboard.webp', to: 'media/dashboard-760.webp', width: 760, mode: 'photo', quality: 84 },
  { from: 'media/dashboard_01.webp', to: 'media/dashboard_01-760.webp', width: 760, mode: 'photo', quality: 84 },

  // --- Nav + footer logo. Drawn 34px tall at the largest (mobile nav).
  { from: 'logo.png', to: 'logo.webp', height: 104, mode: 'art' },

  // --- Partner logo rail. Capped by the `--h` each one is drawn at.
  // parker-hannifin ships at 3840x2160 to be drawn 42px tall.
  { from: 'partners/parker-hannifin.png', to: 'partners/parker-hannifin.webp', height: 130, mode: 'art' },
  { from: 'partners/chevron-phillips.png', to: 'partners/chevron-phillips.webp', height: 150, mode: 'art' },

  // --- Standards marks. Largest display is 26px tall in the hero rail.
  { from: 'standards/astm-logo.png', to: 'standards/astm-logo.webp', height: 84, mode: 'art' },
  { from: 'standards/iso-logo.png', to: 'standards/iso-logo.webp', height: 84, mode: 'art' },
  { from: 'standards/astm-logo-ink.png', to: 'standards/astm-logo-ink.webp', height: 84, mode: 'art' },
  { from: 'standards/iso-logo-ink.png', to: 'standards/iso-logo-ink.webp', height: 84, mode: 'art' },
  { from: 'standards/astm-emblem-ink.png', to: 'standards/astm-emblem-ink.webp', height: 84, mode: 'art' },

  // --- Integration logos. Already near display size, so this is a format swap.
  // These are the one 'art' case where plain lossy wins (soft gradients, no
  // hard type edges), so they are tagged 'photo'.
  { from: 'media/integ-alpha.png', to: 'media/integ-alpha.webp', mode: 'photo', quality: 88 },
  { from: 'media/integ-sap.png', to: 'media/integ-sap.webp', mode: 'photo', quality: 88 },
  { from: 'media/integ-uncountable.png', to: 'media/integ-uncountable.webp', mode: 'photo', quality: 88 },
];

const encoderFor = (job) =>
  job.mode === 'art'
    ? { nearLossless: true, quality: 60, effort: 6 }
    : { quality: job.quality ?? 82, effort: 6 };

const kb = (n) => (n / 1024).toFixed(1) + 'K';

let before = 0;
let after = 0;

for (const job of JOBS) {
  const src = path.join(IMG, job.from);
  const dest = path.join(IMG, job.to);
  await mkdir(path.dirname(dest), { recursive: true });

  let pipeline = sharp(await readFile(src));
  if (job.width || job.height) {
    pipeline = pipeline.resize({
      width: job.width,
      height: job.height,
      fit: 'inside',
      withoutEnlargement: true,
    });
  }
  const out = await pipeline.webp(encoderFor(job)).toBuffer();
  await writeFile(dest, out);

  const meta = await sharp(out).metadata();
  const srcSize = statSync(src).size;
  before += srcSize;
  after += out.length;
  console.log(
    `${job.to.padEnd(40)} ${(meta.width + 'x' + meta.height).padEnd(11)} ` +
      `${kb(srcSize).padStart(7)} -> ${kb(out.length).padStart(7)}`
  );
}

console.log(`\ntotal ${kb(before)} -> ${kb(after)}  (saved ${kb(before - after)})`);
