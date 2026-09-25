import React from 'react';
import { getWebinar, youTubeId, COLORS } from './webinarConfig.js';

/* Booth confirmation — what the visitor sees for the ten seconds before they
 * hand the tablet back.
 *
 * It names what is actually on its way rather than a generic thank-you, plays
 * the CubeOne film in the same frame the other confirmation pages use, and ends
 * with the one control the booth staff need: start again for the next person.
 */

const ASSET_NAMES = {
  whitepaper: 'the white paper, Beyond the Bottleneck',
  'cubeten-brochure': 'the CubeTen brochure',
  'cubeone-brochure': 'the CubeOne brochure',
};

function useM(bp = 760) {
  const [m, setM] = React.useState(typeof window !== 'undefined' && window.innerWidth <= bp);
  React.useEffect(() => {
    const on = () => setM(window.innerWidth <= bp);
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, [bp]);
  return m;
}

function list(items) {
  if (items.length <= 1) return items[0] || '';
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

export default function BoothThankYou({ slug }) {
  const CONFIG = React.useMemo(() => getWebinar(slug), [slug]);
  const booth = CONFIG.booth || {};
  const m = useM();
  const [capture, setCapture] = React.useState(null);

  React.useEffect(() => {
    try {
      const raw = sessionStorage.getItem(`lc-booth-${CONFIG.slug}`);
      if (raw) setCapture(JSON.parse(raw));
    } catch { /* private mode — generic copy is fine */ }
  }, [CONFIG.slug]);

  const firstName = (capture?.name || '').trim().split(/\s+/)[0];
  const sent = (capture?.sent || []).map((id) => ASSET_NAMES[id] || id);
  const failed = capture?.failed || [];
  const needsWorkEmail = failed.some((f) => f.status === 422);
  const videoId = youTubeId(booth.videoUrl || CONFIG.onDemandVideoUrl);
  const boothUrl = `/events/${CONFIG.slug}/booth/`;

  return (
    <section style={{ background: '#000', color: '#fff' }}>
      <div style={{ maxWidth: 940, margin: '0 auto', padding: m ? '32px 18px 56px' : '64px 32px 80px', textAlign: 'center' }}>
        <span style={{ width: m ? 52 : 60, height: m ? 52 : 60, borderRadius: '50%', background: COLORS.teal, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width={m ? 24 : 28} height={m ? 24 : 28} viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4 10-11" stroke="#000" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </span>

        <h1 style={{ fontWeight: 700, fontSize: m ? 30 : 44, letterSpacing: '-0.02em', lineHeight: 1.1, margin: m ? '20px 0 0' : '26px 0 0' }}>
          {firstName ? `Thanks, ${firstName} — it's on its way.` : "It's on its way."}
        </h1>

        <p style={{ margin: m ? '14px auto 0' : '18px auto 0', maxWidth: 620, fontWeight: 300, fontSize: m ? 15.5 : 18, lineHeight: 1.6, color: 'rgba(255,255,255,0.6)' }}>
          {sent.length
            ? <>We've sent {list(sent)} to <strong style={{ fontWeight: 600, color: '#fff' }}>{capture.email}</strong>. It should land in a minute or two.</>
            : 'Check your inbox in a minute or two — what you picked is on its way.'}
        </p>

        {needsWorkEmail && (
          <div style={{ margin: m ? '18px auto 0' : '22px auto 0', maxWidth: 620, padding: '14px 18px', borderRadius: 14, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.35)' }}>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: '#fcd34d' }}>
              One of those needs a work email — personal addresses can't receive the gated files. Ask us at the stand and we'll send it across.
            </p>
          </div>
        )}

        {videoId && (
          <div style={{ margin: m ? '30px auto 0' : '44px auto 0', maxWidth: 840 }}>
            <p style={{ margin: '0 0 14px', fontSize: 12, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)' }}>
              {booth.videoLabel || 'While you are here'}
            </p>
            {/* Padding-bottom ratio keeps the iframe 16:9 at every width — the
                same frame the other confirmation pages use. */}
            <div style={{ position: 'relative', width: '100%', paddingBottom: '56.25%', borderRadius: 20, overflow: 'hidden', background: '#000', border: '1px solid rgba(255,255,255,0.1)' }}>
              <iframe
                src={`https://www.youtube.com/embed/${videoId}`}
                title={booth.videoLabel || "LabsCubed automated tensile testing"}
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
              />
            </div>
          </div>
        )}

        <div style={{ marginTop: m ? 30 : 44 }}>
          <a
            href={boothUrl}
            onClick={() => { try { sessionStorage.removeItem(`lc-booth-${CONFIG.slug}`); } catch { /* ignore */ } }}
            style={{ display: 'inline-block', padding: m ? '15px 26px' : '16px 32px', borderRadius: 999, background: COLORS.teal, color: '#000', fontWeight: 700, fontSize: m ? 15.5 : 16, textDecoration: 'none' }}
          >
            {booth.resetLabel || 'Add another visitor'}
          </a>
          <p style={{ margin: '14px 0 0', fontSize: 13, fontWeight: 300, color: 'rgba(255,255,255,0.4)' }}>
            {CONFIG.boothLabel ? `Find us at ${CONFIG.boothLabel} — ${CONFIG.locationLabel || ''}`.trim() : ''}
          </p>
        </div>
      </div>
    </section>
  );
}
