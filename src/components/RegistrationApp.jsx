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

/* Scrolls the registration section to just under the sticky countdown+header
   stack. scrollIntoView alone lands the target beneath that stack, and the
   anchor sits on the section rather than the inner grid so the scroll stops at
   the top of the section with the whole form in view. The header is measured
   at click time because it is a different height on mobile and desktop. */
function scrollToRegister() {
  const target = document.getElementById("register");
  if (!target) return;
  const header = document.querySelector(".lc-sticky-top");
  const offset = header ? header.getBoundingClientRect().height : 0;
  const top = target.getBoundingClientRect().top + window.scrollY - offset - 12;
  window.scrollTo({ top: Math.max(top, 0), behavior: "smooth" });
}

function Wrap({ children, bg = "#fff", id }) {
  const m = useM();
  return (
    <section id={id} style={{ background: bg }}>
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
  const scrollToForm = scrollToRegister;

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
    <p style={{ margin: 0, maxWidth: 480, fontWeight: 300, fontSize: m ? 15 : 18, lineHeight: 1.55, color: "rgba(255,255,255,0.55)" }}>Measuring, positioning, gripping and processing every specimen by hand quietly consumes technician time and opens the door to variability. See where those costs hide — and what an automation-first workflow actually changes.</p>
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
    ["01", "The hidden costs of manual testing", "How manual specimen measurement, positioning, gripping, testing and data processing consume technician time and introduce opportunities for variability."],
    ["02", "Where variability enters plastics tensile testing", "The factors that affect testing consistency, and the difference between accuracy, repeatability and reproducibility."],
    ["03", "What automation can actually change", "How an automation-first workflow standardises the key steps — specimen measurement, gripping, deformation measurement, testing and analysis — and the impact on technician time and reproducibility."],
    ["04", "From testing data to a smarter lab workflow", "Practical CubeTen examples with HIPS and polypropylene, covering ASTM/ISO requirements, calibration, service and support, cybersecurity and data integration."]
  ];

  return (
    <Wrap bg={COLORS.gray100}>
      <H2>What we'll cover</H2>
      <div style={{ marginTop: m ? 28 : 44, display: "grid", gridTemplateColumns: m ? "1fr" : "repeat(2, 1fr)", gap: m ? 24 : 36 }}>
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

/* Speaker bio. Sits between the agenda and the audience section so the "who is
   telling me this" question is answered before the "is this for me" one. */
function Speaker() {
  const m = useM();
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
        <span style={badge}>Your speaker</span>
        <div style={{ marginTop: m ? 22 : 28, display: "grid", gridTemplateColumns: m ? "1fr" : "auto 1fr", gap: m ? 20 : 36, alignItems: "start" }}>
          <SpeakerAvatar size={m ? 88 : 132} />
          <div>
            <h3 style={{ fontWeight: 700, fontSize: m ? 22 : 28, letterSpacing: "-0.02em", color: COLORS.ink, margin: 0 }}>{CONFIG.speakerName}</h3>
            <div style={{ marginTop: 4, fontSize: m ? 14 : 15, fontWeight: 500, color: COLORS.tealDeep }}>{CONFIG.speakerTitle}</div>
            <p style={{ margin: "16px 0 0", maxWidth: 720, fontWeight: 300, fontSize: m ? 15 : 16.5, lineHeight: 1.65, color: COLORS.muted }}>{CONFIG.speakerBio}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* What attendees walk away with. Content is the doc's section 5 verbatim in
   substance — outcomes first, then what the session actually contains. */
function WhatToExpect() {
  const m = useM();
  const included = [
    "Real-world CubeTen plastics testing data",
    "Examples using HIPS and polypropylene (PP)",
    "The automated workflow, from specimen measurement through data analysis",
    "A short demonstration of CubeTen in operation",
    "Measurement reproducibility and technician-time savings",
    "ASTM/ISO testing, calibration, service, cybersecurity and data integration",
    "Guidance for evaluating whether automation makes sense for your lab",
  ];

  return (
    <Wrap bg={COLORS.gray100}>
      <H2>What to expect</H2>
      <p style={{ margin: m ? "14px 0 0" : "18px 0 0", maxWidth: 720, fontWeight: 300, fontSize: m ? 15 : 17, lineHeight: 1.6, color: COLORS.muted }}>
        You'll leave with a practical understanding of where the hidden costs and sources of variability sit in manual plastics tensile testing, and how automation addresses them.
      </p>
      <div style={{ marginTop: m ? 24 : 34, display: "grid", gridTemplateColumns: m ? "1fr" : "1fr 1fr", gap: m ? 12 : "14px 40px" }}>
        {included.map((item) => (
          <div key={item} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
              <circle cx="12" cy="12" r="11" fill={COLORS.teal} opacity="0.18" />
              <path d="M7 12.5l3.2 3.2L17 9" stroke={COLORS.tealDeep} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{ fontSize: m ? 14.5 : 15.5, fontWeight: 300, lineHeight: 1.55, color: COLORS.ink }}>{item}</span>
          </div>
        ))}
      </div>
    </Wrap>
  );
}

/* Compact audience section. Uses two design-system primitives rather than
   bespoke ornament: the bordered card for the four primary roles, and the
   subtle chip for the wider list. No icons — at this density they read as
   clutter. */
function WhoIsThisFor() {
  const m = useM();
  const roles = [
    ["Testing technicians", "Materials and polymer testing"],
    ["R&D & materials engineers", "Developing and characterising materials"],
    ["QC / QA professionals", "Holding the line on consistency"],
    ["Lab managers & supervisors", "Throughput, cost and capacity"],
  ];
  const also = [
    "Testing & characterisation professionals",
    "Technical & engineering managers",
    "Anyone evaluating automation for plastics testing",
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
          Plastics and polymer testing professionals who want more consistency, efficiency or throughput from their lab.
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
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(29,29,31,0.45)", marginRight: 4 }}>Also for</span>
          {also.map((name) => (
            <span key={name} style={{ fontSize: m ? 12.5 : 13, fontWeight: 500, color: COLORS.ink, background: COLORS.gray100, border: `1px solid ${COLORS.line}`, borderRadius: 999, padding: m ? "6px 12px" : "7px 14px", lineHeight: 1 }}>{name}</span>
          ))}
        </div>
      </div>
    </section>
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
    <Wrap bg={COLORS.gray100} id="register">
      <div style={{ display: "grid", gridTemplateColumns: m ? "1fr" : "1fr 1fr", gap: m ? 32 : 64, alignItems: "start" }}>
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
  return <div><Hero /><Agenda /><WhatToExpect /><Speaker /><WhoIsThisFor /><RegisterSection /></div>;
}
