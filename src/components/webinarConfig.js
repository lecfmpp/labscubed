// Registry of every webinar funnel. One entry per webinar, keyed by slug.
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

function build(w) {
  return {
    ...w,
    targetISO: w.startUTC,
    // Trailing slashes on purpose — without them Netlify answers a 301 first.
    registrationUrl: `/webinar/${w.slug}/`,
    thankYouUrl: `/webinar/${w.slug}/thank-you/`,
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
  "spe-2026": build({
    slug: "spe-2026",
    title: "The Hidden Cost of Manual Plastics Testing",
    dateLabel: "Tuesday, October 20, 2026",
    timeLabel: "11:00 AM EST · 50 minutes, including Q&A",
    badgeLabel: "Webinar · October 20",
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
    onDemandVideoId: "EA0jUa83Qjs",
    // Cross-promoted on the registration page and the thank-you page.
    nextWebinarSlug: "automation-ai-2026",
  }),

  "automation-ai-2026": build({
    slug: "automation-ai-2026",
    title: "Automation, AI and Industry 4.0 in the Testing Lab",
    dateLabel: "Wednesday, November 18, 2026",
    timeLabel: "11:00 AM EST · 50 minutes, including Q&A",
    badgeLabel: "Webinar · November 18",
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
    onDemandVideoId: "EA0jUa83Qjs",
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
