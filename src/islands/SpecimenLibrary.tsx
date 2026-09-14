/* SpecimenLibrary island — specimen chip grid + dimensioned detail card.
   Lifted out of ProductHighlight so product pages can show the same library
   filtered to their own machine (e.g. CubeTen → ASTM D638 / ISO 527-2 only).
   The `specimen-library` anchor lives here, which is what SpecimenRail's
   "Explore the full specimen library" link targets. */
import React from 'react';
import { getSample, Sample } from '../lib/samples';
import { useIsMobile } from '../lib/ui';

function LightSampleCell({ id, active, onClick, compact }: any) {
  const s = getSample(id);
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
        {s && <Sample spec={s} variant="fill" tone="light" color={teal ? "teal" : undefined} style={{ width: "100%", maxWidth: compact ? 84 : 140, maxHeight: compact ? 22 : 30 }} />}
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
        <Sample spec={s} callouts style={{ maxWidth: "100%", maxHeight: isBar ? 150 : 220 }} />
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

const stdLogo = (standard: string) => standard.indexOf("ISO") === 0 ? "/assets/img/standards/iso-logo-ink.webp" : "/assets/img/standards/astm-logo-ink.webp";

function MobileSpecimenSlider({ ids, pid, setPid }: any) {
  const idx = Math.max(0, ids.indexOf(pid));
  const s = getSample(ids[idx]);
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
            <img src={stdLogo(standard)} alt={standard} width={standard.indexOf("ISO") === 0 ? 120 : 105} height={84} style={{ height: 18, width: "auto", opacity: 0.85 }} />
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

export default function SpecimenLibrary({
  ids,
  defaultId,
  eyebrow = "Specimen Library",
  heading = "Every standard specimen our machines test.",
  sub = "From ASTM D638 plastics to ISO 37 elastomers — select a geometry to see its dimensions and matching standard.",
}: { ids: string[]; defaultId?: string; eyebrow?: string; heading?: string; sub?: string }) {
  const m = useIsMobile();
  const [pid, setPid] = React.useState(defaultId || ids[0]);
  const s = getSample(pid) || null;
  const name = s ? s.name : "";
  const standard = s ? s.standard : "";
  const matLabel = s ? s.material === "rubber" ? "Rubber" : "Plastic" : "Plastic";
  const testType = s ? s.testType : "Tensile";
  const desc = `Automated ${matLabel.toLowerCase()} ${testType.toLowerCase()} testing to ${standard} — loaded, gripped and measured unattended, end to end.`;
  return (
    <React.Fragment>
      <div id="specimen-library" style={{ marginBottom: m ? 32 : 48, scrollMarginTop: 80 }}>
        <div style={{ fontWeight: 700, fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: m ? 14 : 18 }}>{eyebrow}</div>
        <h3 style={{ fontWeight: 700, fontSize: m ? 28 : 40, letterSpacing: "-0.02em", lineHeight: 1.1, margin: 0, color: "var(--lc-ink)", maxWidth: 760, textWrap: "balance" } as any}>{heading}</h3>
        <p style={{ marginTop: 14, fontSize: m ? 15 : 18, lineHeight: 1.55, color: "var(--text-muted)", fontWeight: 300, maxWidth: 600 }}>{sub}</p>
      </div>
      {m ?
      <MobileSpecimenSlider ids={ids} pid={pid} setPid={setPid} /> :

      <React.Fragment>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(7, ids.length)}, 1fr)`, gap: 6, borderRadius: 14, boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.08)", padding: 8, marginBottom: 44 }}>
          {ids.map((id) =>
          <LightSampleCell key={id} id={id} active={id === pid} onClick={() => setPid(id)} compact />
          )}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1.15fr 1fr", gap: 64, alignItems: "start" }}>
          <DetailCard s={s} />
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <img src={stdLogo(standard)} alt={standard} width={standard.indexOf("ISO") === 0 ? 120 : 105} height={84} style={{ height: 24, width: "auto", display: "block", opacity: 0.85 }} />
              <div style={{ fontWeight: 600, fontSize: 15, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--lc-teal-deep)" }}>{standard}</div>
            </div>
            <div style={{ fontWeight: 700, fontSize: 56, letterSpacing: "-0.01em", color: "var(--lc-ink)", lineHeight: 1, marginTop: 8 }}>{name}</div>
            <p style={{ marginTop: 18, fontSize: 18, lineHeight: 1.55, color: "var(--text-muted)", fontWeight: 400, maxWidth: 480 }}>{desc}</p>
          </div>
        </div>
      </React.Fragment>
      }
    </React.Fragment>);
}
