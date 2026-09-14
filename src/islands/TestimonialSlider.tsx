/* TestimonialSlider island — framework section 04. Auto-rotating quote
   (7s, paused while hovered) beside a lab photo, with dots.
   Layout and responsive rules live in styles.css as .lc-ts-* — Astro's scoped
   styles never reach island-rendered DOM, and CSS keeps the server HTML
   correct on phones before hydration. */
import React from 'react';

type Item = { quote: string; name: string; role: string; company: string; loc?: string };

export default function TestimonialSlider({ items, img, imgAlt = '' }: { items: Item[]; img: string; imgAlt?: string }) {
  const [i, setI] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const n = items.length;
  React.useEffect(() => {
    if (paused || n < 2) return undefined;
    const t = setInterval(() => setI((p) => (p + 1) % n), 7000);
    return () => clearInterval(t);
  }, [paused, n]);
  const t = items[i];
  const initials = t.name.split(/[\s-]+/).map((w) => w[0]).slice(0, 2).join('');
  return (
    <div className="lc-ts" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="lc-ts-copy">
        <div key={i} className="lc-ts-quote-wrap">
          <div className="lc-ts-stars" aria-label="5 out of 5">
            {[0, 1, 2, 3, 4].map((s) => (
              <svg key={s} width="18" height="18" viewBox="0 0 24 24" fill="var(--lc-teal)" aria-hidden="true"><path d="M12 2l2.9 6.3 6.9.7-5.1 4.6 1.4 6.8L12 17.8 5.9 20.4l1.4-6.8L2.2 9l6.9-.7L12 2z" /></svg>
            ))}
          </div>
          <blockquote className="lc-ts-quote">“{t.quote}”</blockquote>
        </div>
        <div>
          <div className="lc-ts-who">
            <span className="lc-ts-avatar" aria-hidden="true">{initials}</span>
            <div>
              <div className="lc-ts-name">{t.name}</div>
              <div className="lc-ts-role">{t.role}{t.loc ? ` · ${t.loc}` : ''}</div>
            </div>
          </div>
          <span className="lc-ts-company">{t.company}</span>
          <div className="lc-ts-dots">
            {items.map((_, idx) => (
              <button key={idx} type="button" onClick={() => setI(idx)} aria-label={`Testimonial ${idx + 1}`} aria-current={i === idx} className={`lc-dot${i === idx ? ' is-on' : ''}`} />
            ))}
          </div>
        </div>
      </div>
      <div className="lc-ts-photo">
        <img src={img} alt={imgAlt} width={1200} height={673} loading="lazy" />
      </div>
    </div>
  );
}
