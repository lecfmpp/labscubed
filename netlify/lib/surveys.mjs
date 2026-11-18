// Shared plumbing for every LabsCubed survey.
//
// House rule (Nov 2026): every survey we build
//   1. records each response in Supabase (its own table / RPC),
//   2. posts each response to the #surveys Slack channel, and
//   3. adds respondents who left an email to the survey's own Resend segment.
// New surveys: add a segment below and call notifySurvey() from the endpoint.

import { addToSegment } from './resend.mjs';

// Resend segment per survey slug.
export const SURVEY_SEGMENTS = {
  'lc-webinar': '846f0174-640d-4d46-880c-d6c310eb3656', // Survey: AI in Materials Testing 2026
};

const isInternal = (email) => /@labscubed\.com$/i.test(email || '');

/* Posts one response to #surveys via a Slack incoming webhook
   (env SLACK_SURVEYS_WEBHOOK_URL). Never throws. */
export async function postToSurveysChannel({ title, who, rows }) {
  const url = process.env.SLACK_SURVEYS_WEBHOOK_URL;
  if (!url) {
    console.warn('SLACK_SURVEYS_WEBHOOK_URL not set; skipping #surveys post');
    return false;
  }
  const lines = rows
    .filter(([, v]) => v && String(v).trim())
    .map(([k, v]) => `• *${k}:* ${String(v).slice(0, 500)}`);
  const text = [`:bar_chart: *${title}*`, `*${who}*`, ...lines].join('\n');
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) console.error('#surveys post failed:', res.status, await res.text());
    return res.ok;
  } catch (error) {
    console.error('#surveys post failed:', error);
    return false;
  }
}

/* Adds a respondent to the survey's Resend segment. Skips blanks and
   internal test addresses. Never throws. */
export async function addSurveyRespondent(slug, { email, name, company }) {
  const segmentId = SURVEY_SEGMENTS[slug];
  const key = process.env.RESEND_API_KEY;
  if (!segmentId || !key || !email || isInternal(email)) return false;
  try {
    await addToSegment(key, { email, name, properties: company ? { company_name: company } : undefined }, segmentId);
    return true;
  } catch (error) {
    console.error('Survey segment add failed:', error);
    return false;
  }
}
