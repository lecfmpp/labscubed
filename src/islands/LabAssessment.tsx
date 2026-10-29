/* LabAssessment — the iPad kiosk at the AMI booth (client:only).
 *
 * Built from the "Kiosk 1b, dark cinematic" design handoff (Kiosk directions
 * design review). Landscape 1180x820 (holds at 1024x768) and portrait 820x1180,
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
const P = {
  tileBg: 'rgba(255,255,255,.045)', tileOn: 'rgba(23,221,197,.12)',
  ring: 'inset 0 0 0 1px rgba(255,255,255,.1)', ringOnIn: 'inset 0 0 0 2px #17ddc5',
  glowOn: '0 0 0 6px rgba(23,221,197,.12), 0 16px 48px rgba(23,221,197,.28)',
  fg: 'rgba(255,255,255,.88)', fgOn: '#ffffff', mark: 'rgba(255,255,255,.85)', markOn: TEAL,
  segDone: 'rgba(23,221,197,.55)', segCur: TEAL, segOff: 'rgba(255,255,255,.12)',
  offBg: 'rgba(255,255,255,.07)', offFg: 'rgba(255,255,255,.38)',
  field: 'rgba(255,255,255,.06)', fieldErr: 'rgba(255,107,94,.08)', fieldRing: 'inset 0 0 0 1px rgba(255,255,255,.1)',
  errRing: 'inset 0 0 0 2px #ff6b5e', label: 'rgba(255,255,255,.6)', labelErr: '#ff8f85',
};
const CANVAS = 'radial-gradient(900px 520px at 88% -8%, rgba(23,221,197,.16), rgba(23,221,197,0) 70%), linear-gradient(180deg, #0b1213 0%, #0d1a1a 60%, #11302c 140%)';

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
  { id: 'whitepaper', label: 'White paper: Beyond the Bottleneck', sub: 'The data-backed business case for automating tensile testing', img: K('stats-bg.webp') },
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
.la{position:fixed;left:0;right:0;display:flex;flex-direction:column;overflow:hidden;background:${CANVAS};font-family:Inter,system-ui,-apple-system,sans-serif;color:#fff;-webkit-font-smoothing:antialiased;touch-action:manipulation;-webkit-tap-highlight-color:transparent;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;overscroll-behavior:none}
.la *{box-sizing:border-box}
.la input,.la select{-webkit-user-select:text;user-select:text}
.la input::placeholder{color:rgba(255,255,255,.4)}
.la select option{color:#000}
.la-scroll{overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain}
@keyframes kPulseB{0%{transform:scale(1);opacity:.75}100%{transform:scale(1.35);opacity:0}}
`;
const Arrow = ({ c = '#000' }: { c?: string }) => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7M9 7h8v8" /></svg>
);
const Pill = ({ children }: { children: React.ReactNode }) => (
  <div style={{ height: 44, padding: '0 18px', borderRadius: 999, boxShadow: 'inset 0 0 0 1px rgba(23,221,197,.5)', display: 'flex', alignItems: 'center', fontSize: 18, fontWeight: 600, letterSpacing: '.12em', color: TEAL }}>{children}</div>
);

function Tile({ o, on, mediaW, tileH, basis, otherValue, onOther, onTap }: {
  o: Opt; on: boolean; mediaW: number; tileH: number; basis: number; otherValue: string; onOther: (v: string) => void; onTap: () => void;
}) {
  const inp = on && !!o.other;
  const ml = (o.mark || '').length;
  const markFs = Math.round(42 * (ml <= 2 ? 1 : ml === 3 ? 0.8 : 0.6));
  const zoom = on ? 'scale(1.08)' : 'scale(1)';
  const ref = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    if (inp && ref.current) {
      ref.current.focus();
      setTimeout(() => ref.current?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 320);
    }
  }, [inp]);
  return (
    <div role="button" aria-pressed={on} onClick={onTap}
      style={{ flex: `1 1 ${basis}px`, height: tileH, display: 'flex', borderRadius: 22, overflow: 'hidden', cursor: 'pointer', position: 'relative', background: on ? P.tileOn : P.tileBg, boxShadow: on ? P.glowOn : 'none', transition: 'box-shadow .25s ease, background .25s ease' }}>
      <div style={{ width: mediaW, flex: 'none', position: 'relative', overflow: 'hidden', background: '#11302c' }}>
        {o.img && <img src={o.img} alt="" draggable={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transform: zoom, filter: on ? 'none' : 'brightness(.78) saturate(.85)', transition: 'transform .45s ease, filter .3s ease' }} />}
        {o.mark && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: markFs, fontWeight: 800, letterSpacing: '-0.04em', color: on ? P.markOn : P.mark, transform: zoom, transition: 'transform .45s ease' }}>{o.mark}</div>}
        {o.sample && (
          <div style={{ position: 'absolute', inset: 0, background: '#f5f5f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '76%', transform: zoom, transition: 'transform .45s ease' }}>
              <Sample standard={o.sample} color={on ? '#0d9488' : '#1d1d1f'} />
            </div>
          </div>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', padding: '0 26px' }}>
        {!inp && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 23, fontWeight: 500, lineHeight: 1.2, color: on ? P.fgOn : P.fg, textWrap: 'pretty' as any }}>{o.label}</span>
            {o.sub && <span style={{ fontSize: 18, fontWeight: 500, color: 'rgba(255,255,255,.6)' }}>{o.sub}</span>}
          </div>
        )}
        {inp && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 18, fontWeight: 600, color: TEAL }}>Other, please specify</span>
            <input ref={ref} value={otherValue} placeholder="Type your answer" autoComplete="off" autoCapitalize="sentences" enterKeyHint="done"
              onClick={(e) => e.stopPropagation()} onChange={(e) => onOther(e.target.value)}
              style={{ height: 48, border: 'none', outline: 'none', borderRadius: 12, background: 'rgba(0,0,0,.35)', boxShadow: 'inset 0 0 0 1.5px rgba(23,221,197,.6)', padding: '0 14px', font: '500 21px Inter, sans-serif', color: '#fff', width: '100%' }} />
          </div>
        )}
      </div>
      {/* The selected ring sits on an overlay so it draws above the media panel. */}
      <div style={{ position: 'absolute', inset: 0, borderRadius: 22, boxShadow: on ? P.ringOnIn : P.ring, pointerEvents: 'none', zIndex: 2, transition: 'box-shadow .2s ease' }} />
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
  const kb = useKeyboard();

  /* Kiosk hygiene: no pinch-zoom, no pull-to-refresh. */
  React.useEffect(() => {
    const meta = document.querySelector('meta[name="viewport"]');
    const prev = meta?.getAttribute('content') || '';
    meta?.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover');
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
    const bump = () => { clearTimeout(idleRef.current); idleRef.current = window.setTimeout(() => { if (!sending) reset(); }, IDLE_MS); };
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
  const padX = port ? 48 : 56;
  const segW = port ? 28 : 36;
  const tileH = port ? 96 : 105;
  /* The 10px row gap is part of the 1180x820 design; at 1024x768 four rows of 105px
     tiles (the machines list) only fit if the rows are spaced by space-evenly alone,
     the way the portrait layout already does. */
  const rowGap = port || window.innerHeight < 800 ? 0 : 10;
  const opts = optsFor();
  const three = !port && opts.length > 4 && opts.length <= 6;
  const basis = three ? 300 : 440;
  const mediaW = port ? 128 : three ? 120 : 150;
  const titleLong = !!q && q.title.length > 44;
  /* 48px question titles are drawn for the 1180px-wide landscape iPad. On the 1024px
     one (the README says the layout must hold there too) a 43-character title wraps
     to two lines and pushes the last row of tiles off the screen, so it steps down
     to the 38px the README already uses for long titles. */
  const narrow = !port && window.innerWidth < 1100;
  const titleSize = port ? 42 : titleLong || narrow ? 38 : 48;
  const rootStyle: React.CSSProperties = { top: kb.h ? kb.top : 0, height: kb.h ? kb.h : '100dvh' };
  const step = q ? q.step : 7;
  const noProg = screen === 'learn' || (learnPath && (isContact || screen === 'thanks'));

  /* ---------- screens ---------- */
  if (screen === 'cover') {
    return (
      <div className="la" style={rootStyle}>
        <style>{CSS}</style>
        <div style={{ position: 'absolute', inset: 0, background: '#0b1213' }}>
          <img src={COVER} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 40%' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(11,18,19,.7) 0%, rgba(11,18,19,.82) 45%, rgba(11,18,19,.96) 100%)' }} />
          <div style={{ position: 'absolute', left: '50%', top: '50%', width: 900, height: 900, transform: 'translate(-50%,-50%)', background: 'radial-gradient(closest-side, rgba(23,221,197,.28), rgba(23,221,197,0))' }} />
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 96, padding: '0 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <img src={LOGO} alt="LabsCubed" style={{ height: 30 }} />
            <div style={{ display: 'flex', gap: 10 }}><Pill>NOV 11-12</Pill><Pill>BOOTH C819</Pill></div>
          </div>
          <div style={{ position: 'absolute', left: 64, right: 64, bottom: 'calc(50% + 110px)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 16 }}>
            <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '.24em', textTransform: 'uppercase', color: 'rgba(255,255,255,.7)' }}>Free lab assessment</div>
            <div style={{ fontSize: 64, fontWeight: 300, letterSpacing: '-0.045em', lineHeight: 1.04, color: '#fff', maxWidth: 920, textWrap: 'balance' as any }}>See what automation could <span style={{ fontWeight: 800, color: TEAL }}>save your lab.</span></div>
          </div>
          <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: 168, height: 168 }}>
            <span style={{ position: 'absolute', inset: 0, background: 'rgba(23,221,197,.45)', borderRadius: 999, animation: 'kPulseB 2.2s ease-out infinite', pointerEvents: 'none' }} />
            <div role="button" onClick={() => go(1)} style={{ cursor: 'pointer', position: 'absolute', inset: 0, borderRadius: 999, background: TEAL, boxShadow: '0 0 0 10px rgba(23,221,197,.14), 0 0 80px rgba(23,221,197,.6)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: '.12em', color: '#000', textAlign: 'center' }}>GET<br />STARTED</span>
            </div>
          </div>
          <div style={{ position: 'absolute', left: 64, right: 64, top: 'calc(50% + 120px)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 14 }}>
            <div style={{ fontSize: 20, fontWeight: 300, lineHeight: 1.45, color: 'rgba(255,255,255,.85)', maxWidth: 680, textWrap: 'pretty' as any }}>Your testing costs and technician time, workflow bottlenecks, and estimated automation ROI and payback.</div>
            <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '.14em', textTransform: 'uppercase', color: TEAL }}>Takes about 2 minutes</div>
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'choose') {
    const bigBtn = (label: string, bg: string, node: string, onClick: () => void) => (
      <div role="button" onClick={(e) => { e.stopPropagation(); onClick(); }} style={{ cursor: 'pointer', height: 96, padding: '0 12px 0 32px', borderRadius: 999, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
        <span style={{ fontSize: 22, fontWeight: 600, color: '#000' }}>{label}</span>
        <span style={{ width: 72, height: 72, borderRadius: 999, background: node, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Arrow c={TEAL} /></span>
      </div>
    );
    return (
      <div className="la" style={rootStyle}>
        <style>{CSS}</style>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', padding: `0 ${padX}px 40px` }}>
          <div style={{ height: 96, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <img src={LOGO} alt="LabsCubed" style={{ height: 28 }} />
            <div style={{ display: 'flex', gap: 10 }}><Pill>NOV 11-12</Pill><Pill>BOOTH C819</Pill></div>
          </div>
          <div style={{ flex: 'none', padding: '4px 0 26px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,.7)' }}>Welcome to LabsCubed</div>
            <div style={{ fontSize: 54, fontWeight: 300, letterSpacing: '-0.045em', lineHeight: 1.04, color: '#fff' }}>What brings you to <span style={{ fontWeight: 800, color: TEAL }}>the booth?</span></div>
          </div>
          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexWrap: 'wrap', gap: 20 }}>
            <div role="button" onClick={() => goTo('cover', 'assess')} style={{ flex: '1 1 440px', minHeight: 0, borderRadius: 22, overflow: 'hidden', display: 'flex', flexDirection: 'column', cursor: 'pointer', background: 'rgba(23,221,197,.08)', boxShadow: 'inset 0 0 0 2px #17ddc5, 0 0 0 6px rgba(23,221,197,.1), 0 20px 60px rgba(23,221,197,.25)' }}>
              <div style={{ flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden' }}><img src={K('step-load-hand.webp')} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} /></div>
              <div style={{ flex: 'none', padding: '22px 26px 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '.14em', textTransform: 'uppercase', color: TEAL }}>Free lab assessment · 2 minutes</div>
                <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, color: '#fff', textWrap: 'balance' as any }}>See what automation could save your lab.</div>
                <div style={{ fontSize: 18, fontWeight: 300, lineHeight: 1.4, color: 'rgba(255,255,255,.8)', textWrap: 'pretty' as any, marginBottom: 10 }}>Your testing costs, bottlenecks and automation ROI, sent to you by email.</div>
                {bigBtn('Start the assessment', TEAL, '#000', () => goTo('cover', 'assess'))}
              </div>
            </div>
            <div role="button" onClick={() => goTo('learn', 'learn')} style={{ flex: '1 1 440px', minHeight: 0, borderRadius: 22, overflow: 'hidden', display: 'flex', flexDirection: 'column', cursor: 'pointer', background: 'rgba(255,255,255,.045)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.12)' }}>
              <div style={{ flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden' }}><img src={K('hero-plastic.webp')} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(.8) saturate(.85)' }} /></div>
              <div style={{ flex: 'none', padding: '22px 26px 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,.7)' }}>CubeTen and CubeOne</div>
                <div style={{ fontSize: 30, fontWeight: 300, letterSpacing: '-0.03em', lineHeight: 1.1, color: '#fff', textWrap: 'balance' as any }}>Explore our machines.</div>
                <div style={{ fontSize: 18, fontWeight: 300, lineHeight: 1.4, color: 'rgba(255,255,255,.75)', textWrap: 'pretty' as any, marginBottom: 10 }}>Brochures and white papers for plastics and rubber testing, sent to your inbox.</div>
                {bigBtn('Get the materials', '#fff', '#0b1213', () => goTo('learn', 'learn'))}
              </div>
            </div>
          </div>
        </div>
        {pending > 0 && <div style={{ position: 'absolute', right: 14, bottom: 10, fontSize: 18, color: 'rgba(255,255,255,.5)' }}>{pending} saved on this iPad · will send when online</div>}
      </div>
    );
  }

  /* Question, contact and thank-you screens share the top bar. */
  const isThanks = screen === 'thanks';
  const segs = Array.from({ length: 7 }, (_, i) => ({
    bg: isThanks || i < step - 1 ? P.segDone : i === step - 1 ? P.segCur : P.segOff,
    glow: !isThanks && i === step - 1 ? '0 0 12px rgba(23,221,197,.8)' : 'none',
  }));
  const mats = MATERIALS.filter((m) => (ans.learn || []).includes(m.id));
  const thanksList = learnPath ? (mats.length ? mats.map((m) => m.label) : ['Your selected materials']) : THANKS_ASSESS;
  const nextLabel = isContact ? (learnPath ? 'Send my materials' : 'Send my assessment') : screen === 'learn' ? 'Send me these' : screen === 'standards' && sel.length === 0 ? "Skip, I'm not sure" : 'Next';
  const nextNodeBg = nextOn ? TEAL : P.offBg;

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
      {/* top bar */}
      <div style={{ height: 72, flex: 'none', padding: `0 ${padX}px`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <img src={LOGO} alt="LabsCubed" style={{ height: 24 }} />
        {noProg && <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,.55)' }}>CubeTen · CubeOne</div>}
        {!noProg && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <div style={{ display: 'flex', gap: 6 }}>{segs.map((s, i) => <div key={i} style={{ width: segW, height: 6, borderRadius: 3, background: s.bg, boxShadow: s.glow }} />)}</div>
            <div style={{ fontSize: 18, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: '#fff', minWidth: 44, textAlign: 'right' }}>{step} / 7</div>
          </div>
        )}
      </div>

      {/* header: full, or collapsed while the keyboard is up */}
      {!isThanks && !kb.open && (
        <div style={{ flex: 'none', padding: `8px ${padX}px 22px`, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '.16em', textTransform: 'uppercase', color: TEAL }}>{header.eb}</div>
          <div style={{ fontSize: titleSize, fontWeight: 300, letterSpacing: '-0.04em', lineHeight: 1.06, color: '#fff', textWrap: 'balance' as any }}>{header.title}</div>
          <div style={{ fontSize: 20, fontWeight: 500, color: 'rgba(255,255,255,.6)' }}>{header.hint}</div>
        </div>
      )}
      {!isThanks && kb.open && (
        <div style={{ flex: 'none', padding: `4px ${padX}px 14px`, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '.16em', textTransform: 'uppercase', color: TEAL }}>{header.eb}</div>
          <div style={{ fontSize: 28, fontWeight: 300, letterSpacing: '-0.03em', color: '#fff' }}>{header.title}</div>
        </div>
      )}

      {/* tiles */}
      {q && (
        <div className="la-scroll" style={{ flex: 1, minHeight: 0, position: 'relative', padding: `0 ${padX}px`, display: 'flex', flexWrap: 'wrap', alignContent: kb.open ? 'flex-start' : 'space-evenly', gap: `${kb.open ? 16 : rowGap}px 16px`, overflowY: 'auto' }}>
          {opts.map((o) => (
            <Tile key={screen + o.id} o={o} on={sel.includes(o.id)} mediaW={mediaW} tileH={tileH} basis={basis}
              otherValue={other[key] || ''} onOther={(v) => setOther((p) => ({ ...p, [key]: v }))} onTap={() => tap(o)} />
          ))}
          {kb.open && <div style={{ position: 'sticky', left: 0, right: 0, top: 0, height: 56, marginTop: -56, width: '100%', background: 'linear-gradient(#0c1617, rgba(12,22,23,0))', pointerEvents: 'none', order: -1 }} />}
        </div>
      )}

      {/* contact */}
      {isContact && (
        <div className="la-scroll" style={{ flex: 1, minHeight: 0, padding: `0 ${padX}px`, display: 'flex', flexWrap: 'wrap', alignContent: 'flex-start', gap: '14px 16px' }}>
          {fields.map((f) => {
            const msg = showErr ? E[f.k] : '';
            const err = !!msg;
            return (
              <div key={f.k} style={{ flex: '1 1 440px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ height: 88, borderRadius: 18, background: err ? P.fieldErr : P.field, boxShadow: err ? P.errRing : P.fieldRing, padding: '12px 22px 0', display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 18, fontWeight: 600, color: err ? P.labelErr : P.label }}>{f.label}</span>
                  <input value={contact[f.k]} placeholder={f.ph} type={f.type} inputMode={f.mode} autoComplete="off" autoCorrect="off" autoCapitalize={f.cap} spellCheck={false}
                    onChange={(e) => setContact((c) => ({ ...c, [f.k]: e.target.value }))}
                    onFocus={(e) => { const t = e.currentTarget; setTimeout(() => t.scrollIntoView({ block: 'center', behavior: 'smooth' }), 320); }}
                    style={{ border: 'none', outline: 'none', background: 'transparent', padding: 0, font: '500 24px Inter, sans-serif', color: '#fff', width: '100%' }} />
                </label>
                {err && <span style={{ fontSize: 18, fontWeight: 500, color: P.labelErr, paddingLeft: 22 }}>{msg}</span>}
              </div>
            );
          })}
          <label style={{ flex: '1 1 100%', height: 88, borderRadius: 18, background: P.field, boxShadow: P.fieldRing, padding: '12px 22px 0', display: 'flex', flexDirection: 'column', gap: 2, position: 'relative' }}>
            <span style={{ fontSize: 18, fontWeight: 600, color: P.label }}>Country</span>
            <select value={contact.country} onChange={(e) => setContact((c) => ({ ...c, country: e.target.value }))}
              style={{ appearance: 'none', WebkitAppearance: 'none', border: 'none', outline: 'none', background: 'transparent', padding: 0, font: '500 24px Inter, sans-serif', color: '#fff', width: '100%' }}>
              {COUNTRY_LIST.map((c) => <option key={c.c} value={c.c}>{c.n}</option>)}
            </select>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={TEAL} strokeWidth="2.4" strokeLinecap="round" style={{ position: 'absolute', right: 24, top: 33, pointerEvents: 'none' }}><path d="M6 9l6 6 6-6" /></svg>
          </label>
          <div style={{ flex: '1 1 100%', fontSize: 18, fontWeight: 500, color: 'rgba(255,255,255,.6)', lineHeight: 1.4 }}>
            {learnPath ? "We'll email the materials you picked to this address." : "We'll email your personalized assessment to this address."}
          </div>
        </div>
      )}

      {/* thank you */}
      {isThanks && (
        <div style={{ flex: 1, minHeight: 0, position: 'relative', padding: `8px ${padX}px 56px`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', textAlign: 'center', gap: 32 }}>
          <div style={{ position: 'absolute', left: '50%', top: '30%', width: 760, height: 760, transform: 'translate(-50%,-50%)', background: 'radial-gradient(closest-side, rgba(23,221,197,.18), rgba(23,221,197,0))', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
            <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '.2em', textTransform: 'uppercase', color: TEAL }}>Assessment requested</div>
            <div style={{ fontSize: 84, fontWeight: 800, letterSpacing: '-0.05em', lineHeight: 1, color: '#fff' }}>Thank you.</div>
            <div style={{ fontSize: 22, fontWeight: 300, lineHeight: 1.45, color: 'rgba(255,255,255,.82)', maxWidth: 620, textWrap: 'pretty' as any }}>
              {learnPath ? "We'll email the materials you selected to you shortly:" : "We'll be in touch via email with your personalized assessment, including:"}
            </div>
          </div>
          <div style={{ position: 'relative', width: '100%', display: 'flex', flexWrap: 'wrap', gap: 14 }}>
            {thanksList.map((label) => (
              <div key={label} style={{ flex: '1 1 440px', height: 96, borderRadius: 22, background: 'rgba(255,255,255,.05)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', gap: 20, padding: '0 26px', textAlign: 'left' }}>
                <span style={{ width: 12, height: 12, borderRadius: 99, background: TEAL, boxShadow: `0 0 14px ${TEAL}`, flex: 'none' }} />
                <span style={{ fontSize: 23, fontWeight: 500, color: '#fff' }}>{label}</span>
              </div>
            ))}
          </div>
          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <div role="button" onClick={reset} style={{ height: 104, padding: '0 14px 0 40px', borderRadius: 999, background: '#fff', color: '#000', display: 'flex', alignItems: 'center', gap: 28, cursor: 'pointer' }}>
              <span style={{ fontSize: 24, fontWeight: 600 }}>Start a new assessment</span>
              <span style={{ position: 'relative', width: 76, height: 76, borderRadius: 999, background: '#0b1213', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="76" height="76" viewBox="0 0 76 76" style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}>
                  <circle cx="38" cy="38" r="32" fill="none" stroke="rgba(255,255,255,.14)" strokeWidth="5" />
                  <circle cx="38" cy="38" r="32" fill="none" stroke={TEAL} strokeWidth="5" strokeLinecap="round" strokeDasharray="201.06" strokeDashoffset={201.06 * (1 - Math.max(count, 0) / THANKS_SECONDS)} style={{ transition: 'stroke-dashoffset 1s linear' }} />
                </svg>
                <span style={{ fontSize: 24, fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: '#fff' }}>{Math.max(count, 0)}</span>
              </span>
            </div>
            <div style={{ fontSize: 18, fontWeight: 500, color: 'rgba(255,255,255,.55)' }}>The screen resets for the next visitor.</div>
          </div>
        </div>
      )}

      {/* footer */}
      {!isThanks && (
        <div style={{ height: 120, flex: 'none', padding: `8px ${padX}px 16px`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div role="button" onClick={back} style={{ cursor: 'pointer', height: 96, width: 210, borderRadius: 999, boxShadow: 'inset 0 0 0 2px rgba(255,255,255,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontSize: 22, fontWeight: 600, color: '#fff' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>Back
          </div>
          <div role="button" aria-disabled={!nextOn || sending} onClick={next}
            style={{ cursor: 'pointer', height: 96, minWidth: 300, padding: '0 12px 0 40px', borderRadius: 999, background: nextOn ? '#fff' : P.offBg, boxShadow: nextOn ? '0 10px 40px rgba(255,255,255,.12)' : 'inset 0 0 0 1px rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, transition: 'background .2s' }}>
            <span style={{ fontSize: 22, fontWeight: 600, color: nextOn ? '#000' : P.offFg }}>{sending ? 'Sending…' : nextLabel}</span>
            <span style={{ width: 72, height: 72, borderRadius: 999, background: nextNodeBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Arrow c={nextOn ? '#000' : P.offFg} /></span>
          </div>
        </div>
      )}
      {pending > 0 && !kb.open && <div style={{ position: 'absolute', left: '50%', top: 24, transform: 'translateX(-50%)', fontSize: 18, color: 'rgba(255,255,255,.5)', pointerEvents: 'none' }}>{pending} saved on this iPad · will send when online</div>}
    </div>
  );
}
