import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import { SITE_URL, BLOG_HOST } from './src/site.mjs';

// https://astro.build/config
export default defineConfig({
  site: SITE_URL,
  output: 'static',
  integrations: [
    react(),
    sitemap({
      // Replay session pages are personal and gated; they have no business in
      // the sitemap (they are also noindex).
      filter: (page) => !/\/session\/?$/.test(new URL(page).pathname),
      /* Blog/post entries are rewritten without a trailing slash so each entry
         matches the page's own canonical exactly — a sitemap that disagrees
         with the canonical is a wasted signal. BLOG_HOST equals SITE_URL now
         that the blog is live (no staging host to redirect from). */
      serialize(item) {
        const u = new URL(item.url);
        if (/^\/(post|blog)(\/|$)/.test(u.pathname)) {
          item.url = `${BLOG_HOST}${u.pathname.replace(/\/$/, '')}`;
        }
        return item;
      },
    }),
  ],
});
