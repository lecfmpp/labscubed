# LabsCubed Homepage — Astro + React islands

A faithful re-platforming of the LabsCubed marketing homepage as a fast,
SEO/AEO-ready **static** site, built with **Astro** and **React islands** and
ready to deploy on **Netlify** at `lp.labscubed.com`.

The page reproduces the design handoff reference 1:1 — same sections, order,
copy, layout, colours, type, spacing, animations and interactive behaviour.

## Stack

- **Astro 5** (static output) — pre-renders every section to HTML, ships JS only
  for the interactive islands.
- **React 18** islands for the interactive pieces.
- Design tokens (`--lc-*` CSS variables) from the handoff, imported globally.

## Local development

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # outputs to dist/
npm run preview    # serve the built dist/
```

Node 20+ recommended (Netlify pinned to 20 via `netlify.toml`).

## Project structure

```
src/
  site.mjs                  SITE_URL — single source of truth for the origin
  layouts/Base.astro        <head>, SEO meta, Open Graph, JSON-LD, global CSS
  pages/index.astro         page assembly (exact section order)
  styles/
    styles.css              global entry (imports tokens + runtime keyframes/hover classes)
    tokens/                  LabsCubed design tokens (fonts, colors, typography, spacing, base)
  lib/
    samples.tsx             specimen data + SVG geometry engine (ported verbatim)
    ui.tsx                  React primitives (Button, Badge, Section, useIsMobile, ARROW)
    faq.ts                  13 FAQ Q&As (shared by the accordion + JSON-LD)
    jsonld.ts               Organization / Product / FAQPage structured data
  components/               static .astro sections (zero JS)
    Section.astro Button.astro Hero.astro Trust.astro Setup.astro
    Industries.astro Anatomy.astro Measurement.astro CTABanner.astro FAQ.astro Footer.astro
  islands/                  React islands (hydrated)
    Nav.tsx                 client:load  — mobile hamburger drawer
    ProductHighlight.tsx    client:visible — tray toggle, TypeCycle, specimen library
    ConfiguratorFlow.tsx    client:visible — Configurator + CubeTenShowcase + SpecsBand (shared state)
    DataAccess.tsx          client:visible — auto-advancing dashboard slider
    VideoCarousel.tsx       client:visible — YouTube carousel (oEmbed titles)
public/                     all image assets (assets/img/…, uploads/…), robots.txt
```

### Islands vs static

Static `.astro` sections ship **zero JavaScript**; their responsive behaviour
(the reference's `useIsMobile` branch) is reproduced with CSS media queries at
the **760px** breakpoint. Interactive sections are React islands, hydrated with
`client:load` (Nav) or `client:visible` (everything below the fold). Every
section is still server-rendered to HTML at build time, so `view-source` shows
the full page copy for crawlers and AI answer engines.

The **ConfiguratorFlow** island intentionally wraps three sections (Configurator
+ CubeTenShowcase + SpecsBand) because they share state: the selected specimens
and daily volume drive `recommendMachine()`, which sets the showcase machine and
the spec sheet. `recommendMachine` logic is ported verbatim (CubeGo if volume
"Under 20"; CubeOne if all-rubber; else CubeTen).

## SEO / AEO layer

- `<title>`, meta description, canonical, Open Graph + Twitter card in `Base.astro`.
- JSON-LD (`src/lib/jsonld.ts`): **Organization**, **Product** ×2 (CubeTen,
  CubeOne), **FAQPage** (built from the same 13 Q&As the visible FAQ renders).
- `@astrojs/sitemap` → `sitemap-index.xml`; `public/robots.txt` allows all
  crawlers including GPTBot / ClaudeBot / PerplexityBot / Google-Extended.
- Hero image is eager + `fetchpriority="high"`; everything below the fold is lazy.

## Forms

The white-paper CTA form is a **stub** — submit is a no-op (`preventDefault`).
The owner already runs Resend + Supabase functions and will wire them later.
See the `TODO` in `src/components/CTABanner.astro` (`/api/send-brochure`).

## Deploy (Netlify)

`netlify.toml` is included:

```toml
[build]
  command = "npm run build"
  publish = "dist"
[build.environment]
  NODE_VERSION = "20"
```

1. Push this repo to GitHub (see below).
2. In Netlify: **Add new site → Import from Git**, pick the repo. Build command
   and publish dir are read from `netlify.toml`.
3. **Domain settings → Add custom domain** → `lp.labscubed.com` (CNAME to the
   Netlify site).

### Promoting to the apex domain later

`SITE_URL` in `src/site.mjs` is the single origin constant — it drives the
canonical link, OG/Twitter URLs, and the sitemap. To make this the primary
homepage, change that one line to `https://labscubed.com`, rebuild, point the
apex/`www` DNS at the site, and add a 301 from `lp.` → apex.

## Known follow-ups / things to verify against the live site

- **Organization `sameAs`** (LinkedIn / YouTube URLs in `src/lib/jsonld.ts`) are
  best-guesses — confirm the exact profile URLs before production.
- Form backend (`/api/send-brochure`) is not implemented (by design).
- QA the built site against the current live homepage (https://labscubed.com);
  if anything conflicts, the live site wins.
