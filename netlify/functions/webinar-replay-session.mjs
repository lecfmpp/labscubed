// Exchanges a session access token for what the session page may show.
//
// The recording id is only returned once the visitor's booked session has
// opened, so fetching this early — or reading the page source — reveals
// nothing to watch.

import { json, readJson, rpc, TOKEN_RE } from '../lib/shared.mjs';
import { REPLAY_VIDEOS } from '../lib/replay-videos.mjs';
import { WEBINARS } from '../../src/components/webinarConfig.js';
import { SESSION_OPENS_EARLY_MS, SESSION_WATCHABLE_FOR_MS } from '../../src/components/evergreen.js';

export default async (request) => {
  if (request.method !== 'POST') return json(405, { error: 'Method not allowed' });

  const data = await readJson(request);
  const token = String(data?.token || '');
  if (!TOKEN_RE.test(token)) return json(400, { error: 'Missing or malformed access link' });

  let row;
  try {
    row = await rpc('get_webinar_replay', { p_token: token });
  } catch (error) {
    console.error('Session lookup failed:', String(error));
    return json(502, { error: "We couldn't load your session. Please refresh." });
  }
  const w = row && WEBINARS[row.webinar_slug];
  if (!w) return json(404, { error: 'This access link is not valid' });

  const now = Date.now();
  const start = Date.parse(row.session_start);
  const duration = (w.replay?.durationMinutes || 50) * 60000;

  let status =
    now < start - SESSION_OPENS_EARLY_MS ? 'waiting'
    : now > start + SESSION_WATCHABLE_FOR_MS ? 'expired'
    : 'open';
  const videoId = status === 'open' ? REPLAY_VIDEOS[w.slug] || null : null;
  if (status === 'open' && !videoId) status = 'unavailable';

  return json(200, {
    slug: w.slug,
    title: w.title,
    speakerName: w.speakerName,
    sessionStart: new Date(start).toISOString(),
    sessionEnd: new Date(start + duration).toISOString(),
    status,
    videoId,
    viewer: String(row.name || '').trim().split(/\s+/)[0] || null,
    // Lets the page correct for a wrong clock on the visitor's machine.
    serverNow: new Date(now).toISOString(),
  });
};
