import React from 'react';
import LogoSlider from './LogoSlider.jsx';
import { CONFIG, COLORS } from './webinarConfig.js';

// The countdown strip is NOT rendered here — it sits above the site header, so
// registration.astro renders <WebinarTopBar /> in its sticky stack instead.

function useM(bp = 760) {
  const [m, setM] = React.useState(window.innerWidth <= bp);
  React.useEffect(() => {
    const on = () => setM(window.innerWidth <= bp);
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, [bp]);
  return m;
}

function Wrap({ children, bg = "#fff" }) {
  const m = useM();
  return (
    <section style={{ background: bg }}>
      <div style={{ maxWidth: 1312, margin: "0 auto", padding: m ? "64px 20px" : "100px 64px" }}>
        {children}
      </div>
    </section>
  );
}

function H2({ children }) {
  const m = useM();
  return (
    <h2 style={{ fontWeight: 700, fontSize: m ? 30 : 48, letterSpacing: "-0.03em", lineHeight: 1.1, margin: 0, color: COLORS.ink }}>
      {children}
    </h2>
  );
}

function VideoPlaceholder({ label }) {
  return (
    <div style={{ position: "relative", width: "100%", aspectRatio: "16/9", borderRadius: 20, overflow: "hidden", background: "linear-gradient(160deg, #1a1b1f, #000)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span style={{ width: 72, height: 72, borderRadius: "50%", background: COLORS.teal, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="#000"><path d="M8 5v14l11-7z" /></svg>
      </span>
      <span style={{ position: "absolute", bottom: 18, left: 20, fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.55)" }}>{label}</span>
    </div>
  );
}

/* Falls back to the speaker's initials if the photo 404s, so a missing or
   renamed asset degrades to the old avatar instead of a broken image. */
function SpeakerAvatar({ size = 44 }) {
  const [failed, setFailed] = React.useState(false);
  const base = { width: size, height: size, borderRadius: "50%", flexShrink: 0 };

  if (failed || !CONFIG.speakerPhoto) {
    return <span style={{ ...base, background: "#f4f4f4", color: "#000", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13 }}>{CONFIG.speakerInitials}</span>;
  }
  return <img src={CONFIG.speakerPhoto} alt={CONFIG.speakerName} width={size} height={size} onError={() => setFailed(true)} style={{ ...base, objectFit: "cover", display: "block" }} />;
}

/* Mobile reorders the hero deliberately: headline, then the video, then the
   CTA. Supporting copy, schedule and speaker follow underneath. On desktop the
   same pieces sit in the usual two columns. The two branches share the piece
   definitions below so the copy can't drift between layouts. */
function Hero() {
  const m = useM();
  const scrollToForm = () => document.getElementById("register")?.scrollIntoView({ behavior: "smooth" });

  const badge = (
    <span style={{ display: "inline-block", fontSize: m ? 11 : 12, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", padding: "6px 12px", borderRadius: 999, background: "rgba(255,255,255,0.1)", color: "#fff" }}>Webinar · October 20</span>
  );
  const headline = (
    <h1 style={{ fontWeight: 700, fontSize: m ? 30 : 56, lineHeight: 1.1, letterSpacing: "-0.02em", margin: m ? "16px 0 0" : "20px 0 0" }}>{CONFIG.title}</h1>
  );
  const media = (
    <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
      <VideoPlaceholder label="Webinar Preview" />
      <LogoSlider />
    </div>
  );
  const cta = (
    <button onClick={scrollToForm} style={{ background: COLORS.teal, color: "#000", border: "none", borderRadius: 999, padding: m ? "15px 28px" : "14px 28px", fontWeight: 600, fontSize: m ? 16 : 15, cursor: "pointer", width: m ? "100%" : "auto" }}>Save My Seat</button>
  );
  const copy = (
    <p style={{ margin: 0, maxWidth: 480, fontWeight: 300, fontSize: m ? 15 : 18, lineHeight: 1.55, color: "rgba(255,255,255,0.55)" }}>See how automated sample handling and video-extensometer strain capture cut technician time by up to 95% — and what it takes to bring it into your lab.</p>
  );
  const schedule = (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 16px", fontSize: 14, color: "rgba(255,255,255,0.65)" }}>
      <span>{CONFIG.dateLabel}</span><span style={{ color: "rgba(255,255,255,0.3)" }}>·</span><span>{CONFIG.timeLabel}</span>
    </div>
  );
  const speaker = (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <SpeakerAvatar />
      <div>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{CONFIG.speakerName}</div>
        <div style={{ fontSize: 12, fontWeight: 300, color: "rgba(255,255,255,0.5)" }}>{CONFIG.speakerTitle}</div>
      </div>
    </div>
  );

  if (m) {
    return (
      <section style={{ background: "#000", color: "#fff" }}>
        <div style={{ padding: "32px 20px 48px", display: "flex", flexDirection: "column", gap: 20 }}>
          <div>{badge}{headline}</div>
          {media}
          {cta}
          {copy}
          {schedule}
          {speaker}
        </div>
      </section>
    );
  }

  return (
    <section style={{ background: "#000", color: "#fff" }}>
      <div style={{ maxWidth: 1312, margin: "0 auto", padding: "72px 64px 100px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56, alignItems: "center" }}>
        <div>
          {badge}
          {headline}
          <div style={{ marginTop: 20 }}>{copy}</div>
          <div style={{ marginTop: 28 }}>{schedule}</div>
          <div style={{ marginTop: 32 }}>{cta}</div>
          <div style={{ marginTop: 40 }}>{speaker}</div>
        </div>
        {media}
      </div>
    </section>
  );
}

function Agenda() {
  const m = useM();
  const items = [
    ["01", "Automated Sample Handling", "How robotic loading and measurement remove manual variability from tensile testing."],
    ["02", "Video-Extensometer Strain Capture", "Setting up automated strain measurement compliant with ASTM D638 and ISO 527."],
    ["03", "From Test to Data", "Getting results into your LIMS or ERP without manual re-entry."]
  ];

  return (
    <Wrap bg={COLORS.gray100}>
      <H2>What we'll cover</H2>
      <div style={{ marginTop: m ? 28 : 44, display: "grid", gridTemplateColumns: m ? "1fr" : "repeat(3, 1fr)", gap: m ? 24 : 32 }}>
        {items.map(([n, t, d]) => (
          <div key={n}>
            <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.tealDeep, letterSpacing: "0.1em" }}>{n}</div>
            <h3 style={{ fontWeight: 700, fontSize: 20, margin: "10px 0 0", color: COLORS.ink }}>{t}</h3>
            <p style={{ marginTop: 8, fontSize: 15, lineHeight: 1.55, fontWeight: 300, color: COLORS.muted }}>{d}</p>
          </div>
        ))}
      </div>
    </Wrap>
  );
}

/* Compact audience section. Uses two design-system primitives rather than
   bespoke ornament: the bordered card (.lc-icard) for the four roles, and the
   subtle uppercase chip (.lc-badge-subtle) for the industry list. No icons —
   at this density they read as clutter. */
function WhoIsThisFor() {
  const m = useM();
  const roles = [
    ["Lab Managers", "QA labs in manufacturing or R&D"],
    ["Quality Directors", "Testing compliance and cost"],
    ["R&D Engineers", "New materials and formulations"],
    ["Operations Leaders", "Lab throughput and efficiency"],
  ];
  const industries = [
    "Rubber & Elastomers",
    "Plastics & Polymers",
    "Automotive Suppliers",
    "Aerospace",
    "Advanced Composites",
    "Contract Manufacturers",
  ];

  const badge = {
    display: "inline-flex",
    background: COLORS.gray100,
    color: COLORS.muted,
    borderRadius: 4,
    padding: "5px 12px",
    fontWeight: 700,
    fontSize: 11,
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    lineHeight: 1,
  };

  return (
    <section style={{ background: "#fff" }}>
      <div style={{ maxWidth: 1312, margin: "0 auto", padding: m ? "48px 20px" : "72px 64px" }}>
        <span style={badge}>Audience</span>
        <h2 style={{ fontWeight: 700, fontSize: m ? 26 : 34, letterSpacing: "-0.02em", lineHeight: 1.15, margin: "14px 0 0", color: COLORS.ink }}>Who is this for?</h2>
        <p style={{ margin: "10px 0 0", maxWidth: 620, fontWeight: 300, fontSize: m ? 15 : 16, lineHeight: 1.55, color: COLORS.muted }}>
          Labs testing elastomers, plastics and composites that want to cut manual work without giving up data quality.
        </p>

        <div style={{ marginTop: m ? 28 : 36, display: "grid", gridTemplateColumns: m ? "1fr" : "repeat(4, 1fr)", gap: m ? 10 : 16, alignItems: "stretch" }}>
          {roles.map(([title, desc]) => (
            <div key={title} style={{ display: "flex", flexDirection: "column", gap: 4, padding: m ? "14px 16px" : "18px 20px", borderRadius: 14, background: "#fff", border: `1px solid ${COLORS.line}`, boxShadow: "0 1px 0 rgba(0,0,0,0.04)" }}>
              <div style={{ fontSize: m ? 14 : 15, fontWeight: 600, letterSpacing: "-0.01em", color: COLORS.ink }}>{title}</div>
              <div style={{ fontSize: m ? 12.5 : 13.5, fontWeight: 300, lineHeight: 1.45, color: COLORS.muted }}>{desc}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: m ? 24 : 32, display: "flex", alignItems: "center", flexWrap: "wrap", gap: m ? 8 : 10 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(29,29,31,0.45)", marginRight: 4 }}>Industries</span>
          {industries.map((name) => (
            <span key={name} style={{ fontSize: m ? 12.5 : 13, fontWeight: 500, color: COLORS.ink, background: COLORS.gray100, border: `1px solid ${COLORS.line}`, borderRadius: 999, padding: m ? "6px 12px" : "7px 14px", lineHeight: 1 }}>{name}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* Mirrors the FAQ accordion: native <details name> gives exclusive single-open
   with no JS and stays crawlable. Collapsed rows still carry the date and time
   so the schedule is readable without opening anything. */
function UpcomingWebinars() {
  const m = useM();
  const items = [
    {
      date: "October 8, 2026",
      time: "2:00 PM EST · 45 min",
      title: "Rubber Testing 101: ASTM D412 & ISO 37 for QA Teams",
      body: "A ground-up walkthrough of the two standards most rubber QA teams live in — specimen prep, grip selection, and the strain-rate details that quietly cost you repeatability.",
      points: ["Die C specimen prep and common defects", "Grip slip: spotting it in the curve", "Reporting tensile strength and elongation at break"],
      href: "/webinar/rubber-testing",
    },
    {
      date: "October 29, 2026",
      time: "2:00 PM EST · 60 min",
      title: "Cutting Technician Time: A Live CubeOne Walkthrough",
      body: "An unedited run of a full sample set on CubeOne, from loading the magazine to exporting results — including what the operator still has to do.",
      points: ["Loading and running an unattended batch", "Where the 95% time saving actually comes from", "Live Q&A with the engineering team"],
      href: "/webinar/cubeone-walkthrough",
    },
    {
      date: "November 12, 2026",
      time: "2:00 PM EST · 45 min",
      title: "Getting Clean Data Out of Your Testing Lab",
      body: "Most labs lose more time to transcription and rework than to testing. This session covers getting results into a LIMS or ERP without manual re-entry.",
      points: ["Structuring results for downstream systems", "Audit trails that survive a customer audit", "Cutting manual re-entry from the workflow"],
      href: "/webinar/clean-data",
    },
  ];

  return (
    <Wrap>
      <H2>Upcoming webinars</H2>
      <div style={{ marginTop: m ? 24 : 36 }}>
        {items.map((item, i) => (
          <details key={item.href} className="wbn-item" name="upcoming-webinars" open={i === 0}>
            <summary className="wbn-summary">
              <span className="wbn-meta">
                <span className="wbn-date">{item.date}</span>
                <span className="wbn-time">{item.time}</span>
              </span>
              <span className="wbn-title">{item.title}</span>
              <span className="wbn-icon">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 7h12" stroke={COLORS.ink} strokeWidth="1.6" strokeLinecap="round" />
                  <path className="wbn-vbar" d="M7 1v12" stroke={COLORS.ink} strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </span>
            </summary>
            <div className="wbn-body">
              <p className="wbn-text">{item.body}</p>
              <ul className="wbn-points">
                {item.points.map((pt) => <li key={pt}>{pt}</li>)}
              </ul>
              <a href={item.href} className="wbn-cta">Register</a>
            </div>
          </details>
        ))}
      </div>
      <style>{`
        .wbn-item { border-bottom: 1px solid ${COLORS.line}; }
        .wbn-summary { list-style: none; cursor: pointer; display: flex; align-items: center; gap: 24px; padding: 20px 0; }
        .wbn-summary::-webkit-details-marker { display: none; }
        .wbn-meta { display: flex; flex-direction: column; gap: 3px; min-width: 168px; flex: none; }
        .wbn-date { font-size: 13px; font-weight: 600; color: ${COLORS.ink}; }
        .wbn-time { font-size: 12px; font-weight: 300; color: ${COLORS.muted}; }
        .wbn-title { flex: 1; font-size: 17px; font-weight: 500; letter-spacing: -0.01em; color: ${COLORS.ink}; }
        .wbn-icon { width: 32px; height: 32px; flex: none; border-radius: 9999px; background: ${COLORS.gray100}; display: inline-flex; align-items: center; justify-content: center; }
        .wbn-vbar { opacity: 1; transition: opacity .2s ease; }
        .wbn-item[open] .wbn-vbar { opacity: 0; }
        .wbn-body { padding: 0 56px 24px 192px; }
        .wbn-text { margin: 0; max-width: 640px; font-size: 15px; font-weight: 300; line-height: 1.6; color: ${COLORS.muted}; }
        .wbn-points { margin: 14px 0 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 7px; }
        .wbn-points li { position: relative; padding-left: 18px; font-size: 14px; font-weight: 300; line-height: 1.5; color: ${COLORS.muted}; }
        .wbn-points li::before { content: ""; position: absolute; left: 0; top: 8px; width: 6px; height: 6px; border-radius: 50%; background: ${COLORS.teal}; }
        .wbn-cta { display: inline-block; margin-top: 20px; font-size: 13px; font-weight: 600; color: #000; background: ${COLORS.teal}; border-radius: 999px; padding: 10px 20px; text-decoration: none; }

        @media (max-width: 760px) {
          .wbn-summary { gap: 14px; align-items: flex-start; padding: 18px 0; flex-wrap: wrap; }
          .wbn-meta { flex-direction: row; align-items: baseline; gap: 8px; min-width: 0; width: calc(100% - 46px); }
          .wbn-title { flex: 1 0 100%; font-size: 15.5px; order: 3; }
          .wbn-icon { margin-left: auto; }
          .wbn-body { padding: 0 0 20px; }
        }
      `}</style>
    </Wrap>
  );
}

const fieldLabel = { fontSize: 12, fontWeight: 600, color: COLORS.muted, display: "block", marginBottom: 6 };
const fieldInput = { width: "100%", padding: "12px 14px", borderRadius: 10, border: `1px solid ${COLORS.line}`, background: "#fff", fontSize: 14, fontFamily: "inherit", color: COLORS.ink, outline: "none" };

function Field({ label, children }) {
  return <div><label style={fieldLabel}>{label}</label>{children}</div>;
}

function DetailsModal({ onClose, onComplete }) {
  const m = useM();
  const [d, setD] = React.useState({ website: "", role: "", industry: "", materials: "", volume: "", location: "" });
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState("");

  const set = (k) => (e) => setD((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    try {
      onComplete(d);
    } catch (err) {
      console.error("Error:", err);
      setError("Registration failed. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: m ? 12 : 20 }} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 30px 60px rgba(0,0,0,0.25)", padding: m ? "26px 20px 24px" : "36px 36px 32px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <h3 style={{ margin: 0, fontWeight: 700, fontSize: 24, letterSpacing: "-0.01em", color: COLORS.ink }}>A few more details</h3>
            <p style={{ margin: "8px 0 0", fontSize: 14, fontWeight: 300, color: COLORS.muted, maxWidth: 420 }}>Helps us tailor the session to your lab.</p>
          </div>
          <button onClick={onClose} aria-label="Close" style={{ all: "unset", cursor: "pointer", padding: 6 }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke={COLORS.muted} strokeWidth="2" strokeLinecap="round" /></svg></button>
        </div>
        <form onSubmit={handleSubmit} style={{ marginTop: 26, display: "flex", flexDirection: "column", gap: 18 }}>
          {error && <div style={{ padding: "12px 14px", borderRadius: 10, background: "#fee", color: "#c33", fontSize: 14 }}>{error}</div>}
          <Field label="Company Website"><div style={{ position: "relative" }}><div style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 14, fontWeight: 600, color: COLORS.muted, pointerEvents: "none" }}>https://</div><input type="text" required placeholder="yourcompany.com" style={{ ...fieldInput, paddingLeft: 90 }} value={d.website} onChange={set("website")} /></div></Field>
          <div style={{ display: "grid", gridTemplateColumns: m ? "1fr" : "1fr 1fr", gap: 16 }}>
            <Field label="Role"><select required style={fieldInput} value={d.role} onChange={set("role")}><option value="" disabled>Select role</option><option>Lab Manager</option><option>Quality Director</option><option>R&D Engineer</option><option>VP Operations</option><option>Plant Manager</option><option>Other</option></select></Field>
            <Field label="Industry"><select required style={fieldInput} value={d.industry} onChange={set("industry")}><option value="" disabled>Select industry</option><option>Rubber & Elastomers</option><option>Plastics & Polymers</option><option>Automotive</option><option>Aerospace</option><option>Composites</option><option>Other</option></select></Field>
          </div>
          <Field label="Materials You Test"><input type="text" placeholder="e.g. EPDM, Nylon 66, TPU" style={fieldInput} value={d.materials} onChange={set("materials")} /></Field>
          <div style={{ display: "grid", gridTemplateColumns: m ? "1fr" : "1fr 1fr", gap: 16 }}>
            <Field label="Daily Test Volume"><select required style={fieldInput} value={d.volume} onChange={set("volume")}><option value="" disabled>Select range</option><option>1–10 samples/day</option><option>11–50 samples/day</option><option>51–150 samples/day</option><option>150+ samples/day</option></select></Field>
            <Field label="Laboratory Location"><input type="text" required placeholder="City, Country" style={fieldInput} value={d.location} onChange={set("location")} /></Field>
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
            <button type="button" onClick={onClose} style={{ flex: "none", padding: "13px 20px", borderRadius: 999, border: `1px solid ${COLORS.line}`, background: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer", color: COLORS.ink }}>Back</button>
            <button type="submit" disabled={isSubmitting} style={{ flex: 1, padding: "13px 20px", borderRadius: 999, border: "none", background: isSubmitting ? "#ccc" : COLORS.teal, fontWeight: 600, fontSize: 14, cursor: isSubmitting ? "not-allowed" : "pointer", color: "#000" }}>{isSubmitting ? "Registering..." : "Complete Registration"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RegisterSection() {
  const m = useM();
  const [basic, setBasic] = React.useState({ name: "", email: "", company: "" });
  const [showModal, setShowModal] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState("");

  const set = (k) => (e) => setBasic((p) => ({ ...p, [k]: e.target.value }));

  async function complete(details) {
    setIsSubmitting(true);
    setError("");
    const website = details.website.startsWith('http') ? details.website : `https://${details.website}`;
    const payload = { ...basic, ...details, website, webinar: CONFIG.title, timestamp: new Date().toISOString() };
    try {
      console.log("Submitting to:", CONFIG.submitEndpoint);
      const response = await fetch(CONFIG.submitEndpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      console.log("Response status:", response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("API error:", errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log("Registration successful:", data);
      setTimeout(() => {
        window.location.href = CONFIG.thankYouUrl;
      }, 500);
    } catch (err) {
      console.error("Registration submit failed:", err);
      setError("Registration failed. Please try again.");
      setIsSubmitting(false);
      setShowModal(false);
    }
  }

  const seatsUsed = CONFIG.seatsTotal - CONFIG.seatsLeft;
  const percentFilled = (seatsUsed / CONFIG.seatsTotal) * 100;

  return (
    <Wrap bg={COLORS.gray100}>
      <div id="register" style={{ display: "grid", gridTemplateColumns: m ? "1fr" : "1fr 1fr", gap: m ? 32 : 64, alignItems: "start" }}>
        <div>
          <H2>Register for the webinar</H2>
          <div style={{ marginTop: 28, borderRadius: 16, background: "#fff", padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}><span style={{ color: COLORS.muted }}>Date</span><span style={{ fontWeight: 600, color: COLORS.ink }}>{CONFIG.dateLabel}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}><span style={{ color: COLORS.muted }}>Time</span><span style={{ fontWeight: 600, color: COLORS.ink }}>{CONFIG.timeLabel}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}><span style={{ color: COLORS.muted }}>Format</span><span style={{ fontWeight: 600, color: COLORS.ink }}>Live + recording</span></div>
            
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 600, marginBottom: 8, color: COLORS.ink }}>
                <span>Seats Available</span>
                <span style={{ color: COLORS.tealDeep }}>{CONFIG.seatsLeft} left</span>
              </div>
              <div style={{ width: "100%", height: 14, borderRadius: 8, background: "rgba(0,0,0,0.1)", overflow: "hidden" }}>
                <div style={{
                  height: "100%",
                  width: `${percentFilled}%`,
                  background: `linear-gradient(90deg, #22c55e 0%, #f59e0b 50%, #ef4444 100%)`,
                  transition: "width 0.3s ease",
                  borderRadius: 8,
                  boxShadow: "0 0 12px rgba(239, 68, 68, 0.3)"
                }} />
              </div>
              <div style={{ fontSize: 12, marginTop: 6, color: COLORS.muted }}>
                {seatsUsed} / {CONFIG.seatsTotal} filled
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); setShowModal(true); }} style={{ background: "#fff", borderRadius: 20, boxShadow: "0 1px 0 rgba(0,0,0,0.05), 0 20px 40px rgba(0,0,0,0.08)", padding: 32, display: "flex", flexDirection: "column", gap: 18 }}>
          {error && <div style={{ padding: "12px 14px", borderRadius: 10, background: "#fee", color: "#c33", fontSize: 14 }}>{error}</div>}
          <Field label="Full Name"><input type="text" required placeholder="Jane Doe" style={fieldInput} value={basic.name} onChange={set("name")} /></Field>
          <Field label="Work Email"><input type="email" required placeholder="jane@company.com" style={fieldInput} value={basic.email} onChange={set("email")} /></Field>
          <Field label="Company Name"><input type="text" required placeholder="Company Inc." style={fieldInput} value={basic.company} onChange={set("company")} /></Field>
          <button type="submit" disabled={isSubmitting} style={{ marginTop: 4, padding: "14px 20px", borderRadius: 999, border: "none", background: isSubmitting ? "#ccc" : COLORS.teal, fontWeight: 600, fontSize: 15, cursor: isSubmitting ? "not-allowed" : "pointer", color: "#000" }}>{isSubmitting ? "Loading..." : "Register for Webinar"}</button>
        </form>
      </div>
      {showModal && <DetailsModal onClose={() => setShowModal(false)} onComplete={complete} />}
    </Wrap>
  );
}

export default function App() {
  return <div><Hero /><Agenda /><WhoIsThisFor /><UpcomingWebinars /><RegisterSection /></div>;
}
