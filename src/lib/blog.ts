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
      'read_time_minutes,actual_word_count,published_at,created_at,updated_at',
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
  return cache;
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

/** Full body pipeline: drop the inline CSS copy, then unwrap. */
function prepareBody(html: string): string {
  return unwrapArticle(stripBoilerplateStyle(html)).trim();
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
export function extractSchemas(html: string): {
  schemas: unknown[];
  body: string;
} {
  const m = html.match(SCHEMA_DIV);
  if (!m) return { schemas: [], body: prepareBody(html) };

  let schemas: unknown[] = [];
  try {
    const parsed = JSON.parse(decodeEntities(m[2]));
    schemas = Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    // Malformed payload: drop the schema rather than emit invalid JSON-LD, but
    // still strip the div so the page is clean.
    schemas = [];
  }
  return { schemas, body: prepareBody(html.replace(SCHEMA_DIV, '')) };
}

/** Read time in whole minutes — stored value wins, else ~220 wpm. */
export function readTime(post: BlogPost): number {
  if (post.read_time_minutes) return post.read_time_minutes;
  const words =
    post.actual_word_count ??
    post.content.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

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
