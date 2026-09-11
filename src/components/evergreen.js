// Evergreen replay scheduling. Shared by the browser (the booking modal, the
// hub) and the Netlify functions, so the session times a visitor is offered
// and the times the server will accept can never disagree.
//
// Session times are wall-clock times in US Eastern. The offset moves with DST,
// so every instant is resolved through the IANA zone, never a fixed -4 or -5.

const TZ = "America/New_York";

// A session page opens a minute early, and a booked session stays watchable
// for a week — long enough to catch up, short enough to keep "sessions" real.
export const SESSION_OPENS_EARLY_MS = 60 * 1000;
export const SESSION_WATCHABLE_FOR_MS = 7 * 24 * 60 * 60 * 1000;

let easternFormat;
function easternParts(ms) {
  easternFormat ||= new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  const p = {};
  for (const { type, value } of easternFormat.formatToParts(new Date(ms))) p[type] = value;
  return { y: +p.year, mo: +p.month, d: +p.day, h: +p.hour, mi: +p.minute };
}

/* Converts an Eastern wall-clock time to a UTC instant. Two passes settle the
   DST offset, including on the changeover days. */
export function easternToUtc(y, mo, d, h, mi) {
  const target = Date.UTC(y, mo - 1, d, h, mi);
  let guess = target;
  for (let i = 0; i < 2; i++) {
    const p = easternParts(guess);
    guess += target - Date.UTC(p.y, p.mo - 1, p.d, p.h, p.mi);
  }
  return guess;
}

/* The next `count` session start instants (ms) after `now`, from the weekly
   `replay.slots` schedule. Sessions starting within `leadMinutes` are skipped
   so nobody books one they cannot reach in time. */
export function nextSessions(replay, now = Date.now(), count = 4, leadMinutes = 10) {
  const slots = replay?.slots || [];
  if (!slots.length) return [];
  const today = easternParts(now);
  const found = [];
  for (let i = 0; i < 35 && found.length < count; i++) {
    // Noon UTC on an Eastern calendar date always lands on that same date.
    const day = new Date(Date.UTC(today.y, today.mo - 1, today.d + i, 12));
    for (const slot of slots) {
      if (slot.weekday !== day.getUTCDay()) continue;
      const [h, mi] = slot.time.split(":").map(Number);
      const start = easternToUtc(day.getUTCFullYear(), day.getUTCMonth() + 1, day.getUTCDate(), h, mi);
      if (start > now + leadMinutes * 60000) found.push(start);
    }
  }
  return found.sort((a, b) => a - b).slice(0, count);
}

/* Where a webinar's recording stands:
     live-only       — the live session has not aired yet
     recording-soon  — it has aired, but replays are not switched on
     evergreen       — aired, replays on: visitors can book a session
   The server additionally requires the recording id to exist before it will
   book or play anything. */
export function replayState(w, now = Date.now()) {
  if (Date.parse(w.endUTC) > now) return "live-only";
  return w.replay?.enabled ? "evergreen" : "recording-soon";
}
