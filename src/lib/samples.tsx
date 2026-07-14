/* ============================================================
   LabsCubed — Sample Library (ported verbatim from reference
   sample-lib.jsx; geometry math is unchanged — see handoff note).
   ============================================================ */
import React from 'react';

const INK = "#1d1d1f";
const TEAL = "#17ddc5";
const TEALD = "#0d9488";
const GRAY = "#86868b";
const WHITE = "#ffffff";

/* ---- Standards reference table -------------------------------------------
   Geometry in millimetres. For dog-bones: LO overall length, L reduced-section
   length, WO grip width, W narrow width, R shoulder fillet radius, G gauge. ---- */
export const SAMPLES: any[] = [
  // ---- ASTM D638 · Plastics · CubeTen ----
  { id: "astm-d638-i",  standard: "ASTM D638", name: "Type I",  blurb: "Standard rigid-plastic tensile bar — the most common geometry.",
    material: "plastic", machine: "CubeTen", testType: "Tensile", shape: "dogbone", thickness: "3.2 mm",
    geom: { LO: 165, L: 57, WO: 19, W: 13, R: 76, G: 50 } },
  { id: "astm-d638-ii", standard: "ASTM D638", name: "Type II", blurb: "For materials that won't break as a Type I within grip limits.",
    material: "plastic", machine: "CubeTen", testType: "Tensile", shape: "dogbone", thickness: "3.2 mm",
    geom: { LO: 183, L: 57, WO: 19, W: 6, R: 76, G: 50 } },
  { id: "astm-d638-iii", standard: "ASTM D638", name: "Type III", blurb: "Thick sections up to 14 mm — heavy-duty plastics.",
    material: "plastic", machine: "CubeTen", testType: "Tensile", shape: "dogbone", thickness: "≤ 14 mm",
    geom: { LO: 246, L: 57, WO: 29, W: 19, R: 76, G: 50 } },
  { id: "astm-d638-iv", standard: "ASTM D638", name: "Type IV", blurb: "Die-cut specimen for comparing rigid & non-rigid plastics.",
    material: "plastic", machine: "CubeTen", testType: "Tensile", shape: "dogbone", thickness: "3.2 mm",
    geom: { LO: 115, L: 33, WO: 19, W: 6, R: 14, G: 25 } },
  { id: "astm-d638-v", standard: "ASTM D638", name: "Type V", blurb: "Micro-tensile — smallest scale, limited material.",
    material: "plastic", machine: "CubeTen", testType: "Tensile", shape: "dogbone", thickness: "≤ 4 mm",
    geom: { LO: 63.5, L: 9.53, WO: 9.53, W: 3.18, R: 12.7, G: 7.62 } },

  // ---- ISO 527-2 · Plastics · CubeTen ----
  { id: "iso-527-1a", standard: "ISO 527-2", name: "Type 1A", blurb: "Multipurpose injection-moulded specimen.",
    material: "plastic", machine: "CubeTen", testType: "Tensile", shape: "dogbone", thickness: "4 mm",
    geom: { LO: 170, L: 80, WO: 20, W: 10, R: 24, G: 75 } },
  { id: "iso-527-1b", standard: "ISO 527-2", name: "Type 1B", blurb: "Machined / die-cut specimen.",
    material: "plastic", machine: "CubeTen", testType: "Tensile", shape: "dogbone", thickness: "4 mm",
    geom: { LO: 150, L: 60, WO: 20, W: 10, R: 24, G: 50 } },

  // ---- ASTM D412 · Rubber & elastomers · CubeOne ----
  { id: "astm-d412-c", standard: "ASTM D412", name: "Die C", blurb: "Standard rubber dog-bone — the most common elastomer die.",
    material: "rubber", machine: "CubeOne", testType: "Tensile", shape: "dogbone", thickness: "1.5–3 mm",
    geom: { LO: 115, L: 33, WO: 25, W: 6, R: 14, G: 25 } },
  { id: "astm-d412-d", standard: "ASTM D412", name: "Die D", blurb: "Smaller alternate rubber die for limited material.",
    material: "rubber", machine: "CubeOne", testType: "Tensile", shape: "dogbone", thickness: "1.5–3 mm",
    geom: { LO: 100, L: 16, WO: 16, W: 3, R: 10, G: 16 } },

  // ---- ISO 37 · Rubber & elastomers · CubeOne ----
  { id: "iso-37-2", standard: "ISO 37", name: "Type 2", blurb: "Standard international rubber dumbbell.",
    material: "rubber", machine: "CubeOne", testType: "Tensile", shape: "dogbone", thickness: "2 mm",
    geom: { LO: 75, L: 25, WO: 12.5, W: 4, R: 8, G: 20 } },

  // ---- ASTM D624 · Tear strength · Rubber & elastomers · CubeOne ----
  { id: "astm-d624-c", standard: "ASTM D624", name: "Die C", blurb: "Un-nicked 90° angle test piece — the apex initiates the tear.",
    material: "rubber", machine: "CubeOne", testType: "Tear", shape: "raw", thickness: "2 mm", feature: "90° apex",
    geom: { LO: 102, WO: 19 },
    raw: { d: "M867.26,212.26c-41.38,1.97-81.2,15.22-117.38,38.38-24.15,15.46-45.84,35-65.64,57.68-12,13.75-24.11,26.22-37.53,37.83-46.82,40.49-101.86,55.45-157.52,34.47-18.21-6.86-34.82-16.98-50.75-29.72-16.84-13.47-31.67-29.25-46.43-45.96-49.86-56.45-113.36-90.3-181.95-92.68l-204.2-.08.07-202.43,292.52-.16c43.71.08,85.64,20.24,117.18,56.77l60.95,74.33,63.13,77.25,111.5-136.11,16.59-19.6c31.07-34.07,71.76-52.56,113.83-52.66l291.85.1.02,202.5-206.22.09Z", bbox: [5.9, 9.6, 1067.6, 380.5], endTop: 10, endBot: 212 } },
  { id: "astm-d624-b", standard: "ASTM D624", name: "Die B", blurb: "Curved-neck tear specimen — necks down to a 10.2 mm throat.",
    material: "rubber", machine: "CubeOne", testType: "Tear", shape: "raw", thickness: "2 mm", feature: "10.2 mm throat",
    geom: { LO: 110, WO: 25 },
    raw: { d: "M816.66,282.98c-21.79-17.72-47.64-21.23-73.41-9.64l-43.31,16.88c-30.19,10.13-60.57,17.4-92.12,21.83l-48.67,4.42-17.99.28-32.58-.72c-33.76-2.06-66.56-7.02-99.38-15.31-29.02-7.33-56.39-17.68-83.8-29.39-28.98-12.37-64.2.09-81.41,26.58l-27.99,37.12-216-.16V64.71s303.22.08,303.22.08c24.77,0,49.2,6.67,70.75,18.19,23.77,12.71,42.84,30.77,57.48,53.12,9.65,14.74,21.76,26.64,36.24,36.09,52.14,34.01,121.38,25.12,163.23-21.11l17.21-23.2c14.36-19.36,32.2-34.75,53.69-45.81,23.63-12.16,49.7-17.48,76.42-17.47l295.05.08.04,270.26-215.68.07-26.42-34.76c-4.62-6.2-9-11.97-14.58-17.28Z", bbox: [0, 64.6, 1073.3, 270.4], endTop: 65, endBot: 334 } },

  // ---- Flexure bars (rectangular) · Plastics · CubeFlex ----
  { id: "astm-d790", standard: "ASTM D790", name: "Flexure Bar", blurb: "3-point bend bar for rigid plastics.",
    material: "plastic", machine: "CubeFlex", testType: "Flexure", shape: "bar", thickness: "3.2 mm",
    geom: { LO: 127, WO: 12.7 } },
  { id: "iso-178", standard: "ISO 178", name: "Flexure Bar", blurb: "International 3-point bend bar.",
    material: "plastic", machine: "CubeFlex", testType: "Flexure", shape: "bar", thickness: "4 mm",
    geom: { LO: 80, WO: 10 } },
];

export function getSample(id: string) {
  return SAMPLES.find((s) => s.id === id);
}

/* ---- Geometry → SVG path -------------------------------------------------- */
export function dogbonePath(g: any) {
  const { LO, L, WO, W } = g;
  const wo = WO / 2;
  const w = W / 2;
  const d = wo - w;
  const topN = d; // top edge of narrow section (y, top=0)
  const botN = WO - d; // bottom edge of narrow section
  const x1 = (LO - L) / 2; // narrow-section start
  const x2 = (LO + L) / 2; // narrow-section end
  // Split the space outside the gauge into a flat grip tab + a smooth ogee shoulder.
  const halfSpace = (LO - L) / 2;
  const shoulderW = halfSpace * 0.58; // length of the curved transition
  const gripW = halfSpace - shoulderW; // flat clamping tab
  const k = shoulderW * 0.5; // Bézier handle → horizontal tangents = smooth S-curve
  const gL = gripW; // left grip end
  const gR = LO - gripW; // right grip start
  return [
    `M 0 0`,
    `L ${gL} 0`,
    `C ${gL + k} 0 ${x1 - k} ${topN} ${x1} ${topN}`,
    `L ${x2} ${topN}`,
    `C ${x2 + k} ${topN} ${gR - k} 0 ${gR} 0`,
    `L ${LO} 0`,
    `L ${LO} ${WO}`,
    `L ${gR} ${WO}`,
    `C ${gR - k} ${WO} ${x2 + k} ${botN} ${x2} ${botN}`,
    `L ${x1} ${botN}`,
    `C ${x1 - k} ${botN} ${gL + k} ${WO} ${gL} ${WO}`,
    `L 0 ${WO}`,
    `Z`,
  ].join(" ");
}

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : String(n));

/* ---- ASTM D624 tear-die geometries -------------------------------------- */
// Die C — elongated square ends with a central, offset 90° angle (tear apex).
export function anglePath(g: any) {
  const L = g.LO, W = g.WO;
  const end = g.end ?? 24;
  const cx = L / 2;
  const tT = g.topThroat ?? 5;
  const apexH = g.apexH ?? 7;
  const a = apexH; // 45° flanks → half-base = height (90° included)
  const sp = cx - end;
  return [
    `M 0 0`,
    `L ${end} 0`,
    `C ${end + sp * 0.5} 0 ${cx - sp * 0.35} ${tT} ${cx} ${tT}`,
    `C ${cx + sp * 0.35} ${tT} ${L - end - sp * 0.5} 0 ${L - end} 0`,
    `L ${L} 0`,
    `L ${L} ${W}`,
    `L ${cx + a} ${W}`,
    `L ${cx} ${W - apexH}`,
    `L ${cx - a} ${W}`,
    `L 0 ${W}`,
    `Z`,
  ].join(" ");
}

// Die A / B — crescent strip; B has long grip tabs, A has minimal ends.
export function crescentPath(g: any) {
  const L = g.LO, W = g.WO;
  const tab = g.tab ?? 6;
  const cx = L / 2;
  const tT = g.topThroat ?? W * 0.45;
  const bT = g.botThroat ?? W * 0.8;
  const x0 = tab, x1 = L - tab, sp = cx - x0;
  return [
    `M 0 0`,
    `L ${x0} 0`,
    `C ${x0 + sp * 0.5} 0 ${cx - sp * 0.4} ${tT} ${cx} ${tT}`,
    `C ${cx + sp * 0.4} ${tT} ${x1 - sp * 0.5} 0 ${x1} 0`,
    `L ${L} 0`,
    `L ${L} ${W}`,
    `L ${x1} ${W}`,
    `C ${x1 - sp * 0.5} ${W} ${cx + sp * 0.4} ${bT} ${cx} ${bT}`,
    `C ${cx - sp * 0.4} ${bT} ${x0 + sp * 0.5} ${W} ${x0} ${W}`,
    `L 0 ${W}`,
    `Z`,
  ].join(" ");
}

// Die T — trouser: solid rectangular strip (100% filled, no slit).
export function trouserPath(g: any) {
  const L = g.LO, W = g.WO;
  return [
    `M 0 0`,
    `L ${L} 0`,
    `L ${L} ${W}`,
    `L 0 ${W}`,
    `Z`,
  ].join(" ");
}

export function shapePath(s: any) {
  const g = s.geom;
  switch (s.shape) {
    case "angle": return anglePath(g);
    case "crescent": return crescentPath(g);
    case "trouser": return trouserPath(g);
    default: return dogbonePath(g);
  }
}

// Tear-initiation point + label for the dimensioned view.
export function tearNick(s: any) {
  const g = s.geom;
  if (s.shape === "angle") return { x: g.LO / 2, y: g.WO - (g.apexH ?? 7), label: "90°" };
  if (s.shape === "crescent") return { x: g.LO / 2, y: g.botThroat ?? g.WO * 0.8, label: "NICK" };
  return null;
}

/* ---- Dimension primitives (arrowheads as filled triangles) ---------------- */
export function tri(x: number, y: number, dir: string, a: number) {
  const s = a * 0.62;
  if (dir === "left") return `${x},${y} ${x + a},${y - s} ${x + a},${y + s}`;
  if (dir === "right") return `${x},${y} ${x - a},${y - s} ${x - a},${y + s}`;
  if (dir === "up") return `${x},${y} ${x - s},${y + a} ${x + s},${y + a}`;
  return `${x},${y} ${x - s},${y - a} ${x + s},${y - a}`; // down
}

export function Sample({
  standard,
  spec,
  variant = "fill",
  tone = "light",
  color,
  callouts = false,
  pxPerMm,
  outlineScale = 2.6,
  style,
  ...rest
}: any) {
  const s = spec || getSample(standard);
  if (!s) return null;
  const g = s.geom;
  const isBar = s.shape === "bar";
  const isRaw = s.shape === "raw";
  const isTear = s.testType === "Tear";
  const { LO, WO } = g;

  // Raw artwork specimens (supplied SVG paths) — map native coords into the
  // specimen's mm space so overall-length reads LO and the bar end reads WO.
  let rawT: any = null;
  let vExt = WO; // true vertical extent of the drawn shape (mm)
  if (isRaw && s.raw) {
    const [bx, , bw, bh] = s.raw.bbox;
    const sxr = LO / bw;
    const syr = WO / (s.raw.endBot - s.raw.endTop);
    vExt = bh * syr;
    rawT = { d: s.raw.d, tx: -bx * sxr, ty: -s.raw.endTop * syr, sx: sxr, sy: syr };
  }

  const onDark = tone === "dark";
  const fillCol = color === "teal" ? TEAL : color ? color : onDark ? WHITE : INK;
  const dimCol = onDark ? "rgba(255,255,255,0.55)" : TEALD;
  const numCol = onDark ? WHITE : INK;

  const fontMM = Math.max(LO * 0.04, 4.2);
  const sw = Math.max(LO * 0.0022, 0.22);
  const aw = fontMM * 0.5;

  // Padding (mm) around the specimen inside the viewBox.
  const pad = callouts
    ? isTear
      ? {
          l: Math.max(WO * 0.2, fontMM * 0.8),
          t: vExt * 0.42 + fontMM * 2.6,
          r: WO * 0.5 + fontMM * 4.5,
          b: vExt * 0.16 + fontMM * 1.8,
        }
      : {
          l: Math.max(WO * 0.2, fontMM * 0.8),
          t: WO * 0.7 + fontMM * 2.6,
          r: WO * 0.5 + fontMM * 4.5,
          b: isBar ? WO * 0.6 + fontMM * 2.0 : WO * 0.55 + fontMM * 5.6,
        }
    : (() => {
        const p = Math.max(WO * 0.12, variant === "outline" ? sw * 2 : 0.5);
        return { l: p, t: p, r: p, b: p };
      })();

  const vbW = LO + pad.l + pad.r;
  const vbH = vExt + pad.t + pad.b;

  const shapeEl = isRaw ? (
    <g transform={`translate(${rawT.tx} ${rawT.ty}) scale(${rawT.sx} ${rawT.sy})`}>
      <path
        d={rawT.d}
        fill={variant === "outline" ? "none" : fillCol}
        stroke={variant === "outline" ? fillCol : "none"}
        strokeWidth={variant === "outline" ? sw * outlineScale : 0}
        vectorEffect={variant === "outline" ? "non-scaling-stroke" : undefined}
      />
    </g>
  ) : isBar ? (
    <rect
      x="0"
      y="0"
      width={LO}
      height={WO}
      rx={Math.min(WO, LO) * 0.04}
      fill={variant === "outline" ? "none" : fillCol}
      stroke={variant === "outline" ? fillCol : "none"}
      strokeWidth={variant === "outline" ? sw * outlineScale : 0}
    />
  ) : (
    <path
      d={shapePath(s)}
      fill={variant === "outline" ? "none" : fillCol}
      stroke={variant === "outline" ? fillCol : "none"}
      strokeWidth={variant === "outline" ? sw * outlineScale : 0}
      strokeLinejoin={isTear ? "miter" : "round"}
    />
  );

  // ---- Build callouts (specimen-local coordinates) ----
  let dims = null;
  if (callouts) {
    const ext = { stroke: dimCol, strokeWidth: sw * 0.8, opacity: 0.7 };
    const line = { stroke: dimCol, strokeWidth: sw };
    const haloCol = onDark ? "#111111" : "#ffffff";
    const txt: any = {
      fill: numCol,
      fontFamily: "var(--font-sans, Inter, sans-serif)",
      fontWeight: 600,
      fontSize: fontMM,
      paintOrder: "stroke",
      stroke: haloCol,
      strokeWidth: fontMM * 0.32,
      strokeLinejoin: "round",
    };
    const cap: any = { ...txt, fontWeight: 500, fontSize: fontMM * 0.62, fill: dimCol, strokeWidth: fontMM * 0.2, letterSpacing: fontMM * 0.03 };

    const yOA = -(pad.t * 0.62); // overall length line
    const xWO = LO + pad.r * 0.42; // overall width line

    // Shared: overall length (top) + overall width (right)
    const overall = (
      <g>
        <line x1="0" y1="0" x2="0" y2={yOA} {...ext} />
        <line x1={LO} y1="0" x2={LO} y2={yOA} {...ext} />
        <line x1="0" y1={yOA} x2={LO} y2={yOA} {...line} />
        <polygon points={tri(0, yOA, "left", aw)} fill={dimCol} />
        <polygon points={tri(LO, yOA, "right", aw)} fill={dimCol} />
        <text x={LO / 2} y={yOA - fontMM * 0.5} textAnchor="middle" style={txt}>{fmt(LO)}</text>
        <line x1={LO} y1="0" x2={xWO} y2="0" {...ext} />
        <line x1={LO} y1={WO} x2={xWO} y2={WO} {...ext} />
        <line x1={xWO} y1="0" x2={xWO} y2={WO} {...line} />
        <polygon points={tri(xWO, 0, "up", aw)} fill={dimCol} />
        <polygon points={tri(xWO, WO, "down", aw)} fill={dimCol} />
        <text x={xWO + fontMM * 0.5} y={WO / 2} dominantBaseline="middle" style={txt}>{fmt(WO)}</text>
      </g>
    );

    if (isTear) {
      const nick = tearNick(s);
      const yLbl = WO + pad.b * 0.5;
      dims = (
        <g>
          {overall}
          {nick && (
            <g>
              <line x1={nick.x} y1={nick.y} x2={nick.x} y2={yLbl} {...ext} />
              <circle cx={nick.x} cy={nick.y} r={Math.max(sw * 2.4, fontMM * 0.3)} fill={TEAL} stroke={haloCol} strokeWidth={sw * 0.9} />
              <text x={nick.x} y={yLbl + fontMM * 0.95} textAnchor="middle" dominantBaseline="hanging" style={cap}>{nick.label}</text>
            </g>
          )}
        </g>
      );
    } else {
      const wo = WO / 2;
      const w = isBar ? WO / 2 : g.W / 2;
      const d = wo - w;
      const x1 = isBar ? 0 : (LO - g.L) / 2;
      const x2 = isBar ? LO : (LO + g.L) / 2;
      const topN = isBar ? 0 : d;
      const botN = isBar ? WO : WO - d;
      const shoulderW = isBar ? 0 : ((LO - g.L) / 2) * 0.58;
      const yRS = -(pad.t * 0.24);
      const yG = WO + pad.b * 0.42;
      const gx1 = (LO - g.G) / 2;
      const gx2 = (LO + g.G) / 2;

      dims = (
        <g>
          {overall}

          {/* reduced-section length (dog-bone) */}
          {!isBar && (
            <g>
              <line x1={x1} y1={topN} x2={x1} y2={yRS} {...ext} />
              <line x1={x2} y1={topN} x2={x2} y2={yRS} {...ext} />
              <line x1={x1} y1={yRS} x2={x2} y2={yRS} {...line} />
              <polygon points={tri(x1, yRS, "left", aw)} fill={dimCol} />
              <polygon points={tri(x2, yRS, "right", aw)} fill={dimCol} />
              <text x={(x1 + x2) / 2} y={yRS - fontMM * 0.5} textAnchor="middle" style={txt}>{fmt(g.L)}</text>
            </g>
          )}

          {/* narrow width W (dog-bone) — vertical at the neck, label in the notch */}
          {!isBar && (
            <g>
              <line x1={x2} y1={topN} x2={x2} y2={botN} {...line} />
              <polygon points={tri(x2, topN, "up", aw)} fill={dimCol} />
              <polygon points={tri(x2, botN, "down", aw)} fill={dimCol} />
              <text x={x2 + Math.min(shoulderW * 0.4, fontMM * 1.3) + fontMM * 0.3} y={topN * 0.5} dominantBaseline="middle" style={txt}>{fmt(g.W)}</text>
            </g>
          )}

          {/* gauge length (dog-bone) — bottom */}
          {!isBar && (
            <g>
              <line x1={gx1} y1={botN} x2={gx1} y2={yG} {...ext} />
              <line x1={gx2} y1={botN} x2={gx2} y2={yG} {...ext} />
              <line x1={gx1} y1={yG} x2={gx2} y2={yG} {...line} />
              <polygon points={tri(gx1, yG, "left", aw)} fill={dimCol} />
              <polygon points={tri(gx2, yG, "right", aw)} fill={dimCol} />
              <text x={LO / 2} y={yG + fontMM * 0.95} textAnchor="middle" dominantBaseline="hanging" style={txt}>{fmt(g.G)}</text>
              <text x={LO / 2} y={yG + fontMM * 2.0} textAnchor="middle" dominantBaseline="hanging" style={cap}>GAUGE</text>
            </g>
          )}
        </g>
      );
    }
  }

  const svgStyle: any = pxPerMm
    ? { display: "block", width: vbW * pxPerMm, height: vbH * pxPerMm, ...style }
    : { display: "block", width: "100%", height: "auto", ...style };

  return (
    <svg
      viewBox={`${-pad.l} ${-pad.t} ${vbW} ${vbH}`}
      style={svgStyle}
      role="img"
      aria-label={`${s.standard} ${s.name} specimen`}
      {...rest}
    >
      {shapeEl}
      {dims}
    </svg>
  );
}
