/* Nav island (client:load) — desktop bar + mobile hamburger drawer.
   Links replicate the live labscubed.com Webflow header (absolute www URLs),
   including the Resources dropdown. No ROI Calculator (matches live). */
import React from 'react';
import { useIsMobile, Button } from '../lib/ui';

const HOME = 'https://www.labscubed.com/';
const mainLinks: [string, string][] = [
  ['Rubber Testing', 'https://www.labscubed.com/rubber-testing'],
  ['Plastic Testing', 'https://www.labscubed.com/plastic-testing'],
  ['About Us', 'https://www.labscubed.com/about-us'],
  ['Testimonials', 'https://www.labscubed.com/#testimonials'],
];
const resourceLinks: [string, string][] = [
  ['ASTM D638', 'https://www.labscubed.com/astm-d638-iso527-tensile-testing'],
  ['ASTM D412', 'https://www.labscubed.com/astm-d412-iso37-how-to-run-tensile-testing-for-rubber'],
  ['Blog', 'https://www.labscubed.com/blog'],
];
const QUOTE = 'https://www.labscubed.com/get-a-quote';

export default function Nav() {
  const m = useIsMobile();
  const [open, setOpen] = React.useState(false);
  const [resOpen, setResOpen] = React.useState(false);

  if (m) {
    return (
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px" }}>
          <a href={HOME}><img src="/assets/img/logo.png" alt="LabsCubed" width={564} height={140} style={{ height: 28, width: "auto", display: "block" }} /></a>
          <button onClick={() => setOpen((o) => !o)} aria-label="Menu" style={{ all: "unset", cursor: "pointer", width: 42, height: 42, display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: 10, background: "rgba(255,255,255,0.1)" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              {open
                ? <path d="M6 6l12 12M18 6L6 18" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
                : <path d="M4 7h16M4 12h16M4 17h16" stroke="#fff" strokeWidth="2" strokeLinecap="round" />}
            </svg>
          </button>
        </div>
        {open && (
          <div style={{ background: "rgba(0,0,0,0.96)", borderTop: "1px solid rgba(255,255,255,0.1)", padding: "12px 20px 24px", display: "flex", flexDirection: "column", gap: 4 }}>
            {mainLinks.map(([l, href]) => (
              <a key={l} href={href} style={{ color: "rgba(255,255,255,0.85)", fontSize: 16, textDecoration: "none", padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>{l}</a>
            ))}
            <div style={{ padding: "12px 0 4px", fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)" }}>Resources</div>
            {resourceLinks.map(([l, href]) => (
              <a key={l} href={href} style={{ color: "rgba(255,255,255,0.85)", fontSize: 15, textDecoration: "none", padding: "10px 0 10px 12px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>{l}</a>
            ))}
            <div style={{ marginTop: 16 }}><Button variant="primary" size="sm" href={QUOTE}>Get a Quote</Button></div>
          </div>
        )}
      </div>
    );
  }
  return (
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 10, display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 1392, padding: "18px 26px", boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <a href={HOME}><img src="/assets/img/logo.png" alt="LabsCubed" width={564} height={140} style={{ height: 34, width: "auto", display: "block" }} /></a>
        <nav style={{ display: "flex", gap: 26, alignItems: "center" }}>
          {mainLinks.map(([l, href]) => (
            <a key={l} href={href} style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, textDecoration: "none" }} className="lc-navlink">{l}</a>
          ))}
          <div
            style={{ position: "relative" }}
            onMouseEnter={() => setResOpen(true)}
            onMouseLeave={() => setResOpen(false)}
          >
            <button style={{ all: "unset", cursor: "pointer", color: "rgba(255,255,255,0.85)", fontSize: 13, display: "inline-flex", alignItems: "center", gap: 5 }} className="lc-navlink" aria-haspopup="true" aria-expanded={resOpen}>Resources
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" style={{ transform: resOpen ? "rotate(180deg)" : "none", transition: "transform .2s ease" }}><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <div style={{ position: "absolute", top: "100%", right: 0, paddingTop: 14, opacity: resOpen ? 1 : 0, visibility: resOpen ? "visible" : "hidden", transform: resOpen ? "translateY(0)" : "translateY(-6px)", transition: "opacity .18s ease, transform .18s ease, visibility .18s", pointerEvents: resOpen ? "auto" : "none" }}>
              <div style={{ minWidth: 220, background: "rgba(0,0,0,0.96)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: 8, boxShadow: "0 18px 40px rgba(0,0,0,0.45)", display: "flex", flexDirection: "column", gap: 2 }}>
                {resourceLinks.map(([l, href]) => (
                  <a key={l} href={href} style={{ color: "rgba(255,255,255,0.85)", fontSize: 13.5, textDecoration: "none", padding: "10px 12px", borderRadius: 8 }} className="lc-navlink lc-navdrop">{l}</a>
                ))}
              </div>
            </div>
          </div>
        </nav>
        <Button variant="primary" size="sm" href={QUOTE}>Get a Quote</Button>
      </div>
    </div>
  );
}
