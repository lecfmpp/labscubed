import React from 'react';
import { COLORS } from './webinarConfig.js';

/* "Ask us to call you" — the alternative to picking a slot on the calendar.
 *
 * Someone who does not know their schedule yet should not have to leave the page
 * with nothing arranged, so this takes a phone number and hands it to the team.
 * It lives on the confirmation page rather than the registration form because
 * that is where the calendar is, and this is the answer to "I can't commit to a
 * time" — asking for it earlier taxes every registrant for the few who need it.
 *
 * The email it files against comes from the registration that got them here
 * (stashed at submit time). If that is missing — a shared or bookmarked link —
 * the form asks for the email too rather than dropping the request.
 */

// Dial codes for the countries this audience actually comes from, most likely
// first. The flag is an emoji rather than an image so there is nothing to load;
// Windows renders it as the two-letter code, which is why the code and country
// name are always in the label too.
const COUNTRIES = [
  ['US', '🇺🇸', 'United States', '+1'],
  ['CA', '🇨🇦', 'Canada', '+1'],
  ['GB', '🇬🇧', 'United Kingdom', '+44'],
  ['DE', '🇩🇪', 'Germany', '+49'],
  ['FR', '🇫🇷', 'France', '+33'],
  ['IT', '🇮🇹', 'Italy', '+39'],
  ['ES', '🇪🇸', 'Spain', '+34'],
  ['PT', '🇵🇹', 'Portugal', '+351'],
  ['NL', '🇳🇱', 'Netherlands', '+31'],
  ['BE', '🇧🇪', 'Belgium', '+32'],
  ['CH', '🇨🇭', 'Switzerland', '+41'],
  ['AT', '🇦🇹', 'Austria', '+43'],
  ['SE', '🇸🇪', 'Sweden', '+46'],
  ['NO', '🇳🇴', 'Norway', '+47'],
  ['DK', '🇩🇰', 'Denmark', '+45'],
  ['FI', '🇫🇮', 'Finland', '+358'],
  ['IE', '🇮🇪', 'Ireland', '+353'],
  ['PL', '🇵🇱', 'Poland', '+48'],
  ['CZ', '🇨🇿', 'Czechia', '+420'],
  ['TR', '🇹🇷', 'Türkiye', '+90'],
  ['MX', '🇲🇽', 'Mexico', '+52'],
  ['BR', '🇧🇷', 'Brazil', '+55'],
  ['AR', '🇦🇷', 'Argentina', '+54'],
  ['CL', '🇨🇱', 'Chile', '+56'],
  ['CO', '🇨🇴', 'Colombia', '+57'],
  ['IN', '🇮🇳', 'India', '+91'],
  ['CN', '🇨🇳', 'China', '+86'],
  ['JP', '🇯🇵', 'Japan', '+81'],
  ['KR', '🇰🇷', 'South Korea', '+82'],
  ['TW', '🇹🇼', 'Taiwan', '+886'],
  ['TH', '🇹🇭', 'Thailand', '+66'],
  ['MY', '🇲🇾', 'Malaysia', '+60'],
  ['SG', '🇸🇬', 'Singapore', '+65'],
  ['ID', '🇮🇩', 'Indonesia', '+62'],
  ['VN', '🇻🇳', 'Vietnam', '+84'],
  ['AU', '🇦🇺', 'Australia', '+61'],
  ['NZ', '🇳🇿', 'New Zealand', '+64'],
  ['ZA', '🇿🇦', 'South Africa', '+27'],
  ['AE', '🇦🇪', 'United Arab Emirates', '+971'],
  ['SA', '🇸🇦', 'Saudi Arabia', '+966'],
  ['IL', '🇮🇱', 'Israel', '+972'],
  ['EG', '🇪🇬', 'Egypt', '+20'],
];

// A best guess so the common case needs no interaction: the browser's own time
// zone, falling back to the show's country.
const ZONE_HINTS = [
  [/^America\/(Toronto|Vancouver|Edmonton|Winnipeg|Halifax|Montreal|Regina|St_Johns)/, 'CA'],
  [/^America\/(Mexico|Cancun|Tijuana|Monterrey|Merida|Chihuahua)/, 'MX'],
  [/^America\/(Sao_Paulo|Bahia|Fortaleza|Recife|Manaus|Belem)/, 'BR'],
  [/^America\/Argentina/, 'AR'],
  [/^America\/Santiago/, 'CL'],
  [/^America\/Bogota/, 'CO'],
  [/^America\//, 'US'],
  [/^Europe\/(London|Belfast)/, 'GB'],
  [/^Europe\/Dublin/, 'IE'],
  [/^Europe\/(Berlin|Busingen)/, 'DE'],
  [/^Europe\/Paris/, 'FR'],
  [/^Europe\/Rome/, 'IT'],
  [/^Europe\/Madrid/, 'ES'],
  [/^Europe\/Lisbon/, 'PT'],
  [/^Europe\/Amsterdam/, 'NL'],
  [/^Europe\/Brussels/, 'BE'],
  [/^Europe\/Zurich/, 'CH'],
  [/^Europe\/Vienna/, 'AT'],
  [/^Europe\/Stockholm/, 'SE'],
  [/^Europe\/Oslo/, 'NO'],
  [/^Europe\/Copenhagen/, 'DK'],
  [/^Europe\/Helsinki/, 'FI'],
  [/^Europe\/Warsaw/, 'PL'],
  [/^Europe\/Prague/, 'CZ'],
  [/^Europe\/Istanbul/, 'TR'],
  [/^Asia\/(Kolkata|Calcutta)/, 'IN'],
  [/^Asia\/(Shanghai|Chongqing|Harbin)/, 'CN'],
  [/^Asia\/Tokyo/, 'JP'],
  [/^Asia\/Seoul/, 'KR'],
  [/^Asia\/Taipei/, 'TW'],
  [/^Asia\/Bangkok/, 'TH'],
  [/^Asia\/Kuala_Lumpur/, 'MY'],
  [/^Asia\/Singapore/, 'SG'],
  [/^Asia\/Jakarta/, 'ID'],
  [/^Asia\/Ho_Chi_Minh|^Asia\/Saigon/, 'VN'],
  [/^Asia\/Dubai/, 'AE'],
  [/^Asia\/Riyadh/, 'SA'],
  [/^Asia\/(Jerusalem|Tel_Aviv)/, 'IL'],
  [/^Africa\/Cairo/, 'EG'],
  [/^Africa\/Johannesburg/, 'ZA'],
  [/^Australia\//, 'AU'],
  [/^Pacific\/Auckland/, 'NZ'],
];

function guessCountry(fallback = 'US') {
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    const hit = ZONE_HINTS.find(([re]) => re.test(zone));
    if (hit) return hit[1];
  } catch { /* no Intl, or a locked-down browser */ }
  return fallback;
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

export default function CallbackRequest({ slug, kind, title, boothLabel, endpoint = '/api/webinar/callback' }) {
  const m = useM();
  const [country, setCountry] = React.useState('US');
  const [phone, setPhone] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [knownEmail, setKnownEmail] = React.useState('');
  const [status, setStatus] = React.useState('idle'); // idle | sending | done
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    setCountry(guessCountry());
    try {
      const stored = sessionStorage.getItem(`lc-reg-email-${slug}`) || '';
      if (stored) setKnownEmail(stored);
    } catch { /* private mode — the form asks for the email instead */ }
  }, [slug]);

  const dial = (COUNTRIES.find((c) => c[0] === country) || COUNTRIES[0])[3];

  async function submit(e) {
    e.preventDefault();
    const address = (knownEmail || email).trim();
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 6) {
      setError('That number looks too short — please check it.');
      return;
    }
    setStatus('sending');
    setError('');
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: address,
          phone: `${dial} ${phone.trim()}`,
          country,
          webinar_slug: slug,
          kind,
          webinar: title,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) throw new Error(data.error || `HTTP ${response.status}`);
      setStatus('done');
    } catch (err) {
      console.error('Callback request failed:', err);
      setError('Something went wrong. Please try again, or email info@labscubed.com.');
      setStatus('idle');
    }
  }

  const label = { display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.55)', marginBottom: 7 };
  const field = {
    width: '100%',
    boxSizing: 'border-box',
    padding: '14px 16px',
    borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.16)',
    background: 'rgba(255,255,255,0.06)',
    color: '#fff',
    fontSize: 15,
    fontFamily: 'inherit',
    outline: 'none',
  };

  if (status === 'done') {
    return (
      <div style={{ padding: m ? '24px 20px' : '30px 32px', borderRadius: 20, background: 'rgba(23,221,197,0.1)', border: '1px solid rgba(23,221,197,0.35)', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
        <span style={{ flex: 'none', width: 34, height: 34, borderRadius: '50%', background: COLORS.teal, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4 10-11" stroke="#000" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </span>
        <div>
          <h3 style={{ margin: 0, fontWeight: 700, fontSize: m ? 18 : 21, color: '#fff' }}>Got it — we'll call you.</h3>
          <p style={{ margin: '8px 0 0', fontWeight: 300, fontSize: m ? 14.5 : 15.5, lineHeight: 1.6, color: 'rgba(255,255,255,0.7)' }}>
            One of our team will reach out on <strong style={{ fontWeight: 600, color: '#fff' }}>{dial} {phone.trim()}</strong> to agree a time that works
            {boothLabel ? `, and we'll have CubeOne ready for you at ${boothLabel}.` : '.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: m ? '24px 20px' : '30px 32px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)' }}>
      <h3 style={{ margin: 0, fontWeight: 700, fontSize: m ? 20 : 24, letterSpacing: '-0.01em', color: '#fff' }}>Don't know your schedule yet?</h3>
      <p style={{ margin: '10px 0 0', maxWidth: 620, fontWeight: 300, fontSize: m ? 14.5 : 16, lineHeight: 1.6, color: 'rgba(255,255,255,0.6)' }}>
        Leave your number instead and one of our team will contact you to arrange the best time
        {boothLabel ? `, so the machine and a specialist are ready for you at ${boothLabel}.` : '.'}
      </p>

      <form onSubmit={submit} style={{ marginTop: m ? 20 : 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {error && (
          <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.14)', border: '1px solid rgba(239,68,68,0.35)', color: '#fca5a5', fontSize: 13.5 }}>{error}</div>
        )}

        {!knownEmail && (
          <div>
            <label style={label} htmlFor="cb-email">Work email</label>
            <input
              id="cb-email"
              type="email"
              required
              placeholder="jane@company.com"
              style={field}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        )}

        <div>
          <label style={label} htmlFor="cb-phone">Phone number</label>
          <div style={{ display: 'flex', gap: 10, flexDirection: m ? 'column' : 'row' }}>
            <select
              aria-label="Country code"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              style={{ ...field, width: m ? '100%' : 250, flex: 'none', appearance: 'auto', colorScheme: 'dark' }}
            >
              {COUNTRIES.map(([code, flag, name, dialCode]) => (
                <option key={code} value={code}>{`${flag} ${name} (${dialCode})`}</option>
              ))}
            </select>
            <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
              <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.75)', pointerEvents: 'none' }}>{dial}</span>
              <input
                id="cb-phone"
                type="tel"
                required
                autoComplete="tel"
                placeholder="555 000 0000"
                style={{ ...field, paddingLeft: 24 + dial.length * 10 }}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={status === 'sending'}
          style={{
            alignSelf: m ? 'stretch' : 'flex-start',
            marginTop: 4,
            padding: '15px 30px',
            borderRadius: 999,
            border: 'none',
            background: status === 'sending' ? 'rgba(23,221,197,0.5)' : COLORS.teal,
            color: '#000',
            fontWeight: 700,
            fontSize: 15,
            fontFamily: 'inherit',
            cursor: status === 'sending' ? 'not-allowed' : 'pointer',
          }}
        >
          {status === 'sending' ? 'Sending…' : 'Ask our team to call me'}
        </button>
      </form>
    </div>
  );
}
