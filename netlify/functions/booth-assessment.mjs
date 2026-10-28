// Booth lab-assessment endpoint — the iPad questionnaire at the stand.
//
// A visitor answers seven questions about their lab and leaves their details.
// Same shape as booth-capture.mjs (the tablet there collects brochure
// requests), and the same rule: Supabase is written last and always, and a
// failure anywhere else is reported but never costs us the lead — at a booth
// the person is already walking away.
//
//   * the contact is upserted into Resend and added to the show's assessment
//     segment, which is what the "Thank you for completing your lab assessment"
//     broadcast is sent to;
//   * the whole submission is recorded in webinar_registrations (source
//     'booth-assessment', answers in `raw`) through the existing
//     record_webinar_registration RPC — no new table;
//   * the visitor is emailed the "Thank you for completing your lab assessment"
//     message straight away. Its content is read live from the Resend broadcast
//     the team edits (THANKYOU_BROADCAST_ID below), so changing that draft in
//     Resend changes what the booth visitors receive — no redeploy. It goes out
//     as a transactional send, not as the broadcast, so it must never also be
//     sent to the segment (that would thank everyone twice);
//   * the team gets one summary email per submission, so a hot lab (high daily
//     volume, a competitor machine) is seen the same day, not at the next
//     database export.
//
// The page retries a failed POST from an offline queue, so this handler is
// idempotent: a repeat submission for the same email updates the same row.

const EVENTS = {
  'ami-nov-2026': {
    segmentId: '69434a7d-510a-445a-a9a6-1f69cdf51b73',
    // Its own registry key, so the assessment never overwrites the same
    // person's booth-capture row (which is keyed on slug + email).
    recordSlug: 'ami-nov-2026-assessment',
    title: 'AMI Plastics World Expos North America 2026 — Lab Assessment',
  },
};

// The Resend broadcast whose subject/html/text is the visitor's thank-you email.
const THANKYOU_BROADCAST_ID = process.env.ASSESSMENT_THANKYOU_BROADCAST_ID || 'a4644207-e743-46c2-8246-713b4e83e422';
const FROM = 'LabsCubed <news@labscubed.com>';

const LABELS = {
  industry: { plastics: 'Plastics', rubber: 'Rubber', both: 'Plastics and rubber', other: 'Other' },
  volume: { lt20: 'Under 20', '20-50': '20–50', '51-100': '51–100', gt100: 'More than 100', varies: 'It varies', unsure: "I'm not sure" },
};

const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const list = (arr, other) => {
  const items = (Array.isArray(arr) ? arr : []).map(String);
  const out = items.filter((x) => x !== 'other');
  if (items.includes('other')) out.push(`Other: ${other || '—'}`);
  return out.length ? out.join(', ') : '—';
};

export default async (request) => {
  if (request.method !== 'POST') return json(405, { error: 'Method not allowed' });

  let data;
  try {
    data = await request.json();
  } catch {
    return json(400, { error: 'Invalid JSON body' });
  }

  const slug = String(data.event_slug ?? '');
  const event = EVENTS[slug];
  if (!event) return json(400, { error: `Unknown event: ${slug}` });

  const c = data.contact || {};
  const answers = data.answers || {};
  const name = String(c.name ?? '').trim();
  const email = String(c.email ?? '').trim().toLowerCase();
  const website = String(c.website ?? '').trim();
  const phone = String(c.phone ?? '').trim();
  const country = String(c.country ?? '').trim();
  if (!name) return json(400, { error: 'Missing name' });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json(400, { error: 'Invalid email' });
  if (!country) return json(400, { error: 'Missing country' });
  if (!answers.industry) return json(400, { error: 'Missing answers' });

  const industry = LABELS.industry[answers.industry] || String(answers.industry);
  const volume = LABELS.volume[answers.volume] || String(answers.volume || '');
  const tests = list(answers.tests, answers.tests_other);
  const machines = list(answers.machines, answers.machines_other);
  const priorities = list(answers.priorities, answers.priorities_other);
  const standards = list(answers.standards, answers.standards_other);

  // --- Resend: contact + segment ---------------------------------------------
  let resendSynced = false;
  let syncError = null;
  const resendKey = process.env.RESEND_API_KEY;
  const headers = resendKey ? { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' } : null;
  if (headers) {
    try {
      const [firstName, ...rest] = name.split(/\s+/);
      const contact = await fetch('https://api.resend.com/contacts', {
        method: 'POST',
        headers,
        body: JSON.stringify({ email, first_name: firstName, last_name: rest.join(' '), unsubscribed: false }),
      });
      if (!contact.ok) throw new Error(`Resend contact ${contact.status}: ${await contact.text()}`);
      // Segment membership is a separate call — `segments` on the upsert does not attach it.
      const segment = await fetch(
        `https://api.resend.com/contacts/${encodeURIComponent(email)}/segments/${event.segmentId}`,
        { method: 'POST', headers },
      );
      if (!segment.ok) throw new Error(`Resend segment ${segment.status}: ${await segment.text()}`);
      resendSynced = true;
    } catch (error) {
      syncError = String(error);
      console.error('Assessment Resend sync failed:', error);
    }
  } else {
    syncError = 'RESEND_API_KEY not set';
  }

  // --- Thank-you email to the visitor ---------------------------------------
  // Broadcast placeholders do not exist in a transactional send, so they are
  // filled here: the first name, and an unsubscribe that works by reply.
  let emailed = false;
  if (headers) {
    try {
      const firstName = name.split(/\s+/)[0];
      const fill = (t) =>
        String(t || '')
          .replace(/\{\{\{FIRST_NAME\|([^}]*)\}\}\}/g, (_m, fallback) => esc(firstName) || fallback)
          .replace(/\{\{\{FIRST_NAME\}\}\}/g, esc(firstName))
          .replace(/\{\{\{RESEND_UNSUBSCRIBE_URL\}\}\}/g, 'mailto:info@labscubed.com?subject=Unsubscribe');
      let subject = 'Thank You for Completing Your Lab Assessment!';
      let html = '';
      let text = '';
      try {
        const res = await fetch(`https://api.resend.com/broadcasts/${THANKYOU_BROADCAST_ID}`, { headers });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const b = await res.json();
        subject = b.subject || subject;
        html = fill(b.html);
        text = fill(b.text);
      } catch (error) {
        console.error('Thank-you template unavailable, sending the plain fallback:', error);
      }
      if (!html) {
        text = `Hi ${firstName || 'there'},\n\nThank you for completing the LabsCubed Lab Assessment! We’ll review your responses and get back to you soon with insights into your laboratory’s automation potential, opportunities for improvement, and how our solutions could help you achieve your goals.\n\nWant to get started sooner? Book a time with our team: https://calendar.google.com/calendar/appointments/schedules/AcZssZ3euIx4Mb9AXBsNaY8vTFD57jHKEK4d-KBw4OGjkYSAI7lWVJXEiSqrT7e1mPCI4fkDWzE_U-p2\n\nBest regards,\nThe LabsCubed Team\n\nLabsCubed Inc · Ontario, Canada · info@labscubed.com`;
        html = `<p style="font-family:Arial,sans-serif;font-size:16px;line-height:1.6">${esc(text).replace(/\n/g, '<br>')}</p>`;
      }
      // The tablet retries a failed POST, so the same submission can arrive more
      // than once; Resend drops a repeated Idempotency-Key for 24 hours.
      const mail = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { ...headers, 'Idempotency-Key': `assessment-thankyou-${data.client_id || email}` },
        body: JSON.stringify({ from: FROM, to: [email], reply_to: 'info@labscubed.com', subject, html, text }),
      });
      emailed = mail.ok;
      if (!mail.ok) console.error('Thank-you email failed:', mail.status, await mail.text());
    } catch (error) {
      console.error('Thank-you email failed:', error);
    }
  }

  // --- Internal alert --------------------------------------------------------
  let alerted = false;
  if (headers) {
    try {
      const to = process.env.BOOTH_ASSESSMENT_TO || 'info@labscubed.com';
      const rows = [
        ['Name', name], ['Email', email], ['Website', website], ['Phone', phone || '—'], ['Country', country],
        ['Industry', industry], ['Tests', tests], ['Machines', machines], ['Specimens / day', volume],
        ['Main priority', priorities], ['Standards', standards],
      ];
      const html =
        `<p><strong>New lab assessment from the AMI booth</strong></p>` +
        `<table cellpadding="6" style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px">` +
        rows.map(([k, v]) => `<tr><td style="color:#666;border-bottom:1px solid #eee">${esc(k)}</td><td style="border-bottom:1px solid #eee">${esc(v)}</td></tr>`).join('') +
        `</table>`;
      const text = rows.map(([k, v]) => `${k}: ${v}`).join('\n');
      const mail = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          from: FROM,
          to: [to],
          reply_to: email,
          subject: `AMI assessment — ${name}${website ? ` (${website.replace(/^https?:\/\//, '')})` : ''}`,
          html,
          text,
        }),
      });
      alerted = mail.ok;
      if (!mail.ok) console.error('Assessment alert failed:', mail.status, await mail.text());
    } catch (error) {
      console.error('Assessment alert failed:', error);
    }
  }

  // --- Durable record --------------------------------------------------------
  let stored = false;
  try {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
    if (!url || !key) throw new Error('SUPABASE_URL/KEY not set');

    const response = await fetch(`${url}/rest/v1/rpc/record_webinar_registration`, {
      method: 'POST',
      headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        payload: {
          webinar_slug: event.recordSlug,
          kind: 'tradeshow',
          webinar_title: event.title,
          source: 'booth-assessment',
          name,
          email,
          website,
          phone,
          location: country,
          industry,
          materials: tests,
          test_volume: volume,
          assessment: { ...answers, client_id: data.client_id ?? null },
          resend_synced: resendSynced,
          sync_error: syncError,
          team_alerted: alerted,
          thankyou_sent: emailed,
          page: data.page || null,
          submitted_at: data.submitted_at || new Date().toISOString(),
        },
      }),
    });
    if (!response.ok) throw new Error(`Supabase ${response.status}: ${await response.text()}`);
    stored = true;
  } catch (error) {
    // Both stores down is the one case the page cannot recover from by itself,
    // so the whole submission goes to the logs to be replayed by hand.
    console.error('Assessment write failed:', error, JSON.stringify({ name, email, website, country, answers }));
  }

  // A 5xx makes the tablet keep the submission in its offline queue and retry,
  // which is what we want when nothing at all was recorded.
  if (!stored && !resendSynced && !alerted) return json(502, { error: 'Could not record the assessment' });
  return json(200, { success: true, stored, synced: resendSynced, emailed, alerted });
};
