// Webinar registration endpoint.
//
// This is a plain Netlify Function rather than an Astro API route on purpose:
// the site is built `output: 'static'`, and public/_redirects proxies every
// non-file path to the Webflow site. A function keeps the Astro build
// untouched, and the /api/webinar/register rule in _redirects (which sits
// ABOVE the catch-all) is what stops the POST being handed to Webflow.
//
// A registration goes to two places:
//   1. Resend  — a per-webinar segment, for sending.
//   2. Supabase — public.webinar_registrations, tagged with the webinar slug,
//                 as the durable record.
//
// Supabase is written LAST and always, including when Resend failed, so the
// registration survives a marketing-tool outage and the failure is visible in
// the row rather than only in the logs. Neither sync can cost us a signup: the
// visitor gets a 200 as long as their input was valid.

const REQUIRED = ['name', 'email', 'company', 'website', 'role', 'industry', 'volume', 'location'];

// Per-webinar routing. The client posts webinar_slug; this map decides which
// Resend segment the registrant joins. Adding a webinar means creating a Resend
// segment and adding one line here — the Supabase tagging follows from the slug
// automatically.
//
// An unknown slug is rejected rather than defaulted, so a typo cannot quietly
// file registrants under the wrong webinar.
const WEBINARS = {
  'spe-2026': { segmentId: 'd7b053f5-67b3-4747-807e-1e8db27c45a1' },
  'automation-ai-2026': { segmentId: 'ca2a167f-e3c6-483b-90f0-8590d69ad2a1' },
};

const DEFAULT_SLUG = 'spe-2026';

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

  const slug = data.webinar_slug || DEFAULT_SLUG;
  const webinar = WEBINARS[slug];
  if (!webinar) {
    console.error('Unknown webinar slug:', slug);
    return json(400, { error: `Unknown webinar: ${slug}` });
  }

  console.log('Webinar registration:', {
    email: data.email,
    company: data.company,
    webinar: slug,
  });

  let resendSynced = false;
  let syncError = null;

  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    try {
      await addToResend(data, resendKey, webinar.segmentId);
      resendSynced = true;
    } catch (error) {
      syncError = String(error);
      console.error('Resend sync failed:', syncError);
    }
  } else {
    // Name-only diagnostic (never values), so a misconfigured Netlify variable
    // is visible in the stored row instead of needing another deploy to find.
    const visible = Object.keys(process.env)
      .filter((k) => /RESEND|SUPABASE|WEBINAR/i.test(k))
      .sort()
      .join(',');
    syncError = `RESEND_API_KEY not set (visible: ${visible || 'none'})`;
    console.log(syncError);
  }

  let stored = false;
  try {
    stored = await recordInSupabase(data, slug, resendSynced, syncError);
  } catch (error) {
    // Both destinations are down. Log the whole payload as the last resort so
    // the registration can be replayed by hand rather than lost.
    console.error('Supabase write failed:', error, JSON.stringify(data));
  }

  return json(200, { success: true, synced: resendSynced, stored });
};

async function addToResend(data, apiKey, segmentId) {
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
    `https://api.resend.com/contacts/${encodeURIComponent(data.email)}/segments/${segmentId}`,
    { method: 'POST', headers },
  );

  if (!segment.ok) {
    throw new Error(`Resend segment ${segment.status}: ${await segment.text()}`);
  }

  return contact.json();
}

async function recordInSupabase(data, slug, resendSynced, syncError) {
  const url = process.env.SUPABASE_URL;
  // The RPC is granted to anon, so the publishable key is enough; the service
  // key is preferred when present.
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

  if (!url || !key) {
    console.log('SUPABASE_URL/KEY not set — skipping Supabase');
    return false;
  }

  // Writes go through a security-definer RPC rather than the table, so the
  // table itself stays closed to anon and the only exposed surface is a single
  // upsert of one row.
  const response = await fetch(`${url}/rest/v1/rpc/record_webinar_registration`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      payload: {
        webinar_slug: slug,
        webinar_title: data.webinar || null,
        name: data.name,
        email: data.email,
        company: data.company,
        website: data.website,
        role: data.role,
        industry: data.industry,
        materials: data.materials || '',
        test_volume: data.volume,
        location: data.location,
        resend_synced: resendSynced,
        sync_error: syncError,
        submitted_at: data.timestamp || new Date().toISOString(),
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Supabase ${response.status}: ${await response.text()}`);
  }

  return true;
}
