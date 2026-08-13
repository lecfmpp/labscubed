// Single source of truth for the canonical site origin.
// Test subdomain today; flip this one line to the apex (https://labscubed.com)
// when lp. is promoted to the primary homepage. Drives astro `site`
// (sitemap + canonical), the <link rel="canonical">, and OG/Twitter urls.
export const SITE_URL = 'https://labscubed.com';

// Origin used for blog canonicals, breadcrumbs and RSS links.
//
// Deliberately `www.` even though SITE_URL is the apex: every published post
// already canonicalises to https://www.labscubed.com/post/<slug>, and that is
// what Google has indexed. Serving these pages under a different canonical host
// would re-point ~21 indexed URLs for no benefit. Change this only as a planned
// apex consolidation, with redirects — not as a side effect of the migration.
export const BLOG_ORIGIN = 'https://www.labscubed.com';
