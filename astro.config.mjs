import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import { SITE_URL, BLOG_ORIGIN } from './src/site.mjs';

// https://astro.build/config
export default defineConfig({
  site: SITE_URL,
  output: 'static',
  integrations: [
    react(),
    sitemap({
      /* The sitemap is generated from `site` (the apex), but every blog page
         canonicalises to the www origin without a trailing slash — that is what
         is already indexed. A sitemap entry that disagrees with the page's own
         canonical is a contradictory signal, so blog URLs are rewritten here to
         match their canonical exactly. Non-blog pages keep the apex, which is
         what the homepage canonicalises to. */
      serialize(item) {
        const u = new URL(item.url);
        if (/^\/(post|blog)(\/|$)/.test(u.pathname)) {
          const path = u.pathname.replace(/\/$/, '');
          item.url = `${BLOG_ORIGIN}${path}`;
        }
        return item;
      },
    }),
  ],
});
