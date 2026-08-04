/* Build-time: pull everything VideoCarousel needs from YouTube so the browser
   never has to.

   1. The 5 thumbnails, converted to WebP into public/assets/img/yt/<id>.webp so
      they are served first-party with a long cache (fixes the "efficient cache
      lifetime" flag on img.youtube.com).

   2. The 5 video titles, into src/lib/yt-titles.json. These used to be fetched
      from youtube.com/oembed in a useEffect on mount — five cross-origin
      requests that Lighthouse put on the critical request chain (~900ms each,
      and they had to wait for React to hydrate first). Baking them in removes
      the requests, the youtube.com handshake, and the title pop-in.

   FAIL-SAFE: any network/convert failure is logged and skipped — the build never
   breaks. Thumbnails fall back to img.youtube.com client-side; titles fall back
   to whatever is already committed in yt-titles.json, so a failed fetch degrades
   to slightly stale text rather than blank cards. Runs before `astro build`
   (see package.json). Note: youtube.com may 403 some egress IPs. */
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const IDS = ['8IuGJsjw2AE', 'khQHHxJd2hM', 'eWPbdBoOrJ4', 'Y0qXEgPcf5U', 'RILG7TXhc-w'];
const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(here, '../public/assets/img/yt');
const titlesFile = path.resolve(here, '../src/lib/yt-titles.json');
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

/* Merge freshly fetched titles over the committed ones, so a video that fails to
   resolve keeps its last known title instead of reverting to a placeholder. */
async function writeTitles() {
  let existing = {};
  try {
    existing = JSON.parse(await readFile(titlesFile, 'utf8'));
  } catch {
    // First run, or the file was removed — start empty.
  }

  const fetched = await Promise.all(
    IDS.map(async (id) => {
      try {
        const res = await fetch(
          `https://www.youtube.com/oembed?format=json&url=https://www.youtube.com/watch?v=${id}`,
          { headers: { 'User-Agent': UA } }
        );
        if (!res.ok) return [id, null];
        const data = await res.json();
        return [id, data && data.title ? data.title : null];
      } catch {
        return [id, null];
      }
    })
  );

  const titles = {};
  let fresh = 0;
  for (const [id, title] of fetched) {
    if (title) fresh += 1;
    titles[id] = title || existing[id] || 'Watch on YouTube';
  }

  await writeFile(titlesFile, JSON.stringify(titles, null, 2) + '\n');
  console.log(`[yt-titles] ${fresh}/${IDS.length} fetched, ${IDS.length - fresh} kept from cache`);
}

try {
  await mkdir(outDir, { recursive: true });
  const results = await Promise.all(IDS.map(grab));
  const ok = results.filter((r) => r.ok);
  console.log(`[yt-thumbs] generated ${ok.length}/${IDS.length}`, ok.map((r) => `${r.id}(${r.from},${r.kb}k)`).join(' '));
  const miss = results.filter((r) => !r.ok).map((r) => r.id);
  if (miss.length) console.log(`[yt-thumbs] fallback to img.youtube.com for: ${miss.join(', ')}`);
  await writeTitles();
} catch (e) {
  console.log('[yt-thumbs] skipped (non-fatal):', e.message);
}
process.exit(0);
