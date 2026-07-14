/* ============================================================
   LabsCubed — shared UI primitives (ported from ui-lib.jsx).
   Used by the React islands. Static .astro sections have their
   own markup equivalents.
   ============================================================ */
import React from 'react';

export const ARROW = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
    <path d="M7 17 17 7M17 7H9M17 7v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* Shared responsive hook — true at/below the breakpoint (default 760px). */
export function useIsMobile(bp = 760) {
  const [m, setM] = React.useState(typeof window !== "undefined" ? window.innerWidth <= bp : false);
  React.useEffect(() => {
    const on = () => setM(window.innerWidth <= bp);
    on();
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, [bp]);
  return m;
}
/* Fluid gutter used across sections. */
export function gutter(m: boolean) { return m ? "0 20px" : "0 64px"; }

export function Button({ children, variant = "primary", size = "md", arrow, href = "#", style, ...rest }: any) {
  const showArrow = arrow ?? (variant === "primary" || variant === "dark");
  const P: any = {
    primary: { bg: "var(--lc-teal)", color: "#000", circle: "#000", arrow: "#fff" },
    dark: { bg: "#000", color: "#fff", circle: "rgba(255,255,255,0.14)", arrow: "#fff" },
    solid: { bg: "var(--lc-teal)", color: "#000", circle: null },
    ghost: { bg: "transparent", color: "#fff", circle: "rgba(255,255,255,0.14)", arrow: "#fff" },
  }[variant];
  const circle = size === "sm" ? 30 : 36;
  return (
    <a
      href={href}
      className="lc-btn"
      style={{
        display: "inline-flex", alignItems: "center", gap: 14,
        borderRadius: 999, background: P.bg, color: P.color,
        border: variant === "ghost" ? "1px solid rgba(255,255,255,0.25)" : "none",
        fontWeight: 500, fontSize: size === "sm" ? 13 : 14, lineHeight: 1,
        padding: showArrow ? (size === "sm" ? "8px 8px 8px 18px" : "8px 8px 8px 26px") : (size === "sm" ? "11px 22px" : "16px 30px"),
        textDecoration: "none", ...style,
      }}
      {...rest}
    >
      <span>{children}</span>
      {showArrow && (
        <span style={{ width: circle, height: circle, borderRadius: "50%", background: P.circle, color: P.arrow, display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "none" }}>{ARROW}</span>
      )}
    </a>
  );
}

export function Badge({ children, variant = "neutral" }: any) {
  const P: any = {
    neutral: { bg: "var(--lc-gray-200)", color: "var(--lc-ink)", t: "0.1em" },
    subtle: { bg: "var(--lc-gray-100)", color: "var(--text-muted)", t: "0.2em" },
  }[variant];
  return (
    <span style={{ display: "inline-flex", background: P.bg, color: P.color, borderRadius: 4, padding: "5px 12px", fontWeight: 700, fontSize: 11, letterSpacing: P.t, textTransform: "uppercase", lineHeight: 1 }}>{children}</span>
  );
}

export function Eyebrow({ children, muted }: any) {
  return <div style={{ fontWeight: 700, fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: muted ? "rgba(255,255,255,0.5)" : "var(--text-muted)" }}>{children}</div>;
}

export function Section({ children, bg = "#fff", style }: any) {
  const m = useIsMobile();
  return (
    <section style={{ background: bg, width: "100%", display: "flex", justifyContent: "center", ...style }}>
      <div style={{ width: "100%", maxWidth: 1312, padding: gutter(m), boxSizing: "border-box" }}>{children}</div>
    </section>
  );
}
