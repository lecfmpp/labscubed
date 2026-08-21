import type { APIRoute } from 'astro';

interface WebinarRegistration {
  name: string;
  email: string;
  company: string;
  website: string;
  role: string;
  industry: string;
  materials: string;
  volume: string;
  location: string;
  webinar: string;
  timestamp: string;
}

const HUBSPOT_API_KEY = process.env.HUBSPOT_API_KEY;

export const POST: APIRoute = async ({ request }) => {
  try {
    const data: WebinarRegistration = await request.json();
    const required = ['name', 'email', 'company', 'website', 'role', 'industry', 'materials', 'volume', 'location'];
    for (const field of required) {
      if (!data[field as keyof WebinarRegistration]) {
        return new Response(
          JSON.stringify({ error: `Missing required field: ${field}` }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Log registration for debugging
    console.log('Webinar registration received:', { email: data.email, name: data.name, company: data.company });

    // Try to sync to HubSpot if API key is configured
    if (HUBSPOT_API_KEY) {
      try {
        const contactResponse = await createOrUpdateContact(data);
        if (contactResponse.ok) {
          console.log('HubSpot sync successful for', data.email);
        } else {
          console.warn('HubSpot sync failed for', data.email, '- proceeding anyway for testing');
        }
      } catch (hsError) {
        console.warn('HubSpot error (proceeding for testing):', hsError);
      }
    } else {
      console.log('HUBSPOT_API_KEY not configured - skipping sync (testing mode)');
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Registration successful' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Webinar registration error:', error);
    return new Response(
      JSON.stringify({ error: 'Registration failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

async function createOrUpdateContact(data: WebinarRegistration): Promise<Response> {
  const searchResponse = await fetch(
    `https://api.hubapi.com/crm/v3/objects/contacts/search`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HUBSPOT_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filterGroups: [{ filters: [{ propertyName: 'email', operator: 'EQ', value: data.email }] }],
        limit: 1
      })
    }
  );

  if (searchResponse.ok) {
    const searchData = await searchResponse.json();
    if (searchData.results?.length > 0) {
      return fetch(
        `https://api.hubapi.com/crm/v3/objects/contacts/${searchData.results[0].id}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${HUBSPOT_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            properties: [
              { name: 'firstname', value: data.name.split(' ')[0] },
              { name: 'lastname', value: data.name.split(' ').slice(1).join(' ') || '' },
              { name: 'email', value: data.email },
              { name: 'company', value: data.company },
              { name: 'website', value: data.website },
              { name: 'jobtitle', value: data.role },
              { name: 'industry', value: data.industry },
            ]
          })
        }
      );
    }
  }

  return fetch(`https://api.hubapi.com/crm/v3/objects/contacts`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${HUBSPOT_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: [
        { name: 'firstname', value: data.name.split(' ')[0] },
        { name: 'lastname', value: data.name.split(' ').slice(1).join(' ') || '' },
        { name: 'email', value: data.email },
        { name: 'company', value: data.company },
        { name: 'website', value: data.website },
        { name: 'jobtitle', value: data.role },
        { name: 'industry', value: data.industry },
      ]
    })
  });
}
