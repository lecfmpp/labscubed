// White-paper lead form — same two-step pattern as the webinar RegistrationApp
// (basic fields, then a details modal) so the design system's richer
// qualification form is used here too, instead of the single-email CTABanner
// form. Submits to the existing `download-request` Supabase edge function
// (asset: "whitepaper"), which emails the PDF, logs the lead, and tags the
// contact into the "Downloaded - White Paper" Resend segment — unchanged.
import React from 'react';

const COLORS = {
  teal: '#17ddc5',
  ink: '#1d1d1f',
  muted: '#86868b',
  line: 'rgba(0,0,0,0.1)',
};

const ENDPOINT = 'https://grozewxrymeiruhggcdy.supabase.co/functions/v1/download-request';
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
const COOKIE = 'lc_first_touch';
const MAX_AGE = 60 * 60 * 24 * 90; // 90 days

function getCookie(name) {
  const m = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
  return m ? decodeURIComponent(m.pop()) : '';
}
function setCookie(name, value) {
  document.cookie = `${name}=${encodeURIComponent(value)};path=/;max-age=${MAX_AGE};SameSite=Lax`;
}
function currentUtms() {
  const p = new URLSearchParams(location.search);
  const o = {};
  let any = false;
  UTM_KEYS.forEach((k) => { const v = p.get(k); if (v) { o[k] = v; any = true; } });
  return any ? o : null;
}
function firstTouch() {
  let s = {};
  try { s = JSON.parse(getCookie(COOKIE) || '{}') || {}; } catch { s = {}; }
  const has = s.utm_source || s.utm_medium || s.utm_campaign || s.utm_content || s.utm_term;
  if (!has) {
    const cur = currentUtms();
    if (cur) {
      cur.landing_page = location.pathname;
      cur.referrer = document.referrer || '';
      cur.ts = new Date().toISOString();
      setCookie(COOKIE, JSON.stringify(cur));
      s = cur;
    }
  }
  return s;
}

function useM(bp = 760) {
  const [m, setM] = React.useState(typeof window !== 'undefined' && window.innerWidth <= bp);
  React.useEffect(() => {
    const on = () => setM(window.innerWidth <= bp);
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, [bp]);
  return m;
}

const fieldLabel = { fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.55)', display: 'block', marginBottom: 6 };
const fieldInput = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.06)', fontSize: 14, fontFamily: 'inherit', color: '#fff', outline: 'none', boxSizing: 'border-box' };
const modalFieldLabel = { fontSize: 12, fontWeight: 600, color: COLORS.muted, display: 'block', marginBottom: 6 };
const modalFieldInput = { width: '100%', padding: '12px 14px', borderRadius: 10, border: `1px solid ${COLORS.line}`, background: '#fff', fontSize: 14, fontFamily: 'inherit', color: COLORS.ink, outline: 'none', boxSizing: 'border-box' };

function Field({ label, dark, children }) {
  return <div><label style={dark ? fieldLabel : modalFieldLabel}>{label}</label>{children}</div>;
}

function DetailsModal({ onClose, onComplete, submitting }) {
  const m = useM();
  const [d, setD] = React.useState({ website: '', role: '', industry: '', materials: '', volume: '', location: '' });
  const set = (k) => (e) => setD((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onComplete(d);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: m ? 12 : 20 }} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 30px 60px rgba(0,0,0,0.25)', padding: m ? '26px 20px 24px' : '36px 36px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ margin: 0, fontWeight: 700, fontSize: 24, letterSpacing: '-0.01em', color: COLORS.ink }}>A few more details</h3>
            <p style={{ margin: '8px 0 0', fontSize: 14, fontWeight: 300, color: COLORS.muted, maxWidth: 420 }}>Helps us tailor the white paper's follow-up to your lab.</p>
          </div>
          <button onClick={onClose} aria-label="Close" style={{ all: 'unset', cursor: 'pointer', padding: 6 }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke={COLORS.muted} strokeWidth="2" strokeLinecap="round" /></svg></button>
        </div>
        <form onSubmit={handleSubmit} style={{ marginTop: 26, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Field label="Company Website"><div style={{ position: 'relative' }}><div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 14, fontWeight: 600, color: COLORS.muted, pointerEvents: 'none' }}>https://</div><input type="text" required placeholder="yourcompany.com" style={{ ...modalFieldInput, paddingLeft: 90 }} value={d.website} onChange={set('website')} /></div></Field>
          <div style={{ display: 'grid', gridTemplateColumns: m ? '1fr' : '1fr 1fr', gap: 16 }}>
            <Field label="Role"><select required style={modalFieldInput} value={d.role} onChange={set('role')}><option value="" disabled>Select role</option><option>Lab Manager</option><option>Quality Director</option><option>R&D Engineer</option><option>VP Operations</option><option>Plant Manager</option><option>Other</option></select></Field>
            <Field label="Industry"><select required style={modalFieldInput} value={d.industry} onChange={set('industry')}><option value="" disabled>Select industry</option><option>Rubber & Elastomers</option><option>Plastics & Polymers</option><option>Automotive</option><option>Aerospace</option><option>Composites</option><option>Other</option></select></Field>
          </div>
          <Field label="Materials You Test"><input type="text" placeholder="e.g. EPDM, Nylon 66, TPU" style={modalFieldInput} value={d.materials} onChange={set('materials')} /></Field>
          <div style={{ display: 'grid', gridTemplateColumns: m ? '1fr' : '1fr 1fr', gap: 16 }}>
            <Field label="Daily Test Volume"><select required style={modalFieldInput} value={d.volume} onChange={set('volume')}><option value="" disabled>Select range</option><option>1–10 samples/day</option><option>11–50 samples/day</option><option>51–150 samples/day</option><option>150+ samples/day</option></select></Field>
            <Field label="Laboratory Location"><input type="text" required placeholder="City, Country" style={modalFieldInput} value={d.location} onChange={set('location')} /></Field>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button type="button" onClick={onClose} style={{ flex: 'none', padding: '13px 20px', borderRadius: 999, border: `1px solid ${COLORS.line}`, background: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer', color: COLORS.ink }}>Back</button>
            <button type="submit" disabled={submitting} style={{ flex: 1, padding: '13px 20px', borderRadius: 999, border: 'none', background: submitting ? '#ccc' : COLORS.teal, fontWeight: 600, fontSize: 14, cursor: submitting ? 'not-allowed' : 'pointer', color: '#000' }}>{submitting ? 'Sending…' : 'Get the White Paper'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function WhitePaperForm() {
  const m = useM();
  const [basic, setBasic] = React.useState({ name: '', email: '', company: '' });
  const [showModal, setShowModal] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState('');
  const [done, setDone] = React.useState(false);

  const set = (k) => (e) => setBasic((p) => ({ ...p, [k]: e.target.value }));

  async function complete(details) {
    setSubmitting(true);
    setError('');
    const ft = firstTouch();
    const payload = {
      email: basic.email,
      name: basic.name,
      company: basic.company,
      website: details.website.startsWith('http') ? details.website : `https://${details.website}`,
      role: details.role,
      industry: details.industry,
      materials: details.materials,
      volume: details.volume,
      location: details.location,
      asset: 'whitepaper',
      source: location.pathname,
      utm_source: ft.utm_source || '',
      utm_medium: ft.utm_medium || '',
      utm_campaign: ft.utm_campaign || '',
      utm_content: ft.utm_content || '',
      utm_term: ft.utm_term || '',
      referrer: ft.referrer || document.referrer || '',
      landing_page: ft.landing_page || location.pathname,
    };
    try {
      const resp = await fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await resp.json().catch(() => ({}));
      if (resp.ok && data && data.success) {
        setShowModal(false);
        setDone(true);
      } else if (resp.status === 422) {
        setError('Please use your work email.');
        setShowModal(false);
      } else {
        setError('Something went wrong. Please try again.');
        setShowModal(false);
      }
    } catch (err) {
      console.error('White paper submit failed:', err);
      setError('Something went wrong. Please try again.');
      setShowModal(false);
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div style={{ marginTop: 36, display: 'flex', alignItems: 'center', gap: 14, padding: '18px 22px', borderRadius: 16, background: 'rgba(23,221,197,0.1)', border: '1px solid rgba(23,221,197,0.3)', maxWidth: 423 }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="11" fill={COLORS.teal} opacity="0.25" /><path d="M7 12.5l3.2 3.2L17 9" stroke={COLORS.teal} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
        <span style={{ fontSize: 14.5, fontWeight: 500, color: '#fff' }}>Check your inbox! Your white paper is on the way to {basic.email}.</span>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={(e) => { e.preventDefault(); setShowModal(true); }} style={{ marginTop: 36, display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 423 }}>
        {error && <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', fontSize: 13.5 }}>{error}</div>}
        <div style={{ display: 'grid', gridTemplateColumns: m ? '1fr' : '1fr 1fr', gap: 12 }}>
          <Field label="Full Name" dark><input type="text" required placeholder="Jane Doe" style={fieldInput} value={basic.name} onChange={set('name')} /></Field>
          <Field label="Company Name" dark><input type="text" required placeholder="Company Inc." style={fieldInput} value={basic.company} onChange={set('company')} /></Field>
        </div>
        <Field label="Work Email" dark><input type="email" required placeholder="jane@company.com" style={fieldInput} value={basic.email} onChange={set('email')} /></Field>
        <button type="submit" style={{ marginTop: 4, padding: '15px 20px', borderRadius: 999, border: 'none', background: COLORS.teal, fontWeight: 600, fontSize: 14.5, cursor: 'pointer', color: '#000' }}>Download Now</button>
      </form>
      {showModal && <DetailsModal onClose={() => setShowModal(false)} onComplete={complete} submitting={submitting} />}
    </>
  );
}
