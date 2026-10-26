// Registry of every webinar funnel. One entry per webinar, keyed by slug.
//
// Slug convention: <topic>-<mon>-<year>, e.g. spe-oct-2026. Always carrying the
// month and year means the URL says which webinar AND when it ran, and a repeat
// of the same event next year gets its own URL instead of colliding.
//
// The slug is the single identifier that ties everything together: the URL
// (/webinar/<slug>), the Resend segment, the Supabase webinar_slug tag, and
// the .ics filename. Adding a webinar means adding an entry here, creating a
// Resend segment, adding two .astro pages that pass the slug, and dropping an
// .ics in public/ics/ — no component changes.
//
// Times are stored as UTC instants because the Eastern offset moves: October 20
// is still on DST (UTC-4) while November 18 is not (UTC-5). Both sessions start
// at 11:00 local Eastern, which is why their UTC times differ by an hour. The
// visible labels say EST because that is how the audience reads it.

const compact = (iso) => iso.replace(/[-:]/g, "").replace(/\.\d{3}/, "");

/* Accepts whatever a YouTube URL happens to look like — a watch link, a youtu.be
   share link, an /embed/ URL, a Shorts or live URL, a bare 11-character id, or a
   whole <iframe ...> embed snippet pasted in verbatim — and returns just the id.
   Returns null for anything it cannot read, which is what makes the video slots
   fall back to the placeholder. */
export function youTubeId(input) {
  if (!input) return null;
  const raw = String(input).trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(raw)) return raw;
  const match = raw.match(
    /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:embed\/|shorts\/|live\/|v\/|watch\?(?:[^"'\s]*&)?v=))([A-Za-z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

function build(w) {
  // Tradeshows live under /events/, webinars under /webinar/, so the URL says
  // what kind of thing it is before anything loads.
  const base = w.kind === "tradeshow" ? "events" : "webinar";
  return {
    kind: "webinar",
    ...w,
    targetISO: w.startUTC,
    // Trailing slashes on purpose — without them Netlify answers a 301 first.
    registrationUrl: `/${base}/${w.slug}`,
    thankYouUrl: `/${base}/${w.slug}/thank-you`,
    submitEndpoint: "/api/webinar/register",
    calendarLinks: {
      google: `https://calendar.google.com/calendar/u/0/r/eventedit?text=${encodeURIComponent(w.title)}&dates=${compact(w.startUTC)}/${compact(w.endUTC)}`,
      outlook: `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(w.title)}&startdt=${w.startUTC}&enddt=${w.endUTC}`,
      apple: `/ics/webinar-${w.slug}.ics`,
    },
  };
}

/* The tablet at a stand (/events/<slug>/booth/). Shared by every show so the
   three cannot drift apart; a show overrides only what is genuinely its own —
   its logo, and which film plays on the confirmation. A show with no `booth`
   block simply has no booth page.

   The asset ids must match the download-request edge function's own ids, and
   `defaultOn` is what arrives pre-ticked: the white paper, because it is what
   most people at a show ask for. */
const BOOTH_ASSETS = {
  whitepaper: {
    id: "whitepaper",
    name: "The white paper",
    line: "Beyond the Bottleneck — the data-backed business case for automating tensile testing.",
    defaultOn: true,
  },
  cubeten: {
    id: "cubeten-brochure",
    name: "CubeTen brochure",
    line: "Automated tensile testing for plastics and adhesives — ASTM D638 / ISO 527.",
  },
  cubeone: {
    id: "cubeone-brochure",
    name: "CubeOne brochure",
    line: "Automated tensile testing for rubber and elastomers — ASTM D412 / ISO 37.",
  },
};

// The CubeOne film. Every show whose stand carries CubeOne plays this on the
// confirmation; without it the page falls back to onDemandVideoUrl.
const CUBEONE_FILM = "https://www.youtube.com/embed/5nS3gFm5W-I";

const BOOTH = {
  heading: "Thanks for stopping by our booth.",
  lede: "If you'd like to see how we automate materials testing labs, fill this in and our team will get in touch. Tick anything you want sent over and it lands in your inbox before you leave the stand.",
  submitLabel: "Send it to me",
  videoUrl: CUBEONE_FILM,
  videoLabel: "CubeOne, the machine on our stand",
  assets: [BOOTH_ASSETS.whitepaper, BOOTH_ASSETS.cubeten, BOOTH_ASSETS.cubeone],
};

const KHALED = {
  speakerName: "Khaled Boqaileh",
  speakerTitle: "Co-founder & CEO, LabsCubed",
  speakerInitials: "KB",
  speakerPhoto: "/assets/img/team/khaled-boqaileh.webp",
  speakerBio:
    "Khaled Boqaileh is the co-founder and CEO of LabsCubed, a company founded seven years ago. His motivation to start the company came during his master's degree in material development, where he spent countless hours performing repetitive and tedious testing in the lab. Determined to eliminate redundant and error-prone work, Khaled built LabsCubed to provide innovative automation and software solutions that make advanced lab technology accessible to all.",
};

export const WEBINARS = {
  "spe-oct-2026": build({
    slug: "spe-oct-2026",
    title: "The Hidden Cost of Manual Plastics Testing",
    dateLabel: "Tuesday, October 20, 2026",
    timeLabel: "11:00 AM EST · 50 minutes, including Q&A",
    startUTC: "2026-10-20T15:00:00Z",
    endUTC: "2026-10-20T15:50:00Z",
    heroCopy:
      "Measuring, positioning, gripping and processing every specimen by hand quietly consumes technician time and opens the door to variability. See where those costs hide — and what an automation-first workflow actually changes.",
    seatsTotal: 200,
    seatsLeft: 87,
    ...KHALED,
    agenda: [
      ["01", "The hidden costs of manual testing", "How manual specimen measurement, positioning, gripping, testing and data processing consume technician time and introduce opportunities for variability."],
      ["02", "Where variability enters plastics tensile testing", "The factors that affect testing consistency, and the difference between accuracy, repeatability and reproducibility."],
      ["03", "What automation can actually change", "How an automation-first workflow standardises the key steps — specimen measurement, gripping, deformation measurement, testing and analysis — and the impact on technician time and reproducibility."],
      ["04", "From testing data to a smarter lab workflow", "Practical CubeTen examples, covering ASTM/ISO requirements, calibration, service and support, cybersecurity and data integration."],
    ],
    expectIntro:
      "You'll leave with a practical understanding of where the hidden costs and sources of variability sit in manual plastics tensile testing, and how automation addresses them.",
    expect: [
      "Real-world CubeTen plastics testing data",
      "The automated workflow, from specimen measurement through data analysis",
      "A short demonstration of CubeTen in operation",
      "Measurement reproducibility and technician-time savings",
      "ASTM/ISO testing, calibration, service, cybersecurity and data integration",
      "Guidance for evaluating whether automation makes sense for your lab",
    ],
    audienceIntro:
      "Plastics and polymer testing professionals who want more consistency, efficiency or throughput from their lab.",
    roles: [
      ["Testing technicians", "Materials and polymer testing"],
      ["R&D & materials engineers", "Developing and characterising materials"],
      ["QC / QA professionals", "Holding the line on consistency"],
      ["Lab managers & supervisors", "Throughput, cost and capacity"],
    ],
    alsoFor: [
      "Testing & characterisation professionals",
      "Technical & engineering managers",
      "Anyone evaluating automation for plastics testing",
    ],
    exploreCtaLabel: "Explore CubeTen",
    exploreCtaHref: "https://labscubed.com/plastic-testing",
    // SPE hosts the real registration and emails the join link, so our form
    // only captures the lead (name, email, company) and then sends the visitor
    // on. The details modal and the thank-you page are skipped. The matching
    // `leadOnly` flag in netlify/functions/webinar-register.mjs relaxes the
    // server-side required fields for this slug.
    externalRegistrationUrl: "https://www.4spe.org/spe-webinar-the-hidden-cost-of-manual-plastic-testing/",
    registerSubmitLabel: "Continue to SPE registration",
    registerNote:
      "This webinar is run with SPE. After this step you'll finish registering on SPE's site, where your link to join is sent to you.",
    // Co-branding. Set this and the registration + confirmation pages show the
    // partnership badge (PartnershipBadge.jsx); leave it out and they show
    // nothing. logoHeight is the drawn height in px, which the badge scales
    // down on a phone. logoWidth/logoNativeHeight are the file's own pixel
    // dimensions, used only to reserve the box before the image loads.
    partner: {
      name: "SPE",
      label: "Official Partnership Webinar",
      logoSrc: "/assets/img/partners/spe.webp",
      logoAlt: "SPE — Inspiring Plastics Professionals",
      logoHeight: 36,
      logoWidth: 231,
      logoNativeHeight: 73,
    },
    // Video slots. Paste a YouTube URL, a share link, or the whole <iframe>
    // embed snippet — anything youTubeId() can read. Leave null for the
    // placeholder.
    heroVideoUrl: "https://youtu.be/wuEurbhcKUw",
    // The confirmation page's own hero video. Falls back to heroVideoUrl when
    // null, so a webinar with a single video needs only the one field.
    thankYouVideoUrl: "https://youtu.be/agUsIcHPaoU",
    onDemandVideoUrl: "https://www.youtube.com/embed/EA0jUa83Qjs",
    // Evergreen replays. Dormant until the live session has aired AND
    // `enabled` is true. The recording's YouTube id is NOT kept here — it
    // lives server-side in netlify/lib/replay-videos.mjs so it never ships in
    // the public bundle.
    replay: {
      enabled: false,
      durationMinutes: 50,
      // Weekly session times, US Eastern (weekday: 0 = Sunday). The booking
      // modal offers the next four.
      slots: [
        { weekday: 2, time: "11:00" },
        { weekday: 3, time: "14:00" },
        { weekday: 4, time: "11:00" },
        { weekday: 5, time: "14:00" },
      ],
    },
    // Card artwork on the webinar hub, and the blurred backdrop behind the
    // replay gate. A webinar with none still gets a branded text tile on the
    // hub, never a black box.
    thumbnailUrl: "/assets/img/events/spe-replay-thumb-v3.webp",
    thumbnailAlt: "The Hidden Cost of Manual Plastics Testing — webinar replay with Khaled Boqaileh, in partnership with SPE",
    // Post-webinar mode. Once set, the same URL stops selling seats and
    // becomes the replay page: the hero plays `replayVideoUrl` (a YouTube URL,
    // share link or <iframe> snippet), the countdown bar and registration
    // form go, and the page ends in next steps instead. Delete the block to
    // go back to a registration page.
    postWebinar: {
      // The replay sits behind a short form (first name, last name, company
      // email). The video id is NOT kept here: the form's submit returns it
      // from the server, out of netlify/lib/replay-videos.mjs, so it is not in
      // the public bundle. Remove `gate` to publish the video openly instead
      // (then set `replayVideoUrl` to a YouTube URL).
      gate: true,
      badge: "Webinar replay",
      ctaLabel: "Watch the replay",
      heroCopy:
        "This session aired live with SPE on October 20, 2026. Watch the full recording to see where the hidden costs and variability sit in manual plastics tensile testing, and what an automation-first workflow changes. With real CubeTen plastics testing data.",
      agendaHeading: "What the session covered",
      expectHeading: "What's in the replay",
      expectIntro:
        "Press play and you'll get a practical understanding of where the hidden costs and sources of variability sit in manual plastics tensile testing, and how automation addresses them.",
      nextStepsHeading: "Keep going after the replay",
      nextSteps: [
        ["Explore CubeTen", "The automated tensile tester for plastics and adhesives shown in the session.", "/plastic-testing", "See CubeTen"],
        ["Talk to our team", "Tell us what you test and we'll tell you whether automation fits your lab.", "/get-a-quote", "Get a quote"],
        ["Read the white paper", "The data-backed business case for automating tensile testing.", "/white-paper-automation-vs-manual-testing", "Get the white paper"],
        ["More webinars", "Every session we run, with recordings as they become available.", "/webinar#recordings", "Browse webinars"],
      ],
    },
    // Cross-promoted on the registration page and the thank-you page.
    nextWebinarSlug: "automation-ai-nov-2026",
  }),

  "automation-ai-nov-2026": build({
    slug: "automation-ai-nov-2026",
    title: "Automation, AI and Industry 4.0 in the Testing Lab",
    dateLabel: "Wednesday, November 18, 2026",
    timeLabel: "11:00 AM EST · 50 minutes, including Q&A",
    startUTC: "2026-11-18T16:00:00Z",
    endUTC: "2026-11-18T16:50:00Z",
    heroCopy:
      "Making a lab \"smart\" isn't one purchase. It's automating the repetitive work, producing data clean enough to be worth analysing, and connecting the two. Here is what that actually takes.",
    seatsTotal: 200,
    seatsLeft: 200,
    ...KHALED,
    agenda: [
      ["01", "Who is LabsCubed", "Where automated tensile testing came from, and the problem it was built to remove."],
      ["02", "Automation", "Which tasks are worth automating — the repetitive, the bottlenecked and the error-prone — and which are not. Automated thickness and width, smart grips, camera vision, and testing up to 15 samples per tray."],
      ["03", "AI, and why clean data comes first", "Why AI became practical now, and what clean data means in a lab: organised, accurate, traceable and consistently formatted. Without it, there is nothing worth predicting from."],
      ["04", "Industry 4.0 applied", "Automation plus AI as connected systems, and a three-step path for a testing lab: increase automation, improve data collection, then implement AI."],
    ],
    expectIntro:
      "You'll leave able to judge which parts of your own lab are worth automating, what has to be true of your data before AI is useful, and what a realistic path to a connected lab looks like.",
    expect: [
      "A practical test for which tasks are worth automating",
      "What automation changes: up to 95% technician time saved and up to 40% more consistent data",
      "Accuracy, stress consistency and strain consistency compared side by side",
      "What clean data means in a testing lab, and why AI depends on it",
      "Centralised data, QR/barcode scanning and LIMS integration",
      "A three-step path to Industry 4.0 for a testing lab",
      "A first look at CubeFlex — flexure and tensile testing on one instrument",
    ],
    audienceIntro:
      "Lab and engineering leaders weighing up automation, data and AI for their testing operation.",
    roles: [
      ["Lab managers & supervisors", "Planning capacity and capability"],
      ["Technical & engineering managers", "Building the case for automation"],
      ["QC / QA professionals", "Consistency and traceability"],
      ["R&D & materials engineers", "Getting more from testing data"],
    ],
    alsoFor: [
      "Operations and digital transformation leads",
      "Anyone planning a lab data or LIMS project",
      "Anyone evaluating AI for materials testing",
    ],
    exploreCtaLabel: "Explore CubeTen",
    exploreCtaHref: "https://labscubed.com/plastic-testing",
    heroVideoUrl: null,
    thankYouVideoUrl: null,
    onDemandVideoUrl: "https://www.youtube.com/embed/EA0jUa83Qjs",
    // Evergreen replays. Dormant until the live session has aired AND
    // `enabled` is true. The recording's YouTube id is NOT kept here — it
    // lives server-side in netlify/lib/replay-videos.mjs so it never ships in
    // the public bundle.
    replay: {
      enabled: false,
      durationMinutes: 50,
      // Weekly session times, US Eastern (weekday: 0 = Sunday). The booking
      // modal offers the next four.
      slots: [
        { weekday: 2, time: "11:00" },
        { weekday: 3, time: "14:00" },
        { weekday: 4, time: "11:00" },
        { weekday: 5, time: "14:00" },
      ],
    },
    nextWebinarSlug: null,
  }),

  /* Technical webinar built around a customer's request (Dec 2, 2026). It is
     invitation-only in practice — the customer circulates the link internally —
     so it is `unlisted`: noindex, out of the sitemap and off the /webinar hub,
     reachable by direct link only. The customer's name is deliberately NOT on
     the page, and no customer data or unverified figures are quoted; content is
     from the "SABIC Content Blueprint" Google Doc, trimmed to what is safe to
     say publicly. Plan: ~45 minutes of content and ~15 of Q&A. */
  "plastics-testing-dec-2026": build({
    slug: "plastics-testing-dec-2026",
    unlisted: true,
    title: "Rethinking Plastics Testing: The Shift to Automated Workflows",
    dateLabel: "Wednesday, December 2, 2026",
    timeLabel: "9:30 AM EST · 60 minutes, including Q&A",
    startUTC: "2026-12-02T14:30:00Z",
    endUTC: "2026-12-02T15:30:00Z",
    heroCopy:
      "A private technical session for the SABIC team. Follow the full tensile workflow, from specimen to report: where variation enters and what the evidence on CubeTen does and does not show.",
    showSeats: false,
    ...KHALED,
    agenda: [
      ["01", "Where variation enters a tensile test", "Testing is a chain of steps, from specimen and measurement through gripping, testing, extension measurement, analysis and reporting. The main sources of variation, and why consistency has to be judged across the whole workflow rather than at the machine alone."],
      ["02", "From an automated machine to an automated workflow", "What each term means, how to judge the scope of automation stage by stage, and where AI fits in, including vision-based sample tracking and machine-learning grip-pressure adjustment."],
      ["03", "CubeTen up close", "How specimens are handled, positioned and clamped, which specimen types and limits apply, how extension is measured, why the system is compact, and how data and lab integration work. Includes a live demonstration and close-up video of the testing process."],
      ["04", "What the technical evidence shows", "Repeatability data on plastics, and a comparison of manual and automated testing: the methods, the conditions, the results and the limitations, including what is not yet verified."],
    ],
    expectIntro:
      "You'll leave with a clear way to judge how much of a testing workflow is actually automated, and an honest view of what the data supports and where it stops.",
    expect: [
      "Where variation enters a tensile test, from specimen to report",
      "The difference between an automated machine and an automated testing workflow",
      "How specimens are handled, positioned and clamped, and the specimen types and limits",
      "How extension is measured, and crosshead displacement versus direct strain",
      "Where AI is used today, and what is still in development",
      "Repeatability evidence, with methods, conditions and limitations stated openly",
      "A live CubeTen demonstration with close-up video",
      "How the system fits a laboratory: footprint, data handling and integration",
      "Live Q&A with the team",
    ],
    audienceIntro:
      "Prepared exclusively for SABIC's research, processing, application and quality teams who run or rely on plastics tensile testing, and the people deciding how their lab workflow should evolve.",
    roles: [
      ["Research & materials scientists", "Characterising materials"],
      ["Processing & application developers", "Turning data into products"],
      ["QC / QA professionals", "Consistency and traceability"],
      ["Lab managers & supervisors", "Throughput, capacity and validation"],
    ],
    alsoFor: [
      "Peer teams at other SABIC sites and regions",
      "Anyone comparing automated tensile systems",
      "Anyone planning validation against existing equipment",
    ],
    exploreCtaLabel: "Explore CubeTen",
    exploreCtaHref: "https://labscubed.com/plastic-testing",
    registerHeading: "Register for your team's session",
    registerNote:
      "This is a private session prepared exclusively for the SABIC team, so please register with your SABIC email. Can't make it live? Register anyway and we'll send you the recording afterwards.",
    // Exclusive-session branding: the hero badge reads "Private webinar" and the
    // partnership card carries the SABIC mark. Drop the SABIC logo file at
    // public/assets/img/partners/sabic.webp (or .svg) and set `logoSrc`; until
    // then the card shows the name as text.
    private: true,
    partner: {
      name: "SABIC",
      label: "Private session · Prepared for the SABIC team",
      logoSrc: "/assets/img/partners/sabic.webp",
      logoSrcLight: "/assets/img/partners/sabic-white.webp",
      inverted: true,
      size: 0.625,
      centered: true,
      logoAlt: "SABIC",
      logoHeight: 44,
      logoWidth: 588,
      logoNativeHeight: 306,
    },
    heroVideoUrl: null,
    thankYouVideoUrl: null,
    onDemandVideoUrl: "https://www.youtube.com/embed/EA0jUa83Qjs",
    thumbnailUrl: null,
    nextWebinarSlug: null,
  }),

  /* Tradeshow, not a webinar: no speaker slot and no seat counter, a booth and
     a city instead of a start time, and the form books a demo rather than a
     seat. Content is the GPS campaign copy. */
  "gps-sep-2026": build({
    kind: "tradeshow",
    slug: "gps-sep-2026",
    title: "LabsCubed at the Global Polymer Summit 2026",
    dateLabel: "September 28–30, 2026",
    timeLabel: "Booth #815 · Louisville, Kentucky",
    locationLabel: "Louisville, Kentucky",
    boothLabel: "Booth #815",
    eventLabel: "Global Polymer Summit 2026",
    // The show floor opens on the 28th; these hours are an assumption and only
    // drive the countdown and the calendar entry, not any published claim.
    startUTC: "2026-09-28T13:00:00Z",
    endUTC: "2026-09-30T21:00:00Z",
    heroCopy:
      "LabsCubed is heading to the Global Polymer Summit, and we are bringing CubeOne with us. Come meet the team, get hands-on with automated testing, and talk to us about how it would fit your lab.",
    // A tradeshow has no seats to run out of.
    showSeats: false,
    // Not a speaker — the person you'll actually meet at the booth.
    showSpeaker: true,
    speakerHeading: "Who you'll meet",
    speakerName: "Guyth Abouyouniss",
    speakerTitle: "Technical Applications - Account Manager, LabsCubed",
    speakerInitials: "GA",
    speakerPhoto: "/assets/img/team/guyth.webp",
    speakerBio:
      "Guyth will be running CubeOne demonstrations at Booth #815 across all three days. Book a slot and he'll build the demonstration around your own materials and workflow rather than running through a script.",
    ctaLabel: "Book my demo",
    registerHeading: "Book your custom demo",
    registerSubmitLabel: "Book my demo",
    booth: {
      ...BOOTH,
      // The show's own mark, shown at the top of the page. Ours is not repeated
      // there — the site header already carries it.
      showLogo: {
        src: "/assets/img/events/gps-logo.webp",
        alt: "Global Polymer Summit 2026, presented by IEC & ITEC",
        // Taller than a plain wordmark on purpose: the artwork carries three
        // lines of type, which turn to mush much below this.
        height: 46,
        width: 249,
        nativeHeight: 118,
      },
    },
    /* Replaces "What we'll cover" on a tradeshow: what the show is, and why we
       exhibit at it. Every tradeshow entry should carry one. Facts are from the
       organiser's own event page — deliberately no attendance figure, since the
       "5K" on their materials is the fun run, not the headcount. */
    about: {
      heading: "About the Global Polymer Summit",
      imageUrl: "/assets/img/events/gps-2025-panel.webp",
      imageAlt: "LabsCubed speaking on a panel at a previous Global Polymer Summit",
      paragraphs: [
        "The Global Polymer Summit brings the International Elastomer Conference and the International Tire Exposition & Conference together into one event, presented by IEC and ITEC at the Kentucky International Convention Center in Louisville.",
        "Over three days it runs an expo floor alongside a technical and business programme, an educational symposium and a full networking schedule, drawing manufacturers, suppliers, distributors, researchers and engineers from across the rubber, elastomer and tire industries.",
        "That mix is exactly why we exhibit. The people who carry the cost of manual tensile testing are in the room — QA teams holding consistency, lab managers under throughput pressure, and engineers characterising new compounds. We bring CubeOne so those conversations happen over a working machine instead of a slide.",
      ],
    },
    agenda: [
      ["01", "Get hands-on with CubeOne", "See CubeOne run a live demonstration on the show floor. Watch it, test it, and put your hands on it yourself."],
      ["02", "Your lab, your challenges", "Every lab has its own workflow and priorities, so we would rather not give you a one-size-fits-all demonstration. Tell us what you are working with and we will build the demo around it."],
      ["03", "Real numbers, real ROI", "Up to 12 specimens per run, 85% of lab time recovered, ROI in 12–24 months, and 40% more consistent data. Come and see what those numbers would mean for your lab."],
      ["04", "Talk automation with the team", "Bring your questions about throughput, standards, data and integration, and get answers from the people who build the machines."],
    ],
    expectIntro:
      "Book a slot and we will tailor the demonstration to your lab rather than running through a script. Walk up without one and we will still show you CubeOne — booking just means we have the time set aside for you.",
    expect: [
      "A live CubeOne demonstration you can get hands-on with",
      "Up to 12 specimens in a single run",
      "85% of lab technician time recovered",
      "Return on investment in 12–24 months",
      "40% more consistent data",
      "A demo shaped around your own workflow and materials",
      "Straight answers on standards, integration and what automation would take in your lab",
    ],
    audienceIntro:
      "Anyone at GPS 2026 who runs, manages or buys for a polymer testing lab.",
    roles: [
      ["Testing technicians", "Materials and polymer testing"],
      ["R&D & materials engineers", "Developing and characterising materials"],
      ["QC / QA professionals", "Holding the line on consistency"],
      ["Lab managers & supervisors", "Throughput, cost and capacity"],
    ],
    alsoFor: [
      "Technical & engineering managers",
      "Anyone evaluating automation for their lab",
      "Anyone sizing up the ROI of automated testing",
    ],
    exploreCtaLabel: "Explore CubeOne",
    // CubeOne's page is /rubber-testing; /plastic-testing is CubeTen's.
    exploreCtaHref: "https://labscubed.com/rubber-testing",
    // The banner from the first GPS email broadcast, re-encoded for the web and
    // served from this site rather than the Supabase bucket: the original is a
    // 2.9 MB webp sized for email, which is far too heavy for the largest
    // element on a campaign landing page. Same artwork, 1200px wide, ~112 KB.
    // An image slot sits behind a video, so adding a heroVideoUrl later would
    // replace it.
    heroImageUrl: "/assets/img/events/gps-2026-1.webp",
    // Card artwork on the events hub — used both as the thumbnail on the
    // upcoming row and as the media on the show's card.
    thumbnailUrl: "/assets/img/events/gps-2026-1.webp",
    thumbnailAlt: "The LabsCubed stand at the Global Polymer Summit 2026",
    heroImageAlt: "The LabsCubed stand (Booth #815) at the Global Polymer Summit 2026",
    heroVideoUrl: null,
    thankYouVideoUrl: null,
    onDemandVideoUrl: "https://www.youtube.com/embed/EA0jUa83Qjs",
    recordingUrl: null,
    // Past-event mode — the show is over, so the same URL stops taking demo
    // bookings and becomes a recap: no countdown bar, no form, no scheduler
    // CTA. This is the standard treatment for every tradeshow once it ends:
    // add a block like this, set the page to render the site header, and drop
    // the registration CTAs. Delete the block to go back to a booking page.
    // Copy is from Mo'min's "GPS 2026" Google Doc. Each `sections[]` entry is
    // {heading, paragraphs[], image?: {src, alt, position?}, link?: {label,
    // href}}; the page frames every image at 16:10, so any photo works whatever
    // its shape — use `position` ("50% 30%") to keep faces in frame.
    pastEvent: {
      badge: "Event recap",
      ctaLabel: "Read the recap",
      heroCopy:
        "From September 28 to 30 we brought CubeOne to booth 815 in Louisville. Here is what we showed, what we heard from the rubber testing community, and where we think the industry is heading.",
      recapHeading: "When the rubber industry meets automation",
      sections: [
        {
          heading: "When the rubber industry meets automation",
          paragraphs: [
            "At the Global Polymer Summit (GPS) 2026 in Louisville, Kentucky, one thing became clear to our team: the rubber testing industry is ready for a more automated future. From September 28 to 30, we brought CubeOne to booth 815, where we demonstrated automated rubber tensile testing through live demonstrations for pre-booked visitors and attendees throughout the show.",
            "Across dozens of conversations, we heard many of the same challenges: repetitive manual work, time-consuming testing workflows, and the possibility of human error in every test.",
            "At the same time, we saw genuine curiosity about what automation could look like in a rubber laboratory and how it could improve reproducibility, reduce dependence on manual processes, and create greater value for laboratories.",
          ],
          image: { src: "/assets/img/events/gps-2026-4.webp", alt: "Two members of the LabsCubed team at the stand during the Global Polymer Summit 2026" },
        },
        {
          heading: "Putting CubeOne to the test at GPS 2026",
          paragraphs: [
            "At the heart of our presence at GPS 2026 was CubeOne, giving visitors the opportunity to see automated rubber tensile testing in action. For visitors who booked demonstrations ahead of the event, our team used the laboratory and specimen information they provided to prepare the CubeOne around their specific testing requirements, including preparing the relevant specimens for a live demonstration.",
            "We also ran general demonstrations throughout the show, walking attendees through the complete workflow, from specimen handling and testing to data collection and the vision system.",
            "What stood out was how many visitors were surprised by the level of automation and how straightforward the system was to operate, as well as how much of the testing process could be carried out with minimal human intervention.",
            "We also shared real testing data comparing automated and manual testing, including results from our ASTM and ISO testing work, helping visitors see the potential for greater consistency and reproducibility.",
            "Most importantly, these demonstrations gave us the opportunity to meet people from across the rubber industry, understand their workflows and challenges, and continue conversations about what a more automated laboratory could look like.",
          ],
          image: { src: "/assets/img/events/gps-2026-3.webp", alt: "Visitors gathered around the machine at the LabsCubed stand while a team member explains the workflow" },
        },
        {
          heading: "What we heard from the rubber testing community",
          paragraphs: [
            "One of the most valuable parts of GPS 2026 was hearing directly from people working in rubber testing about the challenges they face every day.",
            "Across our conversations, several themes came up repeatedly: manual and repetitive work, the amount of time required to complete testing, and the risk of human error from relying heavily on manual processes.",
            "Many attendees were looking for ways to make their workflows more efficient while improving the consistency and reproducibility of their results. These conversations reinforced something we have been seeing across the industry: laboratories are increasingly looking beyond individual automated machines and toward more connected and autonomous testing workflows.",
            "For us, GPS 2026 was an opportunity not only to demonstrate what CubeOne can do, but also to listen, learn, and better understand where automation can have the greatest impact in real-world rubber laboratories.",
          ],
        },
        {
          heading: "Exploring the role of AI in rubber testing",
          paragraphs: [
            "On the third day of GPS 2026, September 30, our CEO, Khaled Boqaileh, joined an open panel discussion exploring the role of AI and autonomous laboratories in the rubber industry.",
            "The conversation looked at how AI can move beyond data analysis and become part of the physical laboratory workflow, from interpreting experimental data to guiding what happens next.",
            "Khaled shared the LabsCubed perspective on how automation and AI can work together, including how CubeOne is beginning to incorporate AI capabilities into automated testing. The discussion also explored the longer-term path toward more connected and autonomous laboratories, and what that could mean for the role of materials scientists and testing teams.",
          ],
          image: { src: "/assets/img/events/gps-2026-2.webp", alt: "Khaled Boqaileh on the open panel on AI and autonomous laboratories at the Global Polymer Summit 2026", position: "50% 55%" },
        },
        {
          heading: "From manual testing to a more automated workflow",
          paragraphs: [
            "The conversations at GPS 2026 also gave us an opportunity to show how automation can address some of the challenges laboratories are facing today.",
            "With CubeOne, the testing process can move from manually handling specimens and operating the testing machine to a more automated workflow that covers specimen handling, testing, vision, and data collection.",
            "The goal is not simply to automate one step, but to reduce the amount of repetitive work involved in the overall testing process while maintaining consistent and reproducible results.",
            "The testing data we shared at the event, including comparisons between manual and automated testing across ASTM and ISO methods, helped put that difference into perspective and gave visitors a clearer view of what automation can bring to a rubber testing laboratory.",
          ],
          link: { label: "Download the white paper", href: "/white-paper-automation-vs-manual-testing" },
        },
        {
          heading: "Building connections beyond the booth",
          paragraphs: [
            "Beyond the demonstrations themselves, GPS 2026 gave our team the opportunity to connect with people from across the rubber industry and continue conversations that started before the event.",
            "From laboratories exploring automation for the first time to those already considering how to expand their automated workflows, each conversation gave us a better understanding of the different needs and priorities across the industry.",
            "We also had the opportunity to meet existing and potential customers, explore new partnerships, and discuss how LabsCubed can support laboratories as they move toward more automated testing. These connections are an important part of why we continue to participate in GPS and stay closely engaged with the rubber testing community.",
          ],
        },
        {
          heading: "Looking ahead: the future of rubber testing",
          paragraphs: [
            "Our time at GPS 2026 reinforced a clear direction for the rubber testing industry: laboratories are looking for ways to move toward more automated and autonomous workflows.",
            "The conversations we had reflected a growing interest in reducing repetitive manual work, minimizing the influence of human factors, improving reproducibility, and making better use of laboratory time and resources.",
            "For LabsCubed, these conversations are an important part of shaping what we develop next. As we continue working with laboratories around the world, we see the future of rubber testing moving beyond individual automated machines toward laboratories where more of the testing workflow can operate intelligently, consistently, and with less manual intervention.",
          ],
        },
      ],
      nextStepsHeading: "Keep the conversation going",
      nextSteps: [
        ["Explore CubeOne", "Automated tensile testing for rubber and elastomers — ASTM D412 / ISO 37.", "/rubber-testing", "See CubeOne"],
        ["Talk to our team", "Tell us what you test and we'll tell you whether automation fits your lab.", "/get-a-quote", "Get a quote"],
        ["Read the white paper", "The data-backed business case for automating tensile testing.", "/white-paper-automation-vs-manual-testing", "Get the white paper"],
        ["Meet us at the next show", "Where we're exhibiting next, and the shows we've been to.", "/events", "See all events"],
      ],
    },
    nextWebinarSlug: "ami-nov-2026",
  }),

  

  /* AMI's North American plastics week — four co-located expos, one of which is
     the Polymer Testing World Expo, which is as close to our exact audience as
     a show floor gets. Booth number not confirmed yet, so nothing on the page
     claims one. */
  "ami-nov-2026": build({
    kind: "tradeshow",
    slug: "ami-nov-2026",
    title: "See CubeTen at the Compounding World Expo",
    dateLabel: "November 11–12, 2026",
    timeLabel: "Huntington Convention Center · Cleveland, Ohio",
    locationLabel: "Cleveland, Ohio",
    boothLabel: null,
    eventLabel: "AMI Plastics World Expos North America 2026",
    startUTC: "2026-11-11T14:00:00Z",
    endUTC: "2026-11-12T22:00:00Z",
    heroCopy:
      "We're bringing CubeTen to Cleveland for AMI's plastics week. Come and put your hands on automated tensile testing, and talk to us about what it would take in your own lab.",
    showSeats: false,
    showSpeaker: true,
    speakerHeading: "Who you'll meet",
    speakerName: "Guyth Abouyouniss",
    speakerTitle: "Technical Applications - Account Manager, LabsCubed",
    speakerInitials: "GA",
    speakerPhoto: "/assets/img/team/guyth.webp",
    speakerBio:
      "Guyth will be running CubeTen demonstrations across both days of the show. Book a slot and he'll build the demonstration around your own materials and workflow rather than running through a script.",
    ctaLabel: "Book my demo",
    registerHeading: "Book your custom demo",
    // After the three-field form, send the visitor straight to Guyth's Google
    // Calendar appointment schedule (the same link as the AMI Resend emails),
    // so they pick a demo slot. Same mechanism as SPE: the details modal and
    // thank-you page are skipped, and `leadOnly` is set for this slug in
    // netlify/functions/webinar-register.mjs.
    externalRegistrationUrl: "https://calendar.google.com/calendar/appointments/schedules/AcZssZ3euIx4Mb9AXBsNaY8vTFD57jHKEK4d-KBw4OGjkYSAI7lWVJXEiSqrT7e1mPCI4fkDWzE_U-p2",
    registerSubmitLabel: "Continue to pick your time",
    registerNote:
      "After this step you'll choose a demo time in Guyth's calendar.",
    about: {
      heading: "About the Compounding World Expo",
      imageUrl: "/assets/img/events/ami-booth.webp",
      imageAlt: "The LabsCubed booth at an AMI plastics show, with CubeTen and CubeOne on display",
      paragraphs: [
        "The Compounding World Expo is AMI's focused North American show for plastics additives and compounding, held at the Huntington Convention Center in Cleveland. Two days, free to attend, in what AMI calls the plastics hub of North America.",
        "It runs co-located with the Plastics Recycling World Expo, the Plastics Extrusion World Expo and the Polymer Testing World Expo — over 300 exhibitors across the four, and a free conference programme running in four concurrent theatres alongside the floor. One badge covers all of it.",
        "The Polymer Testing World Expo sharing the hall is the reason we go. It puts the people who run and buy for testing labs in the same building as the compounders whose material they characterise. We bring CubeTen and let the machine do the explaining.",
      ],
    },
    agenda: [],
    expectIntro:
      "Book a slot and we'll tailor the demonstration to your lab rather than running through a script. Walk up without one and we'll still show you CubeTen — booking just means we have the time set aside for you.",
    expect: [
      "A live CubeTen demonstration you can get hands-on with",
      "Up to 12 specimens in a single run",
      "85% of lab technician time recovered",
      "Return on investment in 12–24 months",
      "40% more consistent data",
      "A demo shaped around your own workflow and materials",
      "Straight answers on standards, integration and what automation would take in your lab",
    ],
    audienceIntro:
      "Anyone at the show who runs, manages or buys for a plastics testing lab.",
    roles: [
      ["Testing technicians", "Materials and polymer testing"],
      ["R&D & materials engineers", "Developing and characterising materials"],
      ["QC / QA professionals", "Holding the line on consistency"],
      ["Lab managers & supervisors", "Throughput, cost and capacity"],
    ],
    alsoFor: [
      "Compounders and additive suppliers",
      "Technical & engineering managers",
      "Anyone evaluating automation for their lab",
    ],
    booth: {
      ...BOOTH,
      // A plastics show, so CubeTen leads. CubeOne stays on the list because
      // compounders on that floor test rubber too.
      assets: [BOOTH_ASSETS.whitepaper, BOOTH_ASSETS.cubeten, BOOTH_ASSETS.cubeone],
      // CubeTen is the machine on this stand, so the confirmation plays the
      // CubeTen tray run (onDemandVideoUrl) rather than the CubeOne film.
      videoUrl: null,
      videoLabel: "CubeTen, the machine on our stand",
    },
    exploreCtaLabel: "Explore CubeTen",
    exploreCtaHref: "https://labscubed.com/plastic-testing",
    heroImageUrl: "/assets/img/events/ami-booth.webp",
    heroImageAlt: "The LabsCubed booth at an AMI plastics show",
    heroVideoUrl: null,
    thankYouVideoUrl: null,
    onDemandVideoUrl: "https://www.youtube.com/embed/EA0jUa83Qjs",
    thumbnailUrl: "/assets/img/events/ami-booth.webp",
    thumbnailAlt: "The LabsCubed booth at an AMI plastics show",
    recordingUrl: null,
    nextWebinarSlug: null,
  }),

  /* NPE runs once every three years and is the largest plastics show in the
     Americas. Booth number not confirmed yet. */
  "npe-may-2027": build({
    kind: "tradeshow",
    slug: "npe-may-2027",
    title: "See CubeTen at NPE2027: The Plastics Show",
    dateLabel: "May 3–7, 2027",
    timeLabel: "Orlando, Florida",
    locationLabel: "Orlando, Florida",
    boothLabel: null,
    eventLabel: "NPE2027: The Plastics Show",
    startUTC: "2027-05-03T13:00:00Z",
    endUTC: "2027-05-07T21:00:00Z",
    heroCopy:
      "NPE comes round once every three years. We'll be there with CubeTen — come and see automated tensile testing running, and talk to us about what it would change in your lab.",
    showSeats: false,
    showSpeaker: true,
    speakerHeading: "Who you'll meet",
    speakerName: "Guyth Abouyouniss",
    speakerTitle: "Technical Applications - Account Manager, LabsCubed",
    speakerInitials: "GA",
    speakerPhoto: "/assets/img/team/guyth.webp",
    speakerBio:
      "Guyth will be running CubeTen demonstrations across the week. Book a slot and he'll build the demonstration around your own materials and workflow rather than running through a script.",
    ctaLabel: "Book my demo",
    registerHeading: "Book your custom demo",
    registerSubmitLabel: "Book my demo",
    about: {
      heading: "About NPE2027",
      imageUrl: "/assets/img/events/npe-show-floor.webp",
      imageAlt: "The NPE show floor in Orlando",
      paragraphs: [
        "NPE: The Plastics Show is the largest plastics event in the Americas and runs only once every three years. NPE2027 takes place in Orlando from 3–7 May, produced by the Plastics Industry Association under the theme \"NEXT IS NOW\".",
        "The organisers expect more than 51,000 attendees and over 2,200 exhibitors from more than 130 countries, across a floor organised into technology zones covering materials, recycling and sustainability, moldmaking and manufacturing services. ANTEC, the Society of Plastics Engineers' technical conference, runs inside the show for the first time.",
        "A show that size only pays back if the conversations are the right ones. We go to meet the labs behind those exhibitors — the QA teams, lab managers and materials engineers who carry the testing load — and we bring CubeTen so the demonstration happens on a working machine rather than a slide.",
      ],
    },
    agenda: [],
    expectIntro:
      "Book a slot and we'll tailor the demonstration to your lab rather than running through a script. Walk up without one and we'll still show you CubeTen — booking just means we have the time set aside for you.",
    expect: [
      "A live CubeTen demonstration you can get hands-on with",
      "Up to 12 specimens in a single run",
      "85% of lab technician time recovered",
      "Return on investment in 12–24 months",
      "40% more consistent data",
      "A demo shaped around your own workflow and materials",
      "Straight answers on standards, integration and what automation would take in your lab",
    ],
    audienceIntro:
      "Anyone at NPE who runs, manages or buys for a plastics testing lab.",
    roles: [
      ["Testing technicians", "Materials and polymer testing"],
      ["R&D & materials engineers", "Developing and characterising materials"],
      ["QC / QA professionals", "Holding the line on consistency"],
      ["Lab managers & supervisors", "Throughput, cost and capacity"],
    ],
    alsoFor: [
      "Processors and moulders",
      "Technical & engineering managers",
      "Anyone evaluating automation for their lab",
    ],
    booth: {
      ...BOOTH,
      // A plastics show, so CubeTen leads. CubeOne stays on the list because
      // processors on that floor test rubber too.
      assets: [BOOTH_ASSETS.whitepaper, BOOTH_ASSETS.cubeten, BOOTH_ASSETS.cubeone],
      // CubeTen is the machine on this stand, so the confirmation plays the
      // CubeTen tray run (onDemandVideoUrl) rather than the CubeOne film.
      videoUrl: null,
      videoLabel: "CubeTen, the machine on our stand",
    },
    exploreCtaLabel: "Explore CubeTen",
    exploreCtaHref: "https://labscubed.com/plastic-testing",
    heroImageUrl: "/assets/img/events/npe-show-floor.webp",
    heroImageAlt: "The NPE show floor in Orlando",
    heroVideoUrl: null,
    thankYouVideoUrl: null,
    onDemandVideoUrl: "https://www.youtube.com/embed/EA0jUa83Qjs",
    thumbnailUrl: "/assets/img/events/npe-show-floor.webp",
    thumbnailAlt: "The NPE show floor in Orlando",
    recordingUrl: null,
    nextWebinarSlug: null,
  }),
};

/* Partner funnels — Global Instrumentation Services (GIS).

   Clones of our own funnels, hosted under a "gis-" slug so every registration
   is tagged with its own webinar_slug in Supabase and lands in its own Resend
   segment, separate from our campaigns. They are `unlisted`: noindex, out of
   the sitemap, out of llms.txt and off the /webinar/ hub, reachable only by
   direct link. No nextWebinarSlug in either direction, no seat counter, and no
   welcomeEvent in webinar-register.mjs (so our own automations never email GIS
   registrants).

   Content tracks the original it clones; only the fields below differ. Both
   clones are the SAME events as their originals and inherit their date and
   time; they exist only so GIS-sourced leads are tagged and counted apart. */
function gisClone(sourceSlug, overrides) {
  return build({
    ...WEBINARS[sourceSlug],
    ...overrides,
    unlisted: true,
    showSeats: false,
    seatsTotal: null,
    seatsLeft: null,
    nextWebinarSlug: null,
  });
}

// The same event as spe-oct-2026 (same date and time, inherited from it), just
// a separate funnel so GIS-sourced leads are tagged and counted on their own.
WEBINARS["gis-spe-oct-2026"] = gisClone("spe-oct-2026", {
  slug: "gis-spe-oct-2026",
});

// The same event as automation-ai-nov-2026 (date and time inherited from it).
WEBINARS["gis-ai-nov-2026"] = gisClone("automation-ai-nov-2026", {
  slug: "gis-ai-nov-2026",
});

export function getWebinar(slug) {
  const webinar = WEBINARS[slug];
  if (!webinar) throw new Error(`Unknown webinar slug: ${slug}`);
  return webinar;
}

export const COLORS = {
  teal: "#17ddc5",
  tealDeep: "#0d9488",
  ink: "#1d1d1f",
  muted: "#86868b",
  gray100: "#f5f5f7",
  line: "rgba(0,0,0,0.1)",
};
