// Helpers shared by the webinar replay functions. Lives outside
// netlify/functions so Netlify does not deploy it as a function of its own.

export const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

// Session access tokens are 64 lowercase hex characters (see the
// webinar_replay_registrations default in Supabase).
export const TOKEN_RE = /^[a-f0-9]{64}$/;

// Calls a Supabase RPC. The RPCs are security-definer and granted to anon, so
// the publishable key is enough; the service key is preferred when present.
export async function rpc(name, args) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL/KEY not set');

  const res = await fetch(`${url}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Supabase ${name} ${res.status}: ${text}`);
  return text ? JSON.parse(text) : null;
}
