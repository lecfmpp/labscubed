// Registry of every webinar funnel. One entry per webinar, keyed by slug.
//
// Slug convention: <topic>-<mon>-<year>, e.g. spe-oct-2026. Always carrying the
// month and year means the URL says which webinar AND when it ran, and a repeat
// of the same event next year gets its own URL instead of colliding.
//
// The slug is the single identifier that ties everything together: the URL
// (/webinar/<slug>/), the Resend segment, the Supabase webinar_slug tag, and
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
    registrationUrl: `/${base}/${w.slug}/`,
    thankYouUrl: `/${base}/${w.slug}/thank-you/`,
    submitEndpoint: "/api/webinar/register",
    calendarLinks: {
      google: `https://calendar.google.com/calendar/u/0/r/eventedit?text=${encodeURIComponent(w.title)}&dates=${compact(w.startUTC)}/${compact(w.endUTC)}`,
      outlook: `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(w.title)}&startdt=${w.startUTC}&enddt=${w.endUTC}`,
      apple: `/ics/webinar-${w.slug}.ics`,
    },
  };
}

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
      ["04", "From testing data to a smarter lab workflow", "Practical CubeTen examples with HIPS and polypropylene, covering ASTM/ISO requirements, calibration, service and support, cybersecurity and data integration."],
    ],
    expectIntro:
      "You'll leave with a practical understanding of where the hidden costs and sources of variability sit in manual plastics tensile testing, and how automation addresses them.",
    expect: [
      "Real-world CubeTen plastics testing data",
      "Examples using HIPS and polypropylene (PP)",
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
    // Video slots. Paste a YouTube URL, a share link, or the whole <iframe>
    // embed snippet — anything youTubeId() can read. Leave null for the
    // placeholder.
    heroVideoUrl: "https://youtu.be/wuEurbhcKUw",
    // The confirmation page's own hero video. Falls back to heroVideoUrl when
    // null, so a webinar with a single video needs only the one field.
    thankYouVideoUrl: "https://youtu.be/agUsIcHPaoU",
    onDemandVideoUrl: "https://www.youtube.com/embed/EA0jUa83Qjs",
    // Set once the session has aired and the recording is up; until then the
    // hub shows "recording coming soon" for a past webinar.
    recordingUrl: null,
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
    recordingUrl: null,
    nextWebinarSlug: null,
  }),

  /* Tradeshow, not a webinar: no speaker slot and no seat counter, a booth and
     a city instead of a start time, and the form books a demo rather than a
     seat. Content is the GPS campaign copy. */
  "gps-sep-2026": build({
    kind: "tradeshow",
    slug: "gps-sep-2026",
    title: "Get Hands-On With CubeOne at the Global Polymer Summit",
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
    speakerTitle: "Account Executive, LabsCubed",
    speakerInitials: "GA",
    speakerPhoto: "/assets/img/team/guyth.webp",
    speakerBio:
      "Guyth will be running CubeOne demonstrations at Booth #815 across all three days. Book a slot and he'll build the demonstration around your own materials and workflow rather than running through a script.",
    ctaLabel: "Book my demo",
    registerHeading: "Book your custom demo",
    registerSubmitLabel: "Book my demo",
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
    exploreCtaHref: "https://labscubed.com/plastic-testing",
    // The banner from the first GPS email broadcast, re-encoded for the web and
    // served from this site rather than the Supabase bucket: the original is a
    // 2.9 MB webp sized for email, which is far too heavy for the largest
    // element on a campaign landing page. Same artwork, 1200px wide, ~112 KB.
    // An image slot sits behind a video, so adding a heroVideoUrl later would
    // replace it.
    heroImageUrl: "/assets/img/events/gps-2026-banner.webp",
    // Card artwork on the events hub — used both as the thumbnail on the
    // upcoming row and as the media on the show's card.
    thumbnailUrl: "/assets/img/events/gps-2025-panel.webp",
    thumbnailAlt: "LabsCubed on a panel at a previous Global Polymer Summit",
    heroImageAlt: "LabsCubed at the Global Polymer Summit 2026 — Booth #815",
    heroVideoUrl: null,
    thankYouVideoUrl: null,
    onDemandVideoUrl: "https://www.youtube.com/embed/EA0jUa83Qjs",
    recordingUrl: null,
    nextWebinarSlug: null,
  }),

  /* AMI's North American plastics week — four co-located expos, one of which is
     the Polymer Testing World Expo, which is as close to our exact audience as
     a show floor gets. Booth number not confirmed yet, so nothing on the page
     claims one. */
  "ami-nov-2026": build({
    kind: "tradeshow",
    slug: "ami-nov-2026",
    title: "See CubeOne at the Compounding World Expo",
    dateLabel: "November 11–12, 2026",
    timeLabel: "Huntington Convention Center · Cleveland, Ohio",
    locationLabel: "Cleveland, Ohio",
    boothLabel: null,
    eventLabel: "AMI Plastics World Expos North America 2026",
    startUTC: "2026-11-11T14:00:00Z",
    endUTC: "2026-11-12T22:00:00Z",
    heroCopy:
      "We're bringing CubeOne to Cleveland for AMI's plastics week. Come and put your hands on automated tensile testing, and talk to us about what it would take in your own lab.",
    showSeats: false,
    showSpeaker: true,
    speakerHeading: "Who you'll meet",
    speakerName: "Guyth Abouyouniss",
    speakerTitle: "Account Executive, LabsCubed",
    speakerInitials: "GA",
    speakerPhoto: "/assets/img/team/guyth.webp",
    speakerBio:
      "Guyth will be running CubeOne demonstrations across both days of the show. Book a slot and he'll build the demonstration around your own materials and workflow rather than running through a script.",
    ctaLabel: "Book my demo",
    registerHeading: "Book your custom demo",
    registerSubmitLabel: "Book my demo",
    about: {
      heading: "About the Compounding World Expo",
      imageUrl: "/assets/img/events/ami-booth.webp",
      imageAlt: "The LabsCubed booth at an AMI plastics show, with CubeTen and CubeOne on display",
      paragraphs: [
        "The Compounding World Expo is AMI's focused North American show for plastics additives and compounding, held at the Huntington Convention Center in Cleveland. Two days, free to attend, in what AMI calls the plastics hub of North America.",
        "It runs co-located with the Plastics Recycling World Expo, the Plastics Extrusion World Expo and the Polymer Testing World Expo — over 300 exhibitors across the four, and a free conference programme running in four concurrent theatres alongside the floor. One badge covers all of it.",
        "The Polymer Testing World Expo sharing the hall is the reason we go. It puts the people who run and buy for testing labs in the same building as the compounders whose material they characterise. We bring CubeOne and let the machine do the explaining.",
      ],
    },
    agenda: [],
    expectIntro:
      "Book a slot and we'll tailor the demonstration to your lab rather than running through a script. Walk up without one and we'll still show you CubeOne — booking just means we have the time set aside for you.",
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
    exploreCtaLabel: "Explore CubeOne",
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
    title: "See CubeOne at NPE2027: The Plastics Show",
    dateLabel: "May 3–7, 2027",
    timeLabel: "Orlando, Florida",
    locationLabel: "Orlando, Florida",
    boothLabel: null,
    eventLabel: "NPE2027: The Plastics Show",
    startUTC: "2027-05-03T13:00:00Z",
    endUTC: "2027-05-07T21:00:00Z",
    heroCopy:
      "NPE comes round once every three years. We'll be there with CubeOne — come and see automated tensile testing running, and talk to us about what it would change in your lab.",
    showSeats: false,
    showSpeaker: true,
    speakerHeading: "Who you'll meet",
    speakerName: "Guyth Abouyouniss",
    speakerTitle: "Account Executive, LabsCubed",
    speakerInitials: "GA",
    speakerPhoto: "/assets/img/team/guyth.webp",
    speakerBio:
      "Guyth will be running CubeOne demonstrations across the week. Book a slot and he'll build the demonstration around your own materials and workflow rather than running through a script.",
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
        "A show that size only pays back if the conversations are the right ones. We go to meet the labs behind those exhibitors — the QA teams, lab managers and materials engineers who carry the testing load — and we bring CubeOne so the demonstration happens on a working machine rather than a slide.",
      ],
    },
    agenda: [],
    expectIntro:
      "Book a slot and we'll tailor the demonstration to your lab rather than running through a script. Walk up without one and we'll still show you CubeOne — booking just means we have the time set aside for you.",
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
    exploreCtaLabel: "Explore CubeOne",
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
