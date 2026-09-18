/* deploy-succeeded — Netlify event function, runs after every successful deploy.
 *
 * On a PRODUCTION deploy it submits new or changed pages to IndexNow (Bing,
 * Yandex, Seznam, Naver…; Bing feeds ChatGPT search and Copilot). "Changed"
 * means the page's Markdown hash in /indexnow-manifest.json (written by
 * scripts/build-agent-files.mjs) differs from the one stored after the previous
 * production deploy, so an unchanged page is never resubmitted.
 *
 * The key is public by design and must match public/<key>.txt. Blog posts are
 * also submitted by the portal's blog-publish edge function; a duplicate
 * submission of a just-published post is harmless. */
import { getStore } from '@netlify/blobs';

const KEY = '26a1e497ebee437f9e70afe2431719a1';
const HOST = 'labscubed.com';
const ORIGIN = `https://${HOST}`;

export default async (request) => {
  let deploy = {};
  try { deploy = (await request.json()).payload || {}; } catch { /* no body */ }
  if (deploy.context && deploy.context !== 'production') {
    return new Response(`skipped: ${deploy.context} deploy`);
  }

  const res = await fetch(`${ORIGIN}/indexnow-manifest.json`, { headers: { 'cache-control': 'no-cache' } });
  if (!res.ok) return new Response(`manifest ${res.status}`, { status: 200 });
  const current = await res.json();

  const store = getStore('indexnow');
  const previous = (await store.get('manifest', { type: 'json' })) || {};
  const changed = Object.keys(current).filter((u) => previous[u] !== current[u]);

  let status = 'nothing to submit';
  if (changed.length) {
    const r = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `${ORIGIN}/${KEY}.txt`, urlList: changed.slice(0, 10000) }),
    });
    status = `IndexNow ${r.status}`;
    // Only remember the manifest once IndexNow accepted it, so a failed
    // submission is retried on the next deploy.
    if (r.status === 200 || r.status === 202) await store.setJSON('manifest', current);
  }
  console.log(`[indexnow] ${changed.length} changed of ${Object.keys(current).length}: ${status}`, changed.slice(0, 20));
  return new Response(`${status} (${changed.length} urls)`);
};
