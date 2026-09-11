/* QuoteWizard — horizontal 5-step "Get a Quote" wizard (client:load).
   Steps 01-02 reuse the same specimen catalogue + recommendation logic as
   the homepage configurator (see lib/recommend.ts, kept in sync there);
   steps 03-05 collect contact/company details and submit to the
   `quote-request` Supabase edge function, which logs the lead and tags the
   Resend "Quote Requested" segment with the full answer set as properties. */
import React from 'react';
import { SAMPLES, getSample, Sample } from '../lib/samples';
import { Button } from '../lib/ui';
import { DAILY_OPTIONS, recommendMachine } from '../lib/recommend';
import { COUNTRIES, getCountry, flagSrc, formatPhone, type Country } from '../lib/countries';

const ENDPOINT = 'https://grozewxrymeiruhggcdy.supabase.co/functions/v1/quote-request';

const qGrad: any = {
  background: 'linear-gradient(90deg, #000000 0%, #666666 56.25%, #000000 100%)',
  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
};

const STEPS = [
  { id: 'samples', label: 'What you test' },
  { id: 'volume', label: 'Daily volume' },
  { id: 'you', label: 'Your details' },
  { id: 'lab', label: 'Your lab' },
  { id: 'review', label: 'Review' },
];

const RESOURCE_HREF: Record<string, string> = {
  CubeTen: '/resources/astm-d638-iso-527-2-plastic-tensile-testing#brochure',
  CubeOne: '/resources/astm-d412-iso-37-rubber-tensile-testing#brochure',
};

type Data = {
  selected: string[]; otherSample: string; dailyIdx: number | null;
  first: string; last: string; email: string; country: string; phone: string;
  company: string; city: string; heard: string; message: string; subscribe: boolean;
};
const BLANK: Data = { selected: [], otherSample: '', dailyIdx: null, first: '', last: '', email: '', country: '', phone: '', company: '', city: '', heard: '', message: '', subscribe: true };

const emailOk = (v: string) => /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(v.trim());

/* Always initializes false (matching SSR) and corrects in an effect — this
   island is client:load, but a bad initial value here would still cause a
   real render flash and mismatch warnings, so keep the same safe pattern
   used site-wide for freshly authored components. */
function useBP(bp: number) {
  const [hit, setHit] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia(`(max-width:${bp}px)`);
    const on = () => setHit(mq.matches);
    on();
    if (mq.addEventListener) mq.addEventListener('change', on); else (mq as any).addListener(on);
    return () => { if (mq.removeEventListener) mq.removeEventListener('change', on); else (mq as any).removeListener(on); };
  }, [bp]);
  return hit;
}

function stepValid(i: number, d: Data): boolean {
  if (i === 0) return d.selected.length > 0 || !!d.otherSample.trim();
  if (i === 1) return d.dailyIdx !== null;
  if (i === 2) return !!d.first.trim() && !!d.last.trim() && emailOk(d.email) && !!d.country;
  if (i === 3) return !!d.company.trim() && !!d.city.trim();
  return true;
}

const STD_LOGO_INK = (std: string) => (std && std.indexOf('ISO') === 0 ? '/assets/img/standards/iso-logo-ink.webp' : '/assets/img/standards/astm-emblem-ink.webp');

function SampleCard({ s, active, onClick }: any) {
  return (
    <button onClick={onClick} className="qw-scard"
      style={{ all: 'unset', cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', minHeight: 84, boxSizing: 'border-box', borderRadius: 14, background: active ? 'rgba(23,221,197,0.07)' : '#fff', boxShadow: active ? 'inset 0 0 0 1.5px var(--lc-teal), var(--shadow-card)' : 'var(--shadow-edge)', transition: 'box-shadow .18s ease' }}>
      {active ? <span style={{ position: 'absolute', top: 8, left: 8, width: 20, height: 20, borderRadius: '50%', background: 'var(--lc-teal)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}><svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5 9-9" stroke="#06231f" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" /></svg></span> : null}
      <div style={{ width: 104, flex: '0 0 104px', display: 'flex', alignItems: 'center' }}>
        <Sample spec={s} variant="fill" tone="light" style={{ width: '100%', maxHeight: 38 }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 15, letterSpacing: '-0.01em', color: 'var(--lc-ink)' }}>{s.name}</div>
        <div style={{ fontSize: 12.5, marginTop: 2, fontWeight: 500, color: active ? 'var(--lc-teal-deep)' : 'var(--text-muted)' }}>{s.standard}</div>
      </div>
      <img src={STD_LOGO_INK(s.standard)} alt={s.standard} style={{ flex: 'none', height: 21, width: 'auto', opacity: active ? 0.95 : 0.5 }} />
    </button>
  );
}

function SampleGroup({ label, machine, items, selected, onToggle, m, open, onHead }: any) {
  if (!items.length) return null;
  const count = items.filter((s: any) => selected.includes(s.id)).length;
  return (
    <div style={{ marginTop: 16, borderRadius: 16, background: '#fff', boxShadow: count ? 'inset 0 0 0 1.5px var(--lc-teal)' : 'var(--shadow-edge)', overflow: 'hidden', transition: 'box-shadow .2s ease' }}>
      <button onClick={onHead} className="qw-ghead"
        style={{ all: 'unset', cursor: 'pointer', boxSizing: 'border-box', width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: m ? '18px 18px' : '20px 24px' }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--lc-teal)', flex: 'none' }} />
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontWeight: 700, fontSize: 12.5, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--lc-ink)' }}>{label}</span>
          <span style={{ display: 'block', marginTop: 4, fontSize: 13, color: count ? 'var(--lc-teal-deep)' : 'var(--text-muted)', fontWeight: count ? 500 : 300 }}>{count ? count + ' selected' : machine + ' · ' + items.length + ' specimens'}</span>
        </span>
        <svg width="15" height="15" viewBox="0 0 14 14" style={{ flex: 'none', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s ease' }}><path d="M3 5l4 4 4-4" stroke="var(--lc-ink)" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      <div style={{ display: 'grid', gridTemplateRows: open ? '1fr' : '0fr', transition: 'grid-template-rows .28s ease' }}>
        <div style={{ overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: m ? '1fr' : 'repeat(auto-fill, minmax(268px, 1fr))', gap: 14, padding: m ? '4px 14px 18px' : '4px 24px 24px' }}>
            {items.map((s: any) => <SampleCard key={s.id} s={s} active={selected.includes(s.id)} onClick={() => onToggle(s.id)} />)}
          </div>
        </div>
      </div>
    </div>
  );
}

function VolumeChips({ value, onChange }: any) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 28 }}>
      {DAILY_OPTIONS.map((o) => {
        const active = o.value === value;
        return (
          <button key={o.value} onClick={() => onChange(o.value)} className="qw-vchip"
            style={{ all: 'unset', cursor: 'pointer', boxSizing: 'border-box', padding: '15px 22px', borderRadius: 12, minWidth: 132, display: 'flex', flexDirection: 'column', gap: 3, background: active ? 'rgba(23,221,197,0.08)' : 'var(--lc-gray-100)', boxShadow: active ? 'inset 0 0 0 1.5px var(--lc-teal)' : 'inset 0 0 0 1px rgba(0,0,0,0.06)', transition: 'box-shadow .18s ease, background .18s ease' }}>
            <span style={{ fontWeight: 600, fontSize: 17, color: 'var(--lc-ink)' }}>{o.label}</span>
            <span style={{ fontSize: 12.5, fontWeight: 500, color: active ? 'var(--lc-teal-deep)' : 'var(--text-muted)' }}>{o.sub}</span>
          </button>
        );
      })}
    </div>
  );
}

function QField({ label, value, onChange, type = 'text', placeholder, required, wide }: any) {
  const [touched, setTouched] = React.useState(false);
  const bad = touched && required && (type === 'email' ? !emailOk(value) : !value.trim());
  return (
    <label style={{ display: 'block', gridColumn: wide ? '1 / -1' : 'auto' }}>
      <span style={{ display: 'block', fontWeight: 700, fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: bad ? '#B4231C' : 'var(--text-muted)' }}>{label}{required ? ' *' : ''}</span>
      <input className="qw-input" type={type} value={value} placeholder={placeholder} onBlur={() => setTouched(true)} onChange={(e) => onChange(e.target.value)}
        style={{ width: '100%', boxSizing: 'border-box', border: 'none', borderBottom: '1px solid ' + (bad ? '#B4231C' : 'rgba(0,0,0,0.14)'), background: 'transparent', padding: '12px 0', marginTop: 8, fontFamily: 'inherit', fontWeight: 300, fontSize: 19, color: 'var(--lc-ink)', outline: 'none' }} />
      {bad && <span style={{ display: 'block', marginTop: 8, fontSize: 13, color: '#B4231C' }}>{type === 'email' ? 'Enter a valid business email.' : 'This field is required.'}</span>}
    </label>
  );
}

function CountrySelect({ value, onChange, required }: any) {
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState('');
  const box = React.useRef<HTMLDivElement>(null);
  const sel = getCountry(value);
  React.useEffect(() => {
    const away = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) { setOpen(false); setQ(''); } };
    document.addEventListener('mousedown', away);
    return () => document.removeEventListener('mousedown', away);
  }, []);
  const list = COUNTRIES.filter((c) => c.n.toLowerCase().includes(q.trim().toLowerCase()) || c.d.includes(q.trim()));
  return (
    <div ref={box} style={{ position: 'relative' }}>
      <span style={{ display: 'block', fontWeight: 700, fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Country{required ? ' *' : ''}</span>
      <button onClick={() => setOpen((o) => !o)} className="qw-csel"
        style={{ all: 'unset', cursor: 'pointer', boxSizing: 'border-box', width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', marginTop: 8, borderBottom: '1px solid ' + (open ? '#17DDC5' : 'rgba(0,0,0,0.14)') }}>
        {sel ? <img src={flagSrc(sel.c)} alt="" style={{ width: 26, height: 'auto', flex: 'none', borderRadius: 2, boxShadow: '0 0 0 1px rgba(0,0,0,0.08)' }} /> : null}
        <span style={{ flex: 1, minWidth: 0, fontWeight: sel ? 400 : 300, fontSize: 19, color: sel ? 'var(--lc-ink)' : 'rgba(0,0,0,0.35)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sel ? sel.n : 'Select a country'}</span>
        {sel ? <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-muted)', flex: 'none' }}>{sel.d}</span> : null}
        <svg width="14" height="14" viewBox="0 0 14 14" style={{ flex: 'none', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s ease' }}><path d="M3 5l4 4 4-4" stroke="var(--lc-ink)" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      {open && (
        <div style={{ position: 'absolute', zIndex: 30, top: 'calc(100% + 8px)', left: 0, right: 0, background: '#fff', borderRadius: 14, boxShadow: 'var(--shadow-edge), 0 18px 40px rgba(0,0,0,0.14)', overflow: 'hidden' }}>
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search country"
            style={{ width: '100%', boxSizing: 'border-box', border: 'none', borderBottom: '1px solid rgba(0,0,0,0.08)', outline: 'none', padding: '14px 16px', fontFamily: 'inherit', fontSize: 15, fontWeight: 300, color: 'var(--lc-ink)' }} />
          <div style={{ maxHeight: 260, overflowY: 'auto' }}>
            {list.map((c) => (
              <button key={c.c} onClick={() => { onChange(c.c); setOpen(false); setQ(''); }} className="qw-copt"
                style={{ all: 'unset', cursor: 'pointer', boxSizing: 'border-box', width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', background: c.c === value ? 'rgba(23,221,197,0.08)' : 'transparent' }}>
                <img src={flagSrc(c.c)} alt="" style={{ width: 24, height: 'auto', flex: 'none', borderRadius: 2, boxShadow: '0 0 0 1px rgba(0,0,0,0.08)' }} />
                <span style={{ flex: 1, minWidth: 0, fontSize: 15, fontWeight: 500, color: 'var(--lc-ink)' }}>{c.n}</span>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{c.d}</span>
              </button>
            ))}
            {!list.length && <div style={{ padding: '16px', fontSize: 14, fontWeight: 300, color: 'var(--text-muted)' }}>No match. Pick the closest country and note it in the message.</div>}
          </div>
        </div>
      )}
    </div>
  );
}

function PhoneField({ country, value, onChange }: any) {
  const c = getCountry(country);
  const total = c ? c.g.reduce((a, b) => a + b, 0) : 12;
  return (
    <label style={{ display: 'block', opacity: c ? 1 : 0.5 }}>
      <span style={{ display: 'block', fontWeight: 700, fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Phone number</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0', marginTop: 8, borderBottom: '1px solid rgba(0,0,0,0.14)' }}>
        {c ? (
          <React.Fragment>
            <img src={flagSrc(c.c)} alt="" style={{ width: 26, height: 'auto', flex: 'none', borderRadius: 2, boxShadow: '0 0 0 1px rgba(0,0,0,0.08)' }} />
            <span style={{ fontSize: 19, fontWeight: 400, color: 'var(--lc-ink)', flex: 'none' }}>{c.d}</span>
          </React.Fragment>
        ) : null}
        <input className="qw-phone" type="tel" inputMode="tel" disabled={!c} value={formatPhone(value, c)}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, total + 2))}
          placeholder={c ? formatPhone('5551234567'.slice(0, total), c) : 'Select a country first'}
          style={{ flex: 1, minWidth: 0, border: 'none', background: 'transparent', padding: 0, fontFamily: 'inherit', fontWeight: 300, fontSize: 19, color: 'var(--lc-ink)', outline: 'none' }} />
      </span>
    </label>
  );
}

function QChips({ options, value, onChange }: any) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 14 }}>
      {options.map((o: string) => {
        const active = o === value;
        return (
          <button key={o} className="qw-chip" onClick={() => onChange(active ? '' : o)}
            style={{ all: 'unset', cursor: 'pointer', borderRadius: 999, padding: '10px 18px', fontSize: 14, fontWeight: 500, background: active ? '#000' : 'var(--lc-gray-100)', color: active ? '#fff' : 'var(--lc-ink)' }}>{o}</button>
        );
      })}
    </div>
  );
}

function QHead({ n, title, sub, m }: any) {
  return (
    <div>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
        <span style={{ width: 40, height: 40, borderRadius: '50%', background: '#000', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 15, letterSpacing: '-0.02em' }}>{n}</span>
        <span style={{ fontWeight: 700, fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Step</span>
      </div>
      <h2 style={{ ...qGrad, fontWeight: 600, fontSize: m ? 26 : 37, lineHeight: 1.17, letterSpacing: '-0.01em', margin: '22px 0 0', maxWidth: 640 }}>{title}</h2>
      {sub && <p style={{ margin: '14px 0 0', fontWeight: 300, fontSize: 17, lineHeight: 1.55, color: 'var(--text-muted)', maxWidth: 600 }}>{sub}</p>}
    </div>
  );
}

function QRail({ step, go, data, m, sm }: any) {
  const reachable = (i: number) => { for (let k = 0; k < i; k++) if (!stepValid(k, data)) return false; return true; };
  const railRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!sm || !railRef.current) return;
    const el = railRef.current.querySelector('[data-cur="1"]') as HTMLElement | null;
    if (el) railRef.current.scrollTo({ left: Math.max(0, el.offsetLeft - 18), behavior: 'smooth' });
  }, [step, sm]);
  return (
    <div style={{ borderBottom: '1px solid rgba(0,0,0,0.08)', background: '#fff' }}>
      <div ref={railRef} className="qw-rail" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: sm ? '16px 16px 18px' : m ? '22px 22px 24px' : '30px 44px 32px', flexWrap: sm ? 'nowrap' : 'wrap', overflowX: sm ? 'auto' : 'visible' }}>
        {STEPS.map((s, i) => {
          const done = i < step && stepValid(i, data);
          const cur = i === step;
          const can = reachable(i);
          const bg = cur ? '#000' : done ? 'var(--lc-gray-100)' : '#fff';
          const fg = cur ? '#fff' : done ? 'var(--lc-ink)' : 'var(--text-muted)';
          const showLabel = !sm || cur;
          return (
            <button key={s.id} data-cur={cur ? '1' : '0'} onClick={() => can && go(i)} disabled={!can} className={can ? (cur ? 'qw-chipcur' : 'qw-chipstep') : undefined}
              style={{ all: 'unset', cursor: can ? 'pointer' : 'not-allowed', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: showLabel ? 9 : 0, flex: 'none', minHeight: 44, boxSizing: 'border-box', padding: showLabel ? '9px 16px 9px 12px' : '9px 11px', borderRadius: 999, background: bg, color: fg, boxShadow: cur ? 'none' : 'inset 0 0 0 1px rgba(0,0,0,0.12)', opacity: can ? 1 : 0.45, transition: 'background .18s ease, color .18s ease, filter .18s ease' }}>
              <span style={{ width: 22, height: 22, borderRadius: '50%', flex: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 11, background: cur ? '#17DDC5' : done ? '#000' : 'var(--lc-gray-200)', color: cur ? '#000' : done ? '#fff' : 'var(--text-muted)' }}>
                {done ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M5 13l4.5 4.5L19 7" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg> : i + 1}
              </span>
              {showLabel && <span style={{ fontSize: 13.5, fontWeight: cur ? 600 : 500, whiteSpace: 'nowrap' }}>{s.label}</span>}
            </button>
          );
        })}
      </div>
      <div style={{ height: 3, background: 'rgba(0,0,0,0.07)' }}>
        <div style={{ height: 3, width: ((step + 1) / STEPS.length) * 100 + '%', background: '#000', transition: 'width .3s ease' }} />
      </div>
    </div>
  );
}

function QSummary({ data, rec, go, m }: any) {
  const ctry = getCountry(data.country);
  const rows: [string, string, number][] = [
    ['Daily volume', data.dailyIdx !== null ? (DAILY_OPTIONS[data.dailyIdx] || {}).label + ' / day' : '', 1],
    ['Contact', [data.first, data.last].filter(Boolean).join(' '), 2],
    ['Email', data.email, 2],
    ['Phone', data.phone && ctry ? ctry.d + ' ' + formatPhone(data.phone, ctry) : '', 2],
    ['Company', data.company, 3],
    ['Lab site', [data.city, ctry ? ctry.n : ''].filter(Boolean).join(', '), 3],
  ];
  return (
    <aside style={{ background: '#fff', color: 'var(--lc-ink)', borderRadius: 24, padding: m ? 28 : 34, position: m ? 'static' : 'sticky', top: 32, boxShadow: 'var(--shadow-edge), 0 12px 30px rgba(0,0,0,0.05)' }}>
      <div style={{ fontWeight: 700, fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Your match</div>
      <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ width: 9, height: 9, borderRadius: '50%', background: rec.name ? '#17DDC5' : 'rgba(0,0,0,0.15)', flex: 'none' }} />
        <span style={{ fontWeight: 600, fontSize: 30, letterSpacing: '-0.03em', lineHeight: 1.05 }}>{rec.name || 'Not set yet'}</span>
      </div>
      <div style={{ marginTop: 10, fontSize: 14, lineHeight: 1.55, fontWeight: 300, color: 'var(--text-muted)' }}>
        {rec.name ? rec.standard + ' · matched to ' + (rec.samples.length || 'your') + ' specimen' + (rec.samples.length === 1 ? '' : 's') + (data.otherSample.trim() ? ' + your custom spec' : '') : 'Pick your specimens and daily volume — your recommended machine appears here.'}
      </div>
      {rec.samples && rec.samples.length > 0 && (
        <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {rec.samples.map((s: any) => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, background: 'var(--lc-gray-100)' }}>
              <div style={{ width: 62, flex: '0 0 62px', display: 'flex', alignItems: 'center' }}>
                <Sample spec={s} variant="fill" tone="light" style={{ width: '100%', maxHeight: 24 }} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{s.name}</div>
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 1 }}>{s.standard} · {s.testType}</div>
              </div>
            </div>
          ))}
        </div>
      )}
      {rec.name && (
        <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column' }}>
          {rec.specs!.map(([k, v]: [string, string]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 14, padding: '11px 0', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
              <span style={{ fontSize: 12.5, fontWeight: 300, color: 'var(--text-muted)' }}>{k}</span>
              <span style={{ fontSize: 12.5, fontWeight: 500, textAlign: 'right' }}>{v}</span>
            </div>
          ))}
        </div>
      )}
      <div style={{ height: 1, background: 'rgba(0,0,0,0.08)', margin: '26px 0 2px' }} />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {rows.map(([k, v, i]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'baseline', borderBottom: '1px solid rgba(0,0,0,0.07)', padding: '13px 0' }}>
            <span style={{ fontSize: 13, fontWeight: 300, color: 'var(--text-muted)', flex: 'none' }}>{k}</span>
            {v ? <button onClick={() => go(i)} className="qw-edit" style={{ all: 'unset', cursor: 'pointer', fontSize: 13.5, fontWeight: 500, textAlign: 'right', color: 'var(--lc-ink)', overflowWrap: 'break-word', minWidth: 0 }}>{v}</button>
              : <span style={{ fontSize: 13, color: 'rgba(0,0,0,0.25)' }}>—</span>}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 30, fontWeight: 700, fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Prefer to talk</div>
      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14.5 }}>
        <a href="mailto:info@labscubed.com" className="qw-link" style={{ color: 'var(--lc-ink)', textDecoration: 'none', fontWeight: 500 }}>info@labscubed.com</a>
        <a href="tel:+15197490460" className="qw-link" style={{ color: 'var(--lc-ink)', textDecoration: 'none', fontWeight: 500 }}>(519) 749-0460</a>
        <span style={{ color: 'var(--text-muted)', fontWeight: 300, fontSize: 13.5 }}>Kitchener, ON · Mon–Fri, 9–5 ET</span>
      </div>
    </aside>
  );
}

function QPanel({ step, data, set, toggleSample, go, rec, m }: any) {
  const grid: any = { display: 'grid', gridTemplateColumns: m ? '1fr' : '1fr 1fr', gap: m ? 26 : '34px 40px', marginTop: 34, maxWidth: 720 };
  const list = SAMPLES;
  const [openGroup, setOpenGroup] = React.useState<string | null>(null);
  const head = (k: string) => () => setOpenGroup((o) => (o === k ? null : k));
  if (step === 0) return (
    <div>
      <QHead n="01" title="What do you test?" sub="Open a material and select every specimen geometry and standard you run — you can choose more than one." m={m} />
      <div style={{ marginTop: 18 }}>
        <SampleGroup label="Plastic" machine="CubeTen / CubeFlex" items={list.filter((s: any) => s.material === 'plastic')} selected={data.selected} onToggle={toggleSample} m={m} open={openGroup === 'plastic'} onHead={head('plastic')} />
        <SampleGroup label="Rubber" machine="CubeOne" items={list.filter((s: any) => s.material === 'rubber')} selected={data.selected} onToggle={toggleSample} m={m} open={openGroup === 'rubber'} onHead={head('rubber')} />
        <div style={{ marginTop: 16, borderRadius: 16, background: '#fff', boxShadow: data.otherSample.trim() ? 'inset 0 0 0 1.5px var(--lc-teal)' : 'var(--shadow-edge)', overflow: 'hidden', transition: 'box-shadow .2s ease' }}>
          <button onClick={head('other')} className="qw-ghead" style={{ all: 'unset', cursor: 'pointer', boxSizing: 'border-box', width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: m ? '18px 18px' : '20px 24px' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--lc-teal)', flex: 'none' }} />
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'block', fontWeight: 700, fontSize: 12.5, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--lc-ink)' }}>Other</span>
              <span style={{ display: 'block', marginTop: 4, fontSize: 13, color: data.otherSample.trim() ? 'var(--lc-teal-deep)' : 'var(--text-muted)', fontWeight: data.otherSample.trim() ? 500 : 300 }}>{data.otherSample.trim() ? 'Custom spec added' : 'Not listed above'}</span>
            </span>
            <svg width="15" height="15" viewBox="0 0 14 14" style={{ flex: 'none', transform: openGroup === 'other' ? 'rotate(180deg)' : 'none', transition: 'transform .2s ease' }}><path d="M3 5l4 4 4-4" stroke="var(--lc-ink)" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <div style={{ display: 'grid', gridTemplateRows: openGroup === 'other' ? '1fr' : '0fr', transition: 'grid-template-rows .28s ease' }}>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ padding: m ? '4px 14px 18px' : '4px 24px 24px' }}>
                <textarea className="qw-ta" value={data.otherSample} onChange={(e) => set('otherSample', e.target.value)} rows={3} placeholder="Type the standard or specimen you run — e.g. ASTM D1708 or a custom die."
                  style={{ width: '100%', boxSizing: 'border-box', padding: '16px 18px', borderRadius: 14, border: 'none', outline: 'none', resize: 'vertical', fontFamily: 'inherit', fontSize: 15, lineHeight: 1.5, color: 'var(--lc-ink)', background: 'var(--lc-gray-100)', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.06)' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  if (step === 1) return (
    <div>
      <QHead n="02" title="How many samples do you test daily?" sub="An approximate daily volume is enough — it sizes the right level of automation and the ROI case we build for you." m={m} />
      <VolumeChips value={data.dailyIdx} onChange={(v: number) => { set('dailyIdx', v); go(2); }} />
    </div>
  );
  if (step === 2) return (
    <div>
      <QHead n="03" title="Who should we send the quote to?" sub="A LabsCubed specialist replies within one business day. Pick your country first so we get the phone format and the local service team right." m={m} />
      <div style={grid}>
        <QField label="First name" required value={data.first} onChange={(v: string) => set('first', v)} placeholder="Jordan" />
        <QField label="Last name" required value={data.last} onChange={(v: string) => set('last', v)} placeholder="Alvarez" />
        <QField label="Business email" required type="email" value={data.email} onChange={(v: string) => set('email', v)} placeholder="jordan@company.com" wide />
        <CountrySelect required value={data.country} onChange={(v: string) => set('country', v)} />
        <PhoneField country={data.country} value={data.phone} onChange={(v: string) => set('phone', v)} />
      </div>
    </div>
  );
  if (step === 3) return (
    <div>
      <QHead n="04" title="Where is the lab?" sub="The testing site sets install scheduling, lead time and which service team covers you." m={m} />
      <div style={grid}>
        <QField label="Company" required value={data.company} onChange={(v: string) => set('company', v)} placeholder="Company name" />
        <QField label="Lab city" required value={data.city} onChange={(v: string) => set('city', v)} placeholder="City where testing is done" />
      </div>
      <div style={{ marginTop: 34, maxWidth: 720 }}>
        <span style={{ display: 'block', fontWeight: 700, fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>How did you hear about us?</span>
        <QChips options={['Google Search', 'LinkedIn', 'Referral', 'Tradeshow', 'Magazine', 'YouTube', 'Social media', 'Other']} value={data.heard} onChange={(v: string) => set('heard', v)} />
      </div>
    </div>
  );
  const specimens = rec.samples.map((s: any) => s.standard + ' ' + s.name).join(', ');
  const ctry = getCountry(data.country);
  const lines: [string, string, number][] = [
    ['Specimens', specimens || '—', 0],
    ['Custom spec', data.otherSample.trim() || '—', 0],
    ['Daily volume', data.dailyIdx !== null ? (DAILY_OPTIONS[data.dailyIdx] || {}).label : '—', 1],
    ['Recommended machine', rec.name || '—', 1],
    ['Name', (data.first + ' ' + data.last).trim() || '—', 2],
    ['Business email', data.email || '—', 2],
    ['Country', ctry ? ctry.n : '—', 2],
    ['Phone', data.phone ? (ctry ? ctry.d : '') + ' ' + formatPhone(data.phone, ctry) : '—', 2],
    ['Company', data.company || '—', 3],
    ['Lab city', data.city || '—', 3],
    ['Heard about us', data.heard || '—', 3],
  ];
  return (
    <div>
      <QHead n="05" title="Review and send." sub="Everything below is editable — click a row or jump back from the rail above." m={m} />
      {rec.name && (
        <div style={{ marginTop: 30, maxWidth: 760, borderRadius: 20, background: '#000', color: '#fff', overflow: 'hidden', position: 'relative', display: 'grid', gridTemplateColumns: m ? '1fr' : 'minmax(0,1fr) 40%', alignItems: 'stretch' }}>
          <span style={{ position: 'absolute', width: 240, height: 60, top: -14, left: '38%', borderRadius: 60, background: '#17DDC5', opacity: 0.28, filter: 'blur(60px)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', padding: m ? '26px 22px 4px' : '32px 34px' }}>
            <div style={{ fontWeight: 700, fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--lc-teal)' }}>Your match</div>
            <div style={{ marginTop: 12, fontWeight: 600, fontSize: m ? 26 : 32, letterSpacing: '-0.02em', lineHeight: 1.1 }}>{rec.name} looks like your perfect match.</div>
            <p style={{ margin: '14px 0 0', fontSize: 14.5, lineHeight: 1.6, fontWeight: 300, color: 'rgba(255,255,255,0.62)' }}>
              {rec.blurb} Our team will call to evaluate your workflow in more detail, confirm the best possible match and send everything you need — pricing, lead time and the full specification.
            </p>
          </div>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: m ? '0 22px 26px' : '32px 24px', minHeight: m ? 190 : 0 }}>
            <img src={rec.img} alt={rec.name + ' automated tensile testing machine'} style={{ width: '100%', maxWidth: m ? 240 : 300, height: 'auto', display: 'block', objectFit: 'contain' }} />
          </div>
        </div>
      )}
      <div style={{ marginTop: 30, maxWidth: 760, display: 'grid', gridTemplateColumns: m ? '1fr' : '1fr 1fr', gap: '0 40px' }}>
        {lines.map(([k, v, i]) => (
          <button key={k} onClick={() => go(i)} className="qw-row"
            style={{ all: 'unset', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', gap: 16, padding: '13px 0', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
            <span style={{ fontSize: 14, fontWeight: 300, color: 'var(--text-muted)', flex: 'none' }}>{k}</span>
            <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--lc-ink)', textAlign: 'right' }}>{v}</span>
          </button>
        ))}
      </div>
      <div style={{ marginTop: 34, maxWidth: 720 }}>
        <span style={{ display: 'block', fontWeight: 700, fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Anything else we should know?</span>
        <textarea className="qw-input" rows={3} value={data.message} onChange={(e) => set('message', e.target.value)} placeholder="Current equipment, timelines, specimen types…"
          style={{ width: '100%', boxSizing: 'border-box', marginTop: 10, border: 'none', borderBottom: '1px solid rgba(0,0,0,0.14)', background: 'transparent', padding: '12px 0', fontFamily: 'inherit', fontWeight: 300, fontSize: 17, resize: 'vertical', outline: 'none', color: 'var(--lc-ink)' }} />
        <label style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 22, cursor: 'pointer', fontSize: 14, color: 'var(--text-muted)', fontWeight: 300 }}>
          <input type="checkbox" checked={data.subscribe} onChange={(e) => set('subscribe', e.target.checked)} style={{ width: 17, height: 17, accentColor: '#000' }} />
          Subscribe for company updates
        </label>
      </div>
    </div>
  );
}

function QDone({ data, rec, reset }: any) {
  const m = useBP(1040);
  const brochureHref = rec.name ? RESOURCE_HREF[rec.name] : undefined;
  return (
    <div style={{ padding: m ? '56px 24px 64px' : '88px 44px 96px', textAlign: 'center' }}>
      <span style={{ width: 56, height: 56, borderRadius: '50%', background: '#17DDC5', color: '#000', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M5 13l4.5 4.5L19 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </span>
      <h2 style={{ fontWeight: 600, fontSize: m ? 30 : 44, letterSpacing: '-0.03em', lineHeight: 1.1, margin: '26px 0 0', color: 'var(--lc-ink)' }}>Request received, {data.first || 'there'}.</h2>
      <p style={{ margin: '16px auto 0', maxWidth: 540, fontWeight: 300, fontSize: 17, lineHeight: 1.6, color: 'var(--text-muted)' }}>
        Your {rec.name || 'system'} quote is being prepared for {data.company || 'your lab'}. A specialist replies to {data.email || 'your inbox'} within one business day.
      </p>
      <div style={{ marginTop: 30, display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
        {brochureHref
          ? <Button variant="dark" size="sm" href={brochureHref}>Request a Brochure</Button>
          : <Button variant="dark" size="sm" href="https://www.labscubed.com/cubego">Request a Brochure</Button>}
        <button onClick={reset} className="qw-edit" style={{ all: 'unset', cursor: 'pointer', fontSize: 14, fontWeight: 500, color: 'var(--text-muted)', padding: '11px 4px' }}>Start another request</button>
      </div>
    </div>
  );
}

export default function QuoteWizard() {
  const m = useBP(1040);
  const sm = useBP(560);
  const [step, setStep] = React.useState(0);
  const [dir, setDir] = React.useState(1);
  const [data, setData] = React.useState<Data>(BLANK);
  const [sent, setSent] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [sendError, setSendError] = React.useState('');
  const [nudge, setNudge] = React.useState(false);
  const first = React.useRef(true);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem('lc-quote-wizard-v2');
      if (raw) {
        const s = JSON.parse(raw);
        if (s.data) setData({ ...BLANK, ...s.data });
        if (typeof s.step === 'number') setStep(Math.min(s.step, STEPS.length - 1));
      }
    } catch (e) { /* ignore */ }
    first.current = false;
  }, []);
  React.useEffect(() => {
    if (first.current) return;
    try { localStorage.setItem('lc-quote-wizard-v2', JSON.stringify({ step, data })); } catch (e) { /* ignore */ }
  }, [step, data]);

  const set = (k: keyof Data, v: any) => setData((d) => ({ ...d, [k]: v }));
  const toggleSample = (id: string) => setData((d) => {
    const cur = d.selected;
    if (cur.includes(id)) return { ...d, selected: cur.filter((x) => x !== id) };
    const mat = (getSample(id) || ({} as any)).material;
    const sameMat = cur.filter((x) => (getSample(x) || ({} as any)).material === mat);
    return { ...d, selected: [...sameMat, id] };
  });
  const go = (i: number) => { if (i === step) return; setDir(i > step ? 1 : -1); setNudge(false); setStep(Math.max(0, Math.min(STEPS.length - 1, i))); };
  const next = () => { if (!stepValid(step, data)) { setNudge(true); return; } go(step + 1); };
  const rec = recommendMachine(data.selected, data.dailyIdx, data.otherSample);
  const canNext = stepValid(step, data);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = (e.target as HTMLElement).tagName;
      if (t === 'INPUT' || t === 'TEXTAREA') return;
      if (e.key === 'ArrowRight' && step < STEPS.length - 1) next();
      if (e.key === 'ArrowLeft' && step > 0) go(step - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const submit = async () => {
    if (sending) return;
    setSending(true);
    setSendError('');
    const ctry = getCountry(data.country);
    try {
      const r = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first: data.first, last: data.last, email: data.email,
          country: data.country, countryName: ctry ? ctry.n : '',
          phoneDisplay: data.phone && ctry ? `${ctry.d} ${formatPhone(data.phone, ctry)}` : '',
          company: data.company, city: data.city,
          heard: data.heard, message: data.message, subscribe: data.subscribe,
          specimens: rec.samples.map((s: any) => ({ id: s.id, standard: s.standard, name: s.name })),
          otherSample: data.otherSample,
          dailyVolume: data.dailyIdx !== null ? (DAILY_OPTIONS[data.dailyIdx] || {}).label : '',
          recommendedMachine: rec.name,
          source: location.pathname, landing_page: location.pathname, referrer: document.referrer || '',
        }),
      });
      const resp = await r.json().catch(() => ({}));
      if (r.ok && resp && resp.success) {
        setSent(true);
        try { localStorage.removeItem('lc-quote-wizard-v2'); } catch (e) { /* ignore */ }
      } else {
        setSendError(resp?.error || 'Something went wrong. Please try again.');
      }
    } catch (e) {
      setSendError('Something went wrong. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: m ? '1fr' : 'minmax(0,1fr) 360px', gap: m ? 28 : 40, alignItems: 'start' }}>
      <div style={{ background: '#fff', borderRadius: 24, boxShadow: 'var(--shadow-edge), 0 20px 50px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        {sent ? <QDone data={data} rec={rec} reset={() => { setData(BLANK); setStep(0); setSent(false); }} /> : (
          <React.Fragment>
            <QRail step={step} go={go} data={data} m={m} sm={sm} />
            <div style={{ padding: sm ? '30px 18px 14px' : m ? '38px 24px 16px' : '56px 44px 24px', minHeight: m ? 0 : 380 }}>
              <div key={step} className="qw-panel" style={{ '--qw-dx': dir > 0 ? '34px' : '-34px' } as any}>
                <QPanel step={step} data={data} set={set} toggleSample={toggleSample} go={go} rec={rec} m={m} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: sm ? '14px 18px' : m ? '28px 24px 32px' : '36px 44px 40px', marginTop: 8, borderTop: '1px solid rgba(0,0,0,0.07)', flexWrap: 'wrap', position: sm ? 'sticky' : 'static', bottom: 0, background: '#fff', zIndex: 12, boxShadow: sm ? '0 -6px 18px rgba(0,0,0,0.06)' : 'none' }}>
              <button onClick={() => go(step - 1)} disabled={step === 0} className="qw-back"
                style={{ all: 'unset', cursor: step === 0 ? 'default' : 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10, minHeight: 44, fontSize: 14, fontWeight: 500, color: 'var(--text-muted)', opacity: step === 0 ? 0.3 : 1 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>Back
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: sm ? 12 : 20 }}>
                <span style={{ fontSize: 13, fontWeight: 300, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Step {step + 1} of {STEPS.length}</span>
                {step === STEPS.length - 1
                  ? <Button variant="primary" size="md" href="#" onClick={(e: any) => { e.preventDefault(); if (!canNext) { setNudge(true); return; } submit(); }} style={sending ? { opacity: 0.6, pointerEvents: 'none' } : undefined}>{sending ? 'Sending…' : 'Send request'}</Button>
                  : <Button variant={canNext ? 'primary' : 'dark'} size="md" href="#" onClick={(e: any) => { e.preventDefault(); next(); }} style={canNext ? undefined : { opacity: 0.35 }}>Continue</Button>}
              </div>
            </div>
            {nudge && !canNext && <div style={{ padding: m ? '0 24px 28px' : '0 44px 36px', marginTop: -20, fontSize: 13, color: '#B4231C' }}>Complete this step to continue — or use the rail above to revisit an earlier answer.</div>}
            {sendError && <div style={{ padding: m ? '0 24px 28px' : '0 44px 36px', marginTop: -20, fontSize: 13, color: '#B4231C' }}>{sendError}</div>}
          </React.Fragment>
        )}
      </div>
      <QSummary data={data} rec={rec} go={go} m={m} />
    </div>
  );
}
