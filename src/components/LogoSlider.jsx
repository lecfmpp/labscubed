import React from 'react';

const LogoSlider = () => {
  // Sized down on phones: at 40px a wide mark like Caterpillar dominates a
  // 375px viewport.
  const [isMobile, setIsMobile] = React.useState(window.innerWidth <= 760);
  React.useEffect(() => {
    const on = () => setIsMobile(window.innerWidth <= 760);
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  const logoHeight = isMobile ? 26 : 40;
  const gap = isMobile ? 32 : 48;

  const logos = [
    { src: '/assets/img/partners/parker-hannifin.webp', alt: 'Parker Hannifin' },
    { src: '/assets/img/partners/chevron-phillips.webp', alt: 'Chevron Phillips Chemical' },
    { src: '/assets/img/partners/caterpillar.svg', alt: 'Caterpillar' },
    { src: '/assets/img/partners/wacker.svg', alt: 'Wacker' },
    { src: '/assets/img/partners/hexpol.webp', alt: 'HEXPOL' },
    { src: '/assets/img/partners/ace.webp', alt: 'ACE Laboratories' },
    { src: '/assets/img/partners/momentive.webp', alt: 'Momentive' },
    { src: '/assets/img/partners/soucy.webp', alt: 'Soucy' },
  ];

  // Duplicate for seamless loop
  const doubled = [...logos, ...logos];

  return (
    <div style={{
      width: '100%',
      marginTop: isMobile ? 24 : 40,
      overflow: 'hidden',
      position: 'relative',
      maskImage: 'linear-gradient(90deg, transparent 0%, #000 8%, #000 92%, transparent 100%)',
      WebkitMaskImage: 'linear-gradient(90deg, transparent 0%, #000 8%, #000 92%, transparent 100%)',
    }}>
      <div style={{
        display: 'flex',
        gap: `${gap}px`,
        alignItems: 'center',
        animation: 'scroll 40s linear infinite',
        width: 'max-content',
      }}>
        {doubled.map((logo, i) => (
          <div key={i} className="lc-logo-item" style={{
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            height: isMobile ? 34 : 50,
          }}>
            <img
              src={logo.src}
              alt={logo.alt}
              style={{ height: logoHeight }}
            />
          </div>
        ))}
      </div>
      <style>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        /* At rest the marks are a monochrome wash so they read as one row on the
           dark hero. On hover the filter is dropped entirely, so each logo shows
           its OWN brand colours rather than a recoloured version of them.
           The white chip is what makes that possible: several of these marks are
           dark artwork, and without a light backing they would vanish against
           the black once the inversion is removed. */
        .lc-logo-item {
          padding: 6px 10px;
          border-radius: 8px;
          background: transparent;
          transition: background 0.25s ease;
        }
        .lc-logo-item img {
          width: auto;
          object-fit: contain;
          display: block;
          filter: grayscale(1) brightness(1.3) invert(1);
          opacity: 0.7;
          transition: opacity 0.25s ease, filter 0.25s ease;
        }
        .lc-logo-item:hover {
          background: #fff;
        }
        .lc-logo-item:hover img {
          filter: none;
          opacity: 1;
        }
      `}</style>
    </div>
  );
};

export default LogoSlider;
