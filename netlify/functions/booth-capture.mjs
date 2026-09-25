// Booth capture endpoint — the tablet on the show floor.
//
// Someone standing at the stand gives us three things (name, work email,
// company) and ticks which material they want. Everything after that reuses
// machinery that already exists rather than inventing a parallel path:
//
//   * each ticked asset goes through the `download-request` edge function, the
//     same one the website's brochure and white-paper forms post to, so the PDF
//     is emailed, the contact is tagged into that asset's "Downloaded - …"
//     Resend segment, and the lead is logged in webform_leads exactly as today.
//   * the person is added to the show's own Resend segment, so booth leads can
//     be mailed as part of the event follow-up.
//   * the lead is recorded in webinar_registrations with source 'booth', which
//     is what separates a hand-shake at the stand from a web signup.
//
// Supabase is written last and always. A failure in Resend or in the asset
// send-out is reported back but never costs us the lead — at a booth the person
// is already walking away, so there is no second chance to collect it.

const DOWNLOAD_ENDPOINT =
  'https://grozewxrymeiruhggcdy.supabase.co/functions/v1/download-request';

// Only these three, and the key must match the edge function's own asset ids.
const ASSETS = {
  whitepaper: 'White paper — Beyond the Bottleneck',
  'cubeten-brochure': 'CubeTen brochure',
  'cubeone-brochure': 'CubeOne brochure',
};

// Which show this page belongs to, and which Resend segment its leads join.
const EVENTS = {
  'gps-sep-2026': {
    segmentId: '316f18d8-86ba-459f-817a-67cd921e4e2d',
    title: 'Get Hands-On With CubeOne at the Global Polymer Summit',
  },
  'ami-nov-2026': {
    segmentId: '2328d784-cde6-4473-b394-bb9b2ed27088',
    title: 'AMI Compounding World Expo 2026',
  },
  'npe-may-2027': {
    segmentId: 'db1f36b0-627e-4db7-98d5-92bc8367c853',
    title: 'NPE 2027',
  },
};

const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

export default async (request) => {
  if (request.method !== 'POST') return json(405, { error: 'Method not allowed' });

  let data;
  try {
    data = await request.json();
  } catch {
    return json(400, { error: 'Invalid JSON body' });
  }

  const name = String(data.name ?? '').trim();
  const company = String(data.company ?? '').trim();
  const email = String(data.email ?? '').trim().toLowerCase();
  if (!name) return json(400, { error: 'Missing name' });
  if (!company) return json(400, { error: 'Missing company' });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json(400, { error: 'Invalid email' });

  const slug = String(data.event_slug ?? '');
  const event = EVENTS[slug];
  if (!event) return json(400, { error: `Unknown event: ${slug}` });

  const assets = Array.isArray(data.assets)
    ? [...new Set(data.assets.map(String))].filter((a) => a in ASSETS)
    : [];
  if (!assets.length) return json(400, { error: 'Pick at least one thing to send' });

  const source = String(data.source || `/events/${slug}/booth/`);

  // --- Send each asset -------------------------------------------------------
  // One at a time and in order, so the visitor's inbox gets them in the order
  // they ticked rather than whatever finishes first. `origin: 'astro-site'` is
  // set only once: it triggers the internal "new lead" email, and the team wants
  // one alert per person, not one per PDF.
  const sent = [];
  const failed = [];
  for (const [index, asset] of assets.entries()) {
    try {
      const response = await fetch(DOWNLOAD_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name,
          company,
          asset,
          source,
          landing_page: source,
          referrer: '',
          ...(index === 0 ? { origin: 'astro-site' } : {}),
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (response.ok && body.success) {
        sent.push(asset);
      } else {
        // 422 is the edge function refusing a free-mail address. Worth telling
        // the booth staff about while the visitor is still standing there.
        failed.push({ asset, status: response.status, reason: body.error || `HTTP ${response.status}` });
      }
    } catch (error) {
      failed.push({ asset, status: 0, reason: String(error) });
    }
  }

  // --- Show segment ----------------------------------------------------------
  let resendSynced = false;
  let syncError = failed.length ? `assets failed: ${failed.map((f) => f.asset).join(', ')}` : null;
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    try {
      const headers = { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' };
      const [firstName, ...rest] = name.split(/\s+/);
      // Upsert first: the contact may not exist if every asset send failed.
      const contact = await fetch('https://api.resend.com/contacts', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          email,
          first_name: firstName,
          last_name: rest.join(' '),
          unsubscribed: false,
          properties: { company_name: company },
        }),
      });
      if (!contact.ok) throw new Error(`Resend contact ${contact.status}: ${await contact.text()}`);

      // Segment membership is a separate call — passing `segments` on the upsert
      // above does not attach them.
      const segment = await fetch(
        `https://api.resend.com/contacts/${encodeURIComponent(email)}/segments/${event.segmentId}`,
        { method: 'POST', headers },
      );
      if (!segment.ok) throw new Error(`Resend segment ${segment.status}: ${await segment.text()}`);
      resendSynced = true;
    } catch (error) {
      syncError = [syncError, String(error)].filter(Boolean).join(' | ');
      console.error('Booth Resend sync failed:', error);
    }
  } else {
    syncError = [syncError, 'RESEND_API_KEY not set'].filter(Boolean).join(' | ');
  }

  // --- Durable record --------------------------------------------------------
  let stored = false;
  try {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
    if (!url || !key) throw new Error('SUPABASE_URL/KEY not set');

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
          kind: 'tradeshow',
          webinar_title: event.title,
          source: 'booth',
          name,
          email,
          company,
          assets_requested: assets,
          assets_sent: sent,
          assets_failed: failed,
          resend_synced: resendSynced,
          sync_error: syncError,
          submitted_at: new Date().toISOString(),
        },
      }),
    });
    if (!response.ok) throw new Error(`Supabase ${response.status}: ${await response.text()}`);
    stored = true;
  } catch (error) {
    // The booth is the one place the visitor cannot be asked again, so the whole
    // capture goes to the logs to be replayed by hand if both stores are down.
    console.error('Booth capture write failed:', error, JSON.stringify({ name, email, company, assets }));
  }

  return json(200, {
    success: true,
    stored,
    synced: resendSynced,
    sent,
    failed,
    // Lets the tablet tell the visitor the truth: a personal address cannot be
    // sent gated PDFs, and the staff can offer to take a work one instead.
    workEmailRequired: failed.some((f) => f.status === 422),
  });
};
