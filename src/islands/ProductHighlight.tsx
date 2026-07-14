/* ProductHighlight island — tray toggle · TypeCycle · Specimen Library.
   Ported from home-a.jsx (ProductHighlight + helpers). Asset paths made absolute. */
import React from 'react';
import { getSample, Sample } from '../lib/samples';
import { useIsMobile, Section } from '../lib/ui';

function Dogbone({ color = "var(--lc-ink)", w = 54 }: any) {
  return (
    <svg width={w} height={w * 0.34} viewBox="0 0 58 20" fill={color} aria-hidden="true">
      <path d="M0 3c0-1 1-2 2-2h9c1 0 2 1 2 2v3l4-1h26l4 1V3c0-1 1-2 2-2h7c1 0 2 1 2 2v14c0 1-1 2-2 2h-7c-1 0-2-1-2-2v-3l-4 1H17l-4-1v3c0 1-1 2-2 2H2c-1 0-2-1-2-2V3Z" />
    </svg>);
}

function LightSampleCell({ id, active, onClick, compact }: any) {
  const s = typeof getSample === "function" && getSample(id) || null;
  const name = s ? s.name : id;
  const standard = s ? s.standard : "";
  const matLabel = s ? s.material === "rubber" ? "Rubber" : "Plastic" : "";
  const blurb = s ? `Automated ${matLabel} ${s.testType} Testing` : "";
  const [hover, setHover] = React.useState(false);
  const teal = active || hover;
  const boxShadow = active ?
  `inset 0 0 0 1.5px var(--lc-teal)${hover ? ", 0 16px 34px rgba(23,221,197,0.18)" : ""}` :
  hover ? "0 16px 34px rgba(0,0,0,0.10)" : "none";
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ all: "unset", cursor: "pointer", boxSizing: "border-box", flex: 1, minWidth: 0, padding: compact ? "12px 6px" : "22px 18px", display: "flex", flexDirection: "column", gap: compact ? 9 : 14, alignItems: "center", textAlign: "center", position: "relative", zIndex: hover ? 2 : 1, borderRadius: compact ? 11 : 14, background: active ? "rgba(23,221,197,0.06)" : "#fff", boxShadow, transform: hover ? "translateY(-6px)" : "none", transition: "transform .26s cubic-bezier(.2,.7,.2,1), box-shadow .26s ease, background .2s ease" }}>

      <div style={{ height: compact ? 22 : 30, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {typeof Sample === "function" && s ?
        <Sample spec={s} variant="fill" tone="light" color={teal ? "teal" : undefined} style={{ width: "100%", maxWidth: compact ? 84 : 140, maxHeight: compact ? 22 : 30 }} /> :
        <Dogbone color={teal ? "var(--lc-teal)" : "#1d1d1f"} />}
      </div>
      <span style={{ fontWeight: 700, fontSize: compact ? 11.5 : 13, letterSpacing: "0.03em", color: "var(--lc-ink)", whiteSpace: "nowrap" }}>{name}</span>
      {compact ?
      <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: teal ? "var(--lc-teal-deep)" : "var(--text-muted)", whiteSpace: "nowrap" }}>{standard}</span> :

      <div style={{ fontSize: 12, fontWeight: 400, color: "var(--text-muted)", lineHeight: 1.4 }}>{blurb}</div>
      }
    </button>);
}

function Spec({ k, v, u }: any) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)" }}>{k}</div>
      <div style={{ fontSize: 15, fontWeight: 600, marginTop: 3, color: "var(--lc-ink)" }}>{v}{u ? <small style={{ fontSize: 11, fontWeight: 400, color: "var(--text-muted)" }}> {u}</small> : null}</div>
    </div>);
}

function DetailCard({ s }: any) {
  const m = useIsMobile();
  if (!s) return null;
  const isBar = s.shape === "bar";
  const isTear = s.testType === "Tear";
  const feature = s.feature || null;
  return (
    <div style={{ border: "1px solid var(--lc-line-strong)", borderRadius: 16, padding: "26px 28px 24px", background: "#fff", display: "flex", flexDirection: "column", boxShadow: "var(--shadow-edge)" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", color: "var(--lc-teal-deep)" }}>{s.standard}</span>
        <span style={{ fontSize: 19, fontWeight: 600, letterSpacing: "-0.01em", color: "var(--lc-ink)" }}>{s.name}</span>
        <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: isTear ? "var(--lc-teal-deep)" : "var(--text-muted)" }}>{s.testType}</span>
      </div>
      <div style={{ fontSize: 13, fontWeight: 300, lineHeight: 1.5, color: "var(--text-muted)", margin: "8px 0 4px", minHeight: 38 }}>{s.blurb}</div>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "18px 0 10px" }}>
        {typeof Sample === "function" ? <Sample spec={s} callouts style={{ maxWidth: "100%", maxHeight: isBar ? 150 : 220 }} /> : null}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: m ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: m ? "16px 10px" : 10, borderTop: "1px solid var(--lc-line)", paddingTop: 16, marginTop: 6 }}>
        <Spec k="Overall" v={s.geom.LO} u="mm" />
        {isTear ?
        <React.Fragment>
            <Spec k="Width" v={s.geom.WO} u="mm" />
            <Spec k="Feature" v={feature} />
          </React.Fragment> :
        isBar ?
        <Spec k="Width" v={s.geom.WO} u="mm" /> :

        <React.Fragment>
            <Spec k="Gauge" v={s.geom.G} u="mm" />
            <Spec k="Narrow W" v={s.geom.W} u="mm" />
          </React.Fragment>
        }
        <Spec k="Thickness" v={s.thickness} />
      </div>
    </div>);
}

function TypeCycle({ words, caretColor = "var(--lc-teal-deep)" }: any) {
  const [i, setI] = React.useState(0);
  const [len, setLen] = React.useState(words[0].length);
  const [del, setDel] = React.useState(false);
  React.useEffect(() => {
    const word = words[i % words.length];
    let delay = del ? 50 : 105;
    if (!del && len === word.length) delay = 1500;else
    if (del && len === 0) delay = 320;
    const t = setTimeout(() => {
      if (!del && len < word.length) setLen((l) => l + 1);else
      if (!del && len === word.length) setDel(true);else
      if (del && len > 0) setLen((l) => l - 1);else
      {setDel(false);setI((x) => (x + 1) % words.length);}
    }, delay);
    return () => clearTimeout(t);
  }, [len, del, i, words]);
  const word = words[i % words.length];
  return (
    <span style={{ color: "var(--lc-teal-deep)" }}>{word.slice(0, len)}<span className="lc-caret" style={{ color: caretColor, fontWeight: 400 }}>|</span></span>);
}

function MobileSpecimenSlider({ ids, pid, setPid }: any) {
  const idx = Math.max(0, ids.indexOf(pid));
  const s = typeof getSample === "function" ? getSample(ids[idx]) : null;
  const standard = s ? s.standard : "";
  const name = s ? s.name : "";
  const touchX = React.useRef<number | null>(null);
  const go = (d: number) => setPid(ids[(idx + d + ids.length) % ids.length]);
  const onStart = (e: any) => {touchX.current = e.touches[0].clientX;};
  const onEnd = (e: any) => {if (touchX.current == null) return;const dx = e.changedTouches[0].clientX - touchX.current;if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);touchX.current = null;};
  const arrowBtn: any = { all: "unset", cursor: "pointer", width: 42, height: 42, borderRadius: "50%", background: "#000", display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "none" };
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <img src={standard.indexOf("ISO") === 0 ? "/assets/img/standards/iso-logo-ink.png" : "/assets/img/standards/astm-logo-ink.png"} alt={standard} style={{ height: 18, width: "auto", opacity: 0.85 }} />
            <div style={{ fontWeight: 600, fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--lc-teal-deep)" }}>{standard}</div>
          </div>
          <div style={{ fontWeight: 700, fontSize: 30, letterSpacing: "-0.01em", color: "var(--lc-ink)", lineHeight: 1.05, marginTop: 6 }}>{name}</div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button style={arrowBtn} onClick={() => go(-1)} aria-label="Previous specimen"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 6l-6 6 6 6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></button>
          <button style={arrowBtn} onClick={() => go(1)} aria-label="Next specimen"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></button>
        </div>
      </div>
      <div onTouchStart={onStart} onTouchEnd={onEnd} style={{ touchAction: "pan-y" }}>
        <DetailCard s={s} />
      </div>
      <div style={{ marginTop: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
        {ids.map((id: string, i: number) =>
        <span key={id} style={{ width: i === idx ? 20 : 6, height: 6, borderRadius: 999, background: i === idx ? "var(--lc-teal)" : "rgba(0,0,0,0.15)", transition: "width .25s ease, background .25s ease" }} />
        )}
      </div>
    </div>);
}

export default function ProductHighlight() {
  const m = useIsMobile();
  const PLASTIC = ["astm-d638-i", "astm-d638-ii", "astm-d638-iii", "astm-d638-iv", "astm-d638-v", "iso-527-1a", "iso-527-1b", "astm-d412-c", "astm-d412-d", "iso-37-2", "astm-d624-c", "astm-d624-b", "astm-d790", "iso-178"];
  const [pid, setPid] = React.useState("astm-d638-i");
  const s = typeof getSample === "function" && getSample(pid) || null;
  const name = s ? s.name : "Type 1";
  const standard = s ? s.standard : "";
  const matLabel = s ? s.material === "rubber" ? "Rubber" : "Plastic" : "Plastic";
  const testType = s ? s.testType : "Tensile";
  const desc = `Automated ${matLabel.toLowerCase()} ${testType.toLowerCase()} testing to ${standard} — loaded, gripped and measured unattended, end to end.`;
  const isRubber = s ? s.material === "rubber" : false;
  const [tray, setTray] = React.useState("Plastic");
  const trayRubber = tray === "Rubber";
  const trayCap = trayRubber ? 12 : 15;
  const trayMachine = trayRubber ? "CubeOne" : "CubeTen";
  const TRAY_IMG: any = { Plastic: "/uploads/tray-labscubed-plastic.webp", Rubber: "/uploads/tray-labscubed-rubber.webp" };
  const machine = isRubber ? "CubeOne" : "CubeTen";
  return (
    <Section bg="#fff" style={{ paddingTop: 0 }}>
      <div style={{ paddingBottom: m ? 72 : 110 }}>
        <div style={{ display: "grid", gridTemplateColumns: m ? "1fr" : "1.05fr 0.95fr", gap: m ? 28 : 56, alignItems: "center" }}>
          <div>
            <div role="tablist" aria-label="Material" style={{ display: "inline-flex", gap: 4, padding: 4, borderRadius: 999, background: "var(--lc-gray-100)", boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.06)", marginBottom: m ? 20 : 28 }}>
              {["Plastic", "Rubber"].map((t) => {
                const on = tray === t;
                return (
                  <button key={t} role="tab" aria-selected={on} onClick={() => setTray(t)} style={{ all: "unset", cursor: "pointer", padding: m ? "8px 18px" : "9px 22px", borderRadius: 999, fontSize: m ? 13 : 14, fontWeight: 700, letterSpacing: "0.02em", color: on ? "var(--lc-ink)" : "var(--text-muted)", background: on ? "#fff" : "transparent", boxShadow: on ? "0 1px 2px rgba(0,0,0,0.12), inset 0 0 0 1px rgba(23,221,197,0.55)" : "none", transition: "color .2s ease, background .2s ease, box-shadow .2s ease" }}>{t}</button>);
              })}
            </div>
            <h3 style={{ fontWeight: 700, fontSize: m ? 34 : 56, lineHeight: 1.07, letterSpacing: "-0.03em", margin: 0, color: "var(--lc-ink)" }}>Industrial power.<br />Compact footprint.<br /><span style={{ whiteSpace: "nowrap" }}><TypeCycle words={["Rubber Testing", "Plastic Testing"]} /></span></h3>
          </div>
          <div style={{ position: "relative", width: "100%", aspectRatio: "16 / 11" }}>
            <img key={tray} src={TRAY_IMG[tray]} alt={`Autonomous ${tray.toLowerCase()} tray loaded with test specimens`} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", display: "block", filter: "drop-shadow(0 42px 14px rgba(0,0,0,0.2))", animation: "lcTrayFade .4s ease" }} />
          </div>
        </div>
        <div style={{ marginTop: m ? 40 : 72, display: "grid", gridTemplateColumns: m ? "1fr" : "repeat(4, 1fr)", gap: m ? 0 : 40 }}>
          {[
          { v: trayCap, l: "Specimens Per Run", s: `Loaded, tested and measured unattended on the ${trayMachine} carousel.`, anim: true },
          { v: trayRubber ? "85%" : "95%", l: "Recover Lab Time", s: `Save up to ${trayRubber ? "85" : "95"}% of your team's time for higher-value tasks.` },
          { v: "18–24", l: "Months to Full ROI", s: "Maximize ROI while accelerating results and technician time." },
          { v: "40%", l: "Ensure Data Consistency", s: "Up to 40% more consistent results, proven by extensive studies." }].
          map((it: any, i: number) =>
          <div key={it.l} style={m ? { display: "flex", gap: 18, alignItems: "stretch", padding: "18px 0", borderTop: i > 0 ? "1px solid rgba(0,0,0,0.08)" : "none" } : undefined}>
              <div key={it.anim ? trayCap : it.l} style={{ flex: m ? "none" : undefined, width: m ? 104 : undefined, fontWeight: 400, fontSize: m ? 40 : 72, letterSpacing: "-0.04em", lineHeight: 1, color: "var(--lc-ink)", whiteSpace: "nowrap", ...it.anim ? { animation: "lcTrayFade .4s ease" } : {} }}>{it.v}</div>
              <div style={m ? { flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "space-between" } : undefined}>
                <div style={{ marginTop: m ? 0 : 16, fontWeight: 600, fontSize: m ? 16 : 18, color: "var(--lc-ink)" }}>{it.l}</div>
                <div style={{ marginTop: m ? 4 : 6, fontWeight: 300, fontSize: m ? 13 : 15, lineHeight: 1.5, color: "var(--text-muted)" }}>{it.s}</div>
              </div>
            </div>
          )}
        </div>
        <div style={{ height: 1, background: "rgba(0,0,0,0.1)", margin: m ? "36px 0" : "56px 0" }} />
        <div id="specimen-library" style={{ marginBottom: m ? 32 : 48, scrollMarginTop: 80 }}>
          <div style={{ fontWeight: 700, fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: m ? 14 : 18 }}>Specimen Library</div>
          <h3 style={{ fontWeight: 700, fontSize: m ? 28 : 40, letterSpacing: "-0.02em", lineHeight: 1.1, margin: 0, color: "var(--lc-ink)", maxWidth: 760, textWrap: "balance" }}>Every standard specimen our machines test.</h3>
          <p style={{ marginTop: 14, fontSize: m ? 15 : 18, lineHeight: 1.55, color: "var(--text-muted)", fontWeight: 300, maxWidth: 600 }}>From ASTM D638 plastics to ISO 37 elastomers — select a geometry to see its dimensions and matching standard.</p>
        </div>
        {m ?
        <MobileSpecimenSlider ids={PLASTIC} pid={pid} setPid={setPid} /> :

        <React.Fragment>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, borderRadius: 14, boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.08)", padding: 8, marginBottom: 44 }}>
            {PLASTIC.map((id) =>
          <LightSampleCell key={id} id={id} active={id === pid} onClick={() => setPid(id)} compact />
          )}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1.15fr 1fr", gap: 64, alignItems: "start" }}>
            <DetailCard s={s} />
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <img src={standard.indexOf("ISO") === 0 ? "/assets/img/standards/iso-logo-ink.png" : "/assets/img/standards/astm-logo-ink.png"} alt={standard} style={{ height: 24, width: "auto", display: "block", opacity: 0.85 }} />
                <div style={{ fontWeight: 600, fontSize: 15, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--lc-teal-deep)" }}>{standard}</div>
              </div>
              <div style={{ fontWeight: 700, fontSize: 56, letterSpacing: "-0.01em", color: "var(--lc-ink)", lineHeight: 1, marginTop: 8 }}>{name}</div>
              <p style={{ marginTop: 18, fontSize: 18, lineHeight: 1.55, color: "var(--text-muted)", fontWeight: 400, maxWidth: 480 }}>{desc}</p>
            </div>
          </div>
        </React.Fragment>
        }
      </div>
    </Section>);
}
