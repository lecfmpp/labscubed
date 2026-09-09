import React from 'react';
import { getWebinar, youTubeId, COLORS } from './webinarConfig.js';

const WebinarContext = React.createContext(null);
const useWebinar = () => React.useContext(WebinarContext);

// Date, time, title and calendar links all come from the shared config so this
// page can never disagree with the registration page.
function useM(bp = 760) {
  const [m, setM] = React.useState(window.innerWidth <= bp);
  React.useEffect(() => { const on = () => setM(window.innerWidth <= bp); window.addEventListener("resize", on); return () => window.removeEventListener("resize", on); }, [bp]);
  return m;
}

function Wrap({ children, bg = "#fff" }) {
  const m = useM();
  return <section style={{ background: bg }}><div style={{ maxWidth: 1312, margin: "0 auto", padding: m ? "64px 20px" : "100px 64px" }}>{children}</div></section>;
}

function H2({ children }) {
  const m = useM();
  return <h2 style={{ fontWeight: 700, fontSize: m ? 30 : 48, letterSpacing: "-0.03em", lineHeight: 1.1, margin: 0, color: COLORS.ink }}>{children}</h2>;
}

/* One slot for the hero media: plays the configured YouTube video when the
   webinar has one, and shows the placeholder until then. Set heroVideoUrl in
   webinarConfig to fill it — a URL, a share link or a pasted <iframe> all work. */
function HeroVideo({ label, video, image, imageAlt }) {
  const id = youTubeId(video);
  const frame = {
    position: "relative",
    width: "100%",
    aspectRatio: "16/9",
    borderRadius: 20,
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.1)",
  };

  if (id) {
    return (
      <div style={{ ...frame, background: "#000" }}>
        <iframe
          src={`https://www.youtube.com/embed/${id}`}
          title={label}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
        />
      </div>
    );
  }

  if (image) {
    return (
      <div style={{ ...frame, background: "#000" }}>
        <img src={image} alt={imageAlt || label} width={1040} height={585} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      </div>
    );
  }

  return (
    <div style={{ ...frame, background: "linear-gradient(160deg, #1a1b1f, #000)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span style={{ width: 72, height: 72, borderRadius: "50%", background: COLORS.teal, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="#000"><path d="M8 5v14l11-7z" /></svg>
      </span>
      <span style={{ position: "absolute", bottom: 18, left: 20, fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.55)" }}>{label}</span>
    </div>
  );
}

/* Renders the official brand mark when the SVG is present at the path below,
   and falls back to a lettered badge when it is not. The real Google Calendar,
   Outlook and Apple marks are trademarked assets — drop the official SVGs into
   public/assets/img/calendar/ and they are picked up automatically. */
function CalendarIcon({ icon, letter, color, name }) {
  const [failed, setFailed] = React.useState(false);
  if (failed) {
    return <span style={{ width: 18, height: 18, borderRadius: 4, background: color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff", flexShrink: 0 }}>{letter}</span>;
  }
  return <img src={icon} alt={`${name} Calendar`} width={18} height={18} onError={() => setFailed(true)} style={{ width: 18, height: 18, objectFit: "contain", flexShrink: 0, display: "block" }} />;
}

function Hero() {
  const CONFIG = useWebinar();
  const isShow = CONFIG.kind === "tradeshow";
  const m = useM();
  const calendarButtons = [
    { name: "Google", href: CONFIG.calendarLinks.google, icon: "/assets/img/calendar/google-calendar.svg", letter: "G", color: "#4285F4" },
    { name: "Outlook", href: CONFIG.calendarLinks.outlook, icon: "/assets/img/calendar/outlook.svg", letter: "O", color: "#0078D4" },
    { name: "Apple", href: CONFIG.calendarLinks.apple, icon: "/assets/img/calendar/apple.svg", letter: "A", color: "#555" }
  ];

  return (
    <section style={{ background: "#000", color: "#fff" }}>
      <div style={{ maxWidth: 1312, margin: "0 auto", padding: m ? "48px 20px 64px" : "80px 64px 100px", display: "grid", gridTemplateColumns: m ? "1fr" : "1fr 1fr", gap: m ? 32 : 56, alignItems: "center" }}>
        <div>
          <nav aria-label="Breadcrumb" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, marginBottom: m ? 18 : 22 }}>
            <a href={isShow ? "/events/" : "/webinar/"} style={{ color: "rgba(255,255,255,0.65)", textDecoration: "none", borderBottom: "1px solid rgba(255,255,255,0.25)", paddingBottom: 1 }}>{isShow ? "All events" : "All webinars"}</a>
            <span aria-hidden="true" style={{ color: "rgba(255,255,255,0.3)" }}>/</span>
            <span style={{ color: "rgba(255,255,255,0.45)" }}>{isShow ? "Demo booked" : "Registered"}</span>
          </nav>
          <span style={{ width: 56, height: 56, borderRadius: "50%", background: COLORS.teal, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4 10-11" stroke="#000" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </span>
          <h1 style={{ fontWeight: 700, fontSize: m ? 32 : 48, letterSpacing: "-0.02em", lineHeight: 1.1, margin: 0 }}>{isShow ? "Your demo is booked." : "You're registered."}</h1>
          <p style={{ margin: "18px 0 0", maxWidth: 480, fontWeight: 300, fontSize: m ? 15 : 18, lineHeight: 1.55, color: "rgba(255,255,255,0.55)" }}>{isShow
              ? `A confirmation email is on its way. We'll be in touch before the show to agree a time, and you'll find us at ${CONFIG.boothLabel}.`
              : "A confirmation email with your calendar invite and join link is on its way to your inbox."}</p>
          <div style={{ marginTop: 32, flexDirection: "column", gap: 6, padding: "18px 22px", borderRadius: 14, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", display: "flex" }}>
            <span style={{ fontWeight: 600, fontSize: 15 }}>{CONFIG.title}</span>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>{CONFIG.dateLabel} · {CONFIG.timeLabel}</span>
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 28, flexWrap: "wrap" }}>
            {calendarButtons.map((btn) => (
              <a key={btn.name} href={btn.href} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 500, color: "#fff", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 999, padding: "10px 16px", textDecoration: "none", transition: "all 0.2s" }}>
                <CalendarIcon icon={btn.icon} letter={btn.letter} color={btn.color} name={btn.name} />
                <span>{btn.name}</span>
              </a>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 0, minWidth: 0 }}>
          <HeroVideo label={isShow ? "CubeOne in action" : "Event preview"} video={CONFIG.thankYouVideoUrl || CONFIG.heroVideoUrl} image={CONFIG.heroImageUrl} imageAlt={CONFIG.heroImageAlt} />
        </div>
      </div>
    </section>
  );
}

function NextSteps() {
  const CONFIG = useWebinar();
  const isShow = CONFIG.kind === "tradeshow";
  const m = useM();
  const steps = isShow
    ? [
        ["01", "Check your inbox", "Your confirmation email has the show dates and our booth number."],
        ["02", "Tell us about your lab", "Reply with your materials and workflow and we'll build the demonstration around them."],
        ["03", `Come and find us at ${CONFIG.boothLabel}`, "Bring your questions. We'll bring CubeOne."],
      ]
    : [
        ["01", "Check your inbox", "Your confirmation email has the calendar invite and join link."],
        ["02", "Save the date", "Add it to your calendar so it doesn't slip past you."],
        ["03", "Join 5 minutes early", "We'll open the room ahead of time for a live Q&A warm-up."],
      ];

  return (
    <Wrap>
      <H2>What happens next</H2>
      <div style={{ marginTop: m ? 28 : 40, display: "grid", gridTemplateColumns: m ? "1fr" : "repeat(3, 1fr)", gap: m ? 20 : 24 }}>
        {steps.map(([n, t, d]) => (
          <div key={n}>
            <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.tealDeep, letterSpacing: "0.1em" }}>{n}</div>
            <h3 style={{ fontWeight: 700, fontSize: 19, margin: "10px 0 0", color: COLORS.ink }}>{t}</h3>
            <p style={{ marginTop: 8, fontSize: 14, lineHeight: 1.55, fontWeight: 300, color: COLORS.muted }}>{d}</p>
          </div>
        ))}
      </div>
    </Wrap>
  );
}

/* Something to do between registering and the live session: the automation in
   action, then the way through to the product page. */
function WatchWhileYouWait() {
  const CONFIG = useWebinar();
  const isShow = CONFIG.kind === "tradeshow";
  const m = useM();

  return (
    <Wrap bg={COLORS.gray100}>
      <div style={{ maxWidth: 840, margin: "0 auto", textAlign: "center" }}>
        <H2>See the automation for yourself</H2>
        <p style={{ margin: m ? "14px 0 0" : "18px 0 0", fontWeight: 300, fontSize: m ? 15 : 17, lineHeight: 1.6, color: COLORS.muted }}>
          {isShow
            ? "Before the show, here is the automation running a full tray end to end — the same workflow you'll get your hands on at the booth."
            : `While you wait for ${CONFIG.dateLabel.replace(/^\w+, /, "").replace(/, \d{4}$/, "")}, here is CubeTen running a full tray — the same automated workflow Khaled walks through on the day.`}
        </p>
      </div>

      {/* Padding-bottom ratio keeps the iframe 16:9 at every width. */}
      <div style={{ maxWidth: 840, margin: m ? "28px auto 0" : "40px auto 0" }}>
        <div style={{ position: "relative", width: "100%", paddingBottom: "56.25%", borderRadius: 20, overflow: "hidden", background: "#000", boxShadow: "0 20px 40px rgba(0,0,0,0.12)" }}>
          <iframe
            src={`https://www.youtube.com/embed/${youTubeId(CONFIG.onDemandVideoUrl)}`}
            title="LabsCubed CubeTen automated tensile testing"
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
          />
        </div>
      </div>

      <div style={{ marginTop: m ? 28 : 36, textAlign: "center" }}>
        <a href={CONFIG.exploreCtaHref} style={{ display: "inline-block", background: "#1a1b1f", color: "#fff", borderRadius: 999, padding: "14px 28px", fontWeight: 600, fontSize: 14, textTransform: "uppercase", letterSpacing: "0.05em", textDecoration: "none" }}>{CONFIG.exploreCtaLabel}</a>
      </div>
    </Wrap>
  );
}

/* Next webinar in the series, from the registry. Renders nothing for the last
   one in a series. */
function UpcomingWebinar() {
  const CONFIG = useWebinar();
  const m = useM();
  const next = CONFIG.nextWebinarSlug ? getWebinar(CONFIG.nextWebinarSlug) : null;
  if (!next) return null;

  return (
    <Wrap>
      <div style={{ maxWidth: 840, margin: "0 auto" }}>
        <span style={{ display: "inline-flex", background: COLORS.gray100, color: COLORS.muted, borderRadius: 4, padding: "5px 12px", fontWeight: 700, fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", lineHeight: 1 }}>Next in the series</span>
        <div style={{ marginTop: 16, display: "flex", flexDirection: m ? "column" : "row", gap: m ? 6 : 20, alignItems: m ? "flex-start" : "baseline" }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: COLORS.tealDeep, whiteSpace: "nowrap" }}>{next.dateLabel.replace(/^\w+, /, "")}</span>
          <h3 style={{ margin: 0, fontWeight: 700, fontSize: m ? 22 : 28, letterSpacing: "-0.02em", lineHeight: 1.2, color: COLORS.ink }}>{next.title}</h3>
        </div>
        <p style={{ margin: "14px 0 0", fontWeight: 300, fontSize: m ? 15 : 16.5, lineHeight: 1.6, color: COLORS.muted }}>{next.heroCopy}</p>
        <div style={{ marginTop: 22 }}>
          <a href={next.registrationUrl} style={{ display: "inline-block", fontSize: 13, fontWeight: 600, color: "#000", background: COLORS.teal, borderRadius: 999, padding: "12px 24px", textDecoration: "none" }}>Save my seat</a>
        </div>
      </div>
    </Wrap>
  );
}

export default function App({ slug }) {
  const webinar = React.useMemo(() => getWebinar(slug), [slug]);
  return (
    <WebinarContext.Provider value={webinar}>
      <Hero /><NextSteps /><WatchWhileYouWait /><UpcomingWebinar />
    </WebinarContext.Provider>
  );
}
