/* TestimonialSlider island — framework section 04. Auto-rotating quote
   (7s, paused while hovered) beside a photo that crossfades with it, plus
   the customer's headshot and company logo (real assets from the old Webflow
   review tabs). Every photo is stacked in the panel and toggled by opacity,
   so switching quotes never waits on a network fetch.
   Layout and responsive rules live in styles.css as .lc-ts-* — Astro's scoped
   styles never reach island-rendered DOM, and CSS keeps the server HTML
   correct on phones before hydration. */
import React from 'react';

type Item = {
  quote: string;
  name: string;
  role: string;
  company: string;
  loc?: string;
  /** Headshot; falls back to initials when absent. */
  avatar?: string;
  logo?: { src: string; width: number; height: number };
  photo: { src: string; alt: string };
};

export default function TestimonialSlider({ items }: { items: Item[] }) {
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
          <div className="lc-ts-stars" role="img" aria-label="5 out of 5">
            {[0, 1, 2, 3, 4].map((s) => (
              <svg key={s} width="18" height="18" viewBox="0 0 24 24" fill="var(--lc-teal)" aria-hidden="true"><path d="M12 2l2.9 6.3 6.9.7-5.1 4.6 1.4 6.8L12 17.8 5.9 20.4l1.4-6.8L2.2 9l6.9-.7L12 2z" /></svg>
            ))}
          </div>
          <blockquote className="lc-ts-quote">“{t.quote}”</blockquote>
        </div>
        <div>
          <div key={`who-${i}`} className="lc-ts-who lc-ts-fade">
            <span className="lc-ts-avatar" aria-hidden="true">
              {t.avatar ? <img src={t.avatar} alt="" width={52} height={52} loading="lazy" /> : initials}
            </span>
            <div>
              <div className="lc-ts-name">{t.name}</div>
              <div className="lc-ts-role">{t.role}{t.loc ? ` · ${t.loc}` : ''}</div>
            </div>
          </div>
          <div key={`co-${i}`} className="lc-ts-company lc-ts-fade">
            {t.logo
              ? <img src={t.logo.src} alt={t.company} width={t.logo.width} height={t.logo.height} loading="lazy" className="lc-ts-logo" />
              : <span className="lc-ts-company-name">{t.company}</span>}
          </div>
          <div className="lc-ts-dots">
            {items.map((it, idx) => (
              <button key={idx} type="button" onClick={() => setI(idx)} aria-label={`Testimonial from ${it.company}`} aria-current={i === idx} className={`lc-dot${i === idx ? ' is-on' : ''}`} />
            ))}
          </div>
        </div>
      </div>
      <div className="lc-ts-photo">
        {items.map((it, idx) => (
          <img
            key={it.photo.src}
            src={it.photo.src}
            alt={idx === i ? it.photo.alt : ''}
            aria-hidden={idx !== i}
            width={1100}
            height={1000}
            loading="lazy"
            className={idx === i ? 'is-on' : undefined}
          />
        ))}
      </div>
    </div>
  );
}
