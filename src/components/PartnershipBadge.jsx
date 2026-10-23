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
  if (!partner || (!partner.logoSrc && !partner.name)) return null;

  // Inverted: no white card — white marks sit straight on the black hero inside a
  // thin white outline. Set `inverted: true` on the partner block to opt in.
  const inv = !!partner.inverted;
  const logoSrc = inv && partner.logoSrcLight ? partner.logoSrcLight : partner.logoSrc;
  const lcFilter = inv ? 'brightness(0) invert(1)' : undefined;
  const label = partner.label || 'Official Partnership Webinar';
  // Both logos shrink together on a phone so the row keeps its proportions.
  // `partner.size` shrinks or grows the whole card (0.5 = half size).
  const size = partner.size || 1;
  const scale = (m ? 0.68 : 1) * size;
  const lcHeight = Math.round(22 * scale);
  const partnerHeight = Math.round((partner.logoHeight || 30) * scale);
  const dividerHeight = Math.max(lcHeight, partnerHeight) + 6;

  return (
    <div
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: Math.round((m ? 9 : 11) * size),
        maxWidth: '100%',
        boxSizing: 'border-box',
        padding: `${Math.round((m ? 11 : 15) * size)}px ${Math.round((m ? 14 : 22) * size)}px`,
        borderRadius: Math.round((m ? 13 : 16) * size),
        background: inv ? 'transparent' : '#fff',
        boxShadow: inv ? 'inset 0 0 0 1.5px #fff' : 'inset 0 0 0 1px rgba(0,0,0,0.08), 0 18px 36px rgba(0,0,0,0.18)',
      }}
    >
      <span
        style={{
          fontSize: Math.max(6, (m ? 8.5 : 10) * size),
          fontWeight: 700,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: inv ? 'rgba(255,255,255,0.78)' : '#86868b',
          textAlign: 'center',
          lineHeight: 1.3,
        }}
      >
        {label}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: Math.round((m ? 11 : 18) * size) }}>
        <img
          src={LC_LOGO}
          alt="LabsCubed"
          width={Math.round((LC_W / LC_H) * lcHeight)}
          height={lcHeight}
          style={{ height: lcHeight, width: 'auto', display: 'block', filter: lcFilter }}
        />
        <span
          aria-hidden="true"
          style={{ width: 1, height: dividerHeight, background: inv ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.12)', flex: 'none' }}
        />
        {logoSrc ? (
          <img
            src={logoSrc}
            alt={partner.logoAlt || partner.name || 'Partner'}
            width={
              partner.logoWidth && partner.logoNativeHeight
                ? Math.round((partner.logoWidth / partner.logoNativeHeight) * partnerHeight)
                : undefined
            }
            height={partnerHeight}
            style={{ height: partnerHeight, width: 'auto', display: 'block' }}
          />
        ) : (
          /* No logo file yet: the partner's name in plain type, so the card is
             never a half-empty box. */
          <span style={{ fontWeight: 800, fontSize: Math.round(partnerHeight * 0.7), letterSpacing: '0.08em', color: inv ? '#fff' : '#1d1d1f' }}>{partner.name}</span>
        )}
      </div>
    </div>
  );
}
