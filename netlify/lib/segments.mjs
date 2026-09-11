// Resend segment per webinar, used for replay bookings.
//
// This mirrors the map inside netlify/functions/webinar-register.mjs. It is a
// copy rather than a shared import on purpose: live registration is a
// production path with real registrants, and it should not start depending on
// a new module just because replays were added. If a webinar's segment ever
// changes, change it in both places.
export const WEBINAR_SEGMENTS = {
  'spe-oct-2026': 'd7b053f5-67b3-4747-807e-1e8db27c45a1',
  'automation-ai-nov-2026': 'ca2a167f-e3c6-483b-90f0-8590d69ad2a1',
};
