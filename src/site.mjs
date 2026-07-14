// Single source of truth for the canonical site origin.
// Test subdomain today; flip this one line to the apex (https://labscubed.com)
// when lp. is promoted to the primary homepage. Drives astro `site`
// (sitemap + canonical), the <link rel="canonical">, and OG/Twitter urls.
export const SITE_URL = 'https://lp.labscubed.com';
