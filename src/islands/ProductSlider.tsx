/* ProductSlider island — framework section 07. Auto-rolling image slider
   (4.5s, paused while hovered) with arrows, dots and a caption per slide.
   Styles are global .lc-ps-* in styles.css (scoped styles miss islands). */
import React from 'react';

type Slide = { src: string; srcSet?: string; alt: string; caption: string; width: number; height: number; fit?: 'contain' | 'cover' };

const chevron = (dir: 'l' | 'r') => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d={dir === 'l' ? 'M15 6l-6 6 6 6' : 'M9 6l6 6-6 6'} stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
);

export default function ProductSlider({ slides }: { slides: Slide[] }) {
  const [i, setI] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const n = slides.length;
  React.useEffect(() => {
    if (paused || n < 2) return undefined;
    const t = setInterval(() => setI((p) => (p + 1) % n), 4500);
    return () => clearInterval(t);
  }, [paused, n]);
  const go = (d: number) => setI((p) => (p + d + n) % n);
  return (
    <div className="lc-ps" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="lc-ps-frame">
        <div className="lc-ps-track" style={{ transform: `translateX(-${i * 100}%)` }}>
          {slides.map((s, idx) => (
            <div key={s.src} className="lc-ps-slide" aria-hidden={idx !== i}>
              <img
                src={s.src}
                srcSet={s.srcSet}
                sizes="(max-width: 760px) calc(100vw - 40px), min(1184px, calc(100vw - 128px))"
                alt={s.alt}
                width={s.width}
                height={s.height}
                loading="lazy"
                style={{ objectFit: s.fit || 'contain' }}
              />
            </div>
          ))}
        </div>
        {n > 1 && (
          <React.Fragment>
            <button type="button" className="lc-ps-arrow lc-ps-arrow--l" onClick={() => go(-1)} aria-label="Previous slide">{chevron('l')}</button>
            <button type="button" className="lc-ps-arrow lc-ps-arrow--r" onClick={() => go(1)} aria-label="Next slide">{chevron('r')}</button>
          </React.Fragment>
        )}
      </div>
      <p className="lc-ps-caption" aria-live="polite">{slides[i].caption}</p>
      {n > 1 && (
        <div className="lc-ps-dots">
          {slides.map((_, idx) => (
            <button key={idx} type="button" onClick={() => setI(idx)} aria-label={`Slide ${idx + 1}`} aria-current={i === idx} className={`lc-dot${i === idx ? ' is-on' : ''}`} />
          ))}
        </div>
      )}
    </div>
  );
}
