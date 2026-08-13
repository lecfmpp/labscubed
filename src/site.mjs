// Single source of truth for the canonical site origin.
export const SITE_URL = 'https://labscubed.com';

// Where the blog will eventually live, once /post/* stops proxying to Webflow.
// Every published post already canonicalises to https://www.labscubed.com/post/<slug>
// and that is what Google has indexed, so this must not change casually.
export const BLOG_ORIGIN = 'https://www.labscubed.com';

/* ------------------------------------------------------------------ *
 * Staging switch
 * ------------------------------------------------------------------ *
 * While the apex still proxies /post/* to Webflow, the Astro blog runs on the
 * lp. subdomain under a different path so it cannot collide with — or compete
 * against — anything already indexed.
 *
 * Staging pages are noindex/nofollow and canonicalise to themselves. They
 * deliberately do NOT canonicalise to www: for the 19 unpublished drafts that
 * URL 404s, and pointing at a dead page is a worse signal than none.
 *
 * TO GO LIVE, two changes:
 *   1. set BLOG_STAGING = false here
 *   2. rename src/pages/posts/ -> src/pages/post/
 * Everything else — links, canonicals, RSS, sitemap — follows BLOG_BASE and
 * BLOG_HOST automatically.
 */
export const BLOG_STAGING = true;

export const BLOG_BASE = BLOG_STAGING ? '/posts' : '/post';
export const BLOG_HOST = BLOG_STAGING ? 'https://lp.labscubed.com' : BLOG_ORIGIN;

/** Absolute URL for a post, correct in either mode. */
export const postUrl = (slug) => `${BLOG_HOST}${BLOG_BASE}/${slug}`;
/** Absolute URL for the blog index. */
export const blogUrl = () => `${BLOG_HOST}${BLOG_BASE}`;
