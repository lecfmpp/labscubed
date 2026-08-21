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
          <div key={i} style={{
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            height: isMobile ? 34 : 50,
          }}>
            <img
              src={logo.src}
              alt={logo.alt}
              style={{
                height: logoHeight,
                width: 'auto',
                objectFit: 'contain',
                filter: 'grayscale(1) brightness(1.3) invert(1)',
                opacity: 0.7,
                transition: 'opacity 0.3s ease, filter 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.target.style.opacity = '1';
                e.target.style.filter = 'grayscale(0.5) brightness(1.4) invert(1)';
              }}
              onMouseLeave={(e) => {
                e.target.style.opacity = '0.7';
                e.target.style.filter = 'grayscale(1) brightness(1.3) invert(1)';
              }}
            />
          </div>
        ))}
      </div>
      <style>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
};

export default LogoSlider;
