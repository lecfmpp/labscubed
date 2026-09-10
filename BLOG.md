# LabsCubed Blog — Astro + Supabase

The blog that used to live in the Webflow CMS. Same URLs, same visual design,
same SEO signals — built from Supabase at deploy time instead of edited in a CMS.

## How it works

```
Supabase blog_posts  ──►  astro build (fetch at build time)  ──►  static HTML  ──►  Netlify
        ▲
        └── blog-creator automation writes the finished, designed HTML here
```

There is no CMS UI and no content in this repo. `blog_posts.content` holds the
finished `.lcb` article HTML that the `blog-creator` automation produces and the
marketing team reviews. The build reads it, wraps it in the page template, and
emits static pages. Nothing about the article markup is transformed.

### Routes

| Route | Source |
| --- | --- |
| `/post/<slug>` | one page per post — matches the Webflow CMS path exactly |
| `/blog`, `/blog/2` … | paginated index, 12 per page |
| `/blog/category/<slug>` | one indexable hub per public category |
| `/rss.xml` | published posts only |

### Draft previews — the thing Webflow could not do

Visibility is decided by the **deploy context**, not by a flag on the record:

| Context | Renders |
| --- | --- |
| `CONTEXT=production` | `status = published` only |
| deploy preview / branch / local dev | also `review` and `approved`, with a draft ribbon |

So a Netlify Deploy Preview *is* the editorial preview. Webflow refused to serve
`isDraft` items on the staging domain, which is why the Gate-2 preview link in
the Trello flow never worked.

## Publishing

Set the post's `status` to `published` in Supabase and trigger a build. No
Webflow item to create, no `designed-body-html` to re-send through an API.

```sql
update blog_posts set status = 'published', published_at = now()
where slug = 'my-post-slug';
```

Then hit the Netlify build hook. Content changes never require a code change.

## Environment

Both are required at build time — the build fails loudly without them rather
than deploying an empty blog.

| Variable | Where |
| --- | --- |
| `SUPABASE_URL` | Netlify → Site settings → Environment variables |
| `SUPABASE_KEY` | same (read access to `blog_posts` is enough) |

Locally, put them in `.env` (gitignored). See `.env.example`.

## Files

| File | Role |
| --- | --- |
| `src/lib/blog.ts` | fetch, filter, body preparation, read time, related posts |
| `src/lib/blog-schema.ts` | JSON-LD builders for posts without a stored payload |
| `src/layouts/BlogPost.astro` | hero, breadcrumb, category chips, date row |
| `src/pages/post/[slug].astro` | post route + related posts |
| `src/pages/blog/[...page].astro` | paginated index |
| `src/pages/blog/category/[category].astro` | category hubs |
| `src/styles/blog.css` | article typography + page chrome |
| `src/styles/blog-assets.css` | the `.lcb` element kit (~50 components) |

## Typography standard (locked)

The blog renders in **Inter Tight**, self-hosted, variable weight, two subsets —
not Inter, which the rest of this site uses. Every value below was measured off
a live Webflow post (`/post/universal-testing-machine-guide-plastics-rubber`)
and verified element-by-element against it.

| Element | Family | Size | Weight | Line-height | Letter-spacing | Colour |
| --- | --- | --- | --- | --- | --- | --- |
| `h1` (post hero) | Inter Tight | 47px | 600 | 1.208 | normal | `#fff` |
| `.lcb-article > h2` | Inter Tight | 28px | 700 | 1.2 | -0.02em | `#0f0f0f` |
| `.lcb-article > h3` | Inter Tight | 21px | 600 | 1.3 | -0.01em | `#000` |
| `.lcb-article > h4` | Inter Tight | 17px | 600 | 1.35 | — | `#000` |
| `.lcb-article > p` | Inter Tight | 16px | 400 | 1.6 | normal | `#000` |
| `> ul li`, `> ol li` | Inter Tight | 16px | 400 | 1.6 | normal | `#000` |
| inline `a` | Inter Tight | 16px | 600 | inherit | — | inherit |

Rules:

- **Scoped to the blog.** Inter Tight applies to `.lcb-article`, `.bp-hero`,
  `.bp-top`, `.bl-head`, `.bl-filters`, `.bl-list` and `.bp-related` only. The
  homepage stays on Inter; no blog-scoped class may be used outside the blog.
- **Direct-child selectors (`>`) are deliberate.** The kit elements in
  `blog-assets.css` style their own internals — a descendant selector would
  reach inside them and override the kit.
- **`h4` is the one unmeasured row.** No published post carries an `<h4>`, so
  those values come from the Webflow stylesheet's own declaration rather than a
  measurement. Re-measure once a post uses one.
- **Preload the right face.** Blog pages pass `preloadFont="inter-tight"` to
  `Base`; anything else preloads a font it never draws while discovering the one
  it needs late.
- **Do not change a value here without re-measuring a live post.** These numbers
  exist so a migrated article is indistinguishable from the one it replaces.

## Design parity notes

These are not arbitrary values — each was read off the computed styles of the
live Webflow template so the migrated pages read identically. Webflow's root
font size is **15.667px**, so its rem values land on odd pixels; they are
written here as plain px because this site's root is 16px and rem would
silently rescale them.

- Article column **752px** (`.max-width-large`, 48rem at 15.667px)
- H1 **47px / 600 / 1.208**, white, centred over the hero
- Hero: image behind `linear-gradient(181deg, #141519 8%, rgba(0,0,0,.3) 86%)`,
  ~466px tall at 1280px
- Category chip `#17DDC5` on `#04201D`, 11px/700, 1.1px tracking, uppercase
- `.lcb-article > *` typography copied verbatim from the Webflow `<style>` block

`blog-assets.css` was recovered from the stylesheet the live site loads
(`blog-assets-v2.css`) — the local copy of the kit had been missing from
`Projects/08_Blog_Post_Creator/blog-assets/` since July. It is now restored
there too.

### Deliberate improvements over Webflow

Everything indexable is byte-identical (verified against all 21 live posts:
title, meta description, canonical, og:image). Three things are better:

1. **JSON-LD is server-rendered.** Webflow shipped the schema as an inert
   `<div data-schemas>` and injected it with client-side JS after
   `DOMContentLoaded`. Crawlers that do not execute JS — most AI answer engines
   — never saw it. It is now in `<head>` at build time.
2. **`og:type` is `article`**, not Webflow's default `website`.
3. **The sitemap agrees with the canonicals.** Astro generates from `site` (the
   apex); blog entries are rewritten to the `www` origin without a trailing
   slash so each entry matches the page's own canonical exactly.

## Why blog canonicals use `www`

`SITE_URL` is the apex, but `BLOG_ORIGIN` in `src/site.mjs` is
`https://www.labscubed.com` because that is what all 21 published posts already
canonicalise to and what Google has indexed. Consolidating onto one host is a
deliberate project with redirects — not a side effect of this migration.
