import React from 'react';

/* Partnership badge — "Official Partnership Webinar", the LabsCubed mark and the
   partner's logo on one white card.
 *
 * Driven entirely by `partner` in webinarConfig, so a webinar without that block
 * renders nothing and no page needs editing to add or drop a partner.
 *
 * The card stays white on the black hero on purpose: both marks are dark
 * artwork, so a translucent dark surface would swallow them. On black the white
 * card reads as a credential rather than a UI panel, which is the point.
 *
 * Sizing: the logos are capped by height, never width, so a partner logo of any
 * aspect ratio sits on the same optical baseline as the LabsCubed mark. The
 * divider matches the taller of the two. The card is inline-flex, so it hugs its
 * content on desktop and wraps as one unit on a phone instead of stretching.
 */

const LC_LOGO = '/assets/img/logo-dark.webp';
// Intrinsic sizes of the dark LabsCubed mark, used to reserve the right box
// before the image loads.
const LC_W = 266;
const LC_H = 60;

function useM(bp = 760) {
  const [m, setM] = React.useState(window.innerWidth <= bp);
  React.useEffect(() => {
    const on = () => setM(window.innerWidth <= bp);
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, [bp]);
  return m;
}

export default function PartnershipBadge({ partner }) {
  const m = useM();
  if (!partner || !partner.logoSrc) return null;

  const label = partner.label || 'Official Partnership Webinar';
  // Both logos shrink together on a phone so the row keeps its proportions.
  const scale = m ? 0.82 : 1;
  const lcHeight = Math.round(22 * scale);
  const partnerHeight = Math.round((partner.logoHeight || 30) * scale);
  const dividerHeight = Math.max(lcHeight, partnerHeight) + 6;

  return (
    <div
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: m ? 9 : 11,
        maxWidth: '100%',
        boxSizing: 'border-box',
        padding: m ? '13px 16px' : '15px 22px',
        borderRadius: 16,
        background: '#fff',
        boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.08), 0 18px 36px rgba(0,0,0,0.18)',
      }}
    >
      <span
        style={{
          fontSize: m ? 9.5 : 10,
          fontWeight: 700,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: '#86868b',
          textAlign: 'center',
          lineHeight: 1.3,
        }}
      >
        {label}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: m ? 14 : 18 }}>
        <img
          src={LC_LOGO}
          alt="LabsCubed"
          width={Math.round((LC_W / LC_H) * lcHeight)}
          height={lcHeight}
          style={{ height: lcHeight, width: 'auto', display: 'block' }}
        />
        <span
          aria-hidden="true"
          style={{ width: 1, height: dividerHeight, background: 'rgba(0,0,0,0.12)', flex: 'none' }}
        />
        <img
          src={partner.logoSrc}
          alt={partner.logoAlt || partner.name || 'Partner'}
          width={
            partner.logoWidth && partner.logoNativeHeight
              ? Math.round((partner.logoWidth / partner.logoNativeHeight) * partnerHeight)
              : undefined
          }
          height={partnerHeight}
          style={{ height: partnerHeight, width: 'auto', display: 'block' }}
        />
      </div>
    </div>
  );
}
