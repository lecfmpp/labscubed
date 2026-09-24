// "Call me instead" endpoint.
//
// The confirmation page offers two ways to land a demo slot: pick a time on the
// booking calendar, or leave a phone number and let the team arrange it. This
// handles the second. It runs AFTER a registration, so the lead already exists —
// this only attaches the phone number and marks the row as wanting a call.
//
// Same shape as webinar-register: Supabase is the durable record and is written
// last and always, Resend is best-effort, and neither failure is allowed to cost
// the visitor their request.

const SLUGS = new Set([
  'spe-oct-2026',
  'automation-ai-nov-2026',
  'gps-sep-2026',
  'ami-nov-2026',
  'npe-may-2027',
]);

const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

// Deliberately loose: numbers arrive with spaces, dashes and brackets from every
// locale, and a strict pattern rejects real people. Everything that is not a
// digit or a leading + is stripped, then the digit count is what decides.
function cleanPhone(raw) {
  const trimmed = String(raw ?? '').trim();
  if (!trimmed) return null;
  const plus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 15) return null;
  return `${plus ? '+' : ''}${digits}`;
}

export default async (request) => {
  if (request.method !== 'POST') return json(405, { error: 'Method not allowed' });

  let data;
  try {
    data = await request.json();
  } catch {
    return json(400, { error: 'Invalid JSON body' });
  }

  const email = String(data.email ?? '').trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json(400, { error: 'Invalid email' });

  const slug = String(data.webinar_slug ?? '');
  if (!SLUGS.has(slug)) return json(400, { error: `Unknown webinar: ${slug}` });

  const phone = cleanPhone(data.phone);
  if (!phone) return json(400, { error: 'Invalid phone number' });

  let resendSynced = false;
  let syncError = null;
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    try {
      // phone_number, not phone: that property already exists on the audience.
      // An unknown property key makes Resend reject the whole contact with 422.
      const response = await fetch('https://api.resend.com/contacts', {
        method: 'POST',
        headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, properties: { phone_number: phone } }),
      });
      if (!response.ok) throw new Error(`Resend contact ${response.status}: ${await response.text()}`);
      resendSynced = true;
    } catch (error) {
      syncError = String(error);
      console.error('Resend phone sync failed:', syncError);
    }
  }

  let stored = false;
  try {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
    if (!url || !key) throw new Error('SUPABASE_URL/KEY not set');

    const response = await fetch(`${url}/rest/v1/rpc/record_webinar_callback`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        payload: {
          webinar_slug: slug,
          kind: data.kind || 'webinar',
          webinar_title: data.webinar || null,
          name: data.name || '',
          email,
          phone,
          country: data.country || null,
          resend_synced: resendSynced,
          sync_error: syncError,
          requested_at: new Date().toISOString(),
        },
      }),
    });
    if (!response.ok) throw new Error(`Supabase ${response.status}: ${await response.text()}`);
    stored = true;
  } catch (error) {
    // Last resort: the number is in the logs so the callback can be honoured by
    // hand rather than silently lost.
    console.error('Callback write failed:', error, JSON.stringify({ email, phone, slug }));
    return json(502, { error: 'Could not save your number' });
  }

  return json(200, { success: true, stored, synced: resendSynced });
};
