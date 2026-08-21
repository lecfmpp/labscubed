// Single source of truth for the webinar's details. Shared by the countdown
// bar (WebinarTopBar) and the registration page (RegistrationApp) so the date
// on screen and the date the countdown runs to can never drift apart.
export const CONFIG = {
  title: "Automating ASTM D638 & ISO 527 Tensile Testing",
  dateLabel: "Thursday, October 20, 2026",
  timeLabel: "2:00 PM EST · 60 minutes",
  targetISO: "2026-10-20T18:00:00Z",
  seatsTotal: 200,
  seatsLeft: 87,
  speakerName: "Khaled Boqaileh",
  speakerTitle: "CEO and Founder, LabsCubed",
  speakerInitials: "KB",
  speakerPhoto: "/assets/img/team/khaled-boqaileh.webp",
  // Trailing slash on purpose — without it Netlify answers a 301 first.
  thankYouUrl: "/webinar/thank-you/",
  submitEndpoint: "/api/webinar/register",
};

export const COLORS = {
  teal: "#17ddc5",
  tealDeep: "#0d9488",
  ink: "#1d1d1f",
  muted: "#86868b",
  gray100: "#f5f5f7",
  line: "rgba(0,0,0,0.1)",
};
