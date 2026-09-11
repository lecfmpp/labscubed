import React from 'react';
import { WEBINARS, COLORS } from './webinarConfig.js';
import { nextSessions } from './evergreen.js';

/* Booking modal for a webinar's replay sessions, mounted once on the webinar
   hub. Any element carrying data-open-replay="<slug>" opens it. It offers the
   next four scheduled sessions, takes a short form, and sends the visitor to
   their own session page with a personal access link. */

const ROLES = ["Lab Manager", "Quality Director", "R&D Engineer", "Testing Technician", "VP Operations", "Plant Manager", "Other"];

const dayFmt = new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric" });
const timeFmt = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit", timeZoneName: "short" });
const easternFmt = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "numeric", minute: "2-digit" });
const localHmFmt = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });

function useNarrow(bp = 640) {
  const [n, setN] = React.useState(window.innerWidth <= bp);
  React.useEffect(() => {
    const on = () => setN(window.innerWidth <= bp);
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, [bp]);
  return n;
}

const label = { fontSize: 12, fontWeight: 600, color: COLORS.muted, display: "block", marginBottom: 6 };
const input = { width: "100%", boxSizing: "border-box", padding: "11px 13px", borderRadius: 10, border: `1px solid ${COLORS.line}`, background: "#fff", fontSize: 14, fontFamily: "inherit", color: COLORS.ink };

export default function ReplayModal() {
  const narrow = useNarrow();
  const [slug, setSlug] = React.useState(null);
  const [sessions, setSessions] = React.useState([]);
  const [choice, setChoice] = React.useState(null);
  const [form, setForm] = React.useState({ name: "", email: "", company: "", role: "" });
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");
  const firstField = React.useRef(null);

  React.useEffect(() => {
    const onClick = (e) => {
      const trigger = e.target.closest && e.target.closest("[data-open-replay]");
      if (!trigger) return;
      const s = trigger.getAttribute("data-open-replay");
      if (!WEBINARS[s]) return;
      e.preventDefault();
      const list = nextSessions(WEBINARS[s].replay, Date.now(), 4);
      setSlug(s);
      setSessions(list);
      setChoice(list[0] ?? null);
      setError("");
      setBusy(false);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  React.useEffect(() => {
    if (!slug) return undefined;
    const onKey = (e) => { if (e.key === "Escape") setSlug(null); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => firstField.current && firstField.current.focus(), 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [slug]);

  if (!slug) return null;
  const w = WEBINARS[slug];
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    if (!choice) { setError("Pick a session first."); return; }
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/webinar/replay-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, webinar_slug: slug, session_start: new Date(choice).toISOString() }),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok || !out.token) throw new Error(out.error || "We couldn't save your seat. Please try again.");
      try { localStorage.setItem(`lc-replay-${slug}`, out.token); } catch { /* private mode: the link still carries the token */ }
      window.location.href = out.watchUrl;
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="replay-title"
      onMouseDown={(e) => { if (e.target === e.currentTarget) setSlug(null); }}
      style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.62)", display: "flex", alignItems: "center", justifyContent: "center", padding: narrow ? 12 : 24 }}
    >
      <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 560, maxHeight: "92vh", overflowY: "auto", boxShadow: "0 30px 70px rgba(0,0,0,0.3)", padding: narrow ? "24px 20px" : "32px 34px", color: COLORS.ink }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: COLORS.tealDeep }}>Upcoming sessions</div>
            <h2 id="replay-title" style={{ margin: "8px 0 0", fontSize: narrow ? 20 : 23, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.2 }}>{w.title}</h2>
          </div>
          <button type="button" onClick={() => setSlug(null)} aria-label="Close" style={{ all: "unset", cursor: "pointer", padding: 6, lineHeight: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke={COLORS.muted} strokeWidth="2" strokeLinecap="round" /></svg>
          </button>
        </div>
        <p style={{ margin: "10px 0 0", fontSize: 14, lineHeight: 1.55, color: COLORS.muted }}>
          Pick a session time. Questions you send during the session go straight to our team, and we reply by email.
        </p>

        <form onSubmit={submit} style={{ marginTop: 22, display: "grid", gap: 18 }}>
          {sessions.length === 0 ? (
            <div style={{ padding: 14, borderRadius: 12, background: COLORS.gray100, fontSize: 14, color: COLORS.muted }}>No sessions are scheduled right now. Please check back soon.</div>
          ) : (
            <fieldset style={{ border: 0, margin: 0, padding: 0 }}>
              <legend style={{ ...label, marginBottom: 10 }}>Choose your session</legend>
              <div style={{ display: "grid", gridTemplateColumns: narrow ? "1fr" : "1fr 1fr", gap: 10 }}>
                {sessions.map((ms) => {
                  const on = ms === choice;
                  return (
                    <label key={ms} style={{ cursor: "pointer", display: "grid", gap: 3, padding: "12px 14px", borderRadius: 12, border: `1.5px solid ${on ? COLORS.tealDeep : COLORS.line}`, background: on ? "#effcfa" : "#fff" }}>
                      <input type="radio" name="session" checked={on} onChange={() => setChoice(ms)} style={{ position: "absolute", opacity: 0, pointerEvents: "none" }} />
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{dayFmt.format(ms)}</span>
                      <span style={{ fontSize: 13.5, color: COLORS.ink }}>{timeFmt.format(ms)}</span>
                      {/* The Eastern reference only earns its line when it differs from the visitor's own clock. */}
                      {easternFmt.format(ms) !== localHmFmt.format(ms) && (
                        <span style={{ fontSize: 12, color: COLORS.muted }}>{easternFmt.format(ms)} ET</span>
                      )}
                    </label>
                  );
                })}
              </div>
            </fieldset>
          )}

          <div style={{ display: "grid", gridTemplateColumns: narrow ? "1fr" : "1fr 1fr", gap: 14 }}>
            <div><label style={label} htmlFor="rp-name">Full name</label><input id="rp-name" ref={firstField} required style={input} value={form.name} onChange={set("name")} autoComplete="name" /></div>
            <div><label style={label} htmlFor="rp-email">Work email</label><input id="rp-email" type="email" required style={input} value={form.email} onChange={set("email")} autoComplete="email" /></div>
            <div><label style={label} htmlFor="rp-company">Company</label><input id="rp-company" required style={input} value={form.company} onChange={set("company")} autoComplete="organization" /></div>
            <div>
              <label style={label} htmlFor="rp-role">Role</label>
              <select id="rp-role" required style={input} value={form.role} onChange={set("role")}>
                <option value="" disabled>Select role</option>
                {ROLES.map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>
          </div>

          {error && <div role="alert" style={{ padding: "11px 13px", borderRadius: 10, background: "#fdecea", color: "#a1291a", fontSize: 13.5 }}>{error}</div>}

          <button type="submit" disabled={busy || sessions.length === 0} style={{ padding: "14px 20px", borderRadius: 999, border: "none", background: busy ? "#b9ece5" : COLORS.teal, color: "#000", fontWeight: 600, fontSize: 15, cursor: busy ? "wait" : "pointer" }}>
            {busy ? "Saving your seat…" : "Save my seat"}
          </button>
          <p style={{ margin: 0, fontSize: 12.5, color: COLORS.muted, textAlign: "center" }}>You'll get a personal link to your session. Keep it — it's how you get in.</p>
        </form>
      </div>
    </div>
  );
}
