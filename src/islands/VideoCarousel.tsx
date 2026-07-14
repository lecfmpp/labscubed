/* VideoCarousel island — auto-advancing YouTube carousel; titles from oEmbed.
   Ported from home-b.jsx. */
import React from 'react';
import { useIsMobile, Section } from '../lib/ui';

export default function VideoCarousel() {
  const VIDEO_IDS = ["8IuGJsjw2AE", "khQHHxJd2hM", "eWPbdBoOrJ4", "Y0qXEgPcf5U", "RILG7TXhc-w"];
  const [videos, setVideos] = React.useState(VIDEO_IDS.map((id) => ({ id, title: "" })));
  React.useEffect(() => {
    let alive = true;
    Promise.all(
      VIDEO_IDS.map((id) =>
      fetch(`https://www.youtube.com/oembed?format=json&url=https://www.youtube.com/watch?v=${id}`).
      then((r) => r.ok ? r.json() : null).
      then((d) => ({ id, title: d && d.title ? d.title : "Watch on YouTube" })).
      catch(() => ({ id, title: "Watch on YouTube" }))
      )
    ).then((res) => {if (alive) setVideos(res);});
    return () => {alive = false;};
  }, []);
  const m = useIsMobile();
  const GAP = m ? 16 : 24;
  const VISIBLE = m ? 1 : 3;
  const CARD = m ? Math.max(220, (typeof window !== "undefined" ? window.innerWidth : 360) - 40) : 360;
  const [i, setI] = React.useState(0);
  const maxI = Math.max(0, videos.length - VISIBLE);
  React.useEffect(() => {
    if (i > maxI) setI(maxI);
    const t = setInterval(() => setI((p) => p >= maxI ? 0 : p + 1), 3800);
    return () => clearInterval(t);
  }, [maxI]);
  const go = (d: number) => setI((p) => Math.min(maxI, Math.max(0, p + d)));
  const ytPlay =
  <span style={{ width: 22, height: 16, borderRadius: 4, background: "#FF0033", display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
      <svg width="8" height="8" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z" /></svg>
    </span>;

  const arrowBtn: any = {
    width: 44, height: 44, borderRadius: "50%", background: "#000", border: "none", cursor: "pointer",
    display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "none"
  };
  function Thumb({ v }: any) {
    const link = v.id ? `https://www.youtube.com/watch?v=${v.id}` : "#";
    return (
      <div style={{ flex: `0 0 ${CARD}px` }}>
        <a href={link} target="_blank" rel="noopener" style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, color: "var(--lc-ink)", textDecoration: "none", marginBottom: 12 }}>
          {ytPlay}<span>Watch on YouTube</span>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M7 17 17 7M17 7H9M17 7v8" stroke="var(--lc-ink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </a>
        <a href={link} target="_blank" rel="noopener" style={{ display: "block", position: "relative", paddingTop: "56.25%", borderRadius: 14, overflow: "hidden", background: "linear-gradient(135deg, #141414, #2c2c2c)", boxShadow: "var(--shadow-edge)" }}>
          {v.id && <img
            src={`/assets/img/yt/${v.id}.webp`}
            width={640}
            height={480}
            loading="lazy"
            alt={v.title}
            onError={(e) => { const img = e.currentTarget as HTMLImageElement; if (!img.dataset.fb) { img.dataset.fb = "1"; img.src = `https://img.youtube.com/vi/${v.id}/hqdefault.jpg`; } }}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />}
          <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ width: 60, height: 60, borderRadius: "50%", background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.25)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z" /></svg>
            </span>
          </span>
        </a>
        <div style={{ marginTop: 14, fontWeight: 500, fontSize: 18, letterSpacing: "-0.01em", color: "var(--lc-ink)" }}>{v.title}</div>
      </div>);
  }
  return (
    <Section bg="#fff">
      <div style={{ padding: m ? "28px 0 80px" : "120px 0" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--text-muted)" }}>From our channel</div>
            <h2 className="lc-vc-title">See CubeTen and CubeOne in action.</h2>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={() => go(-1)} style={{ ...arrowBtn, opacity: i === 0 ? 0.35 : 1 }} aria-label="Previous">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 6l-6 6 6 6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <button onClick={() => go(1)} style={{ ...arrowBtn, opacity: i >= maxI ? 0.35 : 1 }} aria-label="Next">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </div>
        </div>
        <div style={{ marginTop: 48, overflow: "hidden", WebkitMaskImage: "linear-gradient(90deg, #000 0, #000 72%, transparent 100%)", maskImage: "linear-gradient(90deg, #000 0, #000 72%, transparent 100%)" }}>
          <div style={{ display: "flex", gap: GAP, transform: `translateX(-${i * (CARD + GAP)}px)`, transition: "transform .6s cubic-bezier(.4,0,.2,1)", padding: "0 2px" }}>
            {videos.map((v, idx) => <Thumb key={idx} v={v} />)}
          </div>
        </div>
      </div>
    </Section>);
}
