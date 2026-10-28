/* LabAssessment — the iPad questionnaire at the AMI booth (client:only).
 *
 * Built for a tablet held in the hand or propped on a stand, in landscape or
 * portrait, with a queue of people waiting. So it is deliberately not the
 * website's quote wizard layout: one question per screen, answers as large
 * tap cards (76px+), a fixed thumb-reach footer with Back / Next, and the
 * question and answers side by side in landscape (stacked in portrait).
 *
 * It borrows the quote page's visual language — white canvas, black gradient
 * headings, teal selection, hairline card edges — but none of its density.
 *
 * It is a shared device, so nothing is kept after a visitor finishes: the
 * answers are wiped on the thank-you screen's countdown and after a stretch of
 * inactivity. The only thing that persists is the offline queue, which holds a
 * completed submission until it has reached the server (booth wifi is bad, and
 * a lost lead cannot be recovered once the person has walked away).
 *
 * Question copy and logic come from Mo'min's "Lab Assessment Questionnaire".
 * Submits to netlify/functions/booth-assessment.mjs. */
import React from 'react';
import { COUNTRIES } from '../lib/countries';
import { track } from '../lib/track';

const ENDPOINT = '/api/booth/assessment';
const EVENT_SLUG = 'ami-nov-2026';
const QUEUE_KEY = 'lc-assessment-queue-v1';
const IDLE_MS = 150_000;
const THANKS_SECONDS = 25;

/* The quote page fades its headings from black to grey and back. Across a
   three-line question at arm's length that reads as patchy, so the kiosk keeps
   the weight and tracking but sets them solid. */
const GRAD: React.CSSProperties = { color: 'var(--lc-ink, #1d1d1f)' };

/* Every answer is a tile: a picture slot on the left and the words on the right.
   `img` is a real photo from public/assets/img/assessment, `logo` a standards
   mark on a light tile, and `tile` a short typographic mark for answers that have
   no honest photo (machine brands, volumes, "I'm not sure"). */
type Opt = { id: string; label: string; exclusive?: boolean; other?: boolean; hint?: string; img?: string; logo?: string; tile?: string };
const IMG = (n: string) => `/assets/img/assessment/${n}.webp`;

const INDUSTRY: Opt[] = [
  { id: 'plastics', label: 'Plastics', img: IMG('ind-plastics') },
  { id: 'rubber', label: 'Rubber', img: IMG('ind-rubber') },
  { id: 'both', label: 'Plastics and rubber', img: IMG('ind-both') },
  { id: 'other', label: 'Other', img: IMG('ind-other') },
];
const TESTS: Opt[] = [
  { id: 'tensile', label: 'Tensile', img: IMG('test-tensile') },
  { id: 'flexural', label: 'Flexural', img: IMG('test-flexural') },
  { id: 'compression', label: 'Compression', img: IMG('test-compression') },
  { id: 'other', label: 'Other', other: true, img: IMG('test-other') },
  { id: 'unsure', label: "I'm not sure", exclusive: true, tile: '?' },
];
const MACHINES: Opt[] = [
  { id: 'instron', label: 'Instron', tile: 'In' },
  { id: 'zwickroell', label: 'ZwickRoell', tile: 'ZR' },
  { id: 'mts', label: 'MTS', tile: 'MTS' },
  { id: 'shimadzu', label: 'Shimadzu', tile: 'Sh' },
  { id: 'other', label: 'Other', other: true, tile: '+' },
  { id: 'unsure', label: "I'm not sure", exclusive: true, tile: '?' },
  { id: 'none', label: "We don't currently have a testing machine", exclusive: true, tile: 'No' },
];
const VOLUME: Opt[] = [
  { id: 'lt20', label: 'Under 20', tile: '<20' },
  { id: '20-50', label: '20–50', tile: '20+' },
  { id: '51-100', label: '51–100', tile: '51+' },
  { id: 'gt100', label: 'More than 100', tile: '100+' },
  { id: 'varies', label: 'It varies', tile: '~' },
  { id: 'unsure', label: "I'm not sure", tile: '?' },
];
const PRIORITY: Opt[] = [
  { id: 'technician-time', label: "Freeing up technicians' time", img: IMG('pri-time') },
  { id: 'backlog', label: 'Reducing testing backlogs', img: IMG('pri-backlog') },
  { id: 'turnaround', label: 'Improving turnaround time', img: IMG('pri-turnaround') },
  { id: 'consistency', label: 'Improving testing consistency and reproducibility', img: IMG('pri-consistency') },
  { id: 'capacity', label: 'Increasing testing capacity', img: IMG('pri-capacity') },
  { id: 'cost', label: 'Reducing testing costs', img: IMG('pri-cost') },
  { id: 'other', label: 'Other', other: true, tile: '+' },
  { id: 'unsure', label: "I'm not sure", exclusive: true, tile: '?' },
];
/* Specimens and standards. Which groups show follows the industry answer
 * (plastics → plastic only, rubber → rubber only, both/other → everything);
 * "Other" is always offered. */
const STANDARDS: (Opt & { material: 'plastic' | 'rubber' })[] = [
  { id: 'astm-d638', label: 'ASTM D638', hint: 'Plastics · Tensile', logo: 'astm', material: 'plastic' },
  { id: 'iso-527', label: 'ISO 527', hint: 'Plastics · Tensile', logo: 'iso', material: 'plastic' },
  { id: 'astm-d790', label: 'ASTM D790', hint: 'Plastics · Flexural', logo: 'astm', material: 'plastic' },
  { id: 'iso-178', label: 'ISO 178', hint: 'Plastics · Flexural', logo: 'iso', material: 'plastic' },
  { id: 'astm-d412', label: 'ASTM D412', hint: 'Rubber · Tensile', logo: 'astm', material: 'rubber' },
  { id: 'iso-37', label: 'ISO 37', hint: 'Rubber · Tensile', logo: 'iso', material: 'rubber' },
  { id: 'astm-d624', label: 'ASTM D624', hint: 'Rubber · Tear', logo: 'astm', material: 'rubber' },
];

type Answers = {
  industry: string;
  tests: string[]; testsOther: string;
  machines: string[]; machinesOther: string;
  volume: string;
  priorities: string[]; prioritiesOther: string;
  standards: string[]; standardsOther: string;
  name: string; email: string; website: string; phone: string; country: string;
};
const BLANK: Answers = {
  industry: '', tests: [], testsOther: '', machines: [], machinesOther: '', volume: '',
  priorities: [], prioritiesOther: '', standards: [], standardsOther: '',
  name: '', email: '', website: '', phone: '', country: '',
};

const QUESTIONS = ['industry', 'tests', 'machines', 'volume', 'priority', 'specimens', 'contact'] as const;
type Screen = 'welcome' | (typeof QUESTIONS)[number] | 'thanks';

const emailOk = (v: string) => /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(v.trim());
const siteOk = (v: string) => /^(https?:\/\/)?[^\s/]+\.[a-z]{2,}(\/\S*)?$/i.test(v.trim());

const COUNTRY_LIST = (() => {
  const top = ['CA', 'US'];
  const first = top.map((c) => COUNTRIES.find((x) => x.c === c)).filter(Boolean) as typeof COUNTRIES;
  return [...first, ...COUNTRIES.filter((x) => !top.includes(x.c))];
})();

/* ---------- offline queue ---------- */
function readQueue(): any[] {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]'); } catch { return []; }
}
function writeQueue(q: any[]) {
  try { localStorage.setItem(QUEUE_KEY, JSON.stringify(q)); } catch { /* private mode */ }
}
async function post(payload: any): Promise<boolean> {
  try {
    const r = await fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    return r.ok;
  } catch { return false; }
}

const CSS = `
.la{position:fixed;inset:0;display:flex;flex-direction:column;background:#fff;color:var(--lc-ink,#1d1d1f);font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;overflow:hidden;touch-action:manipulation;-webkit-tap-highlight-color:transparent;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}
.la *{box-sizing:border-box}
.la input,.la select{-webkit-user-select:text;user-select:text}
.la-top{flex:none;height:84px;display:flex;align-items:center;gap:32px;padding:0 56px}
.la-logo{height:30px;width:auto;display:block}
.la-prog{flex:1;max-width:560px;margin-left:auto;display:flex;align-items:center;gap:16px}
.la-seg{flex:1;display:flex;gap:6px}
.la-seg i{flex:1;height:6px;border-radius:3px;background:rgba(0,0,0,.09);transition:background .25s ease}
.la-seg i.on{background:var(--lc-teal,#17ddc5)}
.la-prog b{font-weight:600;font-size:14px;letter-spacing:.14em;text-transform:uppercase;color:var(--text-muted,#86868b);white-space:nowrap}
.la-main{flex:1;min-height:0;display:grid;grid-template-columns:8fr 16fr;gap:48px;padding:0 48px}
.la-main>*{min-width:0}
/* Question screens: the title sits alone across the top, and the whole area under it
   belongs to the tiles, which run from its bottom edge to the footer. */
.la-main.qmode{grid-template-columns:1fr;grid-template-rows:auto minmax(0,1fr);gap:18px;padding:0 48px}
.qmode .la-q{align-self:start;padding:0;display:flex;align-items:baseline;flex-wrap:wrap;column-gap:28px}
.qmode .la-eye{flex-basis:100%}
.qmode .la-q h1{margin:6px 0 0;max-width:none;font-size:clamp(30px,3.7vw,46px);line-height:1.1}
.qmode .la-q p{margin:0;font-size:19px;max-width:none}
.qmode .la-a>div{min-height:100%}
.la-q{align-self:center;padding-bottom:24px}
.la-eye{font-weight:700;font-size:13px;letter-spacing:.2em;text-transform:uppercase;color:var(--lc-teal-deep,#0d9488)}
.la-q h1{margin:18px 0 0;font-weight:600;font-size:clamp(34px,4.3vw,54px);line-height:1.12;letter-spacing:-.015em;max-width:620px}
.la-q p{margin:20px 0 0;font-weight:300;font-size:21px;line-height:1.5;color:var(--text-muted,#6e6e73);max-width:540px}
.la-tag{display:inline-block;margin-top:22px;padding:8px 16px;border-radius:999px;background:rgba(23,221,197,.12);color:var(--lc-teal-deep,#0d9488);font-weight:600;font-size:14px;letter-spacing:.04em}
.la-a{min-height:0;overflow-y:auto;overscroll-behavior:contain;padding:8px 8px 28px;-webkit-mask-image:linear-gradient(180deg,#000 calc(100% - 26px),transparent);mask-image:linear-gradient(180deg,#000 calc(100% - 26px),transparent);display:flex;flex-direction:column;-webkit-overflow-scrolling:touch}
.la-a>div{width:100%;min-height:100%;display:flex;flex-direction:column}
.la-a>div>*{flex:1 1 auto}
.la-grid{display:grid;grid-auto-rows:minmax(92px,1fr);gap:16px;height:100%}
.la-opt{all:unset;box-sizing:border-box;cursor:pointer;position:relative;display:flex;align-items:stretch;min-height:96px;border-radius:22px;background:#fff;box-shadow:var(--shadow-edge,inset 0 0 0 1px rgba(0,0,0,.12));overflow:hidden;font-weight:600;font-size:clamp(20px,2.2vw,25px);line-height:1.25;overflow-wrap:anywhere;transition:background .16s ease,transform .12s ease,box-shadow .16s ease}
.la-opt.wide{grid-column:1/-1}
.la-opt:active{transform:scale(.985)}
.la-opt::after{content:'';position:absolute;inset:0;border-radius:inherit;border:3px solid transparent;pointer-events:none;transition:border-color .16s ease}
.la-opt.on{background:rgba(23,221,197,.12);box-shadow:0 10px 28px rgba(23,221,197,.22)}
.la-opt.on::after{border-color:var(--lc-teal,#17ddc5)}
.la-pic{flex:0 0 42%;min-width:112px;max-width:260px;position:relative;overflow:hidden;background:#0d1314;display:flex;align-items:center;justify-content:center}
.la-pic img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;transition:transform .35s ease}
.la-opt.on .la-pic img{transform:scale(1.07)}
.la-pic.tile{background:linear-gradient(135deg,#0b1213 0%,#11302c 100%)}
.la-pic.tile b{font-weight:800;font-size:clamp(28px,3.3vw,44px);letter-spacing:-.02em;color:var(--lc-teal,#17ddc5)}
.la-pic.logo{background:#f5f5f7}
.la-pic.logo img{position:static;width:64%;height:64%;object-fit:contain}
.la-txt{flex:1;min-width:0;display:flex;flex-direction:column;justify-content:center;padding:12px 18px}
.la-txt small{display:block;margin-top:4px;font-weight:300;font-size:16px;color:var(--text-muted,#86868b)}
.la-grid.dense{gap:12px;grid-auto-rows:minmax(80px,1fr)}
.la-grid.dense .la-opt{font-size:clamp(18px,2vw,22px);min-height:80px}
.la-grid.dense .la-pic{flex-basis:32%;min-width:92px;max-width:150px}
.la-grid.dense .la-txt{padding:10px 18px}
.la-mark{flex:none;width:36px;height:36px;border:2px solid rgba(0,0,0,.2);display:inline-flex;align-items:center;justify-content:center;background:#fff;transition:all .15s ease}
.la-mark.sq{border-radius:9px}.la-mark.rd{border-radius:50%}
.la-opt.on .la-mark{background:var(--lc-teal,#17ddc5);border-color:var(--lc-teal,#17ddc5)}
.la-other{grid-column:1/-1;align-self:center;padding:6px 8px}
.la-in{width:100%;border:0;border-bottom:2px solid rgba(0,0,0,.18);background:transparent;padding:14px 2px;font-family:inherit;font-weight:300;font-size:24px;line-height:1.3;color:inherit;outline:none;border-radius:0;-webkit-appearance:none;appearance:none}
.la-in:focus{border-bottom-color:var(--lc-teal,#17ddc5)}
.la-in.bad{border-bottom-color:#B4231C}
.la-lab{display:block;font-weight:700;font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:var(--text-muted,#86868b);margin-bottom:2px}
.la-lab.bad{color:#B4231C}
.la-form{display:grid;grid-template-columns:1fr 1fr;gap:34px 36px;align-content:center;min-height:100%}
.la-form .full{grid-column:1/-1}
.la-sel{background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 14 14'%3E%3Cpath d='M3 5l4 4 4-4' stroke='%231d1d1f' stroke-width='1.6' fill='none' stroke-linecap='round'/%3E%3C/svg%3E") no-repeat right 4px center}
.la-fine{margin-top:22px;font-weight:300;font-size:14px;line-height:1.5;color:var(--text-muted,#86868b)}
.la-foot{flex:none;height:124px;display:flex;align-items:center;justify-content:space-between;gap:20px;padding:0 56px;border-top:1px solid rgba(0,0,0,.07);background:#fff}
.la-btn{all:unset;box-sizing:border-box;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:12px;min-height:76px;padding:0 52px;border-radius:999px;font-weight:600;font-size:24px;letter-spacing:-.005em;transition:opacity .15s ease,transform .12s ease}
.la-btn:active{transform:scale(.97)}
.la-btn.pri{background:#000;color:#fff}
.la-btn.pri[aria-disabled=true]{opacity:.28}
.la-btn.teal{background:var(--lc-teal,#17ddc5);color:#06231f}
.la-btn.ghost{color:var(--lc-ink,#1d1d1f);box-shadow:inset 0 0 0 1.5px rgba(0,0,0,.18)}
.la-btn.link{color:var(--text-muted,#6e6e73);padding:0 18px;font-weight:500}
.la-spacer{flex:1}
.la-hero{align-self:center;position:relative;border-radius:28px;overflow:hidden;aspect-ratio:4/3;max-height:100%;background:#0b0f10}
.la-hero img{width:100%;height:100%;object-fit:cover;display:block;opacity:.92}
.la-hero::after{content:'';position:absolute;inset:0;background:linear-gradient(0deg,rgba(6,10,12,.75),rgba(6,10,12,0) 55%)}
.la-pills{position:absolute;z-index:2;left:24px;bottom:22px;display:flex;gap:12px}
.la-pills span{padding:9px 18px;border-radius:12px;font-weight:800;font-size:18px}
.la-pills .a{border:2px solid var(--lc-teal,#17ddc5);color:#fff}
.la-pills .b{background:var(--lc-teal,#17ddc5);color:#06231f}
.la-list{list-style:none;margin:0;padding:0;display:grid;gap:16px;grid-auto-rows:minmax(92px,1fr);min-height:100%}
.la-list li{display:flex;align-items:center;gap:18px;padding:22px 28px;border-radius:22px;box-shadow:var(--shadow-edge,inset 0 0 0 1px rgba(0,0,0,.12));font-weight:500;font-size:clamp(21px,2.5vw,27px);line-height:1.35}
.la-list .la-mark{background:var(--lc-teal,#17ddc5);border-color:var(--lc-teal,#17ddc5)}
.la-cover{position:absolute;inset:0;display:flex;flex-direction:column;background-size:cover;background-position:center;color:#fff}
.la-cover::before{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(6,10,12,.72) 0%,rgba(6,10,12,.62) 45%,rgba(6,10,12,.86) 100%),radial-gradient(ellipse at 50% 55%,rgba(23,221,197,.18),rgba(23,221,197,0) 60%)}
.la-cover>*{position:relative;z-index:1}
.la-cover-top{display:flex;align-items:center;justify-content:space-between;padding:34px 56px}
.la-cover-top .la-pills{position:static}
/* The button is the exact middle of the screen: text above it, note below it, in two equal rows. */
.la-cover-mid{position:absolute;inset:0;display:grid;grid-template-rows:1fr auto 1fr;justify-items:center;text-align:center;padding:96px 64px}
.la-cover-text{align-self:end;padding-bottom:44px;display:flex;flex-direction:column;align-items:center}
.la-cover-eye{font-weight:700;font-size:16px;letter-spacing:.28em;text-transform:uppercase;color:var(--lc-teal,#17ddc5)}
.la-cover h1{text-wrap:balance;margin:22px 0 0;max-width:1000px;font-weight:700;font-size:clamp(44px,6.4vw,84px);line-height:1.04;letter-spacing:-.025em}
.la-cover p{margin:28px 0 0;max-width:760px;font-weight:300;font-size:clamp(20px,2.3vw,28px);line-height:1.5;color:rgba(255,255,255,.88)}
.la-go{all:unset;box-sizing:border-box;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:20px;min-height:112px;min-width:min(82%,560px);padding:0 80px;border-radius:999px;background:var(--lc-teal,#17ddc5);color:#04201c;font-weight:800;font-size:clamp(28px,3vw,38px);letter-spacing:.1em;text-transform:uppercase;box-shadow:0 0 0 0 rgba(23,221,197,.5),0 24px 60px rgba(0,0,0,.45);animation:la-pulse 2.6s ease-out infinite;transition:transform .12s ease}
.la-go:active{transform:scale(.97)}
.la-go svg{width:34px;height:34px}
.la-cover-note{align-self:start;margin-top:26px;font-weight:500;font-size:16px;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.7)}
@keyframes la-pulse{0%{box-shadow:0 0 0 0 rgba(23,221,197,.5),0 24px 60px rgba(0,0,0,.45)}70%,100%{box-shadow:0 0 0 34px rgba(23,221,197,0),0 24px 60px rgba(0,0,0,.45)}}
@media (orientation:portrait){.la-cover-top{padding:34px 40px}.la-cover-mid{padding:120px 48px}.la-cover h1{font-size:clamp(46px,8.6vw,76px)}}
@media (max-height:900px) and (orientation:landscape){.la-cover h1{font-size:clamp(36px,4.6vw,54px);margin-top:14px}.la-cover p{margin-top:14px;font-size:20px;max-width:820px;line-height:1.45}.la-go{min-height:100px}.la-cover-top{padding:24px 48px}.la-cover-mid{padding:84px 64px}.la-cover-text{padding-bottom:36px}}
.la-queue{position:fixed;right:14px;bottom:122px;font-size:12px;color:var(--text-muted,#86868b);opacity:.85}
@media (orientation:portrait){
  .la-top{padding:0 40px;height:80px}
  .la-main{grid-template-columns:1fr;grid-template-rows:auto minmax(0,1fr);gap:20px;padding:0 40px}
  .la-main.qmode{padding:0 40px}
  .la-q{align-self:start;padding-top:12px;padding-bottom:0}
  .la-q h1{font-size:clamp(32px,5.6vw,46px)}
  .la-q p{font-size:20px;margin-top:14px}
  .la-opt{min-height:88px;font-size:27px}
  .la-grid.dense .la-opt{font-size:25px;min-height:84px}
  .la-pic{flex-basis:30%;max-width:240px}
  .la-foot{padding:0 40px;height:120px}
  .la-hero{aspect-ratio:auto;align-self:stretch;width:100%;height:100%;max-height:none;margin-bottom:24px}
  .la-form{grid-template-columns:1fr}
}
@media (max-height:800px) and (orientation:landscape){
  .la-top{height:72px}.la-foot{height:104px}
  .la-q h1{font-size:clamp(30px,3.9vw,44px)}
  .la-q p{font-size:18px;margin-top:14px}
  .la-p2{display:none}
  .la-tag{margin-top:16px}
}
@media (max-height:700px) and (orientation:landscape){
  .la-top{height:68px}.la-foot{height:96px}.la-btn{min-height:60px}.la-opt{min-height:68px}
}
/* Landscape tiles are one fixed height on every question, however many answers
   there are. 105px is the height the portrait machines screen (seven stacked
   tiles) settles at on an 820x1180 iPad, which is the size Leandro asked for. */
@media (orientation:landscape){
  .la-grid,.la-grid.dense{grid-auto-rows:105px;align-content:start;height:auto}
  .la-opt,.la-grid.dense .la-opt{min-height:0;height:105px}
  .la-grid.dense{gap:16px}
  .qmode .la-q h1{font-size:clamp(26px,2.9vw,36px)}
  .la-grid.dense .la-opt{font-size:clamp(20px,2.2vw,25px)}
  .la-grid.dense .la-txt{padding:12px 18px}
  .la-grid.dense .la-pic{flex-basis:42%;min-width:112px;max-width:260px}
}
`;

const Tick = ({ c = '#06231f', s = 17 }: { c?: string; s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M5 12.5l4.5 4.5L19 7" stroke={c} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
const Arrow = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>;
const Back = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M11 6l-6 6 6 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>;

/* Landscape and portrait get different grids (see the CSS below), and the last
   tile of an uneven row stretches over the gap, so the component has to know
   which one it is in. */
function useLandscape() {
  const q = '(orientation: landscape)';
  const [land, setLand] = React.useState(true);
  React.useEffect(() => {
    const mq = window.matchMedia(q);
    const on = () => setLand(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return land;
}

function OptionList({ opts, value, multi, onPick, otherValue, onOther }: {
  opts: Opt[]; value: string[]; multi: boolean; onPick: (id: string) => void; otherValue?: string; onOther?: (v: string) => void;
}) {
  const otherRef = React.useRef<HTMLInputElement>(null);
  const otherOn = value.includes('other');
  React.useEffect(() => {
    if (otherOn && otherRef.current) {
      otherRef.current.focus();
      setTimeout(() => otherRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 320);
    }
  }, [otherOn]);
  const land = useLandscape();
  /* Landscape: 2 columns for up to four answers, 3 for five or six, and back to 2
     for the long lists, whose labels need the width at the fixed tile height. Portrait: always one tile per row, stacked. */
  const n = opts.length;
  const cols = land ? (n <= 4 ? 2 : n <= 6 ? 3 : 2) : 1;
  const rem = n % cols;
  const lastSpan = cols > 1 && rem ? cols - rem + 1 : 1;
  const klass = 'la-grid' + (n >= 7 ? ' dense' : '');
  return (
    <div className={klass} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
      {opts.map((o) => {
        const on = value.includes(o.id);
        return (
          <React.Fragment key={o.id}>
            <button type="button" role={multi ? 'checkbox' : 'radio'} aria-checked={on} className={'la-opt' + (on ? ' on' : '')} style={o === opts[n - 1] && lastSpan > 1 ? { gridColumn: `span ${lastSpan}` } : undefined} onClick={() => onPick(o.id)}>
              <span className={'la-pic' + (o.img ? '' : o.logo ? ' logo' : ' tile')}>
                {o.img ? <img src={o.img} alt="" loading="eager" draggable={false} /> : o.logo ? <img src={`/assets/img/standards/${o.logo === 'iso' ? 'iso-logo-ink' : 'astm-emblem-ink'}.webp`} alt="" draggable={false} /> : <b>{o.tile}</b>}
              </span>
              <span className="la-txt"><span>{o.label}</span>{o.hint && <small>{o.hint}</small>}</span>
            </button>
            {o.other && on && onOther && (
              <label className="la-other">
                <input ref={otherRef} className="la-in" value={otherValue || ''} placeholder="Please specify" autoComplete="off" autoCapitalize="sentences" enterKeyHint="done"
                  onChange={(e) => onOther(e.target.value)} />
              </label>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', required, bad, mode, full, autoCap = 'off', children }: any) {
  return (
    <label className={full ? 'full' : ''}>
      <span className={'la-lab' + (bad ? ' bad' : '')}>{label}{required ? ' *' : ' (optional)'}</span>
      {children || (
        <input className={'la-in' + (bad ? ' bad' : '')} type={type} inputMode={mode} value={value} autoComplete="off" autoCorrect="off" autoCapitalize={autoCap} spellCheck={false}
          onChange={(e) => onChange(e.target.value)}
          onFocus={(e) => { const t = e.currentTarget; setTimeout(() => t.scrollIntoView({ block: 'center', behavior: 'smooth' }), 320); }} />
      )}
    </label>
  );
}

export default function LabAssessment() {
  const [screen, setScreen] = React.useState<Screen>('welcome');
  const [a, setA] = React.useState<Answers>(BLANK);
  const [touched, setTouched] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [count, setCount] = React.useState(THANKS_SECONDS);
  const [pending, setPending] = React.useState(0);
  const idleRef = React.useRef<number>(0);
  const advance = React.useRef<number>(0);

  const set = <K extends keyof Answers>(k: K, v: Answers[K]) => setA((p) => ({ ...p, [k]: v }));

  /* Kiosk hygiene: no pinch-zoom, no pull-to-refresh, and the scroll lock Base
     does not apply to a fixed full-screen app. */
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
    const left: any[] = [];
    for (const p of q) { if (!(await post(p))) left.push(p); }
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
    setA(BLANK); setTouched(false); setSending(false); setCount(THANKS_SECONDS); setScreen('welcome');
  }, []);

  /* Wipe the previous visitor's answers after a stretch of inactivity. */
  React.useEffect(() => {
    if (screen === 'welcome' || screen === 'thanks') return;
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

  const qi = QUESTIONS.indexOf(screen as any);
  const showStandards = STANDARDS.filter((s) =>
    a.industry === 'plastics' ? s.material === 'plastic' : a.industry === 'rubber' ? s.material === 'rubber' : true);

  const pick = (key: 'tests' | 'machines' | 'priorities' | 'standards', opts: Opt[]) => (id: string) => {
    const o = opts.find((x) => x.id === id);
    setA((p) => {
      const cur = p[key] as string[];
      if (cur.includes(id)) return { ...p, [key]: cur.filter((x) => x !== id) };
      if (o?.exclusive) return { ...p, [key]: [id] };
      const exclusive = opts.filter((x) => x.exclusive).map((x) => x.id);
      return { ...p, [key]: [...cur.filter((x) => !exclusive.includes(x)), id] };
    });
  };

  const valid = (): boolean => {
    switch (screen) {
      case 'industry': return !!a.industry;
      case 'tests': return a.tests.length > 0 && (!a.tests.includes('other') || !!a.testsOther.trim());
      case 'machines': return a.machines.length > 0 && (!a.machines.includes('other') || !!a.machinesOther.trim());
      case 'volume': return !!a.volume;
      case 'priority': return a.priorities.length > 0 && (!a.priorities.includes('other') || !!a.prioritiesOther.trim());
      case 'specimens': return true;
      case 'contact': return !!a.name.trim() && emailOk(a.email) && siteOk(a.website) && !!a.country;
      default: return true;
    }
  };

  const go = (s: Screen) => { clearTimeout(advance.current); setTouched(false); setScreen(s); };
  const next = () => {
    if (!valid()) { setTouched(true); return; }
    if (screen === 'welcome') return go('industry');
    if (screen === 'contact') return void submit();
    go(QUESTIONS[qi + 1]);
  };
  const prev = () => { if (qi <= 0) go('welcome'); else go(QUESTIONS[qi - 1]); };

  /* Single-choice questions move on by themselves after a beat, so a visitor
     who taps an answer is not left hunting for Next. Back and Next stay put. */
  const choose = (key: 'industry' | 'volume', id: string) => {
    set(key, id);
    clearTimeout(advance.current);
    advance.current = window.setTimeout(() => { setTouched(false); setScreen(QUESTIONS[QUESTIONS.indexOf(key === 'industry' ? 'industry' : 'volume') + 1]); }, 380);
  };

  async function submit() {
    setSending(true);
    const payload = {
      client_id: (crypto as any).randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random(),
      event_slug: EVENT_SLUG,
      page: window.location.pathname,
      submitted_at: new Date().toISOString(),
      answers: {
        industry: a.industry,
        tests: a.tests, tests_other: a.testsOther.trim(),
        machines: a.machines, machines_other: a.machinesOther.trim(),
        volume: a.volume,
        priorities: a.priorities, priorities_other: a.prioritiesOther.trim(),
        standards: a.standards, standards_other: a.standardsOther.trim(),
      },
      contact: { name: a.name.trim(), email: a.email.trim().toLowerCase(), website: a.website.trim(), phone: a.phone.trim(), country: a.country },
    };
    const ok = await post(payload);
    if (!ok) { const q = readQueue(); q.push(payload); writeQueue(q); setPending(q.length); }
    track('booth_assessment_submit', { event: EVENT_SLUG, delivered: ok });
    setSending(false);
    go('thanks');
  }

  const canNext = valid();
  const label = (id: string, opts: Opt[]) => opts.find((o) => o.id === id)?.label;

  /* ---------- screens ---------- */
  let body: React.ReactNode = null;
  if (screen === 'welcome') {
    body = (
      <>
        <div className="la-q">
          <div className="la-eye">Lab assessment · Booth C819</div>
          <h1 style={GRAD}>Discover how automation can improve your laboratory</h1>
          <p>We’re here to help you explore opportunities to reduce testing costs, improve efficiency, increase testing capacity, and achieve greater consistency.</p>
          <p className="la-p2" style={{ marginTop: 14 }}>Please answer a few quick questions about your laboratory and its current practices so we can better understand your needs.</p>
          <span className="la-tag">Takes about 2 minutes</span>
        </div>
        <div className="la-hero">
          <img src="/assets/img/events/ami-booth.webp" alt="" />
          <div className="la-pills"><span className="a">NOV 11–12</span><span className="b">BOOTH C819</span></div>
        </div>
      </>
    );
  } else if (screen === 'thanks') {
    body = (
      <>
        <div className="la-q">
          <div className="la-eye">Assessment received</div>
          <h1 style={GRAD}>Thank you!</h1>
          <p>We’ll be in touch via email with your personalized assessment. We look forward to helping you make testing smarter!</p>
        </div>
        <div className="la-a"><div>
          <ul className="la-list">
            {['Testing costs and technician time', 'Workflow bottlenecks and capacity gains', 'Impact on turnaround time and backlog', 'Estimated automation ROI and payback potential'].map((t) => (
              <li key={t}><span className="la-mark sq"><Tick /></span>{t}</li>
            ))}
          </ul>
        </div></div>
      </>
    );
  } else {
    const head = (eye: string, title: string, sub?: string) => (
      <div className="la-q"><div className="la-eye">{eye}</div><h1 style={GRAD}>{title}</h1>{sub && <p>{sub}</p>}</div>
    );
    if (screen === 'industry') body = (<>{head('Your lab', 'Which industry do you work in?')}<div className="la-a"><div>
      <OptionList opts={INDUSTRY} value={a.industry ? [a.industry] : []} multi={false} onPick={(id) => choose('industry', id)} />
    </div></div></>);
    if (screen === 'tests') body = (<>{head('Your lab', 'What types of tests does your laboratory perform?', 'Select all that apply.')}<div className="la-a"><div>
      <OptionList opts={TESTS} value={a.tests} multi onPick={pick('tests', TESTS)} otherValue={a.testsOther} onOther={(v) => set('testsOther', v)} />
    </div></div></>);
    if (screen === 'machines') body = (<>{head('Your lab', 'What testing machines do you currently use in your laboratory?', 'Select all that apply.')}<div className="la-a"><div>
      <OptionList opts={MACHINES} value={a.machines} multi onPick={pick('machines', MACHINES)} otherValue={a.machinesOther} onOther={(v) => set('machinesOther', v)} />
    </div></div></>);
    if (screen === 'volume') body = (<>{head('Your lab', 'How many specimens do you test daily?')}<div className="la-a"><div>
      <OptionList opts={VOLUME} value={a.volume ? [a.volume] : []} multi={false} onPick={(id) => choose('volume', id)} />
    </div></div></>);
    if (screen === 'priority') body = (<>{head('Your goals', "What is your laboratory’s main priority?", 'Select all that apply.')}<div className="la-a"><div>
      <OptionList opts={PRIORITY} value={a.priorities} multi onPick={pick('priorities', PRIORITY)} otherValue={a.prioritiesOther} onOther={(v) => set('prioritiesOther', v)} />
    </div></div></>);
    if (screen === 'specimens') {
      const opts: Opt[] = [...showStandards, { id: 'other', label: 'Other', other: true, tile: '+' }];
      body = (<>{head('Your testing', 'Which specimens and testing standards do you use?',
        a.industry === 'plastics' ? 'Showing standards for plastics. Select all that apply.' : a.industry === 'rubber' ? 'Showing standards for rubber. Select all that apply.' : 'Select all that apply.')}<div className="la-a"><div>
        <OptionList opts={opts} value={a.standards} multi onPick={pick('standards', opts)} otherValue={a.standardsOther} onOther={(v) => set('standardsOther', v)} />
      </div></div></>);
    }
    if (screen === 'contact') body = (<>{head("Let's get in touch", 'Where should we send your assessment?', 'We’ll email your personalized results.')}<div className="la-a"><div>
      <div className="la-form">
        <Field label="Full name" required value={a.name} onChange={(v: string) => set('name', v)} autoCap="words" bad={touched && !a.name.trim()} />
        <Field label="Email address" required type="email" mode="email" value={a.email} onChange={(v: string) => set('email', v)} bad={touched && !emailOk(a.email)} />
        <Field label="Website" required type="url" mode="url" value={a.website} onChange={(v: string) => set('website', v)} bad={touched && !siteOk(a.website)} />
        <Field label="Phone number" type="tel" mode="tel" value={a.phone} onChange={(v: string) => set('phone', v)} />
        <Field label="Country" required full bad={touched && !a.country}>
          <select className={'la-in la-sel' + (touched && !a.country ? ' bad' : '')} value={a.country} onChange={(e) => set('country', e.target.value)}>
            <option value="">Select your country</option>
            {COUNTRY_LIST.map((c) => <option key={c.c} value={c.c}>{c.n}</option>)}
          </select>
        </Field>
      </div>
      <p className="la-fine">By submitting you agree that LabsCubed may email you your assessment and follow up about your laboratory’s testing. You can unsubscribe at any time.</p>
    </div></div></>);
  }

  const progress = qi >= 0 ? (
    <div className="la-prog" aria-label={`Question ${qi + 1} of ${QUESTIONS.length}`}>
      <div className="la-seg">{QUESTIONS.map((q, i) => <i key={q} className={i <= qi ? 'on' : ''} />)}</div>
      <b>{qi + 1} / {QUESTIONS.length}</b>
    </div>
  ) : null;

  if (screen === 'welcome') {
    return (
      <div className="la">
        <style>{CSS}</style>
        <div className="la-cover" style={{ backgroundImage: 'url(/assets/img/assessment/cover-lab-office.webp)' }}>
          <div className="la-cover-top">
            <img className="la-logo" src="/assets/img/logo-dark.webp" alt="LabsCubed" style={{ filter: 'brightness(0) invert(1)' }} />
            <div className="la-pills"><span className="a">NOV 11–12</span><span className="b">BOOTH C819</span></div>
          </div>
          <div className="la-cover-mid">
            <div className="la-cover-text">
              <div className="la-cover-eye">Free lab assessment</div>
              <h1>See what automation could save your lab</h1>
              <p>Answer {QUESTIONS.length} quick questions and get your personalized assessment: your testing costs and technician time, workflow bottlenecks, and your estimated automation ROI and payback.</p>
            </div>
            <button className="la-go" onClick={() => go('industry')}>Get started <Arrow /></button>
            <span className="la-cover-note">Takes about 2 minutes</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="la">
      <style>{CSS}</style>
      <div className="la-top">
        <img className="la-logo" src="/assets/img/logo-dark.webp" alt="LabsCubed" />
        {progress}
      </div>
      <div className={'la-main' + (qi >= 0 ? ' qmode' : '')}>{body}</div>
      <div className="la-foot">
        {screen === 'welcome' && (<><span className="la-spacer" /><button className="la-btn pri" onClick={next}>Get started <Arrow /></button></>)}
        {screen === 'thanks' && (<><span className="la-spacer" /><button className="la-btn teal" onClick={reset}>Start a new assessment{count > 0 ? ` · ${count}` : ''}</button></>)}
        {qi >= 0 && (
          <>
            <button className="la-btn ghost" onClick={prev}><Back /> Back</button>
            <span className="la-spacer" />
            {screen === 'specimens' && (
              <button className="la-btn link" onClick={() => { set('standards', []); set('standardsOther', ''); go('contact'); }}>I’m not sure</button>
            )}
            <button className="la-btn pri" aria-disabled={!canNext || sending} onClick={next}>
              {screen === 'contact' ? (sending ? 'Sending…' : 'Submit') : 'Next'} {screen !== 'contact' && <Arrow />}
            </button>
          </>
        )}
      </div>
      {pending > 0 && <div className="la-queue">{pending} saved on this iPad · will send when online</div>}
    </div>
  );
}
