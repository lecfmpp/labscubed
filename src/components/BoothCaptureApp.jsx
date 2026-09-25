import React from 'react';
import { getWebinar, COLORS } from './webinarConfig.js';
import { track } from '../lib/track';

/* Booth capture — the tablet at the stand.
 *
 * Deliberately not the website's registration flow. Someone is standing in front
 * of us with a queue behind them, so it is three fields on one screen, no
 * details modal, no scrolling to find the button: name, work email, company, and
 * a tick against whatever they want emailed. The white paper is pre-ticked
 * because it is the thing most people at a show ask for.
 *
 * Everything the visitor picks is sent by the same machinery the website's own
 * download forms use — see netlify/functions/booth-capture.mjs.
 */

const ENDPOINT = '/api/booth/capture';

// Fallback if the registry has no booth block; keeps the page working rather
// than rendering an empty chooser.
const DEFAULT_ASSETS = [
  {
    id: 'whitepaper',
    name: 'The white paper',
    line: 'Beyond the Bottleneck — the data-backed business case for automating tensile testing.',
    defaultOn: true,
  },
  {
    id: 'cubeten-brochure',
    name: 'CubeTen brochure',
    line: 'Automated tensile testing for plastics and adhesives — ASTM D638 / ISO 527.',
  },
  {
    id: 'cubeone-brochure',
    name: 'CubeOne brochure',
    line: 'Automated tensile testing for rubber and elastomers — ASTM D412 / ISO 37.',
  },
];

function useM(bp = 760) {
  const [m, setM] = React.useState(typeof window !== 'undefined' && window.innerWidth <= bp);
  React.useEffect(() => {
    const on = () => setM(window.innerWidth <= bp);
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, [bp]);
  return m;
}

function Check({ on }) {
  return (
    <span
      aria-hidden="true"
      style={{
        flex: 'none',
        width: 26,
        height: 26,
        borderRadius: 9,
        border: on ? `2px solid ${COLORS.teal}` : '2px solid rgba(0,0,0,0.18)',
        background: on ? COLORS.teal : '#fff',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background .15s ease, border-color .15s ease',
      }}
    >
      {on && (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
          <path d="M5 13l4 4 10-11" stroke="#000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </span>
  );
}

export default function BoothCaptureApp({ slug }) {
  const CONFIG = React.useMemo(() => getWebinar(slug), [slug]);
  const booth = CONFIG.booth || {};
  const assets = booth.assets && booth.assets.length ? booth.assets : DEFAULT_ASSETS;
  const m = useM();

  const [form, setForm] = React.useState({ name: '', email: '', company: '' });
  const [picked, setPicked] = React.useState(() => assets.filter((a) => a.defaultOn).map((a) => a.id));
  const [status, setStatus] = React.useState('idle'); // idle | sending
  const [error, setError] = React.useState('');

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));
  const toggle = (id) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  async function submit(e) {
    e.preventDefault();
    if (!picked.length) {
      setError('Tick at least one thing to send.');
      return;
    }
    setStatus('sending');
    setError('');
    try {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          assets: picked,
          event_slug: CONFIG.slug,
          source: window.location.pathname,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }
      track('generate_lead', { form: 'booth', webinar_slug: CONFIG.slug });
      try {
        // The confirmation screen names what is actually on its way, and the
        // staff need to know if a personal address blocked the send.
        sessionStorage.setItem(
          `lc-booth-${CONFIG.slug}`,
          JSON.stringify({ name: form.name, email: form.email, sent: data.sent, failed: data.failed }),
        );
      } catch { /* private mode — the page falls back to generic copy */ }
      window.location.href = `${booth.thankYouUrl || `/events/${CONFIG.slug}/booth/thank-you/`}`;
    } catch (err) {
      console.error('Booth capture failed:', err);
      setError('That did not go through. Check the connection and try again.');
      setStatus('idle');
    }
  }

  const label = { display: 'block', fontSize: 13, fontWeight: 600, color: COLORS.muted, marginBottom: 8 };
  const field = {
    width: '100%',
    boxSizing: 'border-box',
    padding: m ? '16px 16px' : '17px 18px',
    borderRadius: 14,
    border: '1px solid rgba(0,0,0,0.14)',
    background: '#fff',
    color: COLORS.ink,
    // 16px minimum or iOS zooms the whole page on focus — on a booth tablet
    // that leaves the staff pinching back out between visitors.
    fontSize: 16.5,
    fontFamily: 'inherit',
    outline: 'none',
  };

  return (
    <section style={{ background: '#000', color: '#fff' }}>
      <div style={{ maxWidth: 940, margin: '0 auto', padding: m ? '28px 18px 56px' : '56px 32px 80px' }}>
        <div style={{ textAlign: 'center' }}>
          {/* Us and the show, one lockup. The white card is not decoration: the
              show's logo is dark artwork on white, so on the black page it needs
              a light surface to sit on — the same treatment the webinar
              partnership badge uses. */}
          {booth.showLogo ? (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: m ? 14 : 20, padding: m ? '12px 18px' : '14px 24px', borderRadius: 16, background: '#fff', boxShadow: '0 18px 36px rgba(0,0,0,0.3)' }}>
              <img
                src="/assets/img/logo-dark.webp"
                alt="LabsCubed"
                width={Math.round((266 / 60) * (m ? 20 : 24))}
                height={m ? 20 : 24}
                style={{ height: m ? 20 : 24, width: 'auto', display: 'block' }}
              />
              <span aria-hidden="true" style={{ width: 1, alignSelf: 'stretch', background: 'rgba(0,0,0,0.14)', flex: 'none' }} />
              <img
                src={booth.showLogo.src}
                alt={booth.showLogo.alt || ''}
                width={Math.round(((booth.showLogo.width || 249) / (booth.showLogo.nativeHeight || 118)) * ((booth.showLogo.height || 34) * (m ? 0.82 : 1)))}
                height={Math.round((booth.showLogo.height || 34) * (m ? 0.82 : 1))}
                style={{ height: Math.round((booth.showLogo.height || 34) * (m ? 0.82 : 1)), width: 'auto', display: 'block' }}
              />
            </div>
          ) : (
            <img
              src="/assets/img/logo.webp"
              alt="LabsCubed"
              width={419}
              height={104}
              style={{ height: m ? 26 : 30, width: 'auto', display: 'block', margin: '0 auto' }}
            />
          )}
          <h1 style={{ fontWeight: 700, fontSize: m ? 28 : 40, letterSpacing: '-0.02em', lineHeight: 1.12, margin: m ? '22px 0 0' : '28px 0 0' }}>
            {booth.heading || 'Thanks for stopping by our booth.'}
          </h1>
          <p style={{ margin: m ? '12px auto 0' : '16px auto 0', maxWidth: 560, fontWeight: 300, fontSize: m ? 15 : 17.5, lineHeight: 1.55, color: 'rgba(255,255,255,0.6)' }}>
            {booth.lede || 'Tell us where to send it and tick what you would like — it lands in your inbox before you leave the stand.'}
          </p>
        </div>

        <form
          onSubmit={submit}
          style={{
            marginTop: m ? 26 : 36,
            background: '#fff',
            borderRadius: 22,
            padding: m ? '22px 18px' : '32px 32px 30px',
            display: 'flex',
            flexDirection: 'column',
            gap: m ? 16 : 18,
            boxShadow: '0 24px 48px rgba(0,0,0,0.35)',
          }}
        >
          {error && (
            <div style={{ padding: '13px 15px', borderRadius: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#c0362c', fontSize: 14 }}>{error}</div>
          )}

          <div>
            <label style={label} htmlFor="bc-name">Full name</label>
            <input id="bc-name" type="text" required autoComplete="off" placeholder="Jane Doe" style={field} value={form.name} onChange={set('name')} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: m ? '1fr' : '1fr 1fr', gap: m ? 16 : 18 }}>
            <div>
              <label style={label} htmlFor="bc-email">Work email</label>
              <input id="bc-email" type="email" required autoComplete="off" placeholder="jane@company.com" style={field} value={form.email} onChange={set('email')} />
            </div>
            <div>
              <label style={label} htmlFor="bc-company">Company</label>
              <input id="bc-company" type="text" required autoComplete="off" placeholder="Company Inc." style={field} value={form.company} onChange={set('company')} />
            </div>
          </div>

          <div>
            <div style={{ ...label, marginBottom: 10 }}>What should we send you?</div>
            <div style={{ display: 'grid', gridTemplateColumns: m ? '1fr' : 'repeat(3, 1fr)', gap: m ? 10 : 14 }}>
              {assets.map((a) => {
                const on = picked.includes(a.id);
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => toggle(a.id)}
                    aria-pressed={on}
                    style={{
                      all: 'unset',
                      boxSizing: 'border-box',
                      cursor: 'pointer',
                      display: 'flex',
                      gap: 12,
                      alignItems: 'flex-start',
                      padding: m ? '14px 14px' : '16px 16px',
                      borderRadius: 16,
                      border: on ? `2px solid ${COLORS.teal}` : '2px solid rgba(0,0,0,0.1)',
                      background: on ? 'rgba(23,221,197,0.08)' : '#fff',
                      transition: 'border-color .15s ease, background .15s ease',
                    }}
                  >
                    <Check on={on} />
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: 'block', fontWeight: 700, fontSize: 15, color: COLORS.ink, lineHeight: 1.3 }}>{a.name}</span>
                      <span style={{ display: 'block', marginTop: 5, fontWeight: 300, fontSize: 13, lineHeight: 1.45, color: COLORS.muted }}>{a.line}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={status === 'sending'}
            style={{
              marginTop: 4,
              padding: m ? '17px 24px' : '18px 28px',
              borderRadius: 999,
              border: 'none',
              background: status === 'sending' ? '#ccc' : COLORS.teal,
              color: '#000',
              fontWeight: 700,
              fontSize: 17,
              fontFamily: 'inherit',
              cursor: status === 'sending' ? 'not-allowed' : 'pointer',
            }}
          >
            {status === 'sending' ? 'Sending…' : (booth.submitLabel || 'Send it to me')}
          </button>

          <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5, fontWeight: 300, color: COLORS.muted, textAlign: 'center' }}>
            Sent straight to your inbox. We use a work email because the files are gated.
          </p>
        </form>
      </div>
    </section>
  );
}
