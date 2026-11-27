/* Post-build guard: no URL in the sitemap may point at a noindex page.
 *
 *   node scripts/check-sitemap-noindex.mjs        (runs as part of `npm run build`)
 *
 * A sitemap entry tells crawlers "index this", and a noindex page says the
 * opposite. Ahrefs reports it as an error ("Noindex page in sitemap"), and
 * Search Console reports it as "Submitted URL marked 'noindex'". It happens
 * whenever a new page passes `noindex` to Base.astro but nobody adds it to the
 * sitemap filter in astro.config.mjs. This check reads dist/sitemap-*.xml,
 * finds each URL's built HTML and fails the build if that page has a robots
 * noindex meta. Uses only Node built-ins.
 *
 * It fails only the production build (Netlify CONTEXT=production). Deploy
 * previews and local builds also render review/approved blog posts, which are
 * noindex drafts by design (src/lib/blog.ts), so there it only warns: those
 * sitemaps are never the one crawlers read. */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';
const sitemaps = readdirSync(DIST).filter((f) => /^sitemap-\d+\.xml$/.test(f));
if (!sitemaps.length) {
  console.error('[sitemap-check] no dist/sitemap-*.xml found');
  process.exit(1);
}

const urls = sitemaps.flatMap((f) =>
  [...readFileSync(join(DIST, f), 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]),
);

const bad = [];
for (const url of urls) {
  const path = decodeURIComponent(new URL(url).pathname).replace(/\/$/, '');
  // build.format 'file' → /about-us is dist/about-us.html; / is dist/index.html.
  const candidates = path ? [`${path}.html`, `${path}/index.html`] : ['index.html'];
  const file = candidates.map((c) => join(DIST, c)).find(existsSync);
  if (!file) continue; // not an HTML page we built; nothing to check
  if (/<meta[^>]+name="robots"[^>]+content="[^"]*noindex/i.test(readFileSync(file, 'utf8'))) {
    bad.push(url);
  }
}

const IS_PRODUCTION = process.env.CONTEXT === 'production';

if (bad.length) {
  (IS_PRODUCTION ? console.error : console.warn)(
    `[sitemap-check] ${bad.length} noindex page(s) are in the sitemap:\n` +
      bad.map((u) => `  - ${u}`).join('\n') +
      '\nExclude them in the sitemap filter in astro.config.mjs, or drop their noindex.' +
      (IS_PRODUCTION ? '' : '\n(Not a production build, so this is only a warning. Draft posts are expected here.)'),
  );
  if (IS_PRODUCTION) process.exit(1);
} else {
  console.log(`[sitemap-check] ${urls.length} sitemap URLs, none noindex`);
}
