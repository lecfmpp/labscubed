/* LabAssessmentV2 — version 2 of the AMI booth kiosk (client:only), served at
 * /events/ami-nov-2026/pre-assessment-v2/. A copy of LabAssessment.tsx (version 1, which stays
 * untouched) with: a "scan your badge or business card" button, a .com key on the email field, and
 * no country or website fields. Once v2 is proven at the booth the two can be merged back into one.
 *
 * LabAssessment — the iPad kiosk at the AMI booth (client:only).
 *
 * Built from the "Kiosk 3b, photo-led and bold" design handoff (Kiosk directions
 * design review): light canvas, dark top band, heavy Inter 800 type. Landscape 1180x820 (holds at 1024x768) and portrait 820x1180,
 * touch only: tap targets 96px+, nothing relies on hover, text never below 18px.
 *
 * One path: cover, six questions, contact (with the materials the visitor wants by
 * email), thank you. The assessment goes to netlify/functions/booth-assessment.mjs;
 * any ticked materials go to netlify/functions/booth-capture.mjs, the same endpoint
 * the earlier brochure tablet used.
 *
 * It is a shared device, so nothing is kept after a visitor finishes: answers are
 * wiped on the thank-you countdown and after a stretch of inactivity. The only
 * thing that persists is the offline queue, which holds a completed submission
 * until the server has accepted it (booth wifi is bad, and a lost lead cannot be
 * recovered once the person has walked away).
 *
 * Answer ids are the ones booth-assessment.mjs and the database already know
 * (plastics, technician-time, 51-100 ...), so the design could change without
 * touching the backend. Question copy comes from Mo'min's "Lab Assessment
 * Questionnaire". */
import React from 'react';
import { track } from '../lib/track';
// @ts-ignore  specimen drawings, ported as is from the design system
import { Sample } from './kiosk/Sample.jsx';

const ASSESS_ENDPOINT = '/api/booth/assessment';
const SCAN_ENDPOINT = '/api/booth/scan';
const CAPTURE_ENDPOINT = '/api/booth/capture';
const EVENT_SLUG = 'ami-nov-2026';
const QUEUE_KEY = 'lc-assessment-queue-v1';
const IDLE_MS = 90_000;
const THANKS_SECONDS = 30;

const K = (n: string) => `/assets/img/assessment/kiosk/${n}`;
const COVER = K('cubeten-loading-tray.webp');
const LOGO = K('logo.png');

/* ---------- design tokens (README, "Design tokens" and "Answer tiles") ---------- */
const TEAL = '#17ddc5';
const TEAL_D = '#0d9488';
const INK = '#1d1d1f';
const MUTED = '#86868b';
const BAND = '#0b1213';
const P = {
  tileBg: '#ffffff', tileOn: '#e6faf7',
  ring: '0 1px 2px rgba(0,0,0,.05)', ringOnIn: 'inset 0 0 0 4px #17ddc5', glowOn: '0 18px 40px rgba(13,148,136,.22)',
  fg: INK, fgOn: '#0b3b36', mark: '#ffffff', markOn: TEAL,
  segDone: '#ffffff', segCur: TEAL, segOff: 'rgba(255,255,255,.18)',
  nextBg: INK, nextFg: '#ffffff', nextArrow: TEAL, offBg: '#dedee3', offFg: '#8e8e93', offArrow: '#a1a1a6',
  field: '#ffffff', fieldErr: '#fff5f4', fieldRing: 'none', errRing: 'inset 0 0 0 2.5px #d92d20', label: MUTED, labelErr: '#c4221a',
};
const CANVAS = '#f2f2f4';

/* ---------- questions ---------- */
type Opt = { id: string; label: string; sub?: string; img?: string; mark?: string; sample?: string; exclusive?: boolean; other?: boolean };

const INDUSTRY: Opt[] = [
  { id: 'plastics', label: 'Plastics', img: K('hero-plastic.webp') },
  { id: 'rubber', label: 'Rubber', img: K('rubber-testing-large.webp') },
  { id: 'other', label: 'Other', mark: '+' },
];
const TESTS: Opt[] = [
  { id: 'tensile', label: 'Tensile', img: K('step2-cubeten-measurement.webp') },
  { id: 'flexural', label: 'Flexural', mark: 'FLX' },
  { id: 'compression', label: 'Compression', mark: 'CMP' },
  { id: 'other', label: 'Other', mark: '+', other: true },
  { id: 'unsure', label: "I'm not sure", mark: '?', exclusive: true },
];
const MACHINES: Opt[] = [
  { id: 'instron', label: 'Instron', mark: 'In' },
  { id: 'zwickroell', label: 'ZwickRoell', mark: 'ZR' },
  { id: 'mts', label: 'MTS', mark: 'MTS' },
  { id: 'shimadzu', label: 'Shimadzu', mark: 'SH' },
  { id: 'tinius-olsen', label: 'Tinius Olsen', mark: 'TO' },
  { id: 'other', label: 'Other', mark: '+', other: true },
  { id: 'unsure', label: "I'm not sure", mark: '?', exclusive: true },
  { id: 'none', label: "We don't currently have a testing machine", mark: '0', exclusive: true },
];
const VOLUME: Opt[] = [
  { id: 'lt20', label: 'Under 20', mark: '<20' },
  { id: '20-50', label: '20-50', mark: '20-50' },
  { id: '51-100', label: '51-100', mark: '51-100' },
  { id: 'gt100', label: 'More than 100', mark: '100+' },
  { id: 'varies', label: 'It varies', mark: '±' },
  { id: 'unsure', label: "I'm not sure", mark: '?' },
];
const PRIORITY: Opt[] = [
  { id: 'technician-time', label: "Freeing up technicians' time", img: K('step-load-hand.webp') },
  { id: 'backlog', label: 'Reducing testing backlogs', img: K('stats-bg.webp') },
  { id: 'turnaround', label: 'Improving turnaround time', img: K('step4-cubeten-start.webp') },
  { id: 'consistency', label: 'Improving testing consistency and reproducibility', img: K('step2-cubeten-measurement.webp') },
  { id: 'capacity', label: 'Increasing testing capacity', img: K('cubeten-loading-tray.webp') },
  { id: 'cost', label: 'Reducing testing costs', img: K('step-results-dashboard.webp') },
  { id: 'other', label: 'Other', mark: '+', other: true },
  { id: 'unsure', label: "I'm not sure", mark: '?', exclusive: true },
];
/* The "I'm not sure" answer for this question is the footer Skip button. */
const STD_P: Opt[] = [
  { id: 'astm-d638', label: 'ASTM D638', sub: 'Type I · tensile · plastics', sample: 'astm-d638-i' },
  { id: 'iso-527', label: 'ISO 527', sub: 'Type 1A · tensile · plastics', sample: 'iso-527-1a' },
  { id: 'astm-d790', label: 'ASTM D790', sub: 'Flexure bar · plastics', sample: 'astm-d790' },
  { id: 'iso-178', label: 'ISO 178', sub: 'Flexure bar · plastics', sample: 'iso-178' },
];
const STD_R: Opt[] = [
  { id: 'astm-d412', label: 'ASTM D412', sub: 'Die C · tensile · rubber', sample: 'astm-d412-c' },
  { id: 'iso-37', label: 'ISO 37', sub: 'Type 2 · tensile · rubber', sample: 'iso-37-2' },
  { id: 'astm-d624', label: 'ASTM D624', sub: 'Die C · tear · rubber', sample: 'astm-d624-c' },
  { id: 'astm-d624-b', label: 'ASTM D624', sub: 'Die B · tear · rubber', sample: 'astm-d624-b' },
];
/* Materials the visitor can tick on the last step. `id` is what booth-capture.mjs
   takes (cubeten-brochure, cubeone-brochure, whitepaper go through the download-request
   edge function; spe-replay is a link). */
const MATERIALS: Opt[] = [
  { id: 'cubeten-brochure', label: 'CubeTen brochure' },
  { id: 'cubeone-brochure', label: 'CubeOne brochure' },
  { id: 'whitepaper', label: 'White paper', sub: 'Beyond the Bottleneck: a data-backed case for testing automation' },
  { id: 'spe-replay', label: 'SPE webinar replay', sub: 'The Hidden Cost of Manual Plastics Testing' },
];

type QKey = 'industry' | 'tests' | 'machines' | 'volume' | 'priority' | 'standards';
type QDef = { step: number; eb: string; title: string; hint: string; single?: boolean };
const Q: Record<QKey, QDef> = {
  industry: { step: 1, eb: 'Industry', title: 'Which industry do you work in?', hint: 'Select all that apply' },
  tests: { step: 2, eb: 'Test types', title: 'What types of tests does your laboratory perform?', hint: 'Select all that apply' },
  machines: { step: 3, eb: 'Brands', title: 'What brands of testing machines do you currently use?', hint: 'Select all that apply' },
  volume: { step: 4, eb: 'Daily volume', title: 'How many specimens do you test daily?', hint: 'Tap one, then press Next', single: true },
  priority: { step: 5, eb: 'Priorities', title: "What is your laboratory's main priority?", hint: 'Select all that apply' },
  standards: { step: 6, eb: 'Standards', title: 'Which specimens and testing standards do you use?', hint: "Optional. Select all that apply, or skip if you're not sure." },
};

type Screen = 'cover' | QKey | 'contact' | 'thanks';
const ORD: Screen[] = ['cover', 'industry', 'tests', 'machines', 'volume', 'priority', 'standards', 'contact', 'thanks'];

/* Industry is multiple choice; the backend still takes one value, so plastics + rubber
   is its existing 'both', and anything else is the ids joined by commas. */
const industryValue = (ids: string[]) => (ids.includes('plastics') && ids.includes('rubber') && ids.length === 2 ? 'both' : ids.join(','));

type Ans = Partial<Record<QKey, string[]>>;
type Contact = { name: string; email: string; phone: string; company: string; role: string };
const BLANK_CONTACT: Contact = { name: '', email: '', phone: '', company: '', role: '' };
const THANKS_ASSESS = ['Testing costs and technician time', 'Workflow bottlenecks and capacity gains', 'Impact on turnaround time and backlog', 'Estimated automation ROI and payback'];

const errsOf = (c: Contact) => ({
  name: c.name.trim() ? '' : 'Add your full name',
  email: !c.email.trim() ? 'Add your email' : /^\S+@\S+\.\S+$/.test(c.email.trim()) ? '' : 'Enter a valid email, like name@company.com',
  phone: '',
  company: '',
  role: '',
});
/* Phone numbers are formatted as the visitor types, digits only, so nobody has to type spaces or
   brackets. There is no country field: a number typed with a leading + is an international one and
   is grouped in threes; anything else is read as US/CA, (555) 000-0000. */
const formatPhone = (raw: string) => {
  const intl = raw.trim().startsWith('+');
  let d = raw.replace(/\D/g, '');
  if (intl) return d ? `+${d.slice(0, 15).replace(/(\d{3})(?=\d)/g, '$1 ').trim()}` : '+';
  if (d.length === 11 && d.startsWith('1')) d = d.slice(1);
  d = d.slice(0, 10);
  if (d.length > 6) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  if (d.length > 3) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return d;
};
const fullPhone = (p: string) => { const d = p.replace(/\D/g, ''); return d ? (p.trim().startsWith('+') ? p.trim() : `+1 ${p.trim()}`) : ''; };
/* There is no website field: the company site is read from the email's domain. Personal mailbox
   providers are skipped: gmail.com is not their company site. */
const FREE_MAIL = new Set(['gmail.com', 'googlemail.com', 'yahoo.com', 'ymail.com', 'hotmail.com', 'outlook.com', 'live.com', 'msn.com', 'icloud.com', 'me.com', 'aol.com', 'proton.me', 'protonmail.com', 'gmx.com', 'gmx.net', 'qq.com', '163.com', 'mail.com', 'yandex.com', 'zoho.com']);
const domainOfEmail = (e: string) => {
  const d = (e.split('@')[1] || '').trim().toLowerCase();
  return /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(d) && !FREE_MAIL.has(d) ? d : '';
};
const siteHost = (w: string) => w.trim().replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0];

/* ---------- offline queue: {ep, body}; older entries had no ep and were assessments ---------- */
type Queued = { ep: string; body: any };
function readQueue(): Queued[] {
  try {
    return (JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]') as any[]).map((x) => (x && x.ep && x.body ? x : { ep: ASSESS_ENDPOINT, body: x }));
  } catch { return []; }
}
function writeQueue(q: Queued[]) {
  try { localStorage.setItem(QUEUE_KEY, JSON.stringify(q)); } catch { /* private mode */ }
}
async function post(ep: string, body: any): Promise<boolean> {
  try {
    const r = await fetch(ep, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    return r.ok;
  } catch { return false; }
}

/* ---------- hooks ---------- */
function usePortrait() {
  const q = '(orientation: portrait)';
  const [port, setPort] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia(q);
    const on = () => setPort(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return port;
}
/* A phone (a visitor who scanned the QR code and is using their own device) gets a
   layout of its own: one column, a scrolling body and a footer whose buttons are
   stacked, primary on top. Anything wider is the booth iPad. */
function useMobile() {
  const q = '(max-width: 640px), (max-height: 520px)';
  const [m, setM] = React.useState(typeof window !== 'undefined' && window.matchMedia(q).matches);
  React.useEffect(() => {
    const mq = window.matchMedia(q);
    const on = () => setM(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return m;
}
/* The visible viewport. The root is sized to it (not to 100vh/100dvh, which in-app
   browsers and some Safari states make taller than what is on screen) so the Back and
   Next buttons at the bottom of the layout are always inside the visible area. When the
   on-screen keyboard opens, the visible height shrinks and the footer rides above it. */
function useKeyboard() {
  const [s, setS] = React.useState<{ open: boolean; h: number | null; top: number }>({ open: false, h: null, top: 0 });
  React.useEffect(() => {
    const vv = window.visualViewport;
    let maxH = 0;
    let lastW = window.innerWidth;
    const on = () => {
      if (window.innerWidth !== lastW) { lastW = window.innerWidth; maxH = 0; } /* rotated */
      const h = vv ? vv.height : window.innerHeight;
      if (h > maxH) maxH = h;
      const open = maxH - h > 120;
      setS({ open, h: Math.round(h), top: vv ? Math.round(vv.offsetTop) : 0 });
    };
    on();
    const t = vv || window;
    t.addEventListener('resize', on);
    vv?.addEventListener('scroll', on);
    window.addEventListener('orientationchange', on);
    return () => { t.removeEventListener('resize', on); vv?.removeEventListener('scroll', on); window.removeEventListener('orientationchange', on); };
  }, []);
  return s;
}

/* ---------- small pieces ---------- */
const CSS = `
.la{position:fixed;left:0;right:0;display:flex;flex-direction:column;overflow:hidden;background:${CANVAS};font-family:Inter,system-ui,-apple-system,sans-serif;color:${INK};-webkit-font-smoothing:antialiased;touch-action:manipulation;-webkit-tap-highlight-color:transparent;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;overscroll-behavior:none}
.la *{box-sizing:border-box}
.la input,.la select{-webkit-user-select:text;user-select:text}
.la input::placeholder{color:#a1a1a6}
.la-scroll{overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain}
@keyframes kPulseC{0%{box-shadow:0 0 0 0 rgba(23,221,197,.6)}70%{box-shadow:0 0 0 30px rgba(23,221,197,0)}100%{box-shadow:0 0 0 0 rgba(23,221,197,0)}}
`;
const ArrowR = ({ c, s = 30 }: { c: string; s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);
/* Chips on the dark band: NOV 11-12 teal, BOOTH C819 white. */
const Chips = ({ m }: { m?: boolean }) => {
  const tiny = m && window.innerWidth < 360;
  const base: React.CSSProperties = { height: m ? 30 : 44, padding: m ? (tiny ? '0 9px' : '0 12px') : '0 18px', borderRadius: 999, display: 'flex', alignItems: 'center', fontSize: m ? (tiny ? 11 : 13) : 18, fontWeight: 800, letterSpacing: m ? '.04em' : '.1em', color: '#000', whiteSpace: 'nowrap' };
  return <div style={{ display: 'flex', gap: m ? 6 : 10 }}><div style={{ ...base, background: TEAL }}>NOV 11-12</div><div style={{ ...base, background: '#fff' }}>BOOTH C819</div></div>;
};
/* Full-screen toggle for the booth tablet: hides the browser bars. It needs a tap (browsers refuse
   to go full screen on their own), so the visitor-facing staff taps it once. Hidden where the
   browser has no Fullscreen API, or when the page is already installed / full screen. */
const fsEl = () => (document as any).fullscreenElement || (document as any).webkitFullscreenElement || null;
const fsOK = () => !!(document.fullscreenEnabled || (document as any).webkitFullscreenEnabled);
function FullscreenBtn({ dark }: { dark?: boolean }) {
  const [on, setOn] = React.useState(false);
  const [ok, setOk] = React.useState(false);
  React.useEffect(() => {
    const sync = () => setOn(!!fsEl());
    setOk(fsOK() && !window.matchMedia('(display-mode: standalone)').matches);
    sync();
    document.addEventListener('fullscreenchange', sync);
    document.addEventListener('webkitfullscreenchange', sync);
    return () => { document.removeEventListener('fullscreenchange', sync); document.removeEventListener('webkitfullscreenchange', sync); };
  }, []);
  if (!ok) return null;
  const toggle = () => {
    const d: any = document, el: any = document.documentElement;
    try {
      if (fsEl()) (d.exitFullscreen || d.webkitExitFullscreen).call(d);
      else (el.requestFullscreen || el.webkitRequestFullscreen).call(el, { navigationUI: 'hide' });
    } catch { /* refused: nothing to do */ }
  };
  const fg = dark ? '#fff' : INK;
  return (
    <button type="button" onClick={toggle} aria-label={on ? 'Exit full screen' : 'Enter full screen'}
      style={{ width: 52, height: 52, flex: 'none', borderRadius: 14, border: 'none', cursor: 'pointer', background: dark ? 'rgba(255,255,255,.14)' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={fg} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        {on ? <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" /> : <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />}
      </svg>
    </button>
  );
}
const Eyebrow = ({ children, m, color = INK }: { children: React.ReactNode; m?: boolean; color?: string }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: m ? 13 : 18, fontWeight: 800, letterSpacing: m ? '.1em' : '.14em', textTransform: 'uppercase', color }}>
    <span style={{ width: m ? 8 : 10, height: m ? 8 : 10, background: TEAL, borderRadius: 2, flex: 'none' }} />{children}
  </div>
);

/* One button standard for every action button in the kiosk (entry cards, cover, Back,
   Next / Send / Skip, Start a new assessment): the same weight, radius per size, equal
   left and right padding, a label that is always a single line. The label shrinks until it
   fits the width it will really have, so a long label never wraps and never touches the
   edge. */
type BtnSpec = { h: number; r: number; px: number; fs: number; icon: number; gap: number };
function fitFs(label: string, avail: number, base: number, upper = false) {
  const per = upper ? 0.76 : 0.6; /* Inter 800 average glyph width, in em */
  const need = label.length * per * base;
  return need <= avail ? base : Math.max(13, Math.floor(avail / (label.length * per)));
}
function Btn({ label, alt, onClick, bg, fg, spec, w, arrow, back, ring, right, rightW, upper, disabled, style }: {
  label: string; alt?: string; onClick: () => void; bg?: string; fg: string; spec: BtnSpec; w: number; arrow?: string; back?: boolean; ring?: string;
  right?: React.ReactNode; rightW?: number; upper?: boolean; disabled?: boolean; style?: React.CSSProperties;
}) {
  const iconW = right ? rightW || spec.icon : arrow || back ? spec.icon : 0;
  const avail = w - 2 * spec.px - iconW - (iconW ? spec.gap : 0);
  /* A label that would have to go below 15px takes its short form instead (Send, Skip). */
  let text = label;
  let fs = fitFs(label, avail, spec.fs, upper);
  if (alt && fs < 15) { text = alt; fs = fitFs(alt, avail, spec.fs, upper); }
  const padR = right && rightW ? Math.max(8, Math.round((spec.h - rightW) / 2)) : spec.px;
  return (
    <div role="button" aria-disabled={disabled} onClick={(e) => { e.stopPropagation(); onClick(); }}
      style={{ cursor: 'pointer', height: spec.h, borderRadius: spec.r, background: bg, boxShadow: ring, padding: `0 ${padR}px 0 ${spec.px}px`, display: 'flex', alignItems: 'center', justifyContent: back ? 'center' : 'space-between', gap: spec.gap, overflow: 'hidden', transition: 'background .2s', ...style }}>
      {back && <svg width={spec.icon} height={spec.icon} viewBox="0 0 24 24" fill="none" stroke={fg} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }}><path d="M19 12H5M11 6l-6 6 6 6" /></svg>}
      <span style={{ fontSize: fs, fontWeight: 800, letterSpacing: upper ? '.06em' : '-0.01em', color: fg, whiteSpace: 'nowrap', overflow: 'hidden', lineHeight: 1.1, flex: back ? 'none' : 1, minWidth: 0 }}>{text}</span>
      {right ? right : arrow ? <ArrowR c={arrow} s={spec.icon} /> : null}
    </div>
  );
}

function Tile({ o, on, mediaW, tileH, basis, otherValue, onOther, onTap, m, plain, grow }: {
  o: Opt; on: boolean; mediaW: number; tileH: number; basis: number; otherValue: string; onOther: (v: string) => void; onTap: () => void; m?: boolean; plain?: boolean; grow?: boolean;
}) {
  const inp = on && !!o.other;
  const ml = (o.mark || '').length;
  const markFs = Math.round((m ? 34 : 54) * (ml <= 2 ? 1 : ml === 3 ? 0.8 : 0.6));
  const radius = m ? 18 : 22;
  const zoom = on ? 'scale(1.1)' : 'scale(1)';
  const ref = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    if (inp && ref.current) {
      ref.current.focus();
      setTimeout(() => ref.current?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 320);
    }
  }, [inp]);
  return (
    <div role="button" aria-pressed={on} onClick={onTap}
      style={{ flex: inp ? '1 1 100%' : `1 1 ${basis}px`, height: grow ? 'auto' : inp ? tileH + (m ? 20 : 28) : tileH, minHeight: grow ? tileH : undefined, padding: grow ? '8px 0' : undefined, display: 'flex', borderRadius: radius, overflow: 'hidden', cursor: 'pointer', position: 'relative', background: on ? P.tileOn : P.tileBg, boxShadow: on ? P.glowOn : P.ring, transition: 'box-shadow .2s ease, background .2s ease' }}>
      {plain ? (
        <div style={{ flex: 'none', alignSelf: 'center', width: m ? 26 : 30, height: m ? 26 : 30, marginLeft: m ? 16 : 24, borderRadius: '50%', background: on ? TEAL : 'transparent', boxShadow: on ? 'none' : 'inset 0 0 0 2.5px #c7c7cc', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .2s ease, box-shadow .2s ease' }}>
          {on && <svg width={m ? 15 : 18} height={m ? 15 : 18} viewBox="0 0 24 24" fill="none" stroke="#0b3b36" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>}
        </div>
      ) : (
        <div style={{ width: mediaW, flex: 'none', position: 'relative', overflow: 'hidden', background: 'linear-gradient(140deg, #0b1213 0%, #11302c 100%)' }}>
          {o.img && <img src={o.img} alt="" draggable={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transform: zoom, transition: 'transform .45s ease' }} />}
          {o.mark && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: markFs, fontWeight: 800, letterSpacing: '-0.05em', color: on ? P.markOn : P.mark, transform: zoom, transition: 'transform .45s ease' }}>{o.mark}</div>}
          {o.sample && (
            <div style={{ position: 'absolute', inset: 0, background: '#eef0f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '76%', transform: zoom, transition: 'transform .45s ease' }}>
                <Sample standard={o.sample} color={on ? TEAL_D : INK} />
              </div>
            </div>
          )}
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', padding: inp ? (m ? '0 14px 0 8px' : '0 24px 0 12px') : plain ? (m ? '0 14px' : '0 20px') : m ? '0 14px' : '0 24px' }}>
        {!inp && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: m ? 18 : 23, fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.02em', color: on ? P.fgOn : P.fg, textWrap: 'pretty' as any }}>{o.label}</span>
            {o.sub && <span style={{ fontSize: grow ? (m ? 13 : 15) : m ? 14 : 18, fontWeight: 500, lineHeight: 1.25, color: MUTED }}>{o.sub}</span>}
          </div>
        )}
        {inp && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <input ref={ref} value={otherValue} placeholder="Other: type your answer" autoComplete="off" autoCapitalize="sentences" enterKeyHint="done"
              onClick={(e) => e.stopPropagation()} onChange={(e) => onOther(e.target.value)}
              style={{ height: tileH - 2, border: 'none', outline: 'none', borderRadius: 12, background: '#fff', boxShadow: 'inset 0 0 0 1.5px rgba(13,148,136,.45)', padding: '0 18px', font: m ? '500 17px Inter, sans-serif' : '500 21px Inter, sans-serif', color: INK, width: '100%' }} />
          </div>
        )}
      </div>
      {/* The selected ring sits on an overlay so it draws above the media panel. */}
      <div style={{ position: 'absolute', inset: 0, borderRadius: radius, boxShadow: on ? P.ringOnIn : 'none', pointerEvents: 'none', zIndex: 2, transition: 'box-shadow .2s ease' }} />
    </div>
  );
}

/* Scan (version 2 of the kiosk): photograph a badge or business card and let the server read the
   contact details off it. The photo is shrunk first (a tablet camera shot is several MB) and is never
   kept; see netlify/functions/booth-scan.mjs. */
async function shrink(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(new Error('image')); i.src = url; });
    const k = Math.min(1, 1600 / Math.max(img.width, img.height));
    const c = document.createElement('canvas');
    c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
    c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', 0.82).split(',')[1];
  } finally { URL.revokeObjectURL(url); }
}
/* ---------- live camera for the scanner ----------
   The browser's own camera sheet (<input capture>) saves whatever the sensor sees: on a tablet whose
   camera sits on the side, or a front camera that mirrors, the badge comes back sideways or mirrored
   and the reader mixes its words up. So the scan opens its own camera view instead. The picture is
   drawn through a canvas, which is also what gets sent: what the visitor sees is exactly what is read.
   Rotate and Flip fix the picture once and are remembered on this tablet (localStorage), so staff set
   them up a single time. If the camera cannot be opened, the visitor can pick a photo instead. */
const CAM_KEY = 'lc-scan-cam-v1';
type CamPrefs = { facing: 'user' | 'environment'; rot: number; flip: boolean };
function readCamPrefs(): CamPrefs {
  try {
    const x = JSON.parse(localStorage.getItem(CAM_KEY) || '{}');
    return { facing: x.facing === 'user' ? 'user' : 'environment', rot: [0, 90, 180, 270].includes(x.rot) ? x.rot : 0, flip: !!x.flip };
  } catch { return { facing: 'environment', rot: 0, flip: false }; }
}
function CameraSheet({ mobile, onShot, onFile, onClose }: { mobile: boolean; onShot: (b64: string) => void; onFile: () => void; onClose: () => void }) {
  const [prefs, setPrefs] = React.useState<CamPrefs>(readCamPrefs);
  const [err, setErr] = React.useState('');
  /* After Take photo the picture is frozen for review: the visitor sees what will be read and either uses it or retakes it. */
  const [shot, setShot] = React.useState<string | null>(null);
  const vref = React.useRef<HTMLVideoElement>(null);
  const cref = React.useRef<HTMLCanvasElement>(null);
  const live = React.useRef(prefs);
  live.current = prefs;
  const save = (p: CamPrefs) => { setPrefs(p); try { localStorage.setItem(CAM_KEY, JSON.stringify(p)); } catch { /* private mode */ } };

  React.useEffect(() => {
    let stop = false;
    let raf = 0;
    let stream: MediaStream | null = null;
    const draw = () => {
      const v = vref.current, c = cref.current;
      if (v && c && v.videoWidth) {
        const { rot, flip } = live.current;
        const k = Math.min(1, 1600 / Math.max(v.videoWidth, v.videoHeight));
        const w = Math.round(v.videoWidth * k), h = Math.round(v.videoHeight * k);
        const sw = rot % 180 !== 0;
        if (c.width !== (sw ? h : w) || c.height !== (sw ? w : h)) { c.width = sw ? h : w; c.height = sw ? w : h; }
        const ctx = c.getContext('2d')!;
        ctx.save();
        ctx.translate(c.width / 2, c.height / 2);
        ctx.rotate((rot * Math.PI) / 180);
        if (flip) ctx.scale(-1, 1);
        ctx.drawImage(v, -w / 2, -h / 2, w, h);
        ctx.restore();
      }
      raf = requestAnimationFrame(draw);
    };
    (async () => {
      setErr('');
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error('no camera api');
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: prefs.facing }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false });
        if (stop) { stream.getTracks().forEach((t) => t.stop()); return; }
        const v = vref.current!;
        v.srcObject = stream;
        await v.play();
        draw();
      } catch { if (!stop) setErr('The camera could not be opened. Allow camera access for this page, or choose a photo instead.'); }
    })();
    return () => { stop = true; cancelAnimationFrame(raf); stream?.getTracks().forEach((t) => t.stop()); };
  }, [prefs.facing]);

  const shoot = () => {
    const c = cref.current;
    if (!c || !c.width) return;
    setShot(c.toDataURL('image/jpeg', 0.88));
  };
  const bh = mobile ? 56 : 80;
  const btn: React.CSSProperties = { height: bh, minWidth: bh, padding: '0 22px', borderRadius: 20, border: 'none', background: 'rgba(255,255,255,.16)', color: '#fff', font: `800 ${mobile ? 16 : 20}px Inter, sans-serif`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 };
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 60, background: '#000', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 'none', padding: mobile ? '14px 16px 8px' : '24px 40px 12px', color: '#fff', fontSize: mobile ? 16 : 24, fontWeight: 700, lineHeight: 1.3 }}>
        {shot ? (
          <>Is the text sharp and the right way up? <span style={{ color: 'rgba(255,255,255,.6)', fontWeight: 500 }}>Use this photo, or retake it if it is blurry, cut off or sideways.</span></>
        ) : (
          <>Hold your badge or card in front of the camera. The text must read the right way, not sideways or mirrored.
            <span style={{ color: 'rgba(255,255,255,.6)', fontWeight: 500 }}> If it doesn't, tap Rotate or Flip.</span></>
        )}
      </div>
      <div style={{ flex: 1, minHeight: 0, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: mobile ? 8 : 16 }}>
        <video ref={vref} playsInline muted autoPlay style={{ position: 'absolute', width: 2, height: 2, opacity: 0, pointerEvents: 'none' }} />
        <canvas ref={cref} style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 16, background: '#111', visibility: shot ? 'hidden' : 'visible' }} />
        {shot && <img src={shot} alt="Your photo" style={{ position: 'absolute', maxWidth: 'calc(100% - 16px)', maxHeight: 'calc(100% - 16px)', borderRadius: 16, boxShadow: `0 0 0 4px ${TEAL}` }} />}
        {err && <div style={{ position: 'absolute', left: 24, right: 24, textAlign: 'center', color: '#fff', fontSize: mobile ? 17 : 24, fontWeight: 600 }}>{err}</div>}
      </div>
      <div style={{ flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: mobile ? 8 : 14, padding: mobile ? '10px 12px calc(14px + env(safe-area-inset-bottom, 0px))' : '14px 40px 32px' }}>
        {shot ? (
          <>
            <div role="button" onClick={() => setShot(null)} style={btn}>Retake photo</div>
            <div role="button" aria-label="Use this photo" onClick={() => onShot(shot.split(',')[1])} style={{ ...btn, background: TEAL, color: '#000', minWidth: mobile ? 170 : 260, fontSize: mobile ? 18 : 24 }}>Use this photo</div>
          </>
        ) : (
          <>
            <div role="button" onClick={onClose} style={btn}>Close</div>
            <div role="button" onClick={() => save({ ...prefs, rot: (prefs.rot + 90) % 360 })} style={btn}>↻ Rotate</div>
            <div role="button" onClick={() => save({ ...prefs, flip: !prefs.flip })} style={btn}>⇋ Flip</div>
            <div role="button" onClick={() => save({ ...prefs, facing: prefs.facing === 'user' ? 'environment' : 'user' })} style={btn}>Switch camera</div>
            <div role="button" onClick={onFile} style={btn}>Choose photo</div>
            <div role="button" aria-label="Take photo" onClick={shoot} style={{ ...btn, background: TEAL, color: '#000', minWidth: mobile ? 140 : 220, fontSize: mobile ? 18 : 24 }}>Take photo</div>
          </>
        )}
      </div>
    </div>
  );
}
const CameraIcon = ({ c, s = 30 }: { c: string; s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" /><circle cx="12" cy="13" r="3.6" /></svg>
);

export default function LabAssessmentV2() {
  const scan = true;
  const [screen, setScreen] = React.useState<Screen>('cover');
  const [ans, setAns] = React.useState<Ans>({});
  const [materials, setMaterials] = React.useState<string[]>([]);
  const [other, setOther] = React.useState<Partial<Record<QKey, string>>>({});
  const [contact, setContact] = React.useState<Contact>(BLANK_CONTACT);
  const [tried, setTried] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [count, setCount] = React.useState(THANKS_SECONDS);
  const [pending, setPending] = React.useState(0);
  const idleRef = React.useRef<number>(0);
  const advance = React.useRef<number>(0);
  const emailRef = React.useRef<HTMLInputElement>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [scanState, setScanState] = React.useState<'idle' | 'busy' | 'ok' | 'fail'>('idle');
  const scanned = React.useRef(false);
  const [camOpen, setCamOpen] = React.useState(false);
  /* Company and Role are not part of the form by default: they show only when the last scan read them off the photo. */
  const [scanFields, setScanFields] = React.useState({ company: false, role: false });
  const port = usePortrait();
  const mobile = useMobile();
  const kb = useKeyboard();

  /* Kiosk hygiene: no pinch-zoom, no pull-to-refresh. */
  React.useEffect(() => {
    const meta = document.querySelector('meta[name="viewport"]');
    const prev = meta?.getAttribute('content') || '';
    /* Zoom is locked on the booth iPad only; a visitor's own phone keeps pinch-zoom. */
    if (window.innerWidth > 640) meta?.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover');
    const prevOverflow = document.documentElement.style.overscrollBehavior;
    document.documentElement.style.overscrollBehavior = 'none';
    document.body.style.overflow = 'hidden';
    return () => { meta?.setAttribute('content', prev); document.documentElement.style.overscrollBehavior = prevOverflow; document.body.style.overflow = ''; };
  }, []);

  /* Offline queue: retry until delivered. */
  const flush = React.useCallback(async () => {
    const q = readQueue();
    setPending(q.length);
    if (!q.length) return;
    const left: Queued[] = [];
    for (const it of q) { if (!(await post(it.ep, it.body))) left.push(it); }
    writeQueue(left);
    setPending(left.length);
  }, []);
  React.useEffect(() => {
    flush();
    const t = window.setInterval(flush, 20_000);
    window.addEventListener('online', flush);
    return () => { clearInterval(t); window.removeEventListener('online', flush); };
  }, [flush]);

  const reset = React.useCallback(() => {
    clearTimeout(advance.current);
    setScreen('cover'); setAns({}); setMaterials([]); setOther({}); setContact(BLANK_CONTACT); setScanState('idle'); scanned.current = false; setScanFields({ company: false, role: false });
    setTried(false); setSending(false); setCount(THANKS_SECONDS);
  }, []);

  /* A visitor who walks away mid-flow: wipe after a stretch with no touch (not on the
     cover, which holds nothing, nor the thank-you screen, which has its own countdown). */
  React.useEffect(() => {
    if (screen === 'cover' || screen === 'thanks') return;
    const bump = () => { clearTimeout(idleRef.current); idleRef.current = window.setTimeout(() => { if (!sending) reset(); }, window.innerWidth <= 640 ? 300_000 : IDLE_MS); };
    bump();
    const evs = ['pointerdown', 'keydown', 'input'];
    evs.forEach((e) => window.addEventListener(e, bump, true));
    return () => { clearTimeout(idleRef.current); evs.forEach((e) => window.removeEventListener(e, bump, true)); };
  }, [screen, sending, reset]);

  React.useEffect(() => {
    if (screen !== 'thanks') return;
    setCount(THANKS_SECONDS);
    const t = window.setInterval(() => setCount((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [screen]);
  React.useEffect(() => { if (screen === 'thanks' && count <= 0) reset(); }, [count, screen, reset]);

  const go = (d: number) => {
    setScreen((cur) => ORD[Math.max(0, Math.min(ORD.length - 1, ORD.indexOf(cur) + d))]);
  };

  const q = (screen in Q ? Q[screen as QKey] : null) as QDef | null;
  const key = screen as QKey;
  const sel = q ? ans[key] || [] : [];

  const optsFor = (): Opt[] => {
    switch (screen) {
      case 'industry': return INDUSTRY;
      case 'tests': return TESTS;
      case 'machines': return MACHINES;
      case 'volume': return VOLUME;
      case 'priority': return PRIORITY;
      case 'standards': {
        const ind = ans.industry || [];
        const plastics = ind.includes('plastics'), rubber = ind.includes('rubber');
        return [...(plastics && !rubber ? STD_P : rubber && !plastics ? STD_R : [...STD_P, ...STD_R]), { id: 'other', label: 'Other', mark: '+', other: true }];
      }
      default: return [];
    }
  };

  const tap = (o: Opt) => {
    if (!q) return;
    const single = !!q.single;
    setAns((p) => {
      const cur = p[key] || [];
      let nv: string[];
      if (single) nv = [o.id];
      else if (o.exclusive) nv = cur.includes(o.id) ? [] : [o.id];
      else { const b = cur.filter((x) => !(optsFor().find((z) => z.id === x)?.exclusive)); nv = b.includes(o.id) ? b.filter((x) => x !== o.id) : [...b, o.id]; }
      return { ...p, [key]: nv };
    });
  };

  const isContact = screen === 'contact';
  /* The 1024x768 iPad is short: slimmer fields, and three to a row on landscape, keep the whole last step on one screen. */
  const fieldH = mobile ? 68 : !port && window.innerHeight < 800 ? 76 : 88;
  const nextOn = isContact || screen === 'standards' || sel.length > 0;
  const E = errsOf(contact);
  const showErr = tried;
  /* Typing on the tablet is slow, so the email field offers a ".com" key: it shows once the visitor has
     typed an @ and a domain name with no dot yet, and one tap finishes the address. */
  const emailDomain = contact.email.split('@')[1] ?? '';
  const showCom = contact.email.includes('@') && emailDomain.length > 0 && !emailDomain.includes('.');
  async function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setCamOpen(false);
    setScanState('busy');
    try { await readCard(await shrink(file)); } catch { setScanState('fail'); }
  }
  async function readCard(image: string) {
    setCamOpen(false);
    setScanState('busy');
    try {
      const r = await fetch(SCAN_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image, media_type: 'image/jpeg' }) });
      if (!r.ok) throw new Error(String(r.status));
      const { found, contact: f } = await r.json();
      if (!found) { setScanState('fail'); return; }
      scanned.current = true;
      /* Every successful scan replaces all the fields, so a second card (a badge after a business
         card) never inherits the first one's details. */
      setContact({ name: f.name || '', email: f.email || '', phone: f.phone ? formatPhone(f.phone) : '', company: f.company || '', role: f.job_title || '' });
      setScanFields({ company: !!f.company, role: !!f.job_title });
      setScanState('ok');
      setTimeout(() => emailRef.current?.focus(), 250);
    } catch { setScanState('fail'); }
  }
  const addCom = () => {
    setContact((c) => ({ ...c, email: c.email.trim() + '.com' }));
    emailRef.current?.focus();
  };

  async function submit() {
    setSending(true);
    const client_id = (crypto as any).randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random();
    const ct = { name: contact.name.trim(), email: contact.email.trim().toLowerCase(), website: domainOfEmail(contact.email.trim()), phone: fullPhone(contact.phone), company: contact.company.trim(), role: contact.role.trim() };
    const body = {
      client_id, event_slug: EVENT_SLUG, path: 'assess', scanned: scanned.current, page: window.location.pathname, submitted_at: new Date().toISOString(),
      answers: {
        industry: industryValue(ans.industry || []),
        tests: ans.tests || [], tests_other: (other.tests || '').trim(),
        machines: ans.machines || [], machines_other: (other.machines || '').trim(),
        volume: (ans.volume || [])[0] || '',
        priorities: ans.priority || [], priorities_other: (other.priority || '').trim(),
        standards: ans.standards || [], standards_other: (other.standards || '').trim(),
      },
      contact: ct,
    };
    const jobs: Queued[] = [{ ep: ASSESS_ENDPOINT, body }];
    /* Materials ticked on the last step go to the capture endpoint as their own request,
       so a failure there never costs the assessment (each is queued and retried alone). */
    if (materials.length) {
      jobs.push({ ep: CAPTURE_ENDPOINT, body: { client_id: `${client_id}-materials`, event_slug: EVENT_SLUG, path: 'assess', name: ct.name, email: ct.email, company: ct.company || siteHost(ct.website), website: ct.website, phone: ct.phone,
        assets: materials, source: window.location.pathname, submitted_at: new Date().toISOString() } });
    }
    let ok = true;
    for (const job of jobs) {
      const sent = await post(job.ep, job.body);
      if (!sent) { ok = false; const qd = readQueue(); qd.push(job); writeQueue(qd); setPending(qd.length); }
    }
    track('booth_assessment_submit', { event: EVENT_SLUG, delivered: ok, materials: materials.length });
    setSending(false);
    setTried(false);
    setScreen('thanks');
  }

  const next = () => {
    clearTimeout(advance.current);
    if (isContact) {
      if (Object.values(E).some(Boolean) || materials.length === 0) { setTried(true); return; }
      if (!sending) void submit();
      return;
    }
    if (nextOn) go(1);
  };
  const back = () => { clearTimeout(advance.current); go(-1); };

  /* ---------- geometry (README, "Values that change with orientation") ---------- */
  const padX = mobile ? 20 : port ? 44 : 52;
  const segW = mobile ? 20 : port ? 30 : 40;
  const vpH = kb.h ?? window.innerHeight;
  const topH = mobile ? 56 : 72;
  /* Short phone screens (small iPhones, landscape phones) compact further so the answers,
     and above all the Next button, stay on screen without scrolling. */
  const short = mobile && vpH < 700;
  const wideMobile = mobile && window.innerWidth > 640;
  const W = window.innerWidth;
  const compactBtn = short || wideMobile;
  const BTN: BtnSpec = mobile
    ? compactBtn ? { h: 48, r: 14, px: 16, fs: 16, icon: 20, gap: 10 } : { h: 56, r: 16, px: 20, fs: 17, icon: 22, gap: 12 }
    : { h: 96, r: 24, px: 32, fs: 22, icon: 28, gap: 16 };
  /* Pre-assessment questions are text only: the question, then the choices stacked one under
     the other. The specimen standards keep their drawings, the materials list its photos. */
  const plain = !!q && screen !== 'standards';
  /* The 10px row gap is part of the 1180x820 design; at 1024x768 four rows of 105px
     tiles (the machines list) only fit if the rows are spaced by space-evenly alone,
     the way the portrait layout already does. */
  /* Every answer tile on every screen shares one height and one gap per device, so the
     buttons read as a set: nothing grows or shrinks with the number of choices. The rows
     stack from the top (flex-start) instead of being spread over the free height. */
  const rowGap = mobile ? 12 : port ? 14 : window.innerHeight < 800 ? 6 : 8;
  const opts = optsFor();
  /* Standards tiles carry a title and a sub-line, which need more than the 44-48px of a one-line answer. */
  const two = screen === 'standards';
  const tileH = mobile ? (two ? 66 : vpH < 700 ? 50 : 58) : port ? 82 : two ? 64 : window.innerHeight < 800 ? 44 : 48;
  const three = !plain && !mobile && !port && opts.length > 4 && opts.length <= 6;
  const basis = plain ? 4000 : mobile ? 280 : three ? 300 : 440;
  const narrow = !port && window.innerWidth < 1100;
  /* The 200px photo panel leaves too little text width on the 1024px iPad (the materials
     tiles, with a title and a sub-line, clip), so it is 150px there like the 3-column layout. */
  const mediaW = mobile ? (vpH < 700 ? 72 : 84) : port ? 150 : three || narrow ? 150 : 200;
  const titleLong = !!q && q.title.length > 44;
  /* 46px question titles are drawn for the 1180px-wide landscape iPad. On the 1024px
     one (the README says the layout must hold there too) a 43-character title wraps
     to two lines and pushes the last row of tiles off the screen, so it steps down
     to the 38px the README already uses for long titles. */
  const titleSize = mobile ? (vpH < 700 ? (titleLong ? 21 : 24) : titleLong ? 24 : 28) : port ? 44 : titleLong || narrow ? 38 : 46;
  const rootStyle: React.CSSProperties = { top: kb.top, height: kb.h ?? '100dvh' };
  const step = q ? q.step : 7;

  /* ---------- screens ---------- */
  if (screen === 'cover') {
    const heroSpec: BtnSpec = mobile ? { h: 72, r: 20, px: 24, fs: 22, icon: 28, gap: 16 } : { h: 136, r: 28, px: 48, fs: 34, icon: 46, gap: 24 };
    const heroW = mobile ? W - 2 * padX : 520;
    const slabBtn = (
      <div style={{ position: 'relative', width: heroW, height: heroSpec.h }}>
        <span style={{ position: 'absolute', inset: 0, borderRadius: heroSpec.r, animation: 'kPulseC 2.4s ease-out infinite', pointerEvents: 'none' }} />
        <Btn label="GET STARTED" upper onClick={() => go(1)} bg={TEAL} fg="#000" arrow="#000" spec={heroSpec} w={heroW} style={{ position: 'absolute', inset: 0 }} />
      </div>
    );
    const coverSize = mobile ? 40 : port ? 84 : 66;
    return (
      <div className="la" style={rootStyle}>
        <style>{CSS}</style>
        <div style={{ position: 'absolute', inset: 0, background: '#000' }}>
          <img src={COVER} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: '70% 50%' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(5,10,11,.92) 0%, rgba(5,10,11,.78) 45%, rgba(5,10,11,.35) 100%), linear-gradient(0deg, rgba(5,10,11,.7), rgba(5,10,11,0) 40%)' }} />
        </div>
        {!mobile && (
          <div style={{ position: 'absolute', inset: 0 }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 96, padding: `0 ${padX}px`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <img src={LOGO} alt="LabsCubed" style={{ height: 30 }} /><div style={{ display: 'flex', alignItems: 'center', gap: 14 }}><Chips /><FullscreenBtn dark /></div>
            </div>
            <div style={{ position: 'absolute', left: padX, right: padX, bottom: 'calc(50% + 96px)', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '.2em', textTransform: 'uppercase', color: TEAL }}>Free lab assessment</div>
              <div style={{ fontSize: coverSize, fontWeight: 800, letterSpacing: '-0.05em', lineHeight: 0.98, color: '#fff', maxWidth: 820 }}>See what automation could save your lab.</div>
            </div>
            <div style={{ position: 'absolute', left: padX, top: '50%', transform: 'translateY(-50%)' }}>{slabBtn}</div>
            <div style={{ position: 'absolute', left: padX, right: padX, top: 'calc(50% + 92px)', display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 600 }}>
              <div style={{ fontSize: 20, fontWeight: 600, color: '#fff' }}>Takes about 2 minutes</div>
              <div style={{ fontSize: 20, fontWeight: 300, lineHeight: 1.45, color: 'rgba(255,255,255,.82)', textWrap: 'pretty' as any }}>Your testing costs and technician time, workflow bottlenecks, and estimated automation ROI and payback.</div>
            </div>
          </div>
        )}
        {mobile && (
          <div className="la-scroll" style={{ position: 'relative', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', padding: `0 ${padX}px calc(28px + env(safe-area-inset-bottom, 0px))` }}>
            <div style={{ height: 64, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <img src={LOGO} alt="LabsCubed" style={{ height: 22 }} /><Chips m />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 20, padding: '8px 0' }}>
              <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '.2em', textTransform: 'uppercase', color: TEAL }}>Free lab assessment</div>
              <div style={{ fontSize: coverSize, fontWeight: 800, letterSpacing: '-0.05em', lineHeight: 0.98, color: '#fff' }}>See what automation could save your lab.</div>
              {slabBtn}
              <div style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>Takes about 2 minutes</div>
              {!short && <div style={{ fontSize: 16, fontWeight: 300, lineHeight: 1.45, color: 'rgba(255,255,255,.82)', textWrap: 'pretty' as any }}>Your testing costs and technician time, workflow bottlenecks, and estimated automation ROI and payback.</div>}
            </div>
          </div>
        )}
        {pending > 0 && <div style={{ position: 'absolute', right: 14, bottom: 6, fontSize: mobile ? 11 : 18, color: 'rgba(255,255,255,.6)', pointerEvents: 'none' }}>{pending} saved on this {mobile ? 'phone' : 'iPad'} · will send when online</div>}
      </div>
    );
  }

  /* Question, contact and thank-you screens share the dark top band. */
  const isThanks = screen === 'thanks';
  const segs = Array.from({ length: 7 }, (_, i) => (isThanks || i < step - 1 ? P.segDone : i === step - 1 ? P.segCur : P.segOff));
  const thanksList = [...THANKS_ASSESS, ...MATERIALS.filter((m) => materials.includes(m.id)).map((m) => m.label)];
  const nextLabel = isContact ? 'Send my assessment' : screen === 'standards' && sel.length === 0 ? "Skip, I'm not sure" : 'Next';

  const header = q ? { eb: `Question ${q.step} · ${q.eb}`, title: q.title, hint: q.hint }
    : { eb: 'Last step · Your details', title: 'Where should we send your assessment?', hint: 'Phone is optional. Pick at least one item to email to you.' };

  const fields = [
    { k: 'name', label: 'Full name', type: 'text', ph: 'First and last name', mode: undefined as any, cap: 'words' },
    { k: 'email', label: 'Email', type: 'email', ph: 'name@company.com', mode: 'email', cap: 'off' },
    { k: 'company', label: 'Company', type: 'text', ph: 'Company name', mode: undefined as any, cap: 'words' },
    { k: 'role', label: 'Role', type: 'text', ph: 'Job title', mode: undefined as any, cap: 'words' },
    { k: 'phone', label: 'Phone (optional)', type: 'tel', ph: '(555) 000-0000', mode: 'tel', cap: 'off' },
  ] as const;

  const resetW = port || mobile ? W - 2 * padX : Math.round(W * 0.54) - 2 * padX;
  const ringSize = mobile ? 40 : 64;
  const resetBlock = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Btn label="Start a new assessment" onClick={reset} bg={INK} fg="#fff" spec={BTN} w={resetW} rightW={ringSize}
        right={(
          <span style={{ position: 'relative', width: ringSize, height: ringSize, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
            <svg width={ringSize} height={ringSize} viewBox="0 0 76 76" style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}>
              <circle cx="38" cy="38" r="32" fill="none" stroke="rgba(255,255,255,.16)" strokeWidth="6" />
              <circle cx="38" cy="38" r="32" fill="none" stroke={TEAL} strokeWidth="6" strokeDasharray="201.06" strokeDashoffset={201.06 * (1 - Math.max(count, 0) / THANKS_SECONDS)} style={{ transition: 'stroke-dashoffset 1s linear' }} />
            </svg>
            <span style={{ fontSize: mobile ? 15 : 22, fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: '#fff' }}>{Math.max(count, 0)}</span>
          </span>
        )} />
      {!mobile && <div style={{ fontSize: 18, fontWeight: 500, color: MUTED }}>The screen resets for the next visitor.</div>}
    </div>
  );

  return (
    <div className="la" style={rootStyle}>
      <style>{CSS}</style>
      {/* top band */}
      <div style={{ height: topH, flex: 'none', padding: `0 ${padX}px`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: BAND }}>
        <img src={LOGO} alt="LabsCubed" style={{ height: mobile ? 20 : 24 }} />
        {(
          <div style={{ display: 'flex', alignItems: 'center', gap: mobile ? 12 : 18 }}>
            {!mobile && <FullscreenBtn dark />}
            <div style={{ display: 'flex', gap: 4 }}>{segs.map((bg, i) => <div key={i} style={{ width: segW, height: mobile ? 6 : 8, borderRadius: 2, background: bg }} />)}</div>
            <div style={{ fontSize: mobile ? 14 : 18, fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: '#fff', minWidth: mobile ? 32 : 44, textAlign: 'right' }}>{step} / 7</div>
          </div>
        )}
      </div>

      {/* header: full, or collapsed while the keyboard is up */}
      {!isThanks && !kb.open && (
        <div style={{ flex: 'none', padding: mobile ? `${short ? 8 : 12}px ${padX}px ${short ? 10 : 14}px` : `16px ${padX}px 18px`, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Eyebrow m={mobile}>{header.eb}</Eyebrow>
          <div style={{ fontSize: titleSize, fontWeight: 800, letterSpacing: '-0.045em', lineHeight: 1.02, color: INK, textWrap: 'balance' as any }}>{header.title}</div>
          {!short && <div style={{ fontSize: mobile ? 16 : 20, fontWeight: 500, color: MUTED }}>{header.hint}</div>}
        </div>
      )}
      {!isThanks && kb.open && (
        <div style={{ flex: 'none', padding: `${mobile ? 10 : 16}px ${padX}px 12px`, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Eyebrow m={mobile}>{header.eb}</Eyebrow>
          <div style={{ fontSize: mobile ? 22 : 28, fontWeight: 800, letterSpacing: '-0.03em', color: INK }}>{header.title}</div>
        </div>
      )}

      {/* tiles */}
      {q && (
        <div className="la-scroll" style={{ flex: 1, minHeight: 0, position: 'relative', padding: `0 ${padX}px`, display: 'flex', flexWrap: 'wrap', alignContent: 'flex-start', gap: `${kb.open ? 14 : rowGap}px ${mobile ? 12 : 14}px`, overflowY: 'auto', paddingBottom: mobile ? 12 : 0 }}>
          {opts.map((o) => (
            <Tile key={screen + o.id} o={o} on={sel.includes(o.id)} mediaW={mediaW} tileH={tileH} basis={basis}
              otherValue={other[key] || ''} onOther={(v) => setOther((p) => ({ ...p, [key]: v }))} onTap={() => tap(o)} m={mobile} plain={plain} />
          ))}
          {kb.open && <div style={{ position: 'sticky', left: 0, right: 0, top: 0, height: 56, marginTop: -56, width: '100%', background: `linear-gradient(${CANVAS}, rgba(242,242,244,0))`, pointerEvents: 'none', order: -1 }} />}
        </div>
      )}

      {/* contact */}
      {isContact && (
        <div className="la-scroll" style={{ flex: 1, minHeight: 0, padding: `0 ${padX}px`, display: 'flex', flexWrap: 'wrap', alignContent: 'flex-start', gap: mobile ? 12 : 14, paddingBottom: mobile ? 12 : 0 }}>
          {scan && (
            <div style={{ flex: '1 1 100%', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <input ref={fileRef} type="file" accept="image/*" onChange={onPhoto} style={{ display: 'none' }} />
              <div role="button" aria-disabled={scanState === 'busy'} onClick={() => { if (scanState !== 'busy') setCamOpen(true); }}
                style={{ height: mobile ? 64 : 84, borderRadius: mobile ? 16 : 20, background: scanState === 'ok' ? P.tileOn : TEAL, boxShadow: scanState === 'ok' ? P.ringOnIn : 'none', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, cursor: 'pointer', fontSize: mobile ? 18 : 24, fontWeight: 800, letterSpacing: '-0.01em' }}>
                <CameraIcon c="#000" s={mobile ? 26 : 34} />
                {scanState === 'busy' ? 'Reading…' : scanState === 'ok' ? 'Scanned. Scan again' : 'Scan your badge or business card'}
              </div>
              {scanState === 'ok' && <span style={{ fontSize: mobile ? 14 : 18, fontWeight: 600, color: TEAL_D }}>Check your details below{contact.email ? '' : ', then add your email'}.</span>}
              {scanState === 'fail' && <span style={{ fontSize: mobile ? 14 : 18, fontWeight: 600, color: P.labelErr }}>We couldn't read that one. Try again in better light, or type your details.</span>}
            </div>
          )}
          {fields.filter((f) => (f.k === 'company' ? scanFields.company : f.k === 'role' ? scanFields.role : true)).map((f) => {
            const msg = showErr ? E[f.k] : '';
            const err = !!msg;
            return (
              <div key={f.k} style={{ flex: mobile ? '1 1 100%' : `1 1 ${port ? 440 : 280}px`, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ height: fieldH, borderRadius: mobile ? 14 : 18, background: err ? P.fieldErr : P.field, boxShadow: err ? P.errRing : P.fieldRing, padding: mobile ? '9px 16px 0' : '12px 22px 0', display: 'flex', flexDirection: 'column', gap: 2, position: 'relative' }}>
                  <span style={{ fontSize: mobile ? 13 : 18, fontWeight: 800, color: err ? P.labelErr : P.label }}>{f.label}</span>
                  <input ref={f.k === 'email' ? emailRef : undefined} value={contact[f.k]} placeholder={f.ph} type={f.type} inputMode={f.mode} autoComplete="off" autoCorrect="off" autoCapitalize={f.cap} spellCheck={false}
                    onChange={(e) => {
                      const v = e.target.value;
                      setContact((c) => ({ ...c, [f.k]: f.k === 'phone' ? formatPhone(v) : v }));
                    }}
                    onFocus={(e) => { const t = e.currentTarget; setTimeout(() => t.scrollIntoView({ block: 'center', behavior: 'smooth' }), 320); }}
                    style={{ border: 'none', outline: 'none', background: 'transparent', padding: 0, font: mobile ? '500 18px Inter, sans-serif' : '500 24px Inter, sans-serif', color: INK, width: '100%' }} />
                  {f.k === 'email' && showCom && (
                    <button type="button" aria-label="Add .com to the email"
                      onPointerDown={(e) => e.preventDefault()} onClick={addCom}
                      style={{ position: 'absolute', right: mobile ? 10 : 14, top: '50%', transform: 'translateY(-50%)', height: mobile ? 46 : 60, minWidth: mobile ? 84 : 112, padding: '0 18px', border: 'none', borderRadius: 14, background: TEAL, color: '#000', font: mobile ? '800 20px Inter, sans-serif' : '800 26px Inter, sans-serif', cursor: 'pointer' }}>.com</button>
                  )}
                </label>
                {err && <span style={{ fontSize: mobile ? 14 : 18, fontWeight: 600, color: P.labelErr, paddingLeft: mobile ? 16 : 22 }}>{msg}</span>}
              </div>
            );
          })}
          <div style={{ flex: '1 1 100%', marginTop: mobile ? 4 : 8 }}>
            <Eyebrow m={mobile} color={showErr && materials.length === 0 ? P.labelErr : INK}>Email me · pick at least one</Eyebrow>
            {showErr && materials.length === 0 && <div style={{ fontSize: mobile ? 14 : 18, fontWeight: 600, color: P.labelErr, paddingTop: 6 }}>Choose at least one item to email to you</div>}
          </div>
          {MATERIALS.map((o) => (
            <Tile key={o.id} o={o} on={materials.includes(o.id)} mediaW={mediaW} tileH={tileH} basis={mobile ? 280 : port ? 300 : 440}
              otherValue="" onOther={() => {}} onTap={() => setMaterials((p) => (p.includes(o.id) ? p.filter((x) => x !== o.id) : [...p, o.id]))} m={mobile} plain grow />
          ))}
          <div style={{ flex: '1 1 100%', fontSize: mobile ? 14 : 18, fontWeight: 500, color: MUTED, lineHeight: 1.4, paddingBottom: mobile ? 0 : 16 }}>
            We'll email your assessment, and the materials you tick, to this address.
          </div>
        </div>
      )}

      {/* thank you: photo panel and a white panel (landscape side by side, portrait and phone stacked) */}
      {isThanks && (
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: port || mobile ? 'column' : 'row' }}>
          <div style={{ flex: mobile ? (short ? '0 0 110px' : '0 0 170px') : port ? '0 0 400px' : '0 0 46%', position: 'relative', overflow: 'hidden', background: BAND }}>
            <img src={K('step4-cubeten-start.webp')} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: '60% 50%' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, rgba(5,10,11,.88) 0%, rgba(5,10,11,.2) 55%, rgba(5,10,11,0) 100%)' }} />
            <div style={{ position: 'absolute', left: mobile ? 20 : 40, right: mobile ? 20 : 40, bottom: mobile ? 20 : 36, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: mobile ? 13 : 18, fontWeight: 800, letterSpacing: '.2em', textTransform: 'uppercase', color: TEAL }}>Assessment requested</div>
              <div style={{ fontSize: mobile ? (short ? 36 : 44) : narrow && !port ? 66 : 80, fontWeight: 800, letterSpacing: '-0.05em', lineHeight: 0.95, color: '#fff' }}>Thank you.</div>
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column', background: '#fff' }}>
          <div className="la-scroll" style={{ flex: 1, minWidth: 0, minHeight: 0, padding: mobile ? `18px ${padX}px 12px` : `44px ${padX}px 48px`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: mobile ? 20 : 28 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: mobile ? 14 : 18 }}>
              <div style={{ fontSize: mobile ? 18 : 24, fontWeight: 500, lineHeight: 1.4, color: INK, textWrap: 'pretty' as any }}>
                We'll be in touch via email with your personalized assessment, including:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {thanksList.map((label, i) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: mobile ? 14 : 18, minHeight: mobile ? 56 : 64, borderRadius: 16, background: CANVAS, padding: mobile ? '10px 16px' : '10px 20px' }}>
                    <span style={{ fontSize: mobile ? 16 : 20, fontWeight: 800, color: TEAL_D, fontVariantNumeric: 'tabular-nums', flex: 'none' }}>{'0' + (i + 1)}</span>
                    <span style={{ fontSize: mobile ? 17 : 22, fontWeight: 600, lineHeight: 1.25, color: INK }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
            {!mobile && resetBlock}
          </div>
          {mobile && <div style={{ flex: 'none', padding: `10px ${padX}px calc(12px + env(safe-area-inset-bottom, 0px))`, background: '#fff', boxShadow: '0 -1px 0 rgba(0,0,0,.06)' }}>{resetBlock}</div>}
          </div>
        </div>
      )}

      {/* footer: Back left and Next right on the iPad; stacked on a phone, Next on top */}
      {!isThanks && (
        <div style={mobile
          ? { flex: 'none', padding: `10px ${padX}px calc(12px + env(safe-area-inset-bottom, 0px))`, display: 'flex', flexDirection: short || wideMobile ? 'row' : 'column-reverse', gap: 10, background: `linear-gradient(rgba(242,242,244,0), ${CANVAS} 30%)` }
          : { height: 120, flex: 'none', padding: `12px ${padX}px`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
          <Btn label="Back" onClick={back} fg={INK} back ring={`inset 0 0 0 ${mobile ? 2 : 2.5}px ${INK}`} spec={BTN} w={mobile ? (compactBtn ? 104 : W - 2 * padX) : Math.floor((W - 2 * padX - 14) / 2)}
            style={mobile ? { width: compactBtn ? 104 : '100%', flex: 'none' } : { flex: 1 }} />
          <Btn label={sending ? 'Sending…' : nextLabel} alt={isContact ? 'Send' : screen === 'standards' && sel.length === 0 ? 'Skip' : undefined} onClick={next} bg={nextOn ? P.nextBg : P.offBg} fg={nextOn ? P.nextFg : P.offFg} arrow={nextOn ? P.nextArrow : P.offArrow} spec={BTN} w={mobile ? (compactBtn ? W - 2 * padX - 114 : W - 2 * padX) : Math.floor((W - 2 * padX - 14) / 2)} disabled={!nextOn || sending}
            style={mobile ? (compactBtn ? { flex: 1 } : { width: '100%' }) : { flex: 1 }} />
        </div>
      )}
      {camOpen && <CameraSheet mobile={mobile} onShot={(b) => void readCard(b)} onFile={() => fileRef.current?.click()} onClose={() => setCamOpen(false)} />}
      {pending > 0 && !kb.open && <div style={mobile ? { position: 'absolute', left: 0, right: 0, bottom: 1, textAlign: 'center', fontSize: 11, color: MUTED, pointerEvents: 'none' } : { position: 'absolute', left: '50%', top: 24, transform: 'translateX(-50%)', fontSize: 18, color: 'rgba(255,255,255,.6)', pointerEvents: 'none' }}>{pending} saved · will send when online</div>}
    </div>
  );
}
