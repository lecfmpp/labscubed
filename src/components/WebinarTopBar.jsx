import React from 'react';
import { getWebinar, COLORS } from './webinarConfig.js';

// The teal countdown strip. It lives ABOVE the site header rather than inside
// the page body, so it is rendered by the .astro page directly and not by
// RegistrationApp — see registration.astro's sticky stack.

function useIsMobile(bp = 760) {
  const [m, setM] = React.useState(window.innerWidth <= bp);
  React.useEffect(() => {
    const on = () => setM(window.innerWidth <= bp);
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, [bp]);
  return m;
}

function useCountdown(targetISO) {
  const target = React.useMemo(() => new Date(targetISO).getTime(), [targetISO]);
  const [left, setLeft] = React.useState(target - Date.now());
  React.useEffect(() => {
    const t = setInterval(() => setLeft(target - Date.now()), 1000);
    return () => clearInterval(t);
  }, [target]);
  return Math.max(left, 0);
}

const pad = (n) => String(n).padStart(2, "0");

export default function WebinarTopBar({ slug }) {
  const CONFIG = getWebinar(slug);
  const m = useIsMobile();
  const left = useCountdown(CONFIG.targetISO);

  const units = [
    [pad(Math.floor(left / 86400000)), "D"],
    [pad(Math.floor((left % 86400000) / 3600000)), "H"],
    [pad(Math.floor((left % 3600000) / 60000)), "M"],
    [pad(Math.floor((left % 60000) / 1000)), "S"],
  ];

  return (
    <div style={{ background: COLORS.teal, borderBottom: `3px solid ${COLORS.tealDeep}` }}>
      <div style={{ maxWidth: 1312, margin: "0 auto", padding: m ? "10px 20px" : "10px 64px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: m ? 6 : 8 }}>
          <span style={{ fontSize: m ? 11 : 13, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#000", opacity: 0.9 }}>Starts in</span>
          <div style={{ display: "flex", gap: m ? 2 : 4 }}>
            {units.map(([value, label]) => (
              <div key={label} style={{ textAlign: "center" }}>
                <div style={{ fontVariantNumeric: "tabular-nums", fontWeight: 900, fontSize: m ? 14 : 22, background: "#000", borderRadius: 6, padding: m ? "2px 3px" : "4px 6px", color: "#fff", lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: 8, fontWeight: 600, color: "#000", opacity: 0.9, marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
