/* ProductHighlight island — tray toggle · TypeCycle · Specimen Library.
   Ported from home-a.jsx (ProductHighlight + helpers). Asset paths made absolute.
   The library itself is SpecimenLibrary.tsx, shared with the product pages. */
import React from 'react';
import { useIsMobile, Section } from '../lib/ui';
import SpecimenLibrary from './SpecimenLibrary';

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

export default function ProductHighlight() {
  const m = useIsMobile();
  const PLASTIC = ["astm-d638-i", "astm-d638-ii", "astm-d638-iii", "astm-d638-iv", "astm-d638-v", "iso-527-1a", "iso-527-1b", "astm-d412-c", "astm-d412-d", "iso-37-2", "astm-d624-c", "astm-d624-b", "astm-d790", "iso-178"];
  const [tray, setTray] = React.useState("Plastic");
  const trayRubber = tray === "Rubber";
  const trayCap = trayRubber ? 12 : 15;
  const trayMachine = trayRubber ? "CubeOne" : "CubeTen";
  const TRAY_IMG: any = { Plastic: "/uploads/tray-labscubed-plastic.webp", Rubber: "/uploads/tray-labscubed-rubber.webp" };
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
            <img key={tray} src={TRAY_IMG[tray]} width={600} height={400} alt={`Autonomous ${tray.toLowerCase()} tray loaded with test specimens`} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", display: "block", filter: "drop-shadow(0 42px 14px rgba(0,0,0,0.2))", animation: "lcTrayFade .4s ease" }} />
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
        <SpecimenLibrary ids={PLASTIC} defaultId="astm-d638-i" />
      </div>
    </Section>);
}
