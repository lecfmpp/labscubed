/* /rss.xml — feed of published posts.
 *
 * Webflow never exposed one. It costs nothing to generate here and gives
 * newsletter tooling and aggregators a machine-readable source that does not
 * depend on scraping the listing page.
 */
import type { APIRoute } from 'astro';
import { BLOG_ORIGIN } from '../site.mjs';
import { getPosts, postDate, postDescription } from '../lib/blog';

const esc = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

export const GET: APIRoute = async () => {
  // The feed is public-facing, so it never carries preview-only drafts even
  // when the surrounding build is a preview deploy.
  const posts = (await getPosts()).filter((p) => p.status === 'published');

  const items = posts
    .map((p) => {
      const url = `${BLOG_ORIGIN}/post/${p.slug}`;
      return `    <item>
      <title>${esc(p.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${postDate(p).toUTCString()}</pubDate>
      <description>${esc(postDescription(p))}</description>
${p.categories.map((c) => `      <category>${esc(c)}</category>`).join('\n')}
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>LabsCubed Blog</title>
    <link>${BLOG_ORIGIN}/blog</link>
    <description>Automated materials testing, ASTM and ISO methods, and lab workflow guidance from the LabsCubed engineering team.</description>
    <language>en-us</language>
    <atom:link href="${BLOG_ORIGIN}/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
