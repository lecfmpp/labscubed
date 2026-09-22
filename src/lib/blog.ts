/* Blog data layer — Supabase is the CMS.
 *
 * Posts are fetched once at build time over the PostgREST endpoint (no SDK, no
 * runtime JS). `blog_posts.content` already holds the finished, designed `.lcb`
 * HTML produced by the blog-creator automation, so the build does not
 * transform article markup — it only unwraps the schema payload and renders.
 *
 * Draft visibility is decided by the deploy context, not by a flag in the CMS:
 * production builds ship `published` only, while preview/branch deploys also
 * include `review` and `approved`. That is what makes a Netlify Deploy Preview
 * a working editorial preview — the thing Webflow could never do, because it
 * refuses to serve isDraft items on the staging domain.
 */

const SUPABASE_URL =
  import.meta.env.SUPABASE_URL ?? 'https://grozewxrymeiruhggcdy.supabase.co';
const SUPABASE_KEY = import.meta.env.SUPABASE_KEY ?? '';

/** Statuses a production build is allowed to publish. */
const PUBLIC_STATUSES = ['published'];
/** Extra statuses a preview build renders so editors can review before go-live. */
const PREVIEW_STATUSES = ['review', 'approved'];

/** Netlify sets CONTEXT=production only for the live site; everything else
 *  (deploy-preview, branch-deploy) and local `astro dev` is a preview. */
export const IS_PREVIEW =
  (import.meta.env.CONTEXT ?? 'dev') !== 'production';

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  meta_description: string | null;
  summary: string | null;
  content: string;
  author: string | null;
  status: string;
  categories: string[];
  tags: string[] | null;
  primary_keyword: string | null;
  hero_image_url: string | null;
  hero_image_alt: string | null;
  thumb_image_url: string | null;
  thumb_image_alt: string | null;
  read_time_minutes: number | null;
  images: Record<string, { url?: string; alt?: string }>;
  actual_word_count: number | null;
  published_at: string | null;
  created_at: string;
  updated_at: string | null;
}

/** Human label for each public category slug (mirrors the Webflow taxonomy). */
export const CATEGORY_LABELS: Record<string, string> = {
  'tensile-testing': 'Tensile Testing',
  'flexure-testing': 'Flexure Testing',
  'testing-standards': 'Testing Standards',
  'lab-automation': 'Lab Automation',
  data: 'Data',
  'case-studies': 'Case Studies',
  'product-news': 'Product News',
  'quick-guides': 'Quick Guides',
  'roi-insights': 'ROI Insights',
  'industry-buzz': 'Industry Buzz',
  'lab-tips': 'Lab Tips',
  'events-replays': 'Events & Replays',
  'insider-interviews': 'Insider Interviews',
};

export const categoryLabel = (slug: string) =>
  CATEGORY_LABELS[slug] ??
  slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

let cache: BlogPost[] | null = null;

/** All renderable posts, newest first. Cached for the lifetime of the build. */
/** Slugs this build renders, and every slug the CMS knows. Both are filled by
 *  getPosts(), which getStaticPaths always calls before a page body renders. */
let builtSlugs = new Set<string>();
let knownSlugs = new Set<string>();

export async function getPosts(): Promise<BlogPost[]> {
  if (cache) return cache;

  if (!SUPABASE_KEY) {
    throw new Error(
      'SUPABASE_KEY is not set — the blog cannot be built.\n' +
        'Local: add SUPABASE_URL and SUPABASE_KEY to .env in the repo root.\n' +
        'Netlify: Site settings → Environment variables.',
    );
  }

  const statuses = IS_PREVIEW
    ? [...PUBLIC_STATUSES, ...PREVIEW_STATUSES]
    : PUBLIC_STATUSES;

  // `content` is filtered server-side: a post with an empty body would render a
  // blank page, which is worse than not existing.
  const params = new URLSearchParams({
    select:
      'id,title,slug,meta_description,summary,content,author,status,categories,tags,' +
      'primary_keyword,hero_image_url,hero_image_alt,thumb_image_url,thumb_image_alt,' +
      'read_time_minutes,actual_word_count,published_at,created_at,updated_at,images',
    status: `in.(${statuses.join(',')})`,
    content: 'not.is.null',
    order: 'published_at.desc.nullslast,created_at.desc',
  });

  const res = await fetch(`${SUPABASE_URL}/rest/v1/blog_posts?${params}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  });

  if (!res.ok) {
    throw new Error(
      `Supabase returned ${res.status} fetching blog_posts: ${await res.text()}`,
    );
  }

  const rows = (await res.json()) as BlogPost[];

  // A row can pass `content is not null` and still be a stub — the pipeline has
  // produced 227-character placeholder bodies before. Anything that short is a
  // data fault, not a short post, so drop it rather than publish a blank page.
  cache = rows.filter((p) => (p.content ?? '').length > 1000);

  /* Slug bookkeeping for the cross-link guard below. `built` is what this
     build ships; `known` is every slug the CMS has in ANY status, which a
     production build cannot infer from `rows` because it only ever fetched
     the published ones. */
  builtSlugs = new Set(cache.map((p) => p.slug));
  knownSlugs = await fetchKnownSlugs();
  return cache;
}

/** Every slug in blog_posts, whatever its status. One cheap request. */
async function fetchKnownSlugs(): Promise<Set<string>> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/blog_posts?select=slug`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    });
    if (!res.ok) return new Set();
    return new Set(((await res.json()) as { slug: string }[]).map((r) => r.slug));
  } catch {
    // The guard is a safety net, not a load-bearing step: if this request
    // fails the build still ships, it just cannot unlink anything.
    return new Set();
  }
}

export async function getPost(slug: string): Promise<BlogPost | undefined> {
  return (await getPosts()).find((p) => p.slug === slug);
}

/* ------------------------------------------------------------------ *
 * Article body
 * ------------------------------------------------------------------ */

/** The hidden element the automation writes its JSON-LD payload into. */
const SCHEMA_DIV =
  /<div\s+id=["']jsonld-data["'][^>]*data-schemas=(["'])([\s\S]*?)\1[^>]*>\s*<\/div>/i;

/** Decode the HTML entities used to make the JSON safe inside an attribute. */
function decodeEntities(s: string): string {
  return s
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

/** Outer `<div class="lcb-article">…</div>` the automation wraps bodies in. */
const ARTICLE_OPEN = /<div\s+class=["']lcb-article["']\s*>/i;

/** A `<style>` block carrying the shared `.lcb-article` typography. */
const BOILERPLATE_STYLE = /<style\b[^>]*>(?:(?!<\/style>)[\s\S])*?\.lcb-article\s*>(?:(?!<\/style>)[\s\S])*?<\/style>/gi;

/**
 * Strip the per-post copy of the article typography.
 *
 * Posts written before this migration inline that CSS in the body, so it used
 * to ship once per page — and, once every post is on one site, 21 times over.
 * blog.css now provides it globally, so the inline copies are redundant.
 * Only blocks that actually contain `.lcb-article >` rules are removed; a post
 * with its own bespoke <style> keeps it.
 */
function stripBoilerplateStyle(html: string): string {
  return html.replace(BOILERPLATE_STYLE, '');
}

/**
 * Remove the stored `.lcb-article` wrapper so the layout can supply its own.
 *
 * Automated posts arrive wrapped; the five pre-automation posts are bare
 * Webflow rich text. Unwrapping here means the layout emits exactly one
 * `.lcb-article` for both shapes — nesting it would double every margin the
 * direct-child typography rules apply, and would break the `>` selectors that
 * the kit relies on to not reach inside its own elements.
 */
function unwrapArticle(html: string): string {
  const m = html.match(ARTICLE_OPEN);
  if (!m) return html;
  const open = html.replace(ARTICLE_OPEN, '');
  const close = open.lastIndexOf('</div>');
  return close === -1 ? open : open.slice(0, close) + open.slice(close + 6);
}

/** An empty image placeholder written by the blog-creator design pass. */
const IMAGE_SLOT = /<figure\b[^>]*\bdata-image-slot=["']([^"']+)["'][^>]*>\s*<\/figure>/gi;

const attrOf = (tag: string, name: string) => {
  const m = tag.match(new RegExp(`\\b${name}=["']([^"']*)["']`, 'i'));
  return m ? m[1] : '';
};

/**
 * Fill or remove each `data-image-slot` placeholder.
 *
 * The automation marks where an image belongs but never embeds one, so the
 * article HTML stays stable no matter how many times an image is re-uploaded.
 * A slot with an upload becomes a real <figure><img>; a slot without one is
 * removed outright, so a post can be reviewed and published with only some of
 * its images and never shows a broken frame.
 */
function fillImageSlots(
  html: string,
  images: Record<string, { url?: string; alt?: string }>,
): string {
  return html.replace(IMAGE_SLOT, (tag, slot) => {
    const img = images?.[slot];
    if (!img?.url) return '';
    const alt = img.alt || attrOf(tag, 'data-alt') || '';
    const esc = (v: string) => v.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
    return (
      `<figure class="lcb-figure">` +
      `<img src="${esc(img.url)}" alt="${esc(alt)}" loading="lazy" decoding="async">` +
      `</figure>`
    );
  });
}

/** Full body pipeline: drop the inline CSS copy, then unwrap. */
/* A table already sitting in a scroll box. Three generations of the generator
   named that box three different things, and the Webflow posts brought a
   fourth. */
const SCROLLBOX_OPEN =
  /<div[^>]*class="[^"]*(?:lcb-table-wrap|lcb-scroll|fs-table2_instance)[^"]*"[^>]*>\s*$/;

/**
 * Give every table a scroll box.
 *
 * Article tables arrive in five shapes — `.lcb-compare` inside `.lcb`,
 * `.lcb-table` inside `.lcb-table-wrap`, `.lcb-data` inside `.lcb-scroll`,
 * inline-styled tables with no class at all, and the Webflow leftovers
 * (`.table-bordered`, `.fs-table2_table`). The stylesheet only ever knew two of
 * them, which is how a three-column table shipped looking like indented text.
 *
 * Normalising here rather than in CSS means the stylesheet has ONE structure to
 * style, and a sixth shape invented by a future generator run is still wrapped,
 * still scrollable on a phone, and still picks up the baseline table styles.
 * The stored content is never modified — this runs on the way to the page.
 */
function wrapTables(html: string): string {
  return html.replace(/<table\b[\s\S]*?<\/table>/gi, (table, offset: number) =>
    SCROLLBOX_OPEN.test(html.slice(Math.max(0, offset - 300), offset))
      ? table
      : `<div class="lcb-table-wrap">${table}</div>`,
  );
}

/* A cross-link to another post, absolute or relative. */
const POST_LINK =
  /<a\b[^>]*?href="(?:https?:\/\/(?:www\.)?labscubed\.com)?\/post\/([^"/?#]+)[^"]*"[^>]*>([\s\S]*?)<\/a>/gi;

/**
 * Unlink cross-links to posts this build is not shipping.
 *
 * Posts link to each other freely and the generator writes those links while
 * the target is still a draft. In production the target is not built, the path
 * falls through the catch-all in public/_redirects to Webflow, and Webflow
 * answers 404 — a dead link on a live page. Eleven of them were live before
 * this guard existed, most of them from `automated-tensile-testing`.
 *
 * The anchor is unwrapped to its own text, so the sentence still reads, and
 * the link comes back on its own the moment the target is published. Nothing
 * is written back to Supabase; this is a render-time repair.
 *
 * Only slugs the CMS KNOWS are touched. A /post/ slug absent from blog_posts
 * is a pre-migration Webflow article that the proxy still serves, and
 * unlinking it would break a link that works.
 */
function unlinkUnbuiltPosts(html: string): string {
  return html.replace(POST_LINK, (anchor, slug: string, text: string) => {
    if (!knownSlugs.has(slug) || builtSlugs.has(slug)) return anchor;
    unlinked.add(slug);
    return text;
  });
}
const unlinked = new Set<string>();

/** Report what the guard had to repair, so a dead link is visible in the build
 *  log rather than only in the HTML. */
export function reportUnlinked(): string[] {
  return [...unlinked].sort();
}

/**
 * Point every link in a stored post at the URL that actually serves it.
 *
 * The generator (and the Webflow era before it) wrote absolute
 * `https://www.labscubed.com/...` links, some to pages that have since moved.
 * www 301s to the apex, so each of those links cost a redirect hop and kept
 * voting for the old host; links to the moved ASTM pages cost two
 * (SEO report 2026-09-22: 199 www links in 20 of 21 posts). Rewriting at build
 * time fixes every post, including ones generated later, without touching the
 * stored content. Runs on the raw body, so the JSON-LD payload is covered too.
 */
const MOVED: [RegExp, string][] = [
  [/(?:https?:\/\/(?:www\.)?labscubed\.com)?\/astm-d638-iso527-tensile-testing\/?(?=["'#?\s)<&])/g, 'https://labscubed.com/resources/astm-d638-iso-527-2-plastic-tensile-testing'],
  [/(?:https?:\/\/(?:www\.)?labscubed\.com)?\/astm-d412-iso37-how-to-run-tensile-testing-for-rubber\/?(?=["'#?\s)<&])/g, 'https://labscubed.com/resources/astm-d412-iso-37-rubber-tensile-testing'],
  [/(?:https?:\/\/(?:www\.)?labscubed\.com)?\/(astm-d790-iso-178-explained-everything-you-need-to-know-about-plastic-flexural-testing)\/?(?=["'#?\s)<&])/g, 'https://labscubed.com/post/$1'],
  [/(?:https?:\/\/(?:www\.)?labscubed\.com)?\/cube-go-waitlist\/?(?=["'#?\s)<&])/g, 'https://labscubed.com/get-a-quote'],
];
export function normalizeSiteLinks(html: string): string {
  let out = html;
  for (const [re, to] of MOVED) out = out.replace(re, to);
  return out
    .replace(/https?:\/\/(?:www\.)?labscubed\.com(?=[\/"'#?\s)<&]|$)/g, 'https://labscubed.com')
    // Pages have no trailing slash (astro.config trailingSlash 'never').
    .replace(/(https:\/\/labscubed\.com\/[^"'#?\s)<&]*[^\/"'#?\s)<&])\/(?=["'#?\s)<&])/g, '$1');
}

/** Resize every Supabase-hosted image inside a post body (see sbImage). */
function resizeBodyImages(html: string): string {
  return html.replace(/<img\b[^>]*?\ssrc="([^"]+)"[^>]*>/gi, (tag, src: string) => {
    if (!src.includes(SB_OBJECT) || /\ssrcset=/i.test(tag)) return tag;
    return tag.replace(`src="${src}"`,
      `src="${sbImage(src, 1200)}" srcset="${sbSrcset(src, [600, 900, 1200, 1600])}" sizes="(max-width: 860px) 100vw, 820px"`);
  });
}

function prepareBody(
  html: string,
  images: Record<string, { url?: string; alt?: string }> = {},
): string {
  return wrapTables(
    unlinkUnbuiltPosts(
      resizeBodyImages(fillImageSlots(unwrapArticle(stripBoilerplateStyle(html)), images)),
    ),
  ).trim();
}

/**
 * Split the stored body into the schema blocks and the visible article HTML.
 *
 * On Webflow the payload stayed in the DOM and a client-side loader copied it
 * into <script type="application/ld+json"> after DOMContentLoaded. Here it is
 * emitted into <head> at build time, so crawlers that do not execute JS — most
 * AI answer engines among them — can actually read it, and the inert div is
 * removed from the body instead of being shipped to every reader.
 */
export function extractSchemas(
  rawHtml: string,
  images: Record<string, { url?: string; alt?: string }> = {},
): {
  schemas: unknown[];
  body: string;
} {
  const html = normalizeSiteLinks(rawHtml);
  const m = html.match(SCHEMA_DIV);
  if (!m) return { schemas: [], body: prepareBody(html, images) };

  let schemas: unknown[] = [];
  try {
    const parsed = JSON.parse(decodeEntities(m[2]));
    schemas = Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    // Malformed payload: drop the schema rather than emit invalid JSON-LD, but
    // still strip the div so the page is clean.
    schemas = [];
  }
  return { schemas, body: prepareBody(html.replace(SCHEMA_DIV, ''), images) };
}

/** Read time in whole minutes — stored value wins, else ~220 wpm. */
export function readTime(post: BlogPost): number {
  if (post.read_time_minutes) return post.read_time_minutes;
  const words =
    post.actual_word_count ??
    post.content.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

/** Hero and card images, preferring the slot map over the legacy columns. */
/**
 * Blog images live in Supabase Storage at full original size (a header was a
 * 1.6 MB PNG screenshot; Lighthouse 2026-09-22 put that post's mobile LCP at
 * 12 s). Supabase's image transformation endpoint resizes on the fly and serves
 * WebP to browsers that accept it (the original format to those that don't, e.g.
 * social-card crawlers) — same object, `/render/image/` instead of `/object/`.
 * Non-Supabase URLs pass through untouched.
 */
const SB_OBJECT = '/storage/v1/object/public/';
export function sbImage(url: string | null | undefined, width: number): string | null {
  if (!url) return null;
  if (!url.includes(SB_OBJECT)) return url;
  const base = url.replace(SB_OBJECT, '/storage/v1/render/image/public/').split('?')[0];
  return `${base}?width=${width}&quality=75`;
}
export function sbSrcset(url: string | null | undefined, widths: number[]): string | undefined {
  if (!url || !url.includes(SB_OBJECT)) return undefined;
  return widths.map((w) => `${sbImage(url, w)} ${w}w`).join(', ');
}

export const heroImage = (p: BlogPost) =>
  p.images?.main?.url ?? p.hero_image_url ?? null;
export const heroAlt = (p: BlogPost) =>
  p.images?.main?.alt ?? p.hero_image_alt ?? p.title;
export const thumbImage = (p: BlogPost) =>
  p.images?.thumb?.url ?? p.thumb_image_url ?? null;
export const thumbAlt = (p: BlogPost) =>
  p.images?.thumb?.alt ?? p.thumb_image_alt ?? p.title;

export function postDate(post: BlogPost): Date {
  return new Date(post.published_at ?? post.created_at);
}

export function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

/** Description used for <meta name="description"> and the social cards.
 *  Newlines are collapsed — a few stored summaries contain hard line breaks,
 *  and a meta attribute must be a single line to match what is indexed. */
export function postDescription(post: BlogPost): string {
  return (post.meta_description ?? post.summary ?? '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Up to `n` posts related to `post`, preferring a shared category. */
export function relatedPosts(
  post: BlogPost,
  all: BlogPost[],
  n = 3,
): BlogPost[] {
  const others = all.filter((p) => p.slug !== post.slug);
  const scored = others
    .map((p) => ({
      p,
      shared: p.categories.filter((c) => post.categories.includes(c)).length,
    }))
    .sort((a, b) => b.shared - a.shared);
  return scored.slice(0, n).map((s) => s.p);
}
