// Resend calls used by the webinar replay functions.

const headersFor = (apiKey) => ({
  Authorization: `Bearer ${apiKey}`,
  'Content-Type': 'application/json',
});

/* Upserts a contact and adds it to a segment. POST /contacts upserts on email;
   segment membership needs its own call — passing `segments` on the upsert
   does not attach them (verified against the live API). */
export async function addToSegment(apiKey, { email, name, properties }, segmentId) {
  const [firstName, ...rest] = String(name || '').trim().split(/\s+/);
  const headers = headersFor(apiKey);

  const contact = await fetch('https://api.resend.com/contacts', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      email,
      first_name: firstName || '',
      last_name: rest.join(' '),
      unsubscribed: false,
      properties,
    }),
  });
  if (!contact.ok) throw new Error(`Resend contact ${contact.status}: ${await contact.text()}`);

  const segment = await fetch(
    `https://api.resend.com/contacts/${encodeURIComponent(email)}/segments/${segmentId}`,
    { method: 'POST', headers },
  );
  if (!segment.ok) throw new Error(`Resend segment ${segment.status}: ${await segment.text()}`);
}

export async function sendEmail(apiKey, message) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: headersFor(apiKey),
    body: JSON.stringify(message),
  });
  if (!res.ok) throw new Error(`Resend email ${res.status}: ${await res.text()}`);
  return res.json();
}
