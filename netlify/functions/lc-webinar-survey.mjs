// LC Webinar client survey endpoint (/survey/lc-webinar/).
//
// Existing clients and contacts tell us where they stand on AI, so the LC
// Webinar series is built around what matters to them. Supabase is the record
// (public.lc_webinar_survey via the record_lc_webinar_survey RPC). The team
// gets one email per submission and a post in #surveys, and respondents who
// leave an email join the survey's Resend segment (see lib/surveys.mjs).
// There is no email to the respondent.
//
// The page posts twice: once when the questions are answered (the answers
// count even if the person closes the tab on the last screen), then again with
// the follow-up choice. Both posts share a client_id, so the second updates
// the same row instead of adding one.

import { json, readJson, rpc } from '../lib/shared.mjs';
import { postToSurveysChannel, addSurveyRespondent } from '../lib/surveys.mjs';

const FROM = 'LabsCubed <news@labscubed.com>';
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const arr = (v) => (Array.isArray(v) ? v.map((x) => String(x).slice(0, 200)).slice(0, 12) : []);
const str = (v, n = 500) => String(v ?? '').trim().slice(0, n);

export default async (request) => {
  if (request.method !== 'POST') return json(405, { error: 'Method not allowed' });
  const data = await readJson(request);
  if (!data) return json(400, { error: 'Invalid JSON body' });

  const clientId = str(data.client_id, 80);
  if (!/^[a-z0-9-]{8,80}$/i.test(clientId)) return json(400, { error: 'Missing client_id' });
  const email = str(data.email, 200).toLowerCase();
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json(400, { error: 'Invalid email' });

  const a = data.answers || {};
  const payload = {
    client_id: clientId,
    name: str(data.name, 200),
    email,
    company: str(data.company, 200),
    source: str(data.source, 100),
    role: str(a.role, 60),
    role_other: str(a.role_other, 200),
    ai_stage: str(a.ai_stage, 60),
    ai_help: arr(a.ai_help),
    ai_help_other: str(a.ai_help_other, 200),
    concerns: arr(a.concerns),
    comfort: arr(a.comfort),
    topics: arr(a.topics),
    wish: str(a.wish, 2000),
    followup: str(data.followup, 40),
  };

  // Alert once, on the final post (the one that carries the follow-up choice).
  let alerted = false;
  const key = process.env.RESEND_API_KEY;
  if (key && payload.followup) {
    try {
      const L = data.labels || {};
      const rows = [
        ['Name', payload.name || '—'], ['Email', payload.email || '—'], ['Company', payload.company || '—'],
        ['Role', L.role || payload.role], ['AI today', L.ai_stage || payload.ai_stage],
        ['AI could help with', (L.ai_help || payload.ai_help).join(', ')], ['Concerns', (L.concerns || payload.concerns).join(', ')],
        ['Would make them comfortable', (L.comfort || payload.comfort).join(', ')], ['Webinar topics', (L.topics || payload.topics).join(', ')],
        ['Task for AI', payload.wish || '—'], ['Follow-up', L.followup || payload.followup],
      ];
      const html =
        `<p><strong>New LabsCubed Webinar survey response</strong></p><table cellpadding="6" style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px">` +
        rows.map(([k, v]) => `<tr><td style="color:#666;border-bottom:1px solid #eee">${esc(k)}</td><td style="border-bottom:1px solid #eee">${esc(v || '—')}</td></tr>`).join('') +
        `</table>`;
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', 'Idempotency-Key': `lc-survey-${clientId}` },
        body: JSON.stringify({
          from: FROM,
          to: [process.env.LC_SURVEY_ALERT_TO || 'info@labscubed.com'],
          ...(payload.email ? { reply_to: payload.email } : {}),
          subject: `LabsCubed Webinar survey — ${payload.name || payload.email || 'anonymous'}${payload.followup === 'chat' ? ' (open to a chat)' : ''}`,
          html,
          text: rows.map(([k, v]) => `${k}: ${v || '—'}`).join('\n'),
        }),
      });
      alerted = res.ok;
      if (!res.ok) console.error('Survey alert failed:', res.status, await res.text());
    } catch (error) {
      console.error('Survey alert failed:', error);
    }
  }

  // #surveys post + Resend segment, once, on the final post.
  if (payload.followup) {
    const L = data.labels || {};
    const list = (v) => (Array.isArray(v) ? v.join(', ') : v);
    await Promise.all([
      postToSurveysChannel({
        title: 'New survey response: AI in Materials Testing',
        who: [payload.name || 'Anonymous', payload.company, L.role || payload.role_other || payload.role].filter(Boolean).join(' · '),
        rows: [
          ['Email', payload.email],
          ['AI today', L.ai_stage || payload.ai_stage],
          ['AI could help with', list(L.ai_help || payload.ai_help)],
          ['Concerns', list(L.concerns || payload.concerns)],
          ['Would make them comfortable', list(L.comfort || payload.comfort)],
          ['Webinar topics wanted', list(L.topics || payload.topics)],
          ['Task for AI', payload.wish],
          ['Follow-up', L.followup || payload.followup],
        ],
      }),
      addSurveyRespondent('lc-webinar', payload),
    ]);
  }

  try {
    await rpc('record_lc_webinar_survey', { payload: { ...payload, team_alerted: alerted } });
  } catch (error) {
    console.error('Survey write failed:', error, JSON.stringify(payload));
    if (!alerted) return json(502, { error: 'Could not record the survey' });
  }
  return json(200, { success: true });
};
