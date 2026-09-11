import React from 'react';
import { getWebinar, COLORS } from './webinarConfig.js';

/* The replay session page. The access token arrives in the link (?t=) and is
   remembered in localStorage, then exchanged with /api/webinar/replay-session
   for the session time and — only once the session opens — the video.

   States: loading · no-access · waiting · open · expired · unavailable · error */

const pad = (n) => String(n).padStart(2, "0");
const whenFmt = new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" });
const dateFmt = new Intl.DateTimeFormat(undefined, { month: "long", day: "numeric" });
const compact = (ms) => new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

function useNarrow(bp = 760) {
  const [n, setN] = React.useState(window.innerWidth <= bp);
  React.useEffect(() => {
    const on = () => setN(window.innerWidth <= bp);
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, [bp]);
  return n;
}

function useClock(offset) {
  const [now, setNow] = React.useState(Date.now() + offset);
  React.useEffect(() => {
    setNow(Date.now() + offset);
    const t = setInterval(() => setNow(Date.now() + offset), 1000);
    return () => clearInterval(t);
  }, [offset]);
  return now;
}

function Countdown({ ms, big }) {
  const left = Math.max(ms, 0);
  const units = [
    [Math.floor(left / 86400000), "Days"],
    [Math.floor((left % 86400000) / 3600000), "Hours"],
    [Math.floor((left % 3600000) / 60000), "Min"],
    [Math.floor((left % 60000) / 1000), "Sec"],
  ];
  return (
    <div style={{ display: "flex", gap: big ? 10 : 5 }}>
      {units.map(([v, l]) => (
        <div key={l} style={{ textAlign: "center" }}>
          <div style={{ fontVariantNumeric: "tabular-nums", fontWeight: 800, fontSize: big ? 34 : 18, lineHeight: 1, background: "#000", color: "#fff", borderRadius: big ? 10 : 6, padding: big ? "10px 12px" : "4px 7px", minWidth: big ? 58 : 0 }}>{pad(v)}</div>
          <div style={{ fontSize: big ? 11 : 8, fontWeight: 600, marginTop: 4, color: big ? "rgba(255,255,255,0.55)" : "#000", letterSpacing: "0.06em", textTransform: "uppercase" }}>{l}</div>
        </div>
      ))}
    </div>
  );
}

export default function SessionApp({ slug }) {
  const w = getWebinar(slug);
  const narrow = useNarrow();
  const storageKey = `lc-replay-${slug}`;

  const [token] = React.useState(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("t");
    if (fromUrl) {
      try { localStorage.setItem(storageKey, fromUrl); } catch { /* private mode */ }
      return fromUrl;
    }
    try { return localStorage.getItem(storageKey); } catch { return null; }
  });

  const [session, setSession] = React.useState(null);
  const [state, setState] = React.useState(token ? "loading" : "no-access");
  const [offset, setOffset] = React.useState(0);
  const reloading = React.useRef(false);
  const now = useClock(offset);

  const load = React.useCallback(async () => {
    try {
      const res = await fetch("/api/webinar/replay-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const out = await res.json().catch(() => ({}));
      if (res.status === 400 || res.status === 404) { setState("no-access"); return; }
      if (!res.ok) { setState("error"); return; }
      setOffset(Date.parse(out.serverNow) - Date.now());
      setSession(out);
      setState(out.status);
    } catch {
      setState("error");
    }
  }, [token]);

  React.useEffect(() => { if (token) load(); }, [token, load]);

  const start = session ? Date.parse(session.sessionStart) : null;
  const end = session ? Date.parse(session.sessionEnd) : null;

  // When the waiting room reaches the start, ask again — that's when the
  // server hands over the video.
  React.useEffect(() => {
    if (state !== "waiting" || !start || reloading.current) return;
    if (now >= start - 60000) {
      reloading.current = true;
      load().finally(() => { reloading.current = false; });
    }
  }, [now, state, start, load]);

  const watchLink = token ? `${window.location.origin}${window.location.pathname}?t=${token}` : "";
  const calendar = start
    ? {
        google: `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(w.title)}&dates=${compact(start)}/${compact(end)}&details=${encodeURIComponent(`Your session: ${watchLink}`)}`,
        outlook: `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(w.title)}&startdt=${new Date(start).toISOString()}&enddt=${new Date(end).toISOString()}&body=${encodeURIComponent(`Your session: ${watchLink}`)}`,
      }
    : null;

  /* ---------- top bar ---------- */
  let bar;
  if (state === "waiting" && start) {
    bar = (<><span style={barLabel}>Your session starts in</span><Countdown ms={start - now} /></>);
  } else if (state === "open" && end && now < end) {
    bar = (<><span style={{ width: 8, height: 8, borderRadius: "50%", background: "#000" }} /><span style={barLabel}>Session in progress</span></>);
  } else if (state === "open") {
    bar = <span style={barLabel}>Session ended · recording open until {dateFmt.format(start + 7 * 86400000)}</span>;
  } else {
    bar = <span style={barLabel}>{w.title}</span>;
  }

  return (
    <div>
      <div style={{ position: "sticky", top: 0, zIndex: 50, background: COLORS.teal, borderBottom: `3px solid ${COLORS.tealDeep}` }}>
        <div style={{ maxWidth: 1312, margin: "0 auto", padding: narrow ? "10px 20px" : "10px 64px", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, minHeight: 38 }}>{bar}</div>
      </div>

      <section style={{ background: "#000", color: "#fff" }}>
        <div style={{ maxWidth: 1040, margin: "0 auto", padding: narrow ? "28px 20px 40px" : "40px 32px 56px" }}>
          <nav aria-label="Breadcrumb" style={{ display: "flex", gap: 8, fontSize: 13, marginBottom: 18 }}>
            <a href="/webinar/" style={{ color: "rgba(255,255,255,0.65)", textDecoration: "none", borderBottom: "1px solid rgba(255,255,255,0.25)" }}>All webinars</a>
            <span aria-hidden="true" style={{ color: "rgba(255,255,255,0.3)" }}>/</span>
            <span style={{ color: "rgba(255,255,255,0.45)" }}>Session</span>
          </nav>
          <h1 style={{ margin: 0, fontWeight: 700, fontSize: narrow ? 26 : 38, lineHeight: 1.12, letterSpacing: "-0.02em", maxWidth: 820 }}>{w.title}</h1>
          <p style={{ margin: "10px 0 0", fontSize: 14.5, color: "rgba(255,255,255,0.6)" }}>
            {start ? <>Session · {whenFmt.format(start)} · with {w.speakerName}</> : <>With {w.speakerName}, {w.speakerTitle}</>}
          </p>

          <div style={{ marginTop: 26, position: "relative", width: "100%", aspectRatio: "16/9", borderRadius: 18, overflow: "hidden", background: "linear-gradient(160deg, #15191b, #050606)", border: "1px solid rgba(255,255,255,0.1)" }}>
            {state === "open" && session?.videoId ? (
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${session.videoId}?rel=0&modestbranding=1&autoplay=1`}
                title={w.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
              />
            ) : (
              <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", padding: 24, textAlign: "center" }}>
                <Stage state={state} start={start} now={now} viewer={session?.viewer} calendar={calendar} narrow={narrow} />
              </div>
            )}
          </div>
        </div>
      </section>

      {(state === "waiting" || state === "open") && <Questions token={token} narrow={narrow} />}
    </div>
  );
}

const barLabel = { fontSize: 12.5, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#000" };

function Stage({ state, start, now, viewer, calendar, narrow }) {
  const cta = (href, text) => (
    <a href={href} style={{ display: "inline-block", marginTop: 18, background: COLORS.teal, color: "#000", borderRadius: 999, padding: "12px 24px", fontWeight: 600, fontSize: 14, textDecoration: "none" }}>{text}</a>
  );
  const sub = { margin: "10px 0 0", fontSize: 14.5, color: "rgba(255,255,255,0.6)", maxWidth: 440 };

  if (state === "loading") return <p style={sub}>Loading your session…</p>;
  if (state === "waiting") {
    return (
      <div style={{ display: "grid", justifyItems: "center" }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: COLORS.teal }}>{viewer ? `You're booked, ${viewer}` : "You're booked"}</div>
        <div style={{ marginTop: 16 }}><Countdown ms={start - now} big={!narrow} /></div>
        <p style={sub}>Keep this page open — the session starts here automatically.</p>
        {calendar && (
          <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap", justifyContent: "center" }}>
            <a href={calendar.google} target="_blank" rel="noopener noreferrer" style={calBtn}>Add to Google Calendar</a>
            <a href={calendar.outlook} target="_blank" rel="noopener noreferrer" style={calBtn}>Add to Outlook</a>
          </div>
        )}
      </div>
    );
  }
  if (state === "expired") {
    return (<div><h2 style={stageH}>This session has closed</h2><p style={sub}>Book another time and we'll save you a seat.</p>{cta("/webinar/#recordings", "Choose another session")}</div>);
  }
  if (state === "unavailable") {
    return (<div><h2 style={stageH}>The recording isn't available right now</h2><p style={sub}>Please check back shortly — your seat is still saved.</p></div>);
  }
  if (state === "error") {
    return (<div><h2 style={stageH}>We couldn't load your session</h2><p style={sub}>Refresh the page to try again.</p></div>);
  }
  return (
    <div>
      <h2 style={stageH}>This session is for registered viewers</h2>
      <p style={sub}>Open the personal link from your booking, or choose a session to get one.</p>
      {cta("/webinar/#recordings", "Choose a session")}
    </div>
  );
}

const stageH = { margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: "-0.01em" };
const calBtn = { fontSize: 13, fontWeight: 500, color: "#fff", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 999, padding: "9px 16px", textDecoration: "none" };

function Questions({ token, narrow }) {
  const [text, setText] = React.useState("");
  const [sent, setSent] = React.useState([]);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");

  async function send(e) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/webinar/question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, body }),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(out.error || "We couldn't send that. Please try again.");
      setSent((s) => [...s, body]);
      setText("");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section style={{ background: COLORS.gray100 }}>
      <div style={{ maxWidth: 1040, margin: "0 auto", padding: narrow ? "32px 20px 48px" : "44px 32px 64px" }}>
        <h2 style={{ margin: 0, fontSize: narrow ? 21 : 24, fontWeight: 700, letterSpacing: "-0.02em", color: COLORS.ink }}>Questions and comments</h2>
        <p style={{ margin: "8px 0 0", fontSize: 14.5, lineHeight: 1.55, color: COLORS.muted, maxWidth: 640 }}>
          Anything you send here goes straight to the LabsCubed team — it isn't shown to other viewers. We'll reply by email after the session.
        </p>
        <form onSubmit={send} style={{ marginTop: 18, display: "grid", gap: 12 }}>
          <label htmlFor="q-body" style={{ position: "absolute", left: -9999 }}>Your question or comment</label>
          <textarea
            id="q-body"
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 2000))}
            rows={4}
            placeholder="Ask about your materials, your test volume, standards…"
            style={{ width: "100%", boxSizing: "border-box", padding: "14px 16px", borderRadius: 12, border: `1px solid ${COLORS.line}`, background: "#fff", fontSize: 15, fontFamily: "inherit", color: COLORS.ink, resize: "vertical" }}
          />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: COLORS.muted, fontVariantNumeric: "tabular-nums" }}>{text.length} / 2000</span>
            <button type="submit" disabled={busy || !text.trim()} style={{ padding: "12px 22px", borderRadius: 999, border: "none", background: busy || !text.trim() ? "#cfd8d9" : COLORS.teal, color: "#000", fontWeight: 600, fontSize: 14, cursor: busy ? "wait" : "pointer" }}>
              {busy ? "Sending…" : "Send to the team"}
            </button>
          </div>
          {error && <div role="alert" style={{ padding: "11px 13px", borderRadius: 10, background: "#fdecea", color: "#a1291a", fontSize: 13.5 }}>{error}</div>}
        </form>
        {sent.length > 0 && (
          <ul style={{ listStyle: "none", margin: "20px 0 0", padding: 0, display: "grid", gap: 10 }}>
            {sent.map((s, i) => (
              <li key={i} style={{ padding: "12px 16px", borderRadius: 12, background: "#fff", border: `1px solid ${COLORS.line}` }}>
                <div style={{ fontSize: 14.5, color: COLORS.ink, whiteSpace: "pre-wrap" }}>{s}</div>
                <div style={{ marginTop: 6, fontSize: 12, fontWeight: 600, color: COLORS.tealDeep }}>Sent to the team · we'll reply by email</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
