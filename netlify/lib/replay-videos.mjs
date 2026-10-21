// YouTube id of each webinar's recording, by slug.
//
// Server-side on purpose: the session page only receives the id once the
// visitor's booked session has opened, so the recording never appears in the
// public JavaScript bundle or the page source. That is what makes the booking
// form a real gate rather than a decorative one.
//
// To switch a webinar to evergreen replays, BOTH are needed:
//   1. its recording id here (any YouTube id, e.g. "EA0jUa83Qjs"), and
//   2. `replay.enabled: true` in src/components/webinarConfig.js.
// Neither does anything before the live session has aired.
//
// A webinar with `postWebinar.gate` set uses this map differently: its replay
// page unlocks through /api/webinar/register, which returns the id here once
// the visitor has given their name and company email. No `replay.enabled`
// needed.
export const REPLAY_VIDEOS = {
  // The recording of the Oct 20, 2026 SPE webinar.
  'spe-oct-2026': 'q5mGNtZzDBU',
  'automation-ai-nov-2026': null,
};
