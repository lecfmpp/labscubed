// Webinar registration endpoint.
//
// This is a plain Netlify Function rather than an Astro API route on purpose:
// the site is built `output: 'static'`, and public/_redirects proxies every
// non-file path to the Webflow site. A function keeps the Astro build
// untouched, and the /api/webinar/register rule in _redirects (which sits
// ABOVE the catch-all) is what stops the POST being handed to Webflow.
//
// Registrants go to Resend, added to a per-webinar segment so each webinar has
// its own list. Sync is best-effort: until RESEND_API_KEY is set in the Netlify
// environment the registration is only logged, and the caller still gets a 200
// so the funnel works end to end. A Resend outage must never cost us a signup.

const REQUIRED = ['name', 'email', 'company', 'website', 'role', 'industry', 'volume', 'location'];

// Resend segment "Webinar: SPE 2026". One segment per webinar — a new webinar
// means a new segment id here, alongside the new slug in webinarConfig.js.
const SEGMENT_ID = process.env.RESEND_WEBINAR_SEGMENT_ID || 'd7b053f5-67b3-4747-807e-1e8db27c45a1';

const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export default async (request) => {
  if (request.method !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  let data;
  try {
    data = await request.json();
  } catch {
    return json(400, { error: 'Invalid JSON body' });
  }

  for (const field of REQUIRED) {
    if (!data[field]) {
      return json(400, { error: `Missing required field: ${field}` });
    }
  }

  console.log('Webinar registration:', {
    email: data.email,
    company: data.company,
    webinar: data.webinar,
  });

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log('RESEND_API_KEY not set — skipping list sync');
    return json(200, { success: true, synced: false });
  }

  try {
    await addToResend(data, apiKey);
    return json(200, { success: true, synced: true });
  } catch (error) {
    // Log the whole payload so a failed sync can be replayed by hand rather
    // than lost.
    console.error('Resend sync failed:', error, JSON.stringify(data));
    return json(200, { success: true, synced: false });
  }
};

async function addToResend(data, apiKey) {
  const [firstName, ...rest] = data.name.trim().split(/\s+/);
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };

  // POST /contacts upserts on email — a repeat registrant returns the same
  // contact id rather than erroring, so this is safe to call every time.
  const contact = await fetch('https://api.resend.com/contacts', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      email: data.email,
      first_name: firstName,
      last_name: rest.join(' '),
      unsubscribed: false,
      properties: {
        company_name: data.company,
        company_website: data.website,
        job_title: data.role,
        industry: data.industry,
        test_volume: data.volume,
        lab_location: data.location,
        // Optional on the form, so it can legitimately be empty.
        materials_tested: data.materials || '',
        added_to_list_on: new Date().toISOString().slice(0, 10),
      },
    }),
  });

  if (!contact.ok) {
    throw new Error(`Resend contact ${contact.status}: ${await contact.text()}`);
  }

  // Segment membership is a separate call: passing `segments` on the upsert
  // above does not attach them (verified against the live API).
  const segment = await fetch(
    `https://api.resend.com/contacts/${encodeURIComponent(data.email)}/segments/${SEGMENT_ID}`,
    { method: 'POST', headers },
  );

  if (!segment.ok) {
    throw new Error(`Resend segment ${segment.status}: ${await segment.text()}`);
  }

  return contact.json();
}
