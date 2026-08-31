// Single source of truth for the webinar. Everything that mentions the date —
// the countdown, the on-page labels, the Google/Outlook deeplinks and the .ics
// — derives from startUTC/endUTC below, so rescheduling means editing one pair
// of timestamps.
//
// On the date of this event the US Eastern zone is on DST (UTC-4); DST does not
// end until Nov 1, 2026. 11:00 local Eastern is therefore 15:00 UTC. The visible
// label says "EST" because that is how the audience reads it, but the machine
// times below are the true local-11am instants.
const startUTC = "2026-10-20T15:00:00Z";
const endUTC = "2026-10-20T16:00:00Z";

// Path slug. The funnel lives at /webinar/<slug>/ so the URL states both that
// it is a webinar and which one — reused for every future webinar.
const slug = "spe-2026";

const title = "Automating ASTM D638 & ISO 527 Tensile Testing";

// Google and Outlook want different shapes for the same instant.
const compact = (iso) => iso.replace(/[-:]/g, "").replace(/\.\d{3}/, "");

export const CONFIG = {
  slug,
  title,
  dateLabel: "Tuesday, October 20, 2026",
  timeLabel: "11:00 AM EST · 60 minutes",
  targetISO: startUTC,
  startUTC,
  endUTC,
  seatsTotal: 200,
  seatsLeft: 87,
  speakerName: "Khaled Boqaileh",
  speakerTitle: "CEO and Founder, LabsCubed",
  speakerInitials: "KB",
  speakerPhoto: "/assets/img/team/khaled-boqaileh.webp",
  // Trailing slashes on purpose — without them Netlify answers a 301 first.
  registrationUrl: `/webinar/${slug}/`,
  thankYouUrl: `/webinar/${slug}/thank-you/`,
  submitEndpoint: "/api/webinar/register",
  calendarLinks: {
    google: `https://calendar.google.com/calendar/u/0/r/eventedit?text=${encodeURIComponent(title)}&dates=${compact(startUTC)}/${compact(endUTC)}`,
    outlook: `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(title)}&startdt=${startUTC}&enddt=${endUTC}`,
    apple: `/ics/webinar-${slug}.ics`,
  },
  exploreCtaLabel: "Explore CubeTen",
  exploreCtaHref: "/products",
};

export const COLORS = {
  teal: "#17ddc5",
  tealDeep: "#0d9488",
  ink: "#1d1d1f",
  muted: "#86868b",
  gray100: "#f5f5f7",
  line: "rgba(0,0,0,0.1)",
};
