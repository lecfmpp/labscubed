import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import { SITE_URL, BLOG_HOST, BLOG_BASE, BLOG_STAGING } from './src/site.mjs';

// https://astro.build/config
export default defineConfig({
  site: SITE_URL,
  output: 'static',
  integrations: [
    react(),
    sitemap({
      /* While the blog runs on the staging host it is noindex, so listing it in
         a sitemap would be a contradiction — asking Google to crawl pages we
         just told it to ignore. Blog URLs are dropped entirely until cutover.

         After cutover they are rewritten to BLOG_HOST + BLOG_BASE without a
         trailing slash, so each entry matches the page's own canonical exactly;
         a sitemap that disagrees with the canonical is a wasted signal. */
      filter: (page) =>
        !BLOG_STAGING || !/\/(posts|blog)(\/|$)/.test(new URL(page).pathname),
      serialize(item) {
        const u = new URL(item.url);
        if (/^\/(posts|post|blog)(\/|$)/.test(u.pathname)) {
          item.url = `${BLOG_HOST}${u.pathname.replace(/\/$/, '')}`;
        }
        return item;
      },
    }),
  ],
});
