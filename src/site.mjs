// Single source of truth for the canonical site origin.
export const SITE_URL = 'https://labscubed.com';

// The blog used to canonicalise to https://www.labscubed.com because that is
// what Google had indexed for all 21 posts. www now hard-redirects to this
// apex (site-wide, unrelated to the blog), so a canonical pointing at www
// while every request 301s away from it would be a self-contradictory signal.
// The apex is the correct target now — it's where every visitor and crawler
// actually lands, and it matches SITE_URL used everywhere else on the site.
export const BLOG_ORIGIN = SITE_URL;

/* ------------------------------------------------------------------ *
 * Route bases
 * ------------------------------------------------------------------ *
 * Individual posts and the listing/pagination/category hub live under two
 * different top-level paths, matching what Webflow already had indexed:
 *   - /post/<slug>   — one page per article (src/pages/post/[slug].astro)
 *   - /blog, /blog/2, /blog/category/<slug> — the listing (src/pages/blog/*)
 * Both resolve to real static files, so Netlify's public/_redirects catch-all
 * (which proxies everything else to Webflow) never touches them.
 */
export const POST_BASE = '/post';
export const BLOG_BASE = '/blog';
export const BLOG_HOST = BLOG_ORIGIN;

/** Absolute URL for a post. */
export const postUrl = (slug) => `${BLOG_HOST}${POST_BASE}/${slug}`;
/** Absolute URL for the blog index. */
export const blogUrl = () => `${BLOG_HOST}${BLOG_BASE}`;
