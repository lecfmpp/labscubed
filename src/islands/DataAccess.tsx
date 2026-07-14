/* DataAccess island — auto-advancing dashboard slider + integrations grid.
   Ported from home-b.jsx. Asset paths made absolute. */
import React from 'react';
import { useIsMobile } from '../lib/ui';

const IMG2 = "/assets/img/media/";

function DashboardSlider({ images }: any) {
  const [i, setI] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  React.useEffect(() => {
    if (paused || images.length < 2) return undefined;
    const t = setInterval(() => setI((p) => (p + 1) % images.length), 4500);
    return () => clearInterval(t);
  }, [paused, images.length]);
  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      style={{ position: "relative", borderRadius: 16, overflow: "hidden", boxShadow: "var(--shadow-edge), var(--shadow-card)", background: "#fff", aspectRatio: "1080 / 541" }}
    >
      {images.map((src: string, idx: number) => (
        <img key={src} src={IMG2 + src} alt="LabsCubed data review dashboard — stress-strain analysis" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", display: "block", opacity: idx === i ? 1 : 0, transition: "opacity .9s ease", pointerEvents: "none" }} />
      ))}
      {images.length > 1 && (
        <div style={{ position: "absolute", bottom: 16, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 8 }}>
          {images.map((_: any, idx: number) => (
            <button key={idx} onClick={() => setI(idx)} aria-label={`Show dashboard ${idx + 1}`} style={{ all: "unset", cursor: "pointer", width: idx === i ? 24 : 8, height: 8, borderRadius: 999, background: idx === i ? "var(--lc-teal)" : "rgba(0,0,0,0.18)", transition: "width .3s ease, background .3s ease" }} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function DataAccess() {
  const m = useIsMobile();
  return (
    <section style={{ background: "var(--lc-gray-100)" }}>
      <div style={{ maxWidth: 1312, margin: "0 auto", padding: m ? "80px 20px" : "150px 64px 130px", boxSizing: "border-box" }}>
        <div style={{ textAlign: "center", maxWidth: 760, margin: "0 auto" }}>
          <h2 style={{ fontWeight: 700, fontSize: m ? 32 : 56, letterSpacing: "-0.03em", lineHeight: 1.07, margin: 0, color: "var(--lc-ink)" }}>Access Your Data Instantly. Anywhere.</h2>
          <p style={{ marginTop: 18, fontWeight: 300, fontSize: m ? 16 : 20, lineHeight: 1.55, color: "var(--text-muted)" }}>Every test streams straight into the <strong style={{ fontWeight: 600, color: "var(--lc-ink)" }}>LabsCubed Portal</strong> — your cloud workspace to review, compare and export results from anywhere. Need the data elsewhere? Our software team pipes it directly into the systems your lab already runs.</p>
        </div>
        <div style={{ marginTop: m ? 40 : 64 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: m ? 18 : 24 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--lc-teal)", flex: "none" }} />
            <span style={{ fontWeight: 700, fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--lc-ink)" }}>The LabsCubed Portal</span>
          </div>
          <DashboardSlider images={["dashboard.webp", "dashboard_01.webp"]} />
          <div style={{ textAlign: "center", marginTop: m ? 16 : 20, fontWeight: 300, fontSize: m ? 13 : 15, color: "var(--text-muted)" }}>Live dashboards, streamed from every test into the LabsCubed Portal.</div>
        </div>
        <div style={{ marginTop: m ? 48 : 80 }}>
          <div style={{ textAlign: "center", fontWeight: 700, fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: m ? 24 : 36 }}>Or integrate with the systems you already run</div>
          <div style={{ display: "grid", gridTemplateColumns: m ? "1fr" : "repeat(3, 1fr)", gap: m ? 10 : 24, maxWidth: m ? 150 : 620, margin: "0 auto" }}>
            {[
              { img: "integ-alpha.png", name: "Alpha Workbench", desc: "Push tensile results straight into Alpha’s rheology and materials-testing workflows — no manual re-entry." },
              { img: "integ-uncountable.png", name: "Uncountable", desc: "Feed every data point into Uncountable’s R&D and experiment-management platform to close the loop on formulation." },
              { img: "integ-sap.png", name: "SAP", desc: "Sync results into SAP so quality records and ERP stay in lockstep across the business." },
            ].map((it) => (
              <div key={it.name} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ borderRadius: 14, overflow: "hidden", boxShadow: "var(--shadow-edge)" }}>
                  <img src={IMG2 + it.img} alt={it.name + " logo"} style={{ width: "100%", display: "block" }} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: m ? 15 : 16, color: "var(--lc-ink)" }}>{it.name}</div>
                  <div style={{ marginTop: 4, fontWeight: 300, fontSize: m ? 13 : 14, lineHeight: 1.45, color: "var(--text-muted)" }}>{it.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: m ? 24 : 34, textAlign: "center" }}>
            <span style={{ fontWeight: 300, fontSize: m ? 14 : 16, color: "var(--text-muted)" }}>…and these are just a few. Don’t see your tool? </span>
            <a href="/get-a-quote" className="lc-inline-link" style={{ fontWeight: 500, fontSize: m ? 14 : 16, color: "var(--lc-ink)", textDecoration: "none", borderBottom: "1px solid var(--lc-teal)", paddingBottom: 1 }}>We’ll build the integration you need →</a>
          </div>
        </div>
      </div>
    </section>);
}
