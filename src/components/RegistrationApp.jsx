import React from 'react';
import { track } from '../lib/track';
import LogoSlider from './LogoSlider.jsx';
import PartnershipBadge from './PartnershipBadge.jsx';
import { getWebinar, youTubeId, COLORS } from './webinarConfig.js';

// The countdown strip is NOT rendered here — it sits above the site header, so
// the .astro page renders <WebinarTopBar /> in its sticky stack instead.

/* Which webinar this page is for. The root component resolves it from the slug
   the .astro page passes in; everything below reads it from context, so adding
   a webinar needs no component changes. */
const WebinarContext = React.createContext(null);
const useWebinar = () => React.useContext(WebinarContext);

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

/* One slot for the hero media: plays the configured YouTube video when the
   webinar has one, and shows the placeholder until then. Set heroVideoUrl in
   webinarConfig to fill it — a URL, a share link or a pasted <iframe> all work. */
function HeroVideo({ label, video, image, imageAlt, autoplay = false, locked = false, lockedImage, children }) {
  const id = youTubeId(video);
  const mm = useM();
  /* Locked: the replay's own artwork, blurred and dimmed, with the unlock form
     centred over it. No video id is on the page, so this is only a backdrop.
     On a phone the frame grows to fit the form instead of being 16:9. */
  if (locked) {
    return (
      <div style={{ position: "relative", width: "100%", aspectRatio: mm ? undefined : "16/9", minHeight: mm ? 360 : undefined, borderRadius: 20, overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)", background: "#000", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
        {lockedImage && <img src={lockedImage} alt="" aria-hidden="true" style={{ position: "absolute", inset: -24, width: "calc(100% + 48px)", height: "calc(100% + 48px)", objectFit: "cover", filter: "blur(14px)" }} />}
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)" }} />
        <div style={{ position: "relative", width: "100%", maxWidth: 340 }}>{children}</div>
      </div>
    );
  }
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
          src={`https://www.youtube.com/embed/${id}${autoplay ? "?autoplay=1" : ""}`}
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
        <img
          src={image}
          alt={imageAlt || label}
          width={1040}
          height={585}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      </div>
    );
  }

  return (
    <div style={{ ...frame, background: "linear-gradient(160deg, #1a1b1f, #000)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span style={{ width: 72, height: 72, borderRadius: "50%", background: COLORS.teal, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
        {locked
          ? <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 018 0v3" /></svg>
          : <svg width="24" height="24" viewBox="0 0 24 24" fill="#000"><path d="M8 5v14l11-7z" /></svg>}
      </span>
      <span style={{ position: "absolute", bottom: 18, left: 20, fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.55)" }}>{label}</span>
    </div>
  );
}

/* Falls back to the speaker's initials if the photo 404s, so a missing or
   renamed asset degrades to the old avatar instead of a broken image. */
function SpeakerAvatar({ size = 44 }) {
  const CONFIG = useWebinar();
  const [failed, setFailed] = React.useState(false);
  const base = { width: size, height: size, borderRadius: "50%", flexShrink: 0 };

  if (failed || !CONFIG.speakerPhoto) {
    return <span style={{ ...base, background: "#f4f4f4", color: "#000", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13 }}>{CONFIG.speakerInitials}</span>;
  }
  return <img src={CONFIG.speakerPhoto} alt={CONFIG.speakerName} width={size} height={size} onError={() => setFailed(true)} style={{ ...base, objectFit: "cover", display: "block" }} />;
}

/* The replay gate: first name, last name and company email in exchange for the
   recording. The submit goes to the same endpoint as a registration with
   `unlock: true`, which files the lead and answers with the video id, so the id
   is never in the page bundle. */
const FREE_MAIL = /@(gmail|googlemail|yahoo|ymail|hotmail|outlook|live|msn|aol|icloud|me|proton|protonmail|gmx|mail|yandex|qq|163)\./i;

function ReplayGate({ onUnlock }) {
  const CONFIG = useWebinar();
  const m = useM();
  const [f, setF] = React.useState({ first: "", last: "", email: "" });
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (FREE_MAIL.test(f.email)) {
      setError("Please use your company email address.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(CONFIG.submitEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${f.first.trim()} ${f.last.trim()}`,
          first_name: f.first.trim(),
          last_name: f.last.trim(),
          email: f.email.trim(),
          unlock: true,
          webinar: CONFIG.title,
          webinar_slug: CONFIG.slug,
          kind: CONFIG.kind,
          timestamp: new Date().toISOString(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.videoId) throw new Error(data.error || `HTTP ${res.status}`);
      track("generate_lead", { form: "replay_gate", webinar_slug: CONFIG.slug });
      onUnlock(data.videoId, f.first.trim());
    } catch (err) {
      console.error("Replay unlock failed:", err);
      setError(String(err.message || "").includes("company email") ? "Please use your company email address." : "Something went wrong. Please try again.");
      setBusy(false);
    }
  }

  const dark = { ...fieldInput, padding: "9px 12px", fontSize: 13.5, borderRadius: 8 };
  return (
    <form onSubmit={submit} style={{ background: "#fff", color: COLORS.ink, borderRadius: 14, padding: 16, display: "flex", flexDirection: "column", gap: 8, boxShadow: "0 12px 40px rgba(0,0,0,0.45)" }}>
      <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: "-0.01em", display: "flex", alignItems: "center", gap: 8 }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={COLORS.tealDeep} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 018 0v3" /></svg>
        Unlock the replay
      </div>
      {error && <div style={{ padding: "7px 10px", borderRadius: 8, background: "#fee", color: "#c33", fontSize: 12.5 }}>{error}</div>}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <input id="replay-first" aria-label="First name" type="text" required autoComplete="given-name" placeholder="First name" style={dark} value={f.first} onChange={set("first")} />
        <input aria-label="Last name" type="text" required autoComplete="family-name" placeholder="Last name" style={dark} value={f.last} onChange={set("last")} />
      </div>
      <input aria-label="Company email" type="email" required autoComplete="email" placeholder="Company email" style={dark} value={f.email} onChange={set("email")} />
      <button type="submit" disabled={busy} style={{ marginTop: 2, padding: "10px 16px", borderRadius: 999, border: "none", background: busy ? "#ccc" : COLORS.teal, fontWeight: 600, fontSize: 14, cursor: busy ? "not-allowed" : "pointer", color: "#000" }}>{busy ? "Unlocking..." : "Watch the replay"}</button>
    </form>
  );
}

/* Mobile reorders the hero deliberately: headline, then the video, then the
   CTA. Supporting copy, schedule and speaker follow underneath. On desktop the
   same pieces sit in the usual two columns. The two branches share the piece
   definitions below so the copy can't drift between layouts. */
function Hero() {
  const CONFIG = useWebinar();
  const m = useM();
  const past = CONFIG.pastEvent;
  const post = CONFIG.postWebinar;
  const [playing, setPlaying] = React.useState(false);
  /* A gated replay's video id arrives from the server on unlock, and is kept
     in localStorage so a returning visitor is not asked again. */
  const gated = !!post?.gate;
  const [unlocked, setUnlocked] = React.useState(() => {
    if (!gated) return null;
    // ?locked shows the form again on a browser that already unlocked it, so
    // the gate can be checked without clearing storage.
    if (/[?&]locked\b/.test(location.search)) return null;
    try { return JSON.parse(localStorage.getItem(`lc-replay-${CONFIG.slug}`)); } catch { return null; }
  });
  const unlock = (videoId, first) => {
    const v = { videoId, first };
    try { localStorage.setItem(`lc-replay-${CONFIG.slug}`, JSON.stringify(v)); } catch { /* private mode */ }
    setUnlocked(v);
    setPlaying(true);
  };
  /* Replay mode: the button plays the video in place. On a phone the video is
     above the button already, so scrolling is only needed on desktop where the
     hero is two columns and the player may sit off-screen at small heights. */
  const scrollToForm = past
    ? () => {
        const el = document.getElementById("recap");
        const header = document.querySelector(".lc-sticky-top");
        if (el) window.scrollTo({ top: Math.max(el.getBoundingClientRect().top + window.scrollY - (header ? header.getBoundingClientRect().height : 0), 0), behavior: "smooth" });
      }
    : post
    ? () => {
        if (gated && !unlocked) setTimeout(() => document.getElementById("replay-first")?.focus({ preventScroll: true }), 400);
        else setPlaying(true);
        const el = document.getElementById("replay");
        const header = document.querySelector(".lc-sticky-top");
        if (el) window.scrollTo({ top: Math.max(el.getBoundingClientRect().top + window.scrollY - (header ? header.getBoundingClientRect().height : 0) - 16, 0), behavior: "smooth" });
      }
    : scrollToRegister;
  /* A video or an image fills the right-hand column. With neither, the hero is
     a single centred column instead of a two-column grid with a fake player in
     it, and goes back to two columns the moment heroVideoUrl (or an image) is
     set in webinarConfig. */
  const heroVideo = post ? (gated ? unlocked?.videoId : post.replayVideoUrl) : CONFIG.heroVideoUrl;
  const hasMedia = !!post || !!(youTubeId(CONFIG.heroVideoUrl) || CONFIG.heroImageUrl);

  /* These pages carry no site header on purpose, so this is the only route
     back out — to the hub, where the other webinars are. */
  const breadcrumb = (
    <nav aria-label="Breadcrumb" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, marginBottom: m ? 16 : 20 }}>
      <a href={CONFIG.kind === "tradeshow" ? "/events" : "/webinar"} style={{ color: "rgba(255,255,255,0.65)", textDecoration: "none", borderBottom: "1px solid rgba(255,255,255,0.25)", paddingBottom: 1 }}>{CONFIG.kind === "tradeshow" ? "All events" : "All webinars"}</a>
      <span aria-hidden="true" style={{ color: "rgba(255,255,255,0.3)" }}>/</span>
      <span style={{ color: "rgba(255,255,255,0.45)" }}>{CONFIG.dateLabel.replace(/^\w+, /, "")}</span>
    </nav>
  );

  // Private (invitation-only) sessions already say so on the partnership card, so
  // they get no red pill of their own.
  const badge = CONFIG.private && !post && !past ? null : (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: m ? 11 : 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", padding: m ? "7px 13px" : "8px 15px", borderRadius: 999, background: post || past ? COLORS.teal : "#dc2626", color: post || past ? "#000" : "#fff" }}>
      {/* White dot, not red — a red dot on a red pill would be invisible. A
          replay is not live, so its badge is teal and does not pulse. */}
      <span className={post || past ? undefined : "lc-live-dot"} style={{ width: 7, height: 7, borderRadius: "50%", background: post || past ? "#000" : "#fff", flexShrink: 0 }} />
      {past ? past.badge || "Event recap" : post ? post.badge || "Webinar replay" : CONFIG.kind === "tradeshow" ? "Live demo" : CONFIG.private ? "Private webinar" : "Live webinar"}
    </span>
  );
  /* The partnership badge sits opposite the breadcrumb at the top of the hero
     on desktop, and centred on its own line on a phone, where there is no room
     beside anything. */
  const partnerBadge = CONFIG.partner ? <PartnershipBadge partner={CONFIG.partner} /> : null;
  // partner.centered: breadcrumb on its own line, badge centred beneath it.
  const topRow = CONFIG.partner?.centered ? (
    <div>
      {breadcrumb}
      <div style={{ display: "flex", justifyContent: "center", marginTop: 8 }}>{partnerBadge}</div>
    </div>
  ) : (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 32 }}>
      {breadcrumb}
      {partnerBadge}
    </div>
  );
  const headline = (
    <h1 style={{ fontWeight: 700, fontSize: m ? 30 : 56, lineHeight: 1.1, letterSpacing: "-0.02em", margin: m ? "16px 0 0" : "20px 0 0" }}>{CONFIG.title}</h1>
  );
  // Customer logos are left off invitation-only sessions: a private page for one
  // company should not show other companies' marks.
  const slider = CONFIG.private ? null : <LogoSlider />;
  const media = hasMedia ? (
    <div id={post ? "replay" : undefined} style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
      {gated && unlocked?.first && <div style={{ marginBottom: 12, fontSize: 14, color: "rgba(255,255,255,0.7)" }}>Thanks, {unlocked.first} — enjoy the replay.</div>}
      <HeroVideo locked={gated && !unlocked} lockedImage={CONFIG.thumbnailUrl} label={gated && !unlocked ? "Unlock to watch" : post ? "Webinar replay" : CONFIG.kind === "tradeshow" ? "CubeOne in action" : "Webinar preview"} video={heroVideo} image={CONFIG.heroImageUrl} imageAlt={CONFIG.heroImageAlt} autoplay={playing}>{gated && !unlocked && <ReplayGate onUnlock={unlock} />}</HeroVideo>
      {slider}
    </div>
  ) : (
    slider
  );
  const cta = (
    <button onClick={scrollToForm} style={{ background: COLORS.teal, color: "#000", border: "none", borderRadius: 999, padding: m ? "15px 28px" : "14px 28px", fontWeight: 600, fontSize: m ? 16 : 15, cursor: "pointer", width: m ? "100%" : "auto" }}>{past ? past.ctaLabel || "Read the recap" : post ? post.ctaLabel || "Watch the replay" : CONFIG.ctaLabel || "Save My Seat"}</button>
  );
  const copy = (
    <p style={{ margin: 0, maxWidth: hasMedia ? 480 : 640, fontWeight: 300, fontSize: m ? 15 : 18, lineHeight: 1.55, color: "rgba(255,255,255,0.55)" }}>{past?.heroCopy || post?.heroCopy || CONFIG.heroCopy}</p>
  );
  const schedule = (
    <div style={{ display: "flex", flexWrap: "wrap", flexDirection: m ? "column" : "row", justifyContent: hasMedia || m ? "flex-start" : "center", gap: m ? "4px" : "8px 16px", fontSize: 14, color: "rgba(255,255,255,0.65)" }}>
      <span>{post ? `Aired ${CONFIG.dateLabel}` : CONFIG.dateLabel}</span>{!m && <span style={{ color: "rgba(255,255,255,0.3)" }}>·</span>}<span>{post ? "On demand · about 50 minutes" : CONFIG.timeLabel}</span>
      {CONFIG.eventLabel && (<>{!m && <span style={{ color: "rgba(255,255,255,0.3)" }}>·</span>}<span>{CONFIG.eventLabel}</span></>)}
    </div>
  );
  const speaker = past ? null : (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <SpeakerAvatar />
      <div>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{CONFIG.speakerName}</div>
        <div style={{ fontSize: 12, fontWeight: 300, color: "rgba(255,255,255,0.5)" }}>{CONFIG.speakerTitle}</div>
      </div>
    </div>
  );

  const livePulse = (
    <style>{`
      .lc-live-dot { animation: lcLivePulse 1.8s ease-in-out infinite; }
      @keyframes lcLivePulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
      @media (prefers-reduced-motion: reduce) { .lc-live-dot { animation: none; } }
    `}</style>
  );

  if (m) {
    return (
      <section style={{ background: "#000", color: "#fff" }}>
        {livePulse}
        <div style={{ padding: "32px 20px 48px", display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            {breadcrumb}
            {partnerBadge && <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>{partnerBadge}</div>}
            {badge}
            {headline}
            <div style={{ marginTop: 14 }}>{schedule}</div>
          </div>
          {media}
          {cta}
          {copy}
          {speaker}
        </div>
      </section>
    );
  }

  if (!hasMedia) {
    return (
      <section style={{ background: "#000", color: "#fff" }}>
        {livePulse}
        <div style={{ maxWidth: 1312, margin: "0 auto", padding: "56px 64px 100px" }}>
          {topRow}
          <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
            {badge}
            {headline}
            <div style={{ marginTop: 20 }}>{copy}</div>
            <div style={{ marginTop: 28 }}>{schedule}</div>
            <div style={{ marginTop: 32 }}>{cta}</div>
            <div style={{ marginTop: 40 }}>{speaker}</div>
          </div>
          {media && <div style={{ marginTop: 64 }}>{media}</div>}
        </div>
      </section>
    );
  }

  return (
    <section style={{ background: "#000", color: "#fff" }}>
      {livePulse}
      <div style={{ maxWidth: 1312, margin: "0 auto", padding: "56px 64px 100px" }}>
        {topRow}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56, alignItems: "center" }}>
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
      </div>
    </section>
  );
}

/* Tradeshow stand-in for the agenda: what the event is and why we are there,
   so a visitor can judge whether it is worth their time. Driven entirely by
   CONFIG.about, so every future show gets one by filling that in. */
function EventSummary() {
  const CONFIG = useWebinar();
  const m = useM();
  const about = CONFIG.about;
  if (!about) return null;

  return (
    <Wrap bg={COLORS.gray100}>
      <H2>{about.heading}</H2>
      <div style={{ marginTop: m ? 28 : 44, display: "grid", gridTemplateColumns: m ? "1fr" : "1fr 1fr", gap: m ? 24 : 56, alignItems: "start" }}>
        {about.imageUrl && (
          <div style={{ borderRadius: 20, overflow: "hidden", background: "#000", aspectRatio: "16/9" }}>
            <img
              src={about.imageUrl}
              alt={about.imageAlt || about.heading}
              width={800}
              height={450}
              loading="lazy"
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: m ? 14 : 18 }}>
          {about.paragraphs.map((para) => (
            <p key={para} style={{ margin: 0, fontSize: m ? 15 : 16.5, lineHeight: 1.65, fontWeight: 300, color: COLORS.muted }}>{para}</p>
          ))}
        </div>
      </div>
    </Wrap>
  );
}

function Agenda() {
  const CONFIG = useWebinar();
  const m = useM();
  const items = CONFIG.agenda;

  return (
    <Wrap bg={COLORS.gray100}>
      <H2>{CONFIG.postWebinar?.agendaHeading || "What we'll cover"}</H2>
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
  const CONFIG = useWebinar();
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
        <span style={badge}>{CONFIG.speakerHeading || "Your speaker"}</span>
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
  const CONFIG = useWebinar();
  const m = useM();
  const included = CONFIG.expect;

  return (
    <Wrap bg={COLORS.gray100}>
      <H2>{CONFIG.postWebinar?.expectHeading || "What to expect"}</H2>
      <p style={{ margin: m ? "14px 0 0" : "18px 0 0", maxWidth: 720, fontWeight: 300, fontSize: m ? 15 : 17, lineHeight: 1.6, color: COLORS.muted }}>
        {CONFIG.postWebinar?.expectIntro || CONFIG.expectIntro}
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
  const CONFIG = useWebinar();
  const m = useM();
  const roles = CONFIG.roles;
  const also = CONFIG.alsoFor;

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
          {CONFIG.audienceIntro}
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

/* Cross-promotes the next webinar, if this one has a successor in the registry.
   Renders nothing when it does not, so the last webinar in a series needs no
   special casing. */
function NextWebinar() {
  const CONFIG = useWebinar();
  const m = useM();
  const next = CONFIG.nextWebinarSlug ? getWebinar(CONFIG.nextWebinarSlug) : null;
  if (!next) return null;

  return (
    <Wrap bg={COLORS.gray100}>
      <div style={{ display: "flex", flexDirection: m ? "column" : "row", alignItems: m ? "flex-start" : "center", justifyContent: "space-between", gap: m ? 18 : 32 }}>
        <div>
          <span style={{ display: "inline-flex", background: "#fff", color: COLORS.muted, border: `1px solid ${COLORS.line}`, borderRadius: 4, padding: "5px 12px", fontWeight: 700, fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", lineHeight: 1 }}>{CONFIG.kind === "tradeshow" ? "Next show" : "Next in the series"}</span>
          <h3 style={{ margin: "14px 0 0", fontWeight: 700, fontSize: m ? 20 : 26, letterSpacing: "-0.02em", lineHeight: 1.25, color: COLORS.ink, maxWidth: 640 }}>{next.title}</h3>
          <div style={{ marginTop: 8, fontSize: 14, fontWeight: 500, color: COLORS.tealDeep }}>{next.dateLabel} · {next.timeLabel}</div>
        </div>
        <a href={next.registrationUrl} style={{ flex: "none", fontSize: 13, fontWeight: 600, color: "#000", background: COLORS.teal, borderRadius: 999, padding: "12px 24px", textDecoration: "none", whiteSpace: "nowrap" }}>{CONFIG.kind === "tradeshow" ? "Book a demo" : "Register"}</a>
      </div>
    </Wrap>
  );
}

/* The body of a past-event page — the template every finished tradeshow uses.
   It follows the blog post layout: one centred 792px article column, the blog's
   type scale (28px headings, 17px body) in Inter Tight, a hairline between
   sections. Every photo is the same 16:10 frame, full column width and sitting
   under its heading, so nothing floats beside the text and the headings, copy
   and images all share the same left edge. A quick-facts card opens the page. */
const RECAP_FONT = '"Inter Tight", Inter, system-ui, -apple-system, sans-serif';

function Recap() {
  const CONFIG = useWebinar();
  const m = useM();
  const past = CONFIG.pastEvent;
  const facts = [
    ["Dates", CONFIG.dateLabel],
    ["Where", CONFIG.locationLabel],
    ["Our stand", CONFIG.boothLabel],
    ["Show", CONFIG.eventLabel],
  ].filter(([, v]) => v);
  return (
    <section id="recap" style={{ background: "#fff", fontFamily: RECAP_FONT }}>
      <div style={{ maxWidth: 792, margin: "0 auto", padding: m ? "40px 20px 24px" : "64px 20px 40px" }}>
        <dl style={{ margin: 0, display: "grid", gridTemplateColumns: m ? "1fr 1fr" : `repeat(${facts.length}, 1fr)`, gap: m ? "18px 16px" : 24, padding: m ? 20 : "22px 26px", border: `1px solid ${COLORS.line}`, borderRadius: 16, background: COLORS.gray100 }}>
          {facts.map(([k, v]) => (
            <div key={k} style={{ minWidth: 0 }}>
              <dt style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: COLORS.tealDeep }}>{k}</dt>
              <dd style={{ margin: "6px 0 0", fontSize: 15, fontWeight: 600, lineHeight: 1.35, color: COLORS.ink }}>{v}</dd>
            </div>
          ))}
        </dl>

        {past.sections.map((sec, i) => (
          <article key={sec.heading} style={{ marginTop: m ? 40 : 56, paddingTop: i === 0 ? 0 : m ? 40 : 56, borderTop: i === 0 ? "none" : `1px solid ${COLORS.line}` }}>
            <h2 style={{ margin: 0, fontSize: m ? 24 : 28, fontWeight: 700, lineHeight: 1.2, letterSpacing: "-0.02em", color: "#0f0f0f" }}>{sec.heading}</h2>
            {sec.image && (
              <figure style={{ margin: m ? "20px 0 0" : "24px 0 0" }}>
                <img src={sec.image.src} alt={sec.image.alt} width={1600} height={1000} loading="lazy" style={{ display: "block", width: "100%", height: "auto", aspectRatio: "16 / 10", objectFit: "cover", objectPosition: sec.image.position || "50% 40%", borderRadius: 16, background: COLORS.gray100 }} />
              </figure>
            )}
            <div style={{ marginTop: m ? 20 : 24, display: "flex", flexDirection: "column", gap: 16 }}>
              {sec.paragraphs.map((p, j) => (
                <p key={j} style={{ margin: 0, fontSize: m ? 16 : 17, lineHeight: 1.65, fontWeight: 400, color: "#222" }}>{p}</p>
              ))}
            </div>
            {sec.link && (
              <a href={sec.link.href} style={{ display: "inline-block", marginTop: 24, fontSize: 14, fontWeight: 600, color: "#000", background: COLORS.teal, borderRadius: 999, padding: "13px 26px", textDecoration: "none" }}>{sec.link.label}</a>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

/* Replaces the registration form once a webinar has aired: the visitor has
   nothing to register for, so the page ends in places to go next. */
function NextSteps() {
  const CONFIG = useWebinar();
  const m = useM();
  const post = CONFIG.postWebinar || CONFIG.pastEvent;
  return (
    <Wrap id="register">
      <H2>{post.nextStepsHeading || "What to do next"}</H2>
      <div style={{ marginTop: m ? 28 : 44, display: "grid", gridTemplateColumns: m ? "1fr" : "repeat(4, 1fr)", gap: m ? 16 : 20 }}>
        {post.nextSteps.map(([title, text, href, label]) => (
          <a key={href} href={href} onClick={() => track("select_content", { content_type: CONFIG.pastEvent ? "recap_next_step" : "replay_next_step", item_id: href, webinar_slug: CONFIG.slug })} style={{ display: "flex", flexDirection: "column", gap: 10, padding: 24, borderRadius: 16, border: `1px solid ${COLORS.line}`, background: "#fff", textDecoration: "none", color: COLORS.ink }}>
            <h3 style={{ margin: 0, fontWeight: 700, fontSize: 19, letterSpacing: "-0.01em" }}>{title}</h3>
            <p style={{ margin: 0, flex: 1, fontSize: 14.5, lineHeight: 1.55, fontWeight: 300, color: COLORS.muted }}>{text}</p>
            <span style={{ marginTop: 6, fontSize: 13.5, fontWeight: 600, color: COLORS.tealDeep }}>{label} →</span>
          </a>
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
  const CONFIG = useWebinar();
  const m = useM();
  const [basic, setBasic] = React.useState({ name: "", email: "", company: "" });
  const [showModal, setShowModal] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState("");

  const set = (k) => (e) => setBasic((p) => ({ ...p, [k]: e.target.value }));

  async function complete(details) {
    setIsSubmitting(true);
    setError("");
    const website = details.website ? (details.website.startsWith('http') ? details.website : `https://${details.website}`) : undefined;
    const payload = { ...basic, ...details, website, webinar: CONFIG.title, webinar_slug: CONFIG.slug, kind: CONFIG.kind, timestamp: new Date().toISOString() };
    try {
      console.log("Submitting to:", CONFIG.submitEndpoint);
      const response = await fetch(CONFIG.submitEndpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), signal: CONFIG.externalRegistrationUrl ? AbortSignal.timeout(6000) : undefined });
      console.log("Response status:", response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("API error:", errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log("Registration successful:", data);
      track("sign_up", { method: CONFIG.kind || "webinar", webinar_slug: CONFIG.slug });
      // The confirmation page files a "call me instead" request against this
      // address, so it does not have to ask for the email a second time.
      try {
        sessionStorage.setItem(`lc-reg-email-${CONFIG.slug}`, basic.email.trim());
      } catch { /* private mode — that form asks for the email itself */ }
      track("generate_lead", { form: "registration", webinar_slug: CONFIG.slug });
      setTimeout(() => {
        window.location.href = CONFIG.externalRegistrationUrl || CONFIG.thankYouUrl;
      }, 500);
    } catch (err) {
      console.error("Registration submit failed:", err);
      // SPE's page is the real registration. A hiccup saving our copy of the
      // lead must not strand the visitor on our form, so they are sent on
      // regardless; the failure stays in the console and the function logs.
      if (CONFIG.externalRegistrationUrl) {
        window.location.href = CONFIG.externalRegistrationUrl;
        return;
      }
      setError("Registration failed. Please try again.");
      setIsSubmitting(false);
      setShowModal(false);
    }
  }

  const seatsUsed = (CONFIG.seatsTotal || 0) - (CONFIG.seatsLeft || 0);
  const percentFilled = (seatsUsed / CONFIG.seatsTotal) * 100;

  return (
    <Wrap bg={COLORS.gray100} id="register">
      <div style={{ display: "grid", gridTemplateColumns: m ? "1fr" : "1fr 1fr", gap: m ? 32 : 64, alignItems: "start" }}>
        <div>
          <H2>{CONFIG.registerHeading || "Register for the webinar"}</H2>
          <div style={{ marginTop: 28, borderRadius: 16, background: "#fff", padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}><span style={{ color: COLORS.muted }}>Date</span><span style={{ fontWeight: 600, color: COLORS.ink }}>{CONFIG.dateLabel}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}><span style={{ color: COLORS.muted }}>{CONFIG.kind === "tradeshow" ? "Where" : "Time"}</span><span style={{ fontWeight: 600, color: COLORS.ink }}>{CONFIG.timeLabel}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}><span style={{ color: COLORS.muted }}>{CONFIG.kind === "tradeshow" ? "Event" : "Format"}</span><span style={{ fontWeight: 600, color: COLORS.ink }}>{CONFIG.kind === "tradeshow" ? CONFIG.eventLabel : "Live + recording"}</span></div>

            {CONFIG.showSeats !== false && (
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
            )}
          </div>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); if (CONFIG.externalRegistrationUrl) { complete({}); } else { setShowModal(true); } }} style={{ background: "#fff", borderRadius: 20, boxShadow: "0 1px 0 rgba(0,0,0,0.05), 0 20px 40px rgba(0,0,0,0.08)", padding: 32, display: "flex", flexDirection: "column", gap: 18 }}>
          {error && <div style={{ padding: "12px 14px", borderRadius: 10, background: "#fee", color: "#c33", fontSize: 14 }}>{error}</div>}
          <Field label="Full Name"><input type="text" required placeholder="Jane Doe" style={fieldInput} value={basic.name} onChange={set("name")} /></Field>
          <Field label="Work Email"><input type="email" required placeholder="jane@company.com" style={fieldInput} value={basic.email} onChange={set("email")} /></Field>
          <Field label="Company Name"><input type="text" required placeholder="Company Inc." style={fieldInput} value={basic.company} onChange={set("company")} /></Field>
          <button type="submit" disabled={isSubmitting} style={{ marginTop: 4, padding: "14px 20px", borderRadius: 999, border: "none", background: isSubmitting ? "#ccc" : COLORS.teal, fontWeight: 600, fontSize: 15, cursor: isSubmitting ? "not-allowed" : "pointer", color: "#000" }}>{isSubmitting ? "Loading..." : (CONFIG.registerSubmitLabel || "Register for Webinar")}</button>
          {CONFIG.registerNote && <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: COLORS.muted }}>{CONFIG.registerNote}</p>}
        </form>
      </div>
      {showModal && <DetailsModal onClose={() => setShowModal(false)} onComplete={complete} />}
    </Wrap>
  );
}

export default function App({ slug }) {
  const webinar = React.useMemo(() => getWebinar(slug), [slug]);
  return (
    <WebinarContext.Provider value={webinar}>
      <Hero />{webinar.pastEvent ? <Recap /> : <>{webinar.kind === "tradeshow" ? <EventSummary /> : <Agenda />}<WhatToExpect />{webinar.showSpeaker !== false && <Speaker />}<WhoIsThisFor /></>}<NextWebinar />{webinar.postWebinar || webinar.pastEvent ? <NextSteps /> : <RegisterSection />}
    </WebinarContext.Provider>
  );
}
