/* ConfiguratorFlow island — Configurator + CubeTenShowcase + SpecsBand share
   one state root (selected / dailyIdx / otherSample → recommendMachine → model
   + focus). Lifted from index.html App per handoff §4. Ported from home-b.jsx.
   Asset paths made absolute. */
import React from 'react';
import { SAMPLES, getSample, Sample } from '../lib/samples';
import { useIsMobile, Section, Badge, Button } from '../lib/ui';

const gradText: any = {
  background: "linear-gradient(90deg, #000000 0%, #666666 56.25%, #000000 100%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text"
};

/* Crossfade wrapper. */
function FadeSwap({ deps, children, style }: any) {
  const [content, setContent] = React.useState(children);
  const [vis, setVis] = React.useState(true);
  const first = React.useRef(true);
  React.useEffect(() => {
    if (first.current) {first.current = false;return;}
    setVis(false);
    const t = setTimeout(() => {setContent(children);setVis(true);}, 260);
    return () => clearTimeout(t);
  }, [deps]);
  return <div style={{ ...style, opacity: vis ? 1 : 0, transition: "opacity .28s ease" }}>{content}</div>;
}

/* ---- Product model catalogue ---- */
const MODELS: any = {
  "Plastic|Tensile": { name: "CubeTen", standard: "ASTM D638 / ISO 527", img: "cubeten-01.webp", specs: [["Standard", "ASTM D638 / ISO 527"], ["Force (Omega Load Cell)", "Up to 10kN"], ["Elongation", "Up to 1000%"], ["Weight", "250 lbs (115 kg)"], ["Height", "1.8m"], ["Footprint", "0.8 × 1.2m"], ["Power Supply", "220V Single-Phase"], ["Connectivity", "Ethernet, Wi-Fi 6"]] },
  "Plastic|Flexure": { name: "CubeTen", standard: "ASTM D790 / ISO 178", img: "cubeten-02.webp", specs: [["Standard", "ASTM D790 / ISO 178"], ["Force (Omega Load Cell)", "Up to 10kN"], ["Elongation", "Up to 1000%"], ["Weight", "250 lbs (115 kg)"], ["Height", "1.8m"], ["Footprint", "0.8 × 1.2m"], ["Power Supply", "220V Single-Phase"], ["Connectivity", "Ethernet, Wi-Fi 6"]] },
  "Rubber|Tensile": { name: "CubeOne", standard: "ASTM D412 / ISO 37", img: "cubeone-01.webp", specs: [["Standard", "ASTM D412 / ISO 37"], ["Force (Omega Load Cell)", "Up to 1kN"], ["Max Elongation", "1000%"], ["Max Speed", "150 mm/s (6 in/s)"], ["Weight", "150 lbs (75 kg)"], ["Height", "1.7m"], ["Footprint", "0.8 × 1.1m"], ["Power Supply", "220V Single-Phase"], ["Connectivity", "Ethernet, Wi-Fi 6"]] },
  "Rubber|Flexure": { name: "CubeOne", standard: "ASTM D624", img: "cubeone-02.webp", specs: [["Standard", "ASTM D624"], ["Force (Omega Load Cell)", "Up to 1kN"], ["Max Elongation", "1000%"], ["Max Speed", "150 mm/s (6 in/s)"], ["Weight", "150 lbs (75 kg)"], ["Height", "1.7m"], ["Footprint", "0.8 × 1.1m"], ["Power Supply", "220V Single-Phase"], ["Connectivity", "Ethernet, Wi-Fi 6"]] }
};
const CUSTOM_MODEL: any = { name: "CubeGo", standard: "Portable · multi-standard", img: "machine-cubego-v3.webp", specs: [["Standard", "Configurable"], ["Force (Load Cell)", "Up to 5kN"], ["Max Elongation", "1000%"], ["Weight", "35 lbs (16 kg)"], ["Footprint", "Benchtop"], ["Power Supply", "110–240V"], ["Connectivity", "Wi-Fi 6, USB-C"]] };
export function getModel(material: string, test: string) {
  if (material === "Other" || test === "Other") return { ...CUSTOM_MODEL, material, test };
  return { ...(MODELS[`${material}|${test}`] || CUSTOM_MODEL), material, test };
}

export function modelFromSample(sampleId: string) {
  const s = typeof getSample === "function" && getSample(sampleId) || null;
  if (!s) return getModel("Plastic", "Tensile");
  const material = s.material === "rubber" ? "Rubber" : "Plastic";
  const test = s.testType === "Flexure" ? "Flexure" : "Tensile";
  return { ...getModel(material, test), standard: s.standard, sample: s };
}

const STD_LOGO_INK = (std: string) => std && std.indexOf("ISO") === 0 ? "/assets/img/standards/iso-logo-ink.png" : "/assets/img/standards/astm-emblem-ink.png";

function SampleSelectCard({ s, active, onClick }: any) {
  return (
    <button
      onClick={onClick}
      style={{ all: "unset", cursor: "pointer", position: "relative", display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", minHeight: 84, boxSizing: "border-box", borderRadius: 14, background: active ? "rgba(23,221,197,0.07)" : "#fff", boxShadow: active ? "inset 0 0 0 1.5px var(--lc-teal), var(--shadow-card)" : "var(--shadow-edge)", transition: "box-shadow .18s ease, transform .18s ease" }}>

      {active ? <span style={{ position: "absolute", top: 8, left: 8, width: 20, height: 20, borderRadius: "50%", background: "var(--lc-teal)", display: "inline-flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.25)", zIndex: 1 }}><svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5 9-9" stroke="#06231f" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" /></svg></span> : null}
      <div style={{ width: 104, flex: "0 0 104px", display: "flex", alignItems: "center" }}>
        {typeof Sample === "function" ? <Sample spec={s} variant="fill" tone="light" style={{ width: "100%", maxHeight: 38 }} /> : null}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 15, letterSpacing: "-0.01em", color: "var(--lc-ink)" }}>{s.name}</div>
        <div style={{ fontSize: 12.5, color: active ? "var(--lc-teal-deep)" : "var(--text-muted)", marginTop: 2, fontWeight: 500 }}>{s.standard}</div>
      </div>
      <img src={STD_LOGO_INK(s.standard)} alt={s.standard} style={{ flex: "none", height: 21, width: "auto", opacity: active ? 0.95 : 0.5, transition: "opacity .18s ease" }} />
    </button>);
}

/* ---- Configurator question model ---- */
const DAILY_OPTIONS = [
  { value: 0, label: "Under 20", sub: "Entry volume" },
  { value: 1, label: "20–50", sub: "Mid volume" },
  { value: 2, label: "50–100", sub: "High volume" },
  { value: 3, label: "100+", sub: "Max throughput" }];
const MACHINE_HREF: any = { CubeTen: "/plastic-testing", CubeOne: "/rubber-testing", CubeGo: "/cubego" };
function machineBase(name: string) {
  if (name === "CubeOne") return MODELS["Rubber|Tensile"];
  if (name === "CubeGo") return CUSTOM_MODEL;
  return MODELS["Plastic|Tensile"];
}
function recommendMachine(selected: string[], dailyIdx: number) {
  const daily = DAILY_OPTIONS[dailyIdx] || DAILY_OPTIONS[1];
  const sel = (selected || []).map((id) => (typeof getSample === "function" ? getSample(id) : null)).filter(Boolean);
  const isRubber = sel.some((s: any) => s.material === "rubber") && !sel.some((s: any) => s.material === "plastic");
  const name = dailyIdx === 0 ? "CubeGo" : isRubber ? "CubeOne" : "CubeTen";
  const primary = sel[0] || null;
  const standard = primary ? primary.standard : "ASTM D638 / ISO 527";
  return { name, dailyLabel: daily.label, model: { ...machineBase(name), name, standard, sample: primary } };
}

function QAccordion({ n, title, desc, summary, open, onToggle, children }: any) {
  const m = useIsMobile();
  return (
    <div style={{ borderRadius: 16, background: "#fff", boxShadow: open ? "inset 0 0 0 1.5px var(--lc-teal), var(--shadow-card)" : "var(--shadow-edge)", overflow: "hidden", transition: "box-shadow .2s ease" }}>
      <button onClick={onToggle} style={{ all: "unset", cursor: "pointer", boxSizing: "border-box", width: "100%", display: "flex", alignItems: "center", gap: m ? 14 : 18, padding: m ? "20px 20px" : "24px 28px" }}>
        <span style={{ width: m ? 38 : 44, height: m ? 38 : 44, flex: "none", borderRadius: "50%", background: open ? "var(--lc-teal)" : "#000", color: open ? "#06231f" : "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: m ? 15 : 17, letterSpacing: "-0.02em", transition: "background .2s ease, color .2s ease" }}>{n}</span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: "block", fontWeight: 600, fontSize: m ? 17 : 22, letterSpacing: "-0.01em", color: "var(--lc-ink)" }}>{title}</span>
          <span style={{ display: "block", marginTop: 4, fontSize: m ? 13 : 14, fontWeight: 300, lineHeight: 1.5, color: open ? "var(--text-muted)" : "var(--lc-teal-deep)" }}>{open ? desc : summary}</span>
        </span>
        <svg width="16" height="16" viewBox="0 0 14 14" style={{ flex: "none", transform: open ? "rotate(180deg)" : "none", transition: "transform .2s ease" }}><path d="M3 5l4 4 4-4" stroke="var(--lc-ink)" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      <div style={{ display: "grid", gridTemplateRows: open ? "1fr" : "0fr", transition: "grid-template-rows .28s ease" }}>
        <div style={{ overflow: "hidden" }}>
          <div style={{ padding: m ? "0 20px 22px" : "0 28px 28px" }}>{children}</div>
        </div>
      </div>
    </div>);
}
function ChipRow({ options, value, onChange }: any) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
      {options.map((o: any) => {
        const active = o.value === value;
        return (
          <button key={o.value} onClick={() => onChange(o.value)} style={{ all: "unset", cursor: "pointer", boxSizing: "border-box", padding: "13px 20px", borderRadius: 12, background: active ? "rgba(23,221,197,0.08)" : "var(--lc-gray-100)", boxShadow: active ? "inset 0 0 0 1.5px var(--lc-teal)" : "inset 0 0 0 1px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", gap: 2, minWidth: 116, transition: "box-shadow .18s ease, background .18s ease" }}>
            <span style={{ fontWeight: 600, fontSize: 16, color: "var(--lc-ink)" }}>{o.label}</span>
            {o.sub ? <span style={{ fontSize: 12, fontWeight: 500, color: active ? "var(--lc-teal-deep)" : "var(--text-muted)" }}>{o.sub}</span> : null}
          </button>);
      })}
    </div>);
}

function MaterialAccordion({ list, selected, toggleSample, otherSample, setOtherSample }: any) {
  const [open, setOpen] = React.useState<string | null>(null);
  const rows = [
  { key: "plastic", label: "Plastic", machine: "CubeTen / CubeFlex" },
  { key: "rubber", label: "Rubber", machine: "CubeOne" }];
  const shell = (active: boolean) => ({ borderRadius: 14, background: "#fff", boxShadow: active ? "inset 0 0 0 1.5px var(--lc-teal)" : "var(--shadow-edge)", overflow: "hidden" });
  const head: any = { all: "unset", cursor: "pointer", boxSizing: "border-box", display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "18px 18px" };
  const caret = (isOpen: boolean) => <svg width="14" height="14" viewBox="0 0 14 14" style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform .2s ease", flex: "none" }}><path d="M3 5l4 4 4-4" stroke="var(--lc-ink)" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8 }}>
      {rows.map((grp) => {
        const items = list.filter((s: any) => s.material === grp.key);
        if (!items.length) return null;
        const isOpen = open === grp.key;
        const hasActive = items.some((s: any) => selected.includes(s.id));
        return (
          <div key={grp.key} style={shell(hasActive)}>
            <button onClick={() => setOpen(isOpen ? null : grp.key)} style={head}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--lc-teal)", flex: "none" }} />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontWeight: 700, fontSize: 15, letterSpacing: "0.02em", color: "var(--lc-ink)" }}>{grp.label}</span>
                <span style={{ display: "block", marginTop: 2, fontSize: 12, color: "var(--text-muted)" }}>{grp.machine}</span>
              </span>
              {caret(isOpen)}
            </button>
            <div style={{ overflow: "hidden", maxHeight: isOpen ? 1200 : 0, transition: "max-height .32s ease" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "0 14px 16px" }}>
                {items.map((s: any) => <SampleSelectCard key={s.id} s={s} active={selected.includes(s.id)} onClick={() => toggleSample(s.id)} />)}
              </div>
            </div>
          </div>);
      })}
      <div style={shell(!!(otherSample && otherSample.trim()))}>
        <button onClick={() => setOpen(open === "other" ? null : "other")} style={head}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--lc-teal)", flex: "none" }} />
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontWeight: 700, fontSize: 15, letterSpacing: "0.02em", color: "var(--lc-ink)" }}>Other</span>
            <span style={{ display: "block", marginTop: 2, fontSize: 12, color: "var(--text-muted)" }}>Not listed above</span>
          </span>
          {caret(open === "other")}
        </button>
        <div style={{ overflow: "hidden", maxHeight: open === "other" ? 400 : 0, transition: "max-height .32s ease" }}>
            <div style={{ padding: "0 14px 16px" }}>
              <textarea value={otherSample} onChange={(e) => setOtherSample(e.target.value)} placeholder="Type the standard or specimen you run — e.g. ASTM D1708 or a custom die." rows={3} style={{ width: "100%", boxSizing: "border-box", padding: "14px 16px", borderRadius: 12, border: "none", outline: "none", resize: "vertical", fontFamily: "inherit", fontSize: 15, lineHeight: 1.5, color: "var(--lc-ink)", background: "var(--lc-gray-100)", boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.06)" }} />
            </div>
        </div>
      </div>
    </div>);
}

function Configurator({ selected, toggleSample, dailyIdx, setDailyIdx, otherSample, setOtherSample, rec }: any) {
  const m = useIsMobile();
  const list = typeof SAMPLES !== "undefined" ? SAMPLES : [];
  const [open, setOpen] = React.useState(0);
  const toggle = (i: number) => setOpen((o) => o === i ? -1 : i);
  const primary = (typeof getSample === "function" && getSample(selected[0])) || null;
  const sampleSummary = (primary ? primary.standard + " " + primary.name : "Select a standard") + (selected.length > 1 ? " + " + (selected.length - 1) + " more" : "") + (otherSample && otherSample.trim() ? " + custom" : "");
  const dailySummary = (DAILY_OPTIONS[dailyIdx] || {}).label + " samples/day";
  return (
    <Section bg="#fff">
      <div style={{ padding: m ? "20px 0 80px" : "30px 0 130px" }}>
        <Badge variant="neutral">Configure</Badge>
        <h2 style={{ ...gradText, fontWeight: 600, fontSize: m ? 30 : 66, lineHeight: 1.27, letterSpacing: "-0.01em", margin: m ? "28px 0 0" : "40px 0 0", maxWidth: 1014 }}>Find out which of our automated testing machines fits your lab, with a simple test.
        </h2>
        <div style={{ height: 1, background: "rgba(0,0,0,0.1)", margin: m ? "48px 0 36px" : "90px 0 56px" }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <QAccordion n="01" title="What do you test?" desc="Select every specimen geometry and standard you run — you can choose more than one." summary={sampleSummary} open={open === 0} onToggle={() => toggle(0)}>
            {m ? <MaterialAccordion list={list} selected={selected} toggleSample={toggleSample} otherSample={otherSample} setOtherSample={setOtherSample} /> :
            <div style={{ marginTop: 4 }}>
              {[{ key: "plastic", label: "Plastic", machine: "CubeTen / CubeFlex" }, { key: "rubber", label: "Rubber", machine: "CubeOne" }].map((grp) => {
                const items = list.filter((s: any) => s.material === grp.key);
                if (!items.length) return null;
                return (
                  <div key={grp.key} style={{ marginTop: 24 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                      <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--lc-teal)", flex: "none" }} />
                      <span style={{ fontWeight: 700, fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--lc-ink)" }}>{grp.label}</span>
                      <span style={{ fontSize: 12, color: "var(--text-muted)", letterSpacing: "0.02em" }}>{grp.machine}</span>
                      <span style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.1)" }} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: m ? "1fr" : "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
                      {items.map((s: any) =>
                        <SampleSelectCard key={s.id} s={s} active={selected.includes(s.id)} onClick={() => toggleSample(s.id)} />
                      )}
                    </div>
                  </div>);
              })}
              <div style={{ marginTop: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--lc-teal)", flex: "none" }} />
                  <span style={{ fontWeight: 700, fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--lc-ink)" }}>Other</span>
                  <span style={{ fontSize: 12, color: "var(--text-muted)", letterSpacing: "0.02em" }}>Not listed above</span>
                  <span style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.1)" }} />
                </div>
                <textarea value={otherSample} onChange={(e) => setOtherSample(e.target.value)} placeholder="Type the standard or specimen you run — e.g. ASTM D1708 or a custom die." rows={3} style={{ width: "100%", boxSizing: "border-box", padding: "16px 18px", borderRadius: 14, border: "none", outline: "none", resize: "vertical", fontFamily: "inherit", fontSize: 15, lineHeight: 1.5, color: "var(--lc-ink)", background: otherSample && otherSample.trim() ? "rgba(23,221,197,0.07)" : "#fff", boxShadow: otherSample && otherSample.trim() ? "inset 0 0 0 1.5px var(--lc-teal), var(--shadow-card)" : "var(--shadow-edge)", transition: "box-shadow .18s ease, background .18s ease" }} />
              </div>
            </div>
            }
          </QAccordion>
          <QAccordion n="02" title="How many samples do you test daily?" desc="An approximate daily volume is enough — it helps us size the right level of automation." summary={dailySummary} open={open === 1} onToggle={() => toggle(1)}>
            <div style={{ marginTop: 6 }}><ChipRow options={DAILY_OPTIONS} value={dailyIdx} onChange={setDailyIdx} /></div>
          </QAccordion>
        </div>
        <div style={{ marginTop: m ? 36 : 56, borderRadius: 20, background: "#000", color: "#fff", padding: m ? "26px 22px" : "34px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap", position: "relative", overflow: "hidden" }}>
          <span style={{ position: "absolute", width: 260, height: 60, top: -10, right: 80, borderRadius: 60, background: "#17DDC5", opacity: 0.3, filter: "blur(60px)", pointerEvents: "none" }} />
          <div style={{ position: "relative" }}>
            <div style={{ fontWeight: 700, fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--lc-teal)" }}>Your match</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginTop: 10, flexWrap: "wrap" }}>
              <span style={{ fontWeight: 600, fontSize: m ? 28 : 38, letterSpacing: "-0.02em" }}>{rec.name}</span>
              <span style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.6)" }}>{rec.dailyLabel} samples/day</span>
            </div>
            <div style={{ marginTop: 8, fontSize: 14, color: "rgba(255,255,255,0.6)", fontWeight: 300 }}>Matched to {selected.length} standard{selected.length > 1 ? "s" : ""}{otherSample && otherSample.trim() ? " + your custom spec" : ""}.</div>
          </div>
          <div style={{ position: "relative" }}><Button variant="primary" href={MACHINE_HREF[rec.name] || "/plastic-testing"}>Explore {rec.name}</Button></div>
        </div>
      </div>
    </Section>);
}

/* ---- CubeTen full-bleed showcase ---- */
function CubeTenShowcase({ model, focus }: any) {
  const m = useIsMobile();
  if (m) return null;
  const H = m ? 150 : 340;
  const OVERLAP = 0.30;
  const S = m ? 0.46 : 0.5;
  const SIDE = m ? 150 : 470;
  const tenN = S * 1.10,tenF = S * 1.265;
  const oneN = S * 1.0,oneF = S * 1.15;
  const goN = S * 1.0,goF = S * 1.15;
  const base = { ty: 0, b: 1, o: 1, bl: 0 };
  const STATES: any = {
    neutral: {
      go: { ...base, tx: -SIDE, s: goN, z: 2 },
      ten: { ...base, tx: 0, s: tenN, z: 3 },
      one: { ...base, tx: SIDE + 10, s: oneN, z: 2 }
    },
    CubeGo: {
      go: { ...base, tx: -20, s: goF, z: 3 },
      ten: { ...base, tx: -SIDE, s: tenN, z: 2 },
      one: { ...base, tx: SIDE + 10, s: oneN, z: 2 }
    },
    CubeTen: {
      ten: { ...base, tx: 0, s: tenF, z: 3 },
      go: { ...base, tx: -SIDE, s: goN, z: 2 },
      one: { ...base, tx: SIDE + 10, s: oneN, z: 2 }
    },
    CubeOne: {
      one: { ...base, tx: 0, s: oneF, z: 3 },
      go: { ...base, tx: -SIDE, s: goN, z: 2 },
      ten: { ...base, tx: SIDE, s: tenN, z: 2 }
    }
  };
  const key = STATES[focus] ? focus : "neutral";
  const st = STATES[key];
  const transition = "transform .85s cubic-bezier(.22,.9,.28,1), filter .55s ease, opacity .55s ease";
  const machine = (state: any, src: string, alt: string, feetAdj?: number) =>
  <img
    src={src}
    alt={alt}
    style={{
      position: "absolute", left: "50%", bottom: `calc(15% - ${feetAdj || 0}px)`, height: H, width: "auto",
      transformOrigin: "bottom center",
      transform: `translateX(-50%) translateX(${state.tx}px) translateY(${state.ty}px) scale(${state.s})`,
      filter: `brightness(${state.b}) blur(${state.bl || 0}px)`,
      opacity: state.o, zIndex: state.z, transition, pointerEvents: "none",
      willChange: "transform"
    }} />;

  const headline = focus ? model.name : "CubeTen & CubeOne";
  return (
    <section className="lc-showcase" style={{ position: "relative", zIndex: 2, background: "#000" }}>
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: "radial-gradient(120% 80% at 50% 0%, rgba(23,221,197,0.14) 0%, rgba(0,0,0,0) 55%), #000" }} />
      <div style={{ position: "relative", display: "flow-root", maxWidth: 1440, margin: "0 auto", padding: m ? "60px 20px 56px" : "95px 64px 0", boxSizing: "border-box", textAlign: "center" }}>
        <FadeSwap deps={headline}>
          <h2 style={{ fontWeight: 600, fontSize: m ? focus ? 52 : 38 : focus ? 100 : 72, lineHeight: 1.2, letterSpacing: "-0.03em", color: "#fff", margin: 0 }}>{headline}</h2>
        </FadeSwap>
        <div style={{ display: "flex", justifyContent: "center", marginTop: m ? 16 : 18, position: "relative" }}>
          <span style={{ position: "absolute", width: 220, height: 46, top: 2, left: "50%", transform: "translateX(-50%)", borderRadius: 43, background: "#17DDC5", opacity: 0.36, filter: "blur(46px)", pointerEvents: "none" }} />
          <FadeSwap deps={model.name}>
            <Button variant="primary" style={{ whiteSpace: "nowrap" }} href={({ CubeTen: "/plastic-testing", CubeOne: "/rubber-testing", CubeGo: "/cubego" } as any)[model.name] || "/plastic-testing"}>Explore {model.name}</Button>
          </FadeSwap>
        </div>
        {!m &&
        <div style={{ position: "relative", width: "100%", height: H, maxWidth: 973, margin: "34px auto 0", marginBottom: -(H * OVERLAP), zIndex: 3 }}>
          {machine(st.go, "/assets/img/media/machine-cubego-v3.webp", "CubeGo portable tensile testing machine", 4)}
          {machine(st.ten, "/assets/img/media/machine-cubeten.png", "CubeTen automated tensile testing machine")}
          {machine(st.one, "/assets/img/media/machine-cubeone.png", "CubeOne automated tensile testing machine", 4)}
        </div>
        }
      </div>
    </section>);
}

/* ---- Specs band ---- */
function SpecsBand({ model }: any) {
  const m = useIsMobile();
  return (
    <Section bg="#fff">
      <div style={{ paddingTop: m ? 58 : 180, paddingBottom: m ? 80 : 130, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <p style={{ fontWeight: 300, fontSize: m ? 16 : 18, lineHeight: 1.55, color: "var(--text-muted)", maxWidth: 769, textAlign: "center", margin: 0 }}>No massive infrastructural changes required. Designed to fit through standard lab doors and plug into conventional outlets while delivering uncompromising strength.</p>
        <FadeSwap deps={model.name + model.standard} style={{ width: "100%", maxWidth: 769, marginTop: 56 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 23 }}>
            {model.specs.map(([k, v]: any) =>
            <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 16, borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                <span style={{ fontWeight: 300, fontSize: 16, color: "var(--text-muted)" }}>{k}</span>
                <span style={{ fontWeight: 500, fontSize: 16, letterSpacing: "0.03em", color: "var(--lc-ink)" }}>{v}</span>
              </div>
            )}
          </div>
        </FadeSwap>
      </div>
    </Section>);
}

/* ---- Combined island: owns the shared state root (was in App) ---- */
export default function ConfiguratorFlow() {
  const [selected, setSelected] = React.useState(["astm-d638-i"]);
  const [dailyIdx, setDailyIdx] = React.useState(1);
  const [otherSample, setOtherSample] = React.useState("");
  const toggleSample = (id: string) => setSelected((cur) => {
    if (cur.includes(id)) return cur.length > 1 ? cur.filter((x) => x !== id) : cur;
    const mat = ((typeof getSample === "function" && getSample(id)) || {}).material;
    const sameMat = cur.filter((x) => (((typeof getSample === "function" && getSample(x)) || {}).material) === mat);
    return [...sameMat, id];
  });
  const rec = recommendMachine(selected, dailyIdx);
  const model = rec.model;
  const focus = rec.name;
  return (
    <React.Fragment>
      <Configurator selected={selected} toggleSample={toggleSample} dailyIdx={dailyIdx} setDailyIdx={setDailyIdx} otherSample={otherSample} setOtherSample={setOtherSample} rec={rec} />
      <CubeTenShowcase model={model} focus={focus} />
      <SpecsBand model={model} />
    </React.Fragment>);
}
