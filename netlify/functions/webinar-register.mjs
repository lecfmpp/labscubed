// Webinar registration endpoint.
//
// This is a plain Netlify Function rather than an Astro API route on purpose:
// the site is built `output: 'static'`, and public/_redirects proxies every
// non-file path to the Webflow site. A function keeps the Astro build
// untouched, and the /api/webinar/register rule in _redirects (which sits
// ABOVE the catch-all) is what stops the POST being handed to Webflow.
//
// HubSpot sync is best-effort: until HUBSPOT_API_KEY is set in the Netlify
// environment the registration is only logged, and the caller still gets a
// 200 so the funnel works end to end.

const REQUIRED = ['name', 'email', 'company', 'website', 'role', 'industry', 'volume', 'location'];

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

  const apiKey = process.env.HUBSPOT_API_KEY;
  if (!apiKey) {
    console.log('HUBSPOT_API_KEY not set — skipping CRM sync');
    return json(200, { success: true, synced: false });
  }

  try {
    await syncToHubSpot(data, apiKey);
    return json(200, { success: true, synced: true });
  } catch (error) {
    // A CRM failure must not cost us the registration — log it and let the
    // visitor through to the thank-you page.
    console.error('HubSpot sync failed:', error);
    return json(200, { success: true, synced: false });
  }
};

async function syncToHubSpot(data, apiKey) {
  const properties = {
    firstname: data.name.split(' ')[0],
    lastname: data.name.split(' ').slice(1).join(' '),
    email: data.email,
    company: data.company,
    website: data.website,
    jobtitle: data.role,
    industry: data.industry,
  };

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };

  const search = await fetch('https://api.hubapi.com/crm/v3/objects/contacts/search', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      filterGroups: [{ filters: [{ propertyName: 'email', operator: 'EQ', value: data.email }] }],
      limit: 1,
    }),
  });

  const existingId = search.ok ? (await search.json()).results?.[0]?.id : null;

  const url = existingId
    ? `https://api.hubapi.com/crm/v3/objects/contacts/${existingId}`
    : 'https://api.hubapi.com/crm/v3/objects/contacts';

  const response = await fetch(url, {
    method: existingId ? 'PATCH' : 'POST',
    headers,
    body: JSON.stringify({ properties }),
  });

  if (!response.ok) {
    throw new Error(`HubSpot ${response.status}: ${await response.text()}`);
  }
}

export const config = { path: '/api/webinar/register' };
