/* Build-time: download the 5 YouTube thumbnails, convert to WebP, and write them
   to public/assets/img/yt/<id>.webp so they can be served first-party with a long
   cache (fixes the "efficient cache lifetime" flag on img.youtube.com).

   FAIL-SAFE: any network/convert failure is logged and skipped — the build never
   breaks, and VideoCarousel falls back to img.youtube.com client-side for any
   thumbnail that didn't get generated. Runs before `astro build` (see package.json).
   Note: youtube.com may 403 some egress IPs; if so, thumbnails simply fall back. */
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const IDS = ['8IuGJsjw2AE', 'khQHHxJd2hM', 'eWPbdBoOrJ4', 'Y0qXEgPcf5U', 'RILG7TXhc-w'];
const outDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public/assets/img/yt');
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36';

async function grab(id) {
  // Prefer maxres, fall back to hq.
  for (const name of ['maxresdefault', 'hqdefault']) {
    try {
      const res = await fetch(`https://img.youtube.com/vi/${id}/${name}.jpg`, { headers: { 'User-Agent': UA } });
      if (!res.ok) continue;
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 2000) continue; // youtube returns a tiny placeholder for missing sizes
      const webp = await sharp(buf).resize({ width: 640, withoutEnlargement: true }).webp({ quality: 78 }).toBuffer();
      await writeFile(path.join(outDir, `${id}.webp`), webp);
      return { id, ok: true, from: name, kb: Math.round(webp.length / 1024) };
    } catch (e) {
      // try next size / fall through
    }
  }
  return { id, ok: false };
}

try {
  await mkdir(outDir, { recursive: true });
  const results = await Promise.all(IDS.map(grab));
  const ok = results.filter((r) => r.ok);
  console.log(`[yt-thumbs] generated ${ok.length}/${IDS.length}`, ok.map((r) => `${r.id}(${r.from},${r.kb}k)`).join(' '));
  const miss = results.filter((r) => !r.ok).map((r) => r.id);
  if (miss.length) console.log(`[yt-thumbs] fallback to img.youtube.com for: ${miss.join(', ')}`);
} catch (e) {
  console.log('[yt-thumbs] skipped (non-fatal):', e.message);
}
process.exit(0);
