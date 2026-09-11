// Takes a question or comment from a replay session and sends it to the team.
//
// Stored in Supabase first, emailed second: a mail failure must never lose a
// question. Nothing here is shown to other viewers.

import { json, readJson, rpc, TOKEN_RE } from '../lib/shared.mjs';
import { sendEmail } from '../lib/resend.mjs';
import { WEBINARS } from '../../src/components/webinarConfig.js';

// Where questions land. Defaults to the address the webinar emails already use
// as their reply-to; override with WEBINAR_QUESTIONS_TO in Netlify.
const TEAM_INBOX = process.env.WEBINAR_QUESTIONS_TO || 'info@labscubed.com';

export default async (request) => {
  if (request.method !== 'POST') return json(405, { error: 'Method not allowed' });

  const data = await readJson(request);
  const token = String(data?.token || '');
  const body = String(data?.body || '').trim();
  if (!TOKEN_RE.test(token)) return json(400, { error: 'Missing or malformed access link' });
  if (!body) return json(400, { error: 'Write a question or comment first' });
  if (body.length > 2000) return json(400, { error: 'Keep it under 2,000 characters' });

  let q;
  try {
    q = await rpc('record_webinar_question', { p_token: token, p_body: body });
  } catch (error) {
    const msg = String(error);
    if (msg.includes('invalid token')) return json(404, { error: 'This access link is not valid' });
    if (msg.includes('question limit')) return json(429, { error: "You've reached the question limit for this session" });
    console.error('Question save failed:', msg);
    return json(502, { error: "We couldn't send that. Please try again." });
  }

  let notified = false;
  const key = process.env.RESEND_API_KEY;
  if (key) {
    const title = WEBINARS[q.webinar_slug]?.title || q.webinar_slug;
    const when = new Date(q.session_start).toLocaleString('en-US', {
      timeZone: 'America/New_York',
      dateStyle: 'medium',
      timeStyle: 'short',
    });
    try {
      await sendEmail(key, {
        from: 'LabsCubed Webinars <news@labscubed.com>',
        to: [TEAM_INBOX],
        reply_to: q.email,
        subject: `Webinar question — ${title}`,
        text: [
          `${q.name || 'A viewer'} <${q.email}> sent this from the "${title}" session of ${when} ET:`,
          '',
          body,
          '',
          'Reply to this email to answer them directly.',
        ].join('\n'),
      });
      notified = true;
    } catch (error) {
      console.error('Question email failed:', String(error));
    }
  }

  return json(200, { success: true, notified });
};
