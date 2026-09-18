// /api/health — the `status` link in /.well-known/api-catalog (RFC 9727). It
// only says the site's function runtime is up; the quote endpoint is a Supabase
// function with its own availability.
export default async () =>
  new Response(JSON.stringify({ status: 'ok', service: 'labscubed.com', time: new Date().toISOString() }), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*' },
  });
