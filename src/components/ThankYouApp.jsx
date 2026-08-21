import React from 'react';

const CONFIG = {
  title: "Automating ASTM D638 & ISO 527 Tensile Testing",
  dateLabel: "Thursday, October 20, 2026",
  timeLabel: "2:00 PM EST · 60 minutes",
  calendarLinks: {
    google: "https://calendar.google.com/calendar/u/0/r/eventedit?text=Automating+ASTM+D638+%26+ISO+527+Tensile+Testing&dates=20261020T180000Z/20261020T190000Z",
    outlook: "https://outlook.live.com/calendar/0/deeplink/compose?subject=Automating%20ASTM%20D638%20%26%20ISO%20527%20Tensile%20Testing&startdt=2026-10-20T18:00:00&enddt=2026-10-20T19:00:00",
    apple: "/ics/webinar-oct20.ics"
  },
  exploreCtaLabel: "Explore CubeTen",
  exploreCtaHref: "/products"
};

const COLORS = { teal: "#17ddc5", tealDeep: "#0d9488", ink: "#1d1d1f", muted: "#86868b", gray100: "#f5f5f7" };

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

function VideoPlaceholder({ label }) {
  return (
    <div style={{ position: "relative", aspectRatio: "16/9", borderRadius: 20, overflow: "hidden", background: "linear-gradient(160deg, #1a1b1f, #000)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span style={{ width: 72, height: 72, borderRadius: "50%", background: COLORS.teal, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="#000"><path d="M8 5v14l11-7z" /></svg>
      </span>
      <span style={{ position: "absolute", bottom: 18, left: 20, fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.55)" }}>{label}</span>
    </div>
  );
}

function Hero() {
  const m = useM();
  return (
    <section style={{ background: "#000", color: "#fff" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: m ? "56px 20px 48px" : "88px 64px 64px", textAlign: "center" }}>
        <span style={{ width: 56, height: 56, borderRadius: "50%", background: COLORS.teal, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4 10-11" stroke="#000" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </span>
        <h1 style={{ fontWeight: 700, fontSize: m ? 32 : 48, letterSpacing: "-0.02em", lineHeight: 1.1, margin: 0 }}>You're registered.</h1>
        <p style={{ margin: "18px auto 0", maxWidth: 520, fontWeight: 300, fontSize: m ? 15 : 18, lineHeight: 1.55, color: "rgba(255,255,255,0.55)" }}>A confirmation email with your calendar invite and join link is on its way to your inbox.</p>
        <div style={{ marginTop: 32, display: "inline-flex", flexDirection: "column", gap: 6, padding: "18px 28px", borderRadius: 14, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <span style={{ fontWeight: 600, fontSize: 15 }}>{CONFIG.title}</span>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>{CONFIG.dateLabel} · {CONFIG.timeLabel}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 28, flexWrap: "wrap" }}>
          <a href={CONFIG.calendarLinks.google} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, fontWeight: 500, color: "#fff", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 999, padding: "10px 18px", textDecoration: "none" }}>Google Calendar</a>
          <a href={CONFIG.calendarLinks.outlook} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, fontWeight: 500, color: "#fff", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 999, padding: "10px 18px", textDecoration: "none" }}>Outlook</a>
          <a href={CONFIG.calendarLinks.apple} style={{ fontSize: 13, fontWeight: 500, color: "#fff", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 999, padding: "10px 18px", textDecoration: "none" }}>Apple Calendar</a>
        </div>
      </div>
    </section>
  );
}

function OnDemand() {
  const m = useM();
  return (
    <Wrap bg={COLORS.gray100}>
      <div style={{ display: "grid", gridTemplateColumns: m ? "1fr" : "1fr 1fr", gap: m ? 28 : 56, alignItems: "center" }}>
        <div>
          <H2>Watch while you wait</H2>
          <p style={{ marginTop: 16, fontSize: m ? 15 : 17, lineHeight: 1.6, fontWeight: 300, color: COLORS.muted, maxWidth: 440 }}>A short on-demand walkthrough of automated sample handling — a preview of what we'll cover live.</p>
        </div>
        <VideoPlaceholder label="On-Demand Preview" />
      </div>
    </Wrap>
  );
}

function NextSteps() {
  const m = useM();
  const steps = [
    ["01", "Check your inbox", "Your confirmation email has the calendar invite and join link."],
    ["02", "Save the date", "Add it to your calendar so it doesn't slip past you."],
    ["03", "Join 5 minutes early", "We'll open the room ahead of time for a live Q&A warm-up."]
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
      <div style={{ marginTop: m ? 40 : 56, textAlign: "center" }}>
        <a href={CONFIG.exploreCtaHref} style={{ display: "inline-block", background: "#1a1b1f", color: "#fff", borderRadius: 999, padding: "14px 28px", fontWeight: 600, fontSize: 14, textTransform: "uppercase", letterSpacing: "0.05em", textDecoration: "none" }}>{CONFIG.exploreCtaLabel}</a>
      </div>
    </Wrap>
  );
}

export default function App() {
  return <div><Hero /><OnDemand /><NextSteps /></div>;
}
