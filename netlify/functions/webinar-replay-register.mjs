// Books a visitor onto one evergreen replay session of a webinar.
//
// Only works once the webinar is in the evergreen state — aired, replays
// enabled, recording id present — and only for a session the schedule actually
// offers. Returns the access token that unlocks the session page; without it
// there is nothing to watch.

import { json, readJson, rpc } from '../lib/shared.mjs';
import { addToSegment } from '../lib/resend.mjs';
import { WEBINAR_SEGMENTS } from '../lib/segments.mjs';
import { REPLAY_VIDEOS } from '../lib/replay-videos.mjs';
import { WEBINARS } from '../../src/components/webinarConfig.js';
import { nextSessions, replayState } from '../../src/components/evergreen.js';

const REQUIRED = ['name', 'email', 'company', 'role'];
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export default async (request) => {
  if (request.method !== 'POST') return json(405, { error: 'Method not allowed' });

  const data = await readJson(request);
  if (!data) return json(400, { error: 'Invalid JSON body' });

  for (const field of REQUIRED) {
    if (!String(data[field] ?? '').trim()) return json(400, { error: `Missing required field: ${field}` });
  }
  const email = String(data.email).trim();
  if (!EMAIL_RE.test(email)) return json(400, { error: 'Enter a valid work email' });

  const w = WEBINARS[data.webinar_slug];
  if (!w || w.kind === 'tradeshow') return json(400, { error: 'Unknown webinar' });

  const now = Date.now();
  if (replayState(w, now) !== 'evergreen' || !REPLAY_VIDEOS[w.slug]) {
    return json(409, { error: 'Sessions for this webinar are not open yet' });
  }

  // The requested start must be one the schedule offers. The look-back keeps a
  // booking valid if a session tipped past its cut-off while the visitor was
  // still filling in the form.
  const start = Date.parse(data.session_start);
  const offered = nextSessions(w.replay, now - 15 * 60000, 8);
  if (!offered.includes(start)) {
    return json(400, { error: 'That session is no longer available. Pick another time.' });
  }

  let resendSynced = false;
  let syncError = null;
  const key = process.env.RESEND_API_KEY;
  const segmentId = WEBINAR_SEGMENTS[w.slug];
  if (key && segmentId) {
    try {
      await addToSegment(
        key,
        {
          email,
          name: data.name,
          properties: {
            company_name: String(data.company).trim(),
            job_title: String(data.role).trim(),
            added_to_list_on: new Date(now).toISOString().slice(0, 10),
          },
        },
        segmentId,
      );
      resendSynced = true;
    } catch (error) {
      syncError = String(error);
      console.error('Resend sync failed:', syncError);
    }
  } else {
    syncError = key ? 'No Resend segment for this webinar' : 'RESEND_API_KEY not set';
  }

  // Unlike the live funnel, the database write is essential here: the token it
  // returns is the visitor's only way into the session.
  let booked;
  try {
    booked = await rpc('record_webinar_replay', {
      payload: {
        webinar_slug: w.slug,
        session_start: new Date(start).toISOString(),
        name: String(data.name).trim(),
        email,
        company: String(data.company).trim(),
        role: String(data.role).trim(),
        resend_synced: resendSynced,
        sync_error: syncError,
      },
    });
  } catch (error) {
    console.error('Replay booking failed:', String(error), JSON.stringify({ ...data, email }));
    return json(502, { error: "We couldn't save your seat. Please try again." });
  }

  return json(200, {
    success: true,
    token: booked.token,
    sessionStart: booked.session_start,
    watchUrl: `/webinar/${w.slug}/session/?t=${booked.token}`,
  });
};
