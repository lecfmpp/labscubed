/* Index audit — is every page in the sitemap actually in Google?
 *
 *   GOOGLE_SERVICE_ACCOUNT_FILE=sa.json node scripts/index-audit.mjs [--indexnow]
 *
 * Reads the LIVE sitemap, runs each URL through the Search Console URL
 * Inspection API (sc-domain:labscubed.com) and prints coverage state, the
 * canonical Google chose and the last crawl. Writes the full result to
 * index-audit.json. With --indexnow it also submits every sitemap URL to
 * IndexNow (one-off catch-up; later deploys are handled by
 * netlify/functions/deploy-succeeded.mjs).
 *
 * The service account (Supabase vault GOOGLE_SERVICE_ACCOUNT,
 * claude-labscubed-google-ads@…) must be a user on the Search Console property,
 * or every call returns 403. The API allows ~2,000 inspections a day, and there
 * is no API to "Request indexing" — pages that come back "Discovered/Crawled –
 * currently not indexed" need that button in the GSC UI. Uses only Node
 * built-ins. */
import { readFileSync, writeFileSync } from 'node:fs';
import { createSign } from 'node:crypto';

const SITE = 'https://labscubed.com';
const PROPERTY = 'sc-domain:labscubed.com';
const INDEXNOW_KEY = '26a1e497ebee437f9e70afe2431719a1';

const saPath = process.env.GOOGLE_SERVICE_ACCOUNT_FILE;
if (!saPath) { console.error('Set GOOGLE_SERVICE_ACCOUNT_FILE to the service-account JSON.'); process.exit(1); }
const sa = JSON.parse(readFileSync(saPath, 'utf8'));

const b64url = (x) => Buffer.from(typeof x === 'string' ? x : JSON.stringify(x)).toString('base64url');
async function accessToken() {
  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${b64url({ alg: 'RS256', typ: 'JWT' })}.${b64url({
    iss: sa.client_email, scope: 'https://www.googleapis.com/auth/webmasters.readonly',
    aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600,
  })}`;
  const sig = createSign('RSA-SHA256').update(unsigned).sign(sa.private_key, 'base64url');
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${unsigned}.${sig}` }),
  });
  const j = await r.json();
  if (!j.access_token) throw new Error(`token: ${JSON.stringify(j)}`);
  return j.access_token;
}

async function sitemapUrls() {
  const idx = await (await fetch(`${SITE}/sitemap-index.xml`)).text();
  const maps = [...idx.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const urls = [];
  for (const m of maps) urls.push(...[...(await (await fetch(m)).text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((x) => x[1]));
  return urls;
}

const urls = await sitemapUrls();
const token = await accessToken();
const results = [];
for (const url of urls) {
  const r = await fetch('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ inspectionUrl: url, siteUrl: PROPERTY }),
  });
  const j = await r.json();
  if (!r.ok) { results.push({ url, error: `${r.status} ${j.error?.message || ''}` }); if (r.status === 403) break; continue; }
  const s = j.inspectionResult?.indexStatusResult || {};
  results.push({
    url, verdict: s.verdict, coverage: s.coverageState, googleCanonical: s.googleCanonical,
    canonicalMismatch: !!(s.googleCanonical && s.googleCanonical.replace(/\/$/, '') !== url.replace(/\/$/, '')),
    lastCrawl: s.lastCrawlTime, robots: s.robotsTxtState, fetch: s.pageFetchState,
  });
}

writeFileSync('index-audit.json', JSON.stringify(results, null, 2));
const pad = (s, n) => String(s ?? '').slice(0, n).padEnd(n);
for (const r of results) {
  console.log(`${pad(r.url.replace(SITE, ''), 70)} ${pad(r.error || r.coverage, 42)} ${pad(r.lastCrawl?.slice(0, 10), 10)}${r.canonicalMismatch ? '  ⚠ Google canonical: ' + r.googleCanonical : ''}`);
}
const indexed = results.filter((r) => r.verdict === 'PASS').length;
console.log(`\n${indexed}/${urls.length} indexed · full result in index-audit.json`);

if (process.argv.includes('--indexnow')) {
  const r = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: 'labscubed.com', key: INDEXNOW_KEY, keyLocation: `${SITE}/${INDEXNOW_KEY}.txt`, urlList: urls }),
  });
  console.log(`IndexNow: ${r.status} for ${urls.length} URLs`);
}
