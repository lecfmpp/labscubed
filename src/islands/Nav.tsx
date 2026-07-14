/* Nav island (client:load) — desktop bar + mobile hamburger drawer.
   Ported from ui-lib.jsx Nav. Logo path made absolute. */
import React from 'react';
import { useIsMobile, Button } from '../lib/ui';

export default function Nav() {
  const links: [string, string][] = [["Rubber Testing", "/rubber-testing"], ["Plastic Testing", "/plastic-testing"], ["About Us", "/about-us"], ["ROI Calculator", "https://roicalculator.labscubed.com/"], ["Testimonials", "/#testimonials"], ["Resources", "/blog"]];
  const m = useIsMobile();
  const [open, setOpen] = React.useState(false);
  if (m) {
    return (
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px" }}>
          <img src="/assets/img/logo.png" alt="LabsCubed" style={{ height: 28 }} />
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
            {links.map(([l, href]) => (
              <a key={l} href={href} style={{ color: "rgba(255,255,255,0.85)", fontSize: 16, textDecoration: "none", padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>{l}</a>
            ))}
            <div style={{ marginTop: 16 }}><Button variant="primary" size="sm" href="/get-a-quote">Get a Quote</Button></div>
          </div>
        )}
      </div>
    );
  }
  return (
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 10, display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 1392, padding: "18px 26px", boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <img src="/assets/img/logo.png" alt="LabsCubed" style={{ height: 34 }} />
        <nav style={{ display: "flex", gap: 26, alignItems: "center" }}>
          {links.slice(0, 5).map(([l, href]) => (
            <a key={l} href={href} style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, textDecoration: "none" }} className="lc-navlink">{l}</a>
          ))}
          <a href="/blog" style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, display: "inline-flex", alignItems: "center", gap: 5 }} className="lc-navlink">Resources
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </a>
        </nav>
        <Button variant="primary" size="sm" href="/get-a-quote">Get a Quote</Button>
      </div>
    </div>
  );
}
