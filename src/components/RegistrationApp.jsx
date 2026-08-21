import React from 'react';
import LogoSlider from './LogoSlider.jsx';

const CONFIG = {
  title: "Automating ASTM D638 & ISO 527 Tensile Testing",
  dateLabel: "Thursday, October 20, 2026",
  timeLabel: "2:00 PM EST · 60 minutes",
  targetISO: "2026-10-20T18:00:00Z",
  seatsTotal: 200,
  seatsLeft: 87,
  speakerName: "Elena Cho",
  speakerTitle: "Director of Applications Engineering, LabsCubed",
  speakerInitials: "EC",
  thankYouUrl: "/webinar/thank-you",
  submitEndpoint: "/api/webinar/register"
};

const COLORS = {
  teal: "#17ddc5",
  tealDeep: "#0d9488",
  ink: "#1d1d1f",
  muted: "#86868b",
  gray100: "#f5f5f7",
  line: "rgba(0,0,0,0.1)"
};

function useM(bp = 760) {
  const [m, setM] = React.useState(window.innerWidth <= bp);
  React.useEffect(() => {
    const on = () => setM(window.innerWidth <= bp);
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, [bp]);
  return m;
}

function useCountdown(targetISO) {
  const target = React.useMemo(() => new Date(targetISO).getTime(), [targetISO]);
  const [left, setLeft] = React.useState(target - Date.now());
  React.useEffect(() => {
    const t = setInterval(() => setLeft(target - Date.now()), 1000);
    return () => clearInterval(t);
  }, [target]);
  return Math.max(left, 0);
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

function TopBar() {
  const m = useM();
  const left = useCountdown(CONFIG.targetISO);
  const d = Math.floor(left / 86400000);
  const h = Math.floor((left % 86400000) / 3600000);
  const mnt = Math.floor((left % 3600000) / 60000);
  const s = Math.floor((left % 60000) / 1000);
  const pad = (n) => String(n).padStart(2, "0");

  return (
    <div style={{ background: COLORS.teal, borderBottom: `3px solid ${COLORS.tealDeep}` }}>
      <div style={{ maxWidth: 1312, margin: "0 auto", padding: m ? "16px 20px" : "16px 64px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: m ? 6 : 8 }}>
          <span style={{ fontSize: m ? 12 : 13, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#000", opacity: 0.9 }}>Starts in</span>
          <div style={{ display: "flex", gap: m ? 2 : 4 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontVariantNumeric: "tabular-nums", fontWeight: 900, fontSize: m ? 14 : 24, background: "#000", borderRadius: 6, padding: m ? "2px 3px" : "4px 6px", color: "#fff", lineHeight: 1 }}>{pad(d)}</div>
              <div style={{ fontSize: 8, fontWeight: 600, color: "#000", opacity: 0.9, marginTop: 2 }}>D</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontVariantNumeric: "tabular-nums", fontWeight: 900, fontSize: m ? 14 : 24, background: "#000", borderRadius: 6, padding: m ? "2px 3px" : "4px 6px", color: "#fff", lineHeight: 1 }}>{pad(h)}</div>
              <div style={{ fontSize: 8, fontWeight: 600, color: "#000", opacity: 0.9, marginTop: 2 }}>H</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontVariantNumeric: "tabular-nums", fontWeight: 900, fontSize: m ? 14 : 24, background: "#000", borderRadius: 6, padding: m ? "2px 3px" : "4px 6px", color: "#fff", lineHeight: 1 }}>{pad(mnt)}</div>
              <div style={{ fontSize: 8, fontWeight: 600, color: "#000", opacity: 0.9, marginTop: 2 }}>M</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontVariantNumeric: "tabular-nums", fontWeight: 900, fontSize: m ? 14 : 24, background: "#000", borderRadius: 6, padding: m ? "2px 3px" : "4px 6px", color: "#fff", lineHeight: 1 }}>{pad(s)}</div>
              <div style={{ fontSize: 8, fontWeight: 600, color: "#000", opacity: 0.9, marginTop: 2 }}>S</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Hero() {
  const m = useM();
  const scrollToForm = () => document.getElementById("register")?.scrollIntoView({ behavior: "smooth" });

  return (
    <section style={{ background: "#000", color: "#fff" }}>
      <div style={{ maxWidth: 1312, margin: "0 auto", padding: m ? "48px 20px 64px" : "80px 64px 100px", display: "grid", gridTemplateColumns: m ? "1fr" : "1fr 1fr", gap: m ? 32 : 56, alignItems: "center" }}>
        <div>
          <span style={{ display: "inline-block", fontSize: 12, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", padding: "6px 12px", borderRadius: 999, background: "rgba(255,255,255,0.1)", color: "#fff" }}>Webinar · October 20</span>
          <h1 style={{ fontWeight: 700, fontSize: m ? 34 : 56, lineHeight: 1.08, letterSpacing: "-0.02em", margin: "20px 0 0" }}>{CONFIG.title}</h1>
          <p style={{ margin: "20px 0 0", maxWidth: 480, fontWeight: 300, fontSize: m ? 15 : 18, lineHeight: 1.55, color: "rgba(255,255,255,0.55)" }}>See how automated sample handling and video-extensometer strain capture cut technician time by up to 95% — and what it takes to bring it into your lab.</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 20px", marginTop: 28, fontSize: 14, color: "rgba(255,255,255,0.65)" }}><span>{CONFIG.dateLabel}</span><span style={{ color: "rgba(255,255,255,0.3)" }}>·</span><span>{CONFIG.timeLabel}</span></div>
          <div style={{ marginTop: 32 }}><button onClick={scrollToForm} style={{ background: COLORS.teal, color: "#000", border: "none", borderRadius: 999, padding: "14px 28px", fontWeight: 600, fontSize: 15, cursor: "pointer" }}>Save My Seat</button></div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 40 }}>
            <span style={{ width: 40, height: 40, borderRadius: "50%", background: "#f4f4f4", color: "#000", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13 }}>{CONFIG.speakerInitials}</span>
            <div><div style={{ fontSize: 14, fontWeight: 600 }}>{CONFIG.speakerName}</div><div style={{ fontSize: 12, fontWeight: 300, color: "rgba(255,255,255,0.5)" }}>{CONFIG.speakerTitle}</div></div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 0, minWidth: 0 }}>
          <VideoPlaceholder label="Webinar Preview" />
          <LogoSlider />
        </div>
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

function UpcomingWebinars() {
  const m = useM();
  const items = [
    ["October 8, 2026", "Rubber Testing 101: ASTM D412 & ISO 37 for QA Teams", "/webinar/rubber-testing"],
    ["October 29, 2026", "Cutting Technician Time: A Live CubeOne Walkthrough", "/webinar/cubeone-walkthrough"],
    ["November 12, 2026", "Getting Clean Data Out of Your Testing Lab", "/webinar/clean-data"]
  ];

  return (
    <Wrap>
      <H2>Upcoming webinars</H2>
      <div style={{ marginTop: m ? 28 : 40, display: "flex", flexDirection: "column" }}>
        {items.map(([date, title, href], i) => (
          <div key={i} style={{ display: "flex", flexDirection: m ? "column" : "row", alignItems: m ? "flex-start" : "center", justifyContent: "space-between", gap: m ? 12 : 24, padding: "24px 0", borderBottom: i < items.length - 1 ? `1px solid ${COLORS.line}` : "none" }}>
            <div style={{ display: "flex", flexDirection: m ? "column" : "row", alignItems: m ? "flex-start" : "center", gap: m ? 6 : 24, flex: 1 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.muted, minWidth: 140 }}>{date}</span>
              <span style={{ fontSize: 17, fontWeight: 600, color: COLORS.ink }}>{title}</span>
            </div>
            <a href={href} style={{ flex: "none", fontSize: 13, fontWeight: 600, color: "#000", background: COLORS.teal, borderRadius: 999, padding: "10px 20px", textDecoration: "none" }}>Register</a>
          </div>
        ))}
      </div>
    </Wrap>
  );
}

const fieldLabel = { fontSize: 12, fontWeight: 600, color: COLORS.muted, display: "block", marginBottom: 6 };
const fieldInput = { width: "100%", padding: "12px 14px", borderRadius: 10, border: `1px solid ${COLORS.line}`, background: "#fff", fontSize: 14, fontFamily: "inherit", color: COLORS.ink, outline: "none" };

function Field({ label, children }) {
  return <div><label style={fieldLabel}>{label}</label>{children}</div>;
}

function DetailsModal({ onClose, onComplete }) {
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
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 30px 60px rgba(0,0,0,0.25)", padding: "36px 36px 32px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <h3 style={{ margin: 0, fontWeight: 700, fontSize: 24, letterSpacing: "-0.01em", color: COLORS.ink }}>A few more details</h3>
            <p style={{ margin: "8px 0 0", fontSize: 14, fontWeight: 300, color: COLORS.muted, maxWidth: 420 }}>Helps us tailor the session to your lab.</p>
          </div>
          <button onClick={onClose} aria-label="Close" style={{ all: "unset", cursor: "pointer", padding: 6 }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke={COLORS.muted} strokeWidth="2" strokeLinecap="round" /></svg></button>
        </div>
        <form onSubmit={handleSubmit} style={{ marginTop: 26, display: "flex", flexDirection: "column", gap: 18 }}>
          {error && <div style={{ padding: "12px 14px", borderRadius: 10, background: "#fee", color: "#c33", fontSize: 14 }}>{error}</div>}
          <Field label="Company Website"><input type="url" required placeholder="https://yourcompany.com" style={fieldInput} value={d.website} onChange={set("website")} /></Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label="Role"><select required style={fieldInput} value={d.role} onChange={set("role")}><option value="" disabled>Select role</option><option>Lab Manager</option><option>Quality Director</option><option>R&D Engineer</option><option>VP Operations</option><option>Plant Manager</option><option>Other</option></select></Field>
            <Field label="Industry"><select required style={fieldInput} value={d.industry} onChange={set("industry")}><option value="" disabled>Select industry</option><option>Rubber & Elastomers</option><option>Plastics & Polymers</option><option>Automotive</option><option>Aerospace</option><option>Composites</option><option>Other</option></select></Field>
          </div>
          <Field label="Materials You Test"><input type="text" required placeholder="e.g. EPDM, Nylon 66, TPU" style={fieldInput} value={d.materials} onChange={set("materials")} /></Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
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
    const payload = { ...basic, ...details, webinar: CONFIG.title, timestamp: new Date().toISOString() };
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
  return <div><TopBar /><Hero /><Agenda /><UpcomingWebinars /><RegisterSection /></div>;
}
