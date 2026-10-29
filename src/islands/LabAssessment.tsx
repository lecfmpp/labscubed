/* LabAssessment — the iPad kiosk at the AMI booth (client:only).
 *
 * Built from the "Kiosk 3b, photo-led and bold" design handoff (Kiosk directions
 * design review): light canvas, dark top band, heavy Inter 800 type. Landscape 1180x820 (holds at 1024x768) and portrait 820x1180,
 * touch only: tap targets 96px+, nothing relies on hover, text never below 18px.
 *
 * Two paths from the first screen:
 *   assess  free lab assessment: cover, six questions, contact, thank you.
 *           Submits to netlify/functions/booth-assessment.mjs.
 *   learn   explore materials: pick brochures / white paper / webinar replay,
 *           contact, thank you. Submits to netlify/functions/booth-capture.mjs,
 *           the same endpoint the earlier brochure tablet used.
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
import { COUNTRIES } from '../lib/countries';
import { track } from '../lib/track';
// @ts-ignore  specimen drawings, ported as is from the design system
import { Sample } from './kiosk/Sample.jsx';

const ASSESS_ENDPOINT = '/api/booth/assessment';
const CAPTURE_ENDPOINT = '/api/booth/capture';
const EVENT_SLUG = 'ami-nov-2026';
const QUEUE_KEY = 'lc-assessment-queue-v1';
const IDLE_MS = 90_000;
const THANKS_SECONDS = 15;

const K = (n: string) => `/assets/img/assessment/kiosk/${n}`;
const COVER = '/assets/img/assessment/cover-lab-office.webp';
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
  { id: 'both', label: 'Plastics and rubber', img: K('cubeten-loading-tray.webp') },
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
];
/* Materials. `id` is what booth-capture.mjs sends (cubeten-brochure, cubeone-brochure,
   whitepaper go through the download-request edge function; spe-replay is a link). */
const MATERIALS: Opt[] = [
  { id: 'cubeten-brochure', label: 'CubeTen brochure', sub: 'Plastics · ASTM D638, ISO 527', img: K('hero-plastic.webp') },
  { id: 'spe-replay', label: 'SPE webinar replay', sub: 'The Hidden Cost of Manual Plastics Testing', img: K('step2-cubeten-measurement.webp') },
  { id: 'cubeone-brochure', label: 'CubeOne brochure', sub: 'Rubber · ASTM D412, ISO 37', img: K('hero-rubber.webp') },
  { id: 'whitepaper', label: 'White paper: Beyond the Bottleneck', sub: 'Automation business case', img: K('stats-bg.webp') },
];

type QKey = 'industry' | 'tests' | 'machines' | 'volume' | 'priority' | 'standards' | 'learn';
type QDef = { step: number; eb: string; title: string; hint: string; single?: boolean; learn?: boolean };
const Q: Record<QKey, QDef> = {
  industry: { step: 1, eb: 'Industry', title: 'Which industry do you work in?', hint: 'Tap one to continue', single: true },
  tests: { step: 2, eb: 'Test types', title: 'What types of tests does your laboratory perform?', hint: 'Select all that apply' },
  machines: { step: 3, eb: 'Equipment', title: 'What testing machines do you currently use?', hint: 'Select all that apply' },
  volume: { step: 4, eb: 'Daily volume', title: 'How many specimens do you test daily?', hint: 'Tap one to continue', single: true },
  priority: { step: 5, eb: 'Priorities', title: "What is your laboratory's main priority?", hint: 'Select all that apply' },
  standards: { step: 6, eb: 'Standards', title: 'Which specimens and testing standards do you use?', hint: "Optional. Select all that apply, or skip if you're not sure." },
  learn: { step: 0, eb: 'Product materials', title: 'Choose what we send you.', hint: "Select all that apply. We'll email them to you.", learn: true },
};

type Screen = 'choose' | 'cover' | QKey | 'contact' | 'thanks';
type Path = 'assess' | 'learn';
const ORD: Record<Path, Screen[]> = {
  assess: ['choose', 'cover', 'industry', 'tests', 'machines', 'volume', 'priority', 'standards', 'contact', 'thanks'],
  learn: ['choose', 'learn', 'contact', 'thanks'],
};

type Ans = Partial<Record<QKey, string[]>>;
type Contact = { name: string; email: string; web: string; phone: string; country: string };
const BLANK_CONTACT: Contact = { name: '', email: '', web: '', phone: '', country: 'US' };
const THANKS_ASSESS = ['Testing costs and technician time', 'Workflow bottlenecks and capacity gains', 'Impact on turnaround time and backlog', 'Estimated automation ROI and payback'];

const COUNTRY_LIST = (() => {
  const top = ['US', 'CA'];
  const first = top.map((c) => COUNTRIES.find((x) => x.c === c)).filter(Boolean) as typeof COUNTRIES;
  return [...first, ...COUNTRIES.filter((x) => !top.includes(x.c))];
})();

const errsOf = (c: Contact) => ({
  name: c.name.trim() ? '' : 'Add your full name',
  email: !c.email.trim() ? 'Add your email' : /^\S+@\S+\.\S+$/.test(c.email.trim()) ? '' : 'Enter a valid email, like name@company.com',
  web: c.web.trim() ? '' : 'Add your company website',
  phone: '',
});
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
  const q = '(max-width: 640px)';
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
/* On-screen keyboard: the layout shrinks to the visual viewport so the footer
   sits directly above the keyboard (README, "Keyboard-aware state"). */
function useKeyboard() {
  const [s, setS] = React.useState<{ open: boolean; h: number | null; top: number }>({ open: false, h: null, top: 0 });
  React.useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const on = () => {
      const open = window.innerHeight - vv.height > 120;
      setS({ open, h: open ? vv.height : null, top: open ? vv.offsetTop : 0 });
    };
    on();
    vv.addEventListener('resize', on);
    vv.addEventListener('scroll', on);
    return () => { vv.removeEventListener('resize', on); vv.removeEventListener('scroll', on); };
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
  const base: React.CSSProperties = { height: m ? 32 : 44, padding: m ? '0 12px' : '0 18px', borderRadius: 999, display: 'flex', alignItems: 'center', fontSize: m ? 13 : 18, fontWeight: 800, letterSpacing: m ? '.06em' : '.1em', color: '#000', whiteSpace: 'nowrap' };
  return <div style={{ display: 'flex', gap: m ? 6 : 10 }}><div style={{ ...base, background: TEAL }}>NOV 11-12</div><div style={{ ...base, background: '#fff' }}>BOOTH C819</div></div>;
};
const Eyebrow = ({ children, m, color = INK }: { children: React.ReactNode; m?: boolean; color?: string }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: m ? 13 : 18, fontWeight: 800, letterSpacing: m ? '.1em' : '.14em', textTransform: 'uppercase', color }}>
    <span style={{ width: m ? 8 : 10, height: m ? 8 : 10, background: TEAL, borderRadius: 2, flex: 'none' }} />{children}
  </div>
);

function Tile({ o, on, mediaW, tileH, basis, otherValue, onOther, onTap, m }: {
  o: Opt; on: boolean; mediaW: number; tileH: number; basis: number; otherValue: string; onOther: (v: string) => void; onTap: () => void; m?: boolean;
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
      style={{ flex: `1 1 ${basis}px`, height: tileH, display: 'flex', borderRadius: radius, overflow: 'hidden', cursor: 'pointer', position: 'relative', background: on ? P.tileOn : P.tileBg, boxShadow: on ? P.glowOn : P.ring, transition: 'box-shadow .2s ease, background .2s ease' }}>
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
      <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', padding: m ? '0 14px' : '0 24px' }}>
        {!inp && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: m ? 18 : 23, fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.02em', color: on ? P.fgOn : P.fg, textWrap: 'pretty' as any }}>{o.label}</span>
            {o.sub && <span style={{ fontSize: m ? 14 : 18, fontWeight: 500, color: MUTED }}>{o.sub}</span>}
          </div>
        )}
        {inp && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: m ? 14 : 18, fontWeight: 800, color: TEAL_D }}>Other, please specify</span>
            <input ref={ref} value={otherValue} placeholder="Type your answer" autoComplete="off" autoCapitalize="sentences" enterKeyHint="done"
              onClick={(e) => e.stopPropagation()} onChange={(e) => onOther(e.target.value)}
              style={{ height: m ? 44 : 48, border: 'none', outline: 'none', borderRadius: 12, background: '#fff', boxShadow: 'inset 0 0 0 1.5px rgba(13,148,136,.45)', padding: '0 14px', font: m ? '500 17px Inter, sans-serif' : '500 21px Inter, sans-serif', color: INK, width: '100%' }} />
          </div>
        )}
      </div>
      {/* The selected ring sits on an overlay so it draws above the media panel. */}
      <div style={{ position: 'absolute', inset: 0, borderRadius: radius, boxShadow: on ? P.ringOnIn : 'none', pointerEvents: 'none', zIndex: 2, transition: 'box-shadow .2s ease' }} />
    </div>
  );
}

export default function LabAssessment() {
  const [screen, setScreen] = React.useState<Screen>('choose');
  const [path, setPath] = React.useState<Path>('assess');
  const [ans, setAns] = React.useState<Ans>({});
  const [other, setOther] = React.useState<Partial<Record<QKey, string>>>({});
  const [contact, setContact] = React.useState<Contact>(BLANK_CONTACT);
  const [tried, setTried] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [count, setCount] = React.useState(THANKS_SECONDS);
  const [pending, setPending] = React.useState(0);
  const idleRef = React.useRef<number>(0);
  const advance = React.useRef<number>(0);
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
    setScreen('choose'); setPath('assess'); setAns({}); setOther({}); setContact(BLANK_CONTACT);
    setTried(false); setSending(false); setCount(THANKS_SECONDS);
  }, []);

  /* A visitor who walks away mid-flow: wipe after a stretch with no touch (not on the
     entry screen, which holds nothing, nor the thank-you screen, which has its own countdown). */
  React.useEffect(() => {
    if (screen === 'choose' || screen === 'thanks') return;
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
    setScreen((cur) => { const o = ORD[path]; return o[Math.max(0, Math.min(o.length - 1, o.indexOf(cur) + d))]; });
  };
  const goTo = (s: Screen, p: Path) => { clearTimeout(advance.current); setPath(p); setTried(false); setScreen(s); };

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
      case 'learn': return MATERIALS;
      case 'standards': {
        const ind = (ans.industry || [])[0];
        return [...(ind === 'plastics' ? STD_P : ind === 'rubber' ? STD_R : [...STD_P, ...STD_R]), { id: 'other', label: 'Other', mark: '+', other: true }];
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
    if (single) { clearTimeout(advance.current); advance.current = window.setTimeout(() => go(1), 450); }
  };

  const isContact = screen === 'contact';
  const learnPath = path === 'learn';
  const nextOn = isContact || screen === 'standards' || sel.length > 0;
  const E = errsOf(contact);
  const showErr = tried;

  async function submit() {
    setSending(true);
    const client_id = (crypto as any).randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random();
    const ct = { name: contact.name.trim(), email: contact.email.trim().toLowerCase(), website: contact.web.trim(), phone: contact.phone.trim(), country: contact.country };
    let ep: string; let body: any;
    if (learnPath) {
      ep = CAPTURE_ENDPOINT;
      body = { client_id, event_slug: EVENT_SLUG, path: 'learn', name: ct.name, email: ct.email, company: siteHost(ct.website), website: ct.website, phone: ct.phone, country: ct.country,
        assets: ans.learn || [], source: window.location.pathname, submitted_at: new Date().toISOString() };
    } else {
      ep = ASSESS_ENDPOINT;
      body = {
        client_id, event_slug: EVENT_SLUG, path: 'assess', page: window.location.pathname, submitted_at: new Date().toISOString(),
        answers: {
          industry: (ans.industry || [])[0] || '',
          tests: ans.tests || [], tests_other: (other.tests || '').trim(),
          machines: ans.machines || [], machines_other: (other.machines || '').trim(),
          volume: (ans.volume || [])[0] || '',
          priorities: ans.priority || [], priorities_other: (other.priority || '').trim(),
          standards: ans.standards || [], standards_other: (other.standards || '').trim(),
        },
        contact: ct,
      };
    }
    const ok = await post(ep, body);
    if (!ok) { const qd = readQueue(); qd.push({ ep, body }); writeQueue(qd); setPending(qd.length); }
    track(learnPath ? 'booth_materials_submit' : 'booth_assessment_submit', { event: EVENT_SLUG, delivered: ok });
    setSending(false);
    setTried(false);
    setScreen('thanks');
  }

  const next = () => {
    clearTimeout(advance.current);
    if (isContact) {
      if (Object.values(E).some(Boolean)) { setTried(true); return; }
      if (!sending) void submit();
      return;
    }
    if (nextOn) go(1);
  };
  const back = () => { clearTimeout(advance.current); go(-1); };

  /* ---------- geometry (README, "Values that change with orientation") ---------- */
  const padX = mobile ? 20 : port ? 44 : 52;
  const segW = mobile ? 20 : port ? 30 : 40;
  const tileH = mobile ? 76 : port ? 96 : 105;
  const topH = mobile ? 56 : 72;
  /* The 10px row gap is part of the 1180x820 design; at 1024x768 four rows of 105px
     tiles (the machines list) only fit if the rows are spaced by space-evenly alone,
     the way the portrait layout already does. */
  const rowGap = mobile ? 12 : port || window.innerHeight < 800 ? 0 : 10;
  const opts = optsFor();
  const three = !mobile && !port && opts.length > 4 && opts.length <= 6;
  const basis = mobile ? 280 : three ? 300 : 440;
  const narrow = !port && window.innerWidth < 1100;
  /* The 200px photo panel leaves too little text width on the 1024px iPad (the materials
     tiles, with a title and a sub-line, clip), so it is 150px there like the 3-column layout. */
  const mediaW = mobile ? 84 : port ? 150 : three || narrow ? 150 : 200;
  const titleLong = !!q && q.title.length > 44;
  /* 46px question titles are drawn for the 1180px-wide landscape iPad. On the 1024px
     one (the README says the layout must hold there too) a 43-character title wraps
     to two lines and pushes the last row of tiles off the screen, so it steps down
     to the 38px the README already uses for long titles. */
  const titleSize = mobile ? (titleLong ? 24 : 28) : port ? 44 : titleLong || narrow ? 38 : 46;
  const rootStyle: React.CSSProperties = { top: kb.h ? kb.top : 0, height: kb.h ? kb.h : '100dvh' };
  const step = q ? q.step : 7;
  const noProg = screen === 'learn' || (learnPath && (isContact || screen === 'thanks'));

  /* ---------- screens ---------- */
  if (screen === 'cover') {
    const slab = mobile
      ? { width: '100%', height: 84, borderRadius: 22, padding: '0 28px 0 32px', fontSize: 26 }
      : { width: 520, height: 136, borderRadius: 28, padding: '0 40px 0 48px', fontSize: 34 };
    const slabBtn = (
      <div style={{ position: 'relative', width: slab.width, height: slab.height }}>
        <span style={{ position: 'absolute', inset: 0, borderRadius: slab.borderRadius, animation: 'kPulseC 2.4s ease-out infinite', pointerEvents: 'none' }} />
        <div role="button" onClick={() => go(1)} style={{ cursor: 'pointer', position: 'absolute', inset: 0, borderRadius: slab.borderRadius, background: TEAL, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: slab.padding }}>
          <span style={{ fontSize: slab.fontSize, fontWeight: 800, letterSpacing: '.06em', color: '#000' }}>GET STARTED</span>
          <svg width={mobile ? 34 : 46} height={mobile ? 34 : 46} viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </div>
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
              <img src={LOGO} alt="LabsCubed" style={{ height: 30 }} /><Chips />
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
              <div style={{ fontSize: 16, fontWeight: 300, lineHeight: 1.45, color: 'rgba(255,255,255,.82)', textWrap: 'pretty' as any }}>Your testing costs and technician time, workflow bottlenecks, and estimated automation ROI and payback.</div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (screen === 'choose') {
    const slabBtn = (label: string, bg: string, arrow: string, onClick: () => void) => (
      <div role="button" onClick={(e) => { e.stopPropagation(); onClick(); }} style={{ cursor: 'pointer', height: mobile ? 60 : 96, padding: mobile ? '0 24px' : '0 32px', borderRadius: mobile ? 16 : 20, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
        <span style={{ fontSize: mobile ? 18 : 22, fontWeight: 800, color: '#000' }}>{label}</span>
        <ArrowR c={arrow} s={mobile ? 24 : 30} />
      </div>
    );
    const card = (img: string, eb: string, title: string, line: string, btn: React.ReactNode, onClick: () => void) => (
      <div role="button" onClick={onClick} style={{ flex: mobile ? 'none' : '1 1 440px', minHeight: 0, position: 'relative', borderRadius: mobile ? 20 : 22, overflow: 'hidden', cursor: 'pointer', background: BAND, display: 'flex', flexDirection: 'column' }}>
        <div style={mobile ? { height: 170, flex: 'none', position: 'relative' } : { flex: 1, minHeight: 0, position: 'relative' }}>
          <img src={img} alt="" style={{ position: 'absolute', top: mobile ? 16 : 24, left: mobile ? 16 : 24, width: mobile ? 'calc(100% - 32px)' : 'calc(100% - 48px)', height: mobile ? 'calc(100% - 16px)' : 'calc(100% - 24px)', objectFit: 'contain' }} />
        </div>
        <div style={{ flex: 'none', padding: mobile ? '16px 18px 18px' : '22px 28px 28px', display: 'flex', flexDirection: 'column', gap: mobile ? 8 : 10 }}>
          <div style={{ fontSize: mobile ? 13 : 18, fontWeight: 800, letterSpacing: '.16em', textTransform: 'uppercase', color: TEAL }}>{eb}</div>
          <div style={{ fontSize: mobile ? 26 : 36, fontWeight: 800, letterSpacing: '-0.045em', lineHeight: 1.02, color: '#fff', textWrap: 'balance' as any }}>{title}</div>
          <div style={{ fontSize: mobile ? 16 : 18, fontWeight: 500, lineHeight: 1.4, color: 'rgba(255,255,255,.82)', textWrap: 'pretty' as any, marginBottom: 8 }}>{line}</div>
          {btn}
        </div>
      </div>
    );
    return (
      <div className="la" style={rootStyle}>
        <style>{CSS}</style>
        <div className={mobile ? 'la-scroll' : undefined} style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ height: mobile ? 64 : 84, flex: 'none', padding: `0 ${padX}px`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: BAND }}>
            <img src={LOGO} alt="LabsCubed" style={{ height: mobile ? 22 : 26 }} /><Chips m={mobile} />
          </div>
          <div style={{ flex: 'none', padding: mobile ? `20px ${padX}px 16px` : `24px ${padX}px 22px`, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Eyebrow m={mobile}>Welcome to LabsCubed</Eyebrow>
            <div style={{ fontSize: mobile ? 34 : 54, fontWeight: 800, letterSpacing: '-0.05em', lineHeight: 1, color: INK }}>What brings you to the booth?</div>
          </div>
          <div style={mobile ? { flex: 'none', padding: `0 ${padX}px calc(24px + env(safe-area-inset-bottom, 0px))`, display: 'flex', flexDirection: 'column', gap: 16 } : { flex: 1, minHeight: 0, padding: `0 ${padX}px 36px`, display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            {card(K('step-load-hand.webp'), 'Free lab assessment · 2 minutes', 'See what automation could save your lab.', 'Your testing costs, bottlenecks and automation ROI, sent to you by email.', slabBtn('Start the assessment', TEAL, '#000', () => goTo('cover', 'assess')), () => goTo('cover', 'assess'))}
            {card(K('hero-plastic.webp'), 'CubeTen and CubeOne', 'Explore our machines.', 'Brochures and white papers for plastics and rubber testing, sent to your inbox.', slabBtn('Get the materials', '#fff', TEAL_D, () => goTo('learn', 'learn')), () => goTo('learn', 'learn'))}
          </div>
        </div>
        {pending > 0 && <div style={{ position: 'absolute', right: 14, bottom: 6, fontSize: mobile ? 11 : 18, color: MUTED, pointerEvents: 'none' }}>{pending} saved on this {mobile ? 'phone' : 'iPad'} · will send when online</div>}
      </div>
    );
  }

  /* Question, contact and thank-you screens share the dark top band. */
  const isThanks = screen === 'thanks';
  const segs = Array.from({ length: 7 }, (_, i) => (isThanks || i < step - 1 ? P.segDone : i === step - 1 ? P.segCur : P.segOff));
  const mats = MATERIALS.filter((m) => (ans.learn || []).includes(m.id));
  const thanksList = learnPath ? (mats.length ? mats.map((m) => m.label) : ['Your selected materials']) : THANKS_ASSESS;
  const nextLabel = isContact ? (learnPath ? 'Send my materials' : 'Send my assessment') : screen === 'learn' ? 'Send me these' : screen === 'standards' && sel.length === 0 ? "Skip, I'm not sure" : 'Next';

  const header = q ? { eb: q.learn ? q.eb : `Question ${q.step} · ${q.eb}`, title: q.title, hint: q.hint }
    : { eb: 'Last step · Your details', title: learnPath ? 'Where should we send your materials?' : 'Where should we send your assessment?', hint: 'Phone is optional. Everything else is required.' };

  const fields = [
    { k: 'name', label: 'Full name', type: 'text', ph: 'First and last name', mode: undefined as any, cap: 'words' },
    { k: 'email', label: 'Email', type: 'email', ph: 'name@company.com', mode: 'email', cap: 'off' },
    { k: 'web', label: 'Website', type: 'url', ph: 'yourcompany.com', mode: 'url', cap: 'off' },
    { k: 'phone', label: 'Phone (optional)', type: 'tel', ph: '+1 555 000 0000', mode: 'tel', cap: 'off' },
  ] as const;

  return (
    <div className="la" style={rootStyle}>
      <style>{CSS}</style>
      {/* top band */}
      <div style={{ height: topH, flex: 'none', padding: `0 ${padX}px`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: BAND }}>
        <img src={LOGO} alt="LabsCubed" style={{ height: mobile ? 20 : 24 }} />
        {noProg && <div style={{ fontSize: mobile ? 13 : 18, fontWeight: 600, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,.6)' }}>CubeTen · CubeOne</div>}
        {!noProg && (
          <div style={{ display: 'flex', alignItems: 'center', gap: mobile ? 12 : 18 }}>
            <div style={{ display: 'flex', gap: 4 }}>{segs.map((bg, i) => <div key={i} style={{ width: segW, height: mobile ? 6 : 8, borderRadius: 2, background: bg }} />)}</div>
            <div style={{ fontSize: mobile ? 14 : 18, fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: '#fff', minWidth: mobile ? 32 : 44, textAlign: 'right' }}>{step} / 7</div>
          </div>
        )}
      </div>

      {/* header: full, or collapsed while the keyboard is up */}
      {!isThanks && !kb.open && (
        <div style={{ flex: 'none', padding: mobile ? `12px ${padX}px 14px` : `16px ${padX}px 18px`, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Eyebrow m={mobile}>{header.eb}</Eyebrow>
          <div style={{ fontSize: titleSize, fontWeight: 800, letterSpacing: '-0.045em', lineHeight: 1.02, color: INK, textWrap: 'balance' as any }}>{header.title}</div>
          <div style={{ fontSize: mobile ? 16 : 20, fontWeight: 500, color: MUTED }}>{header.hint}</div>
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
        <div className="la-scroll" style={{ flex: 1, minHeight: 0, position: 'relative', padding: `0 ${padX}px`, display: 'flex', flexWrap: 'wrap', alignContent: kb.open || mobile ? 'flex-start' : 'space-evenly', gap: `${kb.open ? 14 : rowGap}px ${mobile ? 12 : 14}px`, overflowY: 'auto', paddingBottom: mobile ? 12 : 0 }}>
          {opts.map((o) => (
            <Tile key={screen + o.id} o={o} on={sel.includes(o.id)} mediaW={mediaW} tileH={tileH} basis={basis}
              otherValue={other[key] || ''} onOther={(v) => setOther((p) => ({ ...p, [key]: v }))} onTap={() => tap(o)} m={mobile} />
          ))}
          {kb.open && <div style={{ position: 'sticky', left: 0, right: 0, top: 0, height: 56, marginTop: -56, width: '100%', background: `linear-gradient(${CANVAS}, rgba(242,242,244,0))`, pointerEvents: 'none', order: -1 }} />}
        </div>
      )}

      {/* contact */}
      {isContact && (
        <div className="la-scroll" style={{ flex: 1, minHeight: 0, padding: `0 ${padX}px`, display: 'flex', flexWrap: 'wrap', alignContent: 'flex-start', gap: mobile ? 12 : 14, paddingBottom: mobile ? 12 : 0 }}>
          {fields.map((f) => {
            const msg = showErr ? E[f.k] : '';
            const err = !!msg;
            return (
              <div key={f.k} style={{ flex: mobile ? '1 1 100%' : '1 1 440px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ height: mobile ? 68 : 88, borderRadius: mobile ? 14 : 18, background: err ? P.fieldErr : P.field, boxShadow: err ? P.errRing : P.fieldRing, padding: mobile ? '9px 16px 0' : '12px 22px 0', display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: mobile ? 13 : 18, fontWeight: 800, color: err ? P.labelErr : P.label }}>{f.label}</span>
                  <input value={contact[f.k]} placeholder={f.ph} type={f.type} inputMode={f.mode} autoComplete="off" autoCorrect="off" autoCapitalize={f.cap} spellCheck={false}
                    onChange={(e) => setContact((c) => ({ ...c, [f.k]: e.target.value }))}
                    onFocus={(e) => { const t = e.currentTarget; setTimeout(() => t.scrollIntoView({ block: 'center', behavior: 'smooth' }), 320); }}
                    style={{ border: 'none', outline: 'none', background: 'transparent', padding: 0, font: mobile ? '500 18px Inter, sans-serif' : '500 24px Inter, sans-serif', color: INK, width: '100%' }} />
                </label>
                {err && <span style={{ fontSize: mobile ? 14 : 18, fontWeight: 600, color: P.labelErr, paddingLeft: mobile ? 16 : 22 }}>{msg}</span>}
              </div>
            );
          })}
          <label style={{ flex: '1 1 100%', height: mobile ? 68 : 88, borderRadius: mobile ? 14 : 18, background: '#fff', padding: mobile ? '9px 16px 0' : '12px 22px 0', display: 'flex', flexDirection: 'column', gap: 2, position: 'relative' }}>
            <span style={{ fontSize: mobile ? 13 : 18, fontWeight: 800, color: MUTED }}>Country</span>
            <select value={contact.country} onChange={(e) => setContact((c) => ({ ...c, country: e.target.value }))}
              style={{ appearance: 'none', WebkitAppearance: 'none', border: 'none', outline: 'none', background: 'transparent', padding: 0, font: mobile ? '500 18px Inter, sans-serif' : '500 24px Inter, sans-serif', color: INK, width: '100%' }}>
              {COUNTRY_LIST.map((c) => <option key={c.c} value={c.c}>{c.n}</option>)}
            </select>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth="2.4" strokeLinecap="round" style={{ position: 'absolute', right: mobile ? 16 : 24, top: mobile ? 26 : 33, pointerEvents: 'none' }}><path d="M6 9l6 6 6-6" /></svg>
          </label>
          <div style={{ flex: '1 1 100%', fontSize: mobile ? 14 : 18, fontWeight: 500, color: MUTED, lineHeight: 1.4 }}>
            {learnPath ? "We'll email the materials you picked to this address." : "We'll email your personalized assessment to this address."}
          </div>
        </div>
      )}

      {/* thank you: photo panel and a white panel (landscape side by side, portrait and phone stacked) */}
      {isThanks && (
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: port || mobile ? 'column' : 'row' }}>
          <div style={{ flex: mobile ? '0 0 200px' : port ? '0 0 400px' : '0 0 46%', position: 'relative', overflow: 'hidden', background: BAND }}>
            <img src={K('step4-cubeten-start.webp')} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: '60% 50%' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, rgba(5,10,11,.88) 0%, rgba(5,10,11,.2) 55%, rgba(5,10,11,0) 100%)' }} />
            <div style={{ position: 'absolute', left: mobile ? 20 : 40, right: mobile ? 20 : 40, bottom: mobile ? 20 : 36, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: mobile ? 13 : 18, fontWeight: 800, letterSpacing: '.2em', textTransform: 'uppercase', color: TEAL }}>Assessment requested</div>
              <div style={{ fontSize: mobile ? 48 : narrow && !port ? 66 : 80, fontWeight: 800, letterSpacing: '-0.05em', lineHeight: 0.95, color: '#fff' }}>Thank you.</div>
            </div>
          </div>
          <div className="la-scroll" style={{ flex: 1, minWidth: 0, minHeight: 0, padding: mobile ? `20px ${padX}px 24px` : `44px ${padX}px 48px`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: mobile ? 20 : 28, background: '#fff' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: mobile ? 14 : 18 }}>
              <div style={{ fontSize: mobile ? 18 : 24, fontWeight: 500, lineHeight: 1.4, color: INK, textWrap: 'pretty' as any }}>
                {learnPath ? "We'll email the materials you selected to you shortly:" : "We'll be in touch via email with your personalized assessment, including:"}
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div role="button" onClick={reset} style={{ height: mobile ? 68 : 104, padding: mobile ? '0 8px 0 24px' : '0 14px 0 36px', borderRadius: mobile ? 20 : 24, background: INK, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, cursor: 'pointer' }}>
                <span style={{ fontSize: mobile ? 18 : 24, fontWeight: 800 }}>Start a new assessment</span>
                <span style={{ position: 'relative', width: mobile ? 52 : 76, height: mobile ? 52 : 76, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width={mobile ? 52 : 76} height={mobile ? 52 : 76} viewBox="0 0 76 76" style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}>
                    <circle cx="38" cy="38" r="32" fill="none" stroke="rgba(255,255,255,.16)" strokeWidth="6" />
                    <circle cx="38" cy="38" r="32" fill="none" stroke={TEAL} strokeWidth="6" strokeDasharray="201.06" strokeDashoffset={201.06 * (1 - Math.max(count, 0) / THANKS_SECONDS)} style={{ transition: 'stroke-dashoffset 1s linear' }} />
                  </svg>
                  <span style={{ fontSize: mobile ? 18 : 26, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{Math.max(count, 0)}</span>
                </span>
              </div>
              <div style={{ fontSize: mobile ? 14 : 18, fontWeight: 500, color: MUTED }}>{mobile ? 'Thanks for stopping by.' : 'The screen resets for the next visitor.'}</div>
            </div>
          </div>
        </div>
      )}

      {/* footer: Back left and Next right on the iPad; stacked on a phone, Next on top */}
      {!isThanks && (
        <div style={mobile
          ? { flex: 'none', padding: `10px ${padX}px calc(12px + env(safe-area-inset-bottom, 0px))`, display: 'flex', flexDirection: 'column-reverse', gap: 10, background: `linear-gradient(rgba(242,242,244,0), ${CANVAS} 30%)` }
          : { height: 120, flex: 'none', padding: `12px ${padX}px`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
          <div role="button" onClick={back} style={{ cursor: 'pointer', height: mobile ? 52 : 96, width: mobile ? '100%' : 200, borderRadius: mobile ? 16 : 24, boxShadow: `inset 0 0 0 ${mobile ? 2 : 2.5}px ${INK}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontSize: mobile ? 17 : 22, fontWeight: 800, color: INK }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>Back
          </div>
          <div role="button" aria-disabled={!nextOn || sending} onClick={next}
            style={{ cursor: 'pointer', height: mobile ? 60 : 96, flex: mobile ? 'none' : 1, width: mobile ? '100%' : undefined, maxWidth: mobile ? undefined : 460, padding: mobile ? '0 24px' : '0 36px', borderRadius: mobile ? 16 : 24, background: nextOn ? P.nextBg : P.offBg, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, transition: 'background .2s' }}>
            <span style={{ fontSize: mobile ? 18 : 22, fontWeight: 800, color: nextOn ? P.nextFg : P.offFg }}>{sending ? 'Sending…' : nextLabel}</span>
            <ArrowR c={nextOn ? P.nextArrow : P.offArrow} s={mobile ? 24 : 30} />
          </div>
        </div>
      )}
      {pending > 0 && !kb.open && <div style={mobile ? { position: 'absolute', left: 0, right: 0, bottom: 1, textAlign: 'center', fontSize: 11, color: MUTED, pointerEvents: 'none' } : { position: 'absolute', left: '50%', top: 24, transform: 'translateX(-50%)', fontSize: 18, color: 'rgba(255,255,255,.6)', pointerEvents: 'none' }}>{pending} saved · will send when online</div>}
    </div>
  );
}
