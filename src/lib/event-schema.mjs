/* schema.org Event markup for the webinar / tradeshow funnel pages, built from
   the same registry entry the page renders, so the structured data can never
   disagree with the visible date, place or title. Pass the result to <Base
   jsonLd> alongside the site-wide blocks (a jsonLd prop REPLACES those, it
   does not add to them). */
const ORIGIN = 'https://labscubed.com';

export function eventSchema(w) {
  const isShow = w.kind === 'tradeshow';
  const base = isShow ? 'events' : 'webinar';
  const url = `${ORIGIN}/${base}/${w.slug}`;
  const image = [w.heroImageUrl, w.thumbnailUrl].filter(Boolean).map((p) => (p.startsWith('http') ? p : ORIGIN + p));
  const organizer = { '@type': 'Organization', name: 'LabsCubed', url: ORIGIN };
  const event = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: w.title,
    description: w.postWebinar?.heroCopy || w.pastEvent?.heroCopy || w.heroCopy,
    url,
    startDate: w.startUTC,
    endDate: w.endUTC,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: isShow
      ? 'https://schema.org/OfflineEventAttendanceMode'
      : 'https://schema.org/OnlineEventAttendanceMode',
    location: isShow
      ? { '@type': 'Place', name: w.eventLabel || w.title, address: w.locationLabel }
      : { '@type': 'VirtualLocation', url },
    organizer,
  };
  if (image.length) event.image = image;
  if (!isShow && w.speakerName) {
    event.performer = { '@type': 'Person', name: w.speakerName, jobTitle: w.speakerTitle, worksFor: organizer };
  }
  // Webinars are free; a past one has nothing left to sign up for.
  if (!isShow && !w.postWebinar) {
    event.isAccessibleForFree = true;
    event.offers = { '@type': 'Offer', price: 0, priceCurrency: 'USD', url, availability: 'https://schema.org/InStock', validFrom: '2026-08-01' };
  }
  return event;
}
