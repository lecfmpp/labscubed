/* Post-build: the machine-readable copies of the site, generated from dist/.
 *
 *   dist/<page>.md              Markdown of every indexable page. The edge
 *                               function netlify/edge-functions/markdown.ts
 *                               serves it for `Accept: text/markdown`.
 *   dist/llms.txt               llmstxt.org index of the site.
 *   dist/llms-full.txt          every page's Markdown in one file.
 *   dist/search-index.json      title/description/url per page, for the
 *                               WebMCP `search_blog` tool (components/WebMcp.astro).
 *   dist/.well-known/agent-skills/index.json
 *                               Agent Skills Discovery v0.2.0 index. The sha256
 *                               digests are computed here from the SKILL.md files
 *                               in public/, so they can never drift from them.
 *
 * Runs after `astro build` (package.json "build"). Pages carrying
 * `<meta name="robots" content="noindex…">` (404, replay sessions, draft posts)
 * are skipped everywhere. */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';

const DIST = new URL('../dist/', import.meta.url).pathname;
const SITE = 'https://labscubed.com';

const td = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced', bulletListMarker: '-' });
td.use(gfm);
// Visual-only duplicates (e.g. the second copy of a looping marquee) are
// aria-hidden; screen readers skip them, and so should the Markdown.
td.remove((node) => node.getAttribute && node.getAttribute('aria-hidden') === 'true');
td.remove(['script', 'style', 'noscript', 'template', 'svg', 'iframe', 'video', 'audio', 'form', 'button', 'input', 'select', 'textarea', 'canvas']);
// Decorative images without alt text only add noise.
td.addRule('img', {
  filter: 'img',
  replacement: (_c, node) => {
    const alt = (node.getAttribute('alt') || '').trim();
    const src = node.getAttribute('src') || '';
    if (!alt || !src) return '';
    return `![${alt}](${src.startsWith('/') ? SITE + src : src})`;
  },
});
// Absolute links, so the Markdown is useful outside the site.
td.addRule('link', {
  filter: (node) => node.nodeName === 'A' && node.getAttribute('href'),
  replacement: (content, node) => {
    const text = content.trim();
    if (!text) return '';
    let href = node.getAttribute('href');
    if (href.startsWith('#')) return text;
    if (href.startsWith('/')) href = SITE + href;
    return `[${text}](${href})`;
  },
});

const walk = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith('.html') ? [p] : [];
  });

const decode = (s) =>
  s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'");
const pick = (html, re) => decode((html.match(re) || [])[1] || '').trim();

const pages = [];
for (const file of walk(DIST)) {
  const rel = relative(DIST, file);
  const html = readFileSync(file, 'utf8');
  if (/<meta[^>]+name="robots"[^>]+noindex/i.test(html)) continue;

  const title = pick(html, /<title>([\s\S]*?)<\/title>/i);
  const description = pick(html, /<meta[^>]+name="description"[^>]+content="([^"]*)"/i);
  const canonical = pick(html, /<link[^>]+rel="canonical"[^>]+href="([^"]*)"/i);
  const main = (html.match(/<main[\s\S]*?<\/main>/i) || [html.replace(/[\s\S]*<body[^>]*>|<\/body>[\s\S]*/gi, '')])[0];

  // Adjacent inline elements are separated visually by CSS, not by a space in
  // the markup ("Type I" + "ASTM D638" would read "Type IASTM D638").
  const spaced = main.replace(/<\/(span|strong|em|b|small|a)>\s*<(span|strong|em|b|small|a|div|p)\b/gi, '</$1> <$2');
  const body = td.turndown(spaced).replace(/\n{3,}/g, '\n\n').trim();
  // Pages build flat (astro.config format 'file'): about-us.html -> /about-us.
  const path = rel === 'index.html' ? '/' : '/' + rel.replace(/\.html$/, '');
  const url = canonical || SITE + path;
  const md = `---\ntitle: ${JSON.stringify(title)}\ndescription: ${JSON.stringify(description)}\nurl: ${url}\n---\n\n${body}\n`;
  writeFileSync(file.replace(/\.html$/, '.md'), md);

  pages.push({ path, url, title, description, md });
}
pages.sort((a, b) => a.path.localeCompare(b.path));

/* ---- llms.txt --------------------------------------------------------- */
const groups = [
  ['Products', (p) => /^\/(plastic|rubber)-testing$/.test(p.path)],
  ['Get a quote', (p) => p.path === '/get-a-quote'],
  ['Testing standards guides', (p) => p.path.startsWith('/resources/') || p.path.startsWith('/white-paper')],
  ['Blog', (p) => p.path.startsWith('/post/')],
  ['Webinars & events', (p) => /^\/(webinar|events)\/[^/]+$/.test(p.path)],
  ['Company', (p) => ['/about-us', '/privacy-policy', '/developers'].includes(p.path)],
];
const mdUrl = (p) => `${SITE}${p.path === '/' ? '/index' : p.path}.md`;
let llms = `# LabsCubed

> LabsCubed builds automated tensile testing machines for polymer and rubber labs: the CubeTen (plastics and adhesives, ASTM D638 / ISO 527, up to 10 kN, 15 specimens per run) and the CubeOne (rubber and elastomers, ASTM D412 / ISO 37 and ASTM D624 tear, up to 1 kN, 12 specimens per run). Both load, measure and test a full tray of specimens unattended.

Every page below is also available as Markdown: send \`Accept: text/markdown\` to its URL, or use the linked \`.md\` URL. The public API (quote requests, event registration) is described at ${SITE}/openapi.json and ${SITE}/developers.
`;
for (const [name, test] of groups) {
  const list = pages.filter(test);
  if (!list.length) continue;
  llms += `\n## ${name}\n\n`;
  for (const p of list) llms += `- [${p.title.replace(/\s*\|\s*LabsCubed$/, '')}](${mdUrl(p)})${p.description ? `: ${p.description}` : ''}\n`;
}
llms += `\n## Optional\n\n- [Home](${mdUrl(pages.find((p) => p.path === '/'))}): overview of both machines, specimens tested and FAQ\n- [Blog index](${SITE}/blog): all articles\n- [Full site as one file](${SITE}/llms-full.txt)\n`;
writeFileSync(join(DIST, 'llms.txt'), llms);
writeFileSync(join(DIST, 'llms-full.txt'), pages.map((p) => p.md).join('\n\n---\n\n'));

/* ---- IndexNow manifest ------------------------------------------------
 * url -> hash of the page's Markdown. netlify/functions/deploy-succeeded.mjs
 * compares it with the previous production deploy's copy and submits only
 * the pages whose content changed. */
writeFileSync(
  join(DIST, 'indexnow-manifest.json'),
  JSON.stringify(Object.fromEntries(pages.map((p) => [p.url, createHash('sha256').update(p.md).digest('hex').slice(0, 16)]))),
);

/* ---- search index for WebMCP ----------------------------------------- */
writeFileSync(
  join(DIST, 'search-index.json'),
  JSON.stringify(pages.map(({ url, path, title, description }) => ({ url, path, title, description }))),
);

/* ---- agent skills index ---------------------------------------------- */
const SKILLS_DIR = join(DIST, '.well-known/agent-skills');
const skills = existsSync(SKILLS_DIR)
  ? readdirSync(SKILLS_DIR)
      .filter((d) => existsSync(join(SKILLS_DIR, d, 'SKILL.md')))
      .map((name) => {
        const buf = readFileSync(join(SKILLS_DIR, name, 'SKILL.md'));
        const description = (buf.toString('utf8').match(/^description:\s*(.+)$/m) || [])[1] || '';
        return {
          name,
          type: 'skill-md',
          description: description.trim(),
          url: `${SITE}/.well-known/agent-skills/${name}/SKILL.md`,
          digest: 'sha256:' + createHash('sha256').update(buf).digest('hex'),
        };
      })
  : [];
writeFileSync(
  join(SKILLS_DIR, 'index.json'),
  JSON.stringify({ $schema: 'https://schemas.agentskills.io/discovery/0.2.0/schema.json', skills }, null, 2),
);

console.log(`[agent-files] ${pages.length} Markdown pages, llms.txt, llms-full.txt, search-index.json, ${skills.length} skills`);
