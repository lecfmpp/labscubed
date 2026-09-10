/* StickyToc — sticky scroll-spy table of contents + share row.
   `top` accounts for the site's own sticky header height (0 by default,
   since the homepage/hero pages float the nav over content instead). */
import React from 'react';

// Always starts `false` (matching the server render) — see the identical
// note in SpecimenSelector.tsx for why computing this from window.innerWidth
// up front causes a React hydration mismatch.
function useM(bp = 860) {
  const [m, setM] = React.useState(false);
  React.useEffect(() => {
    const on = () => setM(window.innerWidth <= bp);
    on();
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, [bp]);
  return m;
}

function ShareRow({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = React.useState(false);
  const links = [
    { label: 'Share on LinkedIn', href: 'https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(url), path: 'M4.98 3.5a2.5 2.5 0 11-.01 5.001A2.5 2.5 0 014.98 3.5zM3 9h4v12H3zM10 9h3.8v1.7h.05c.53-.95 1.83-1.95 3.76-1.95C21.4 8.75 22 11.1 22 14.2V21h-4v-6c0-1.43-.03-3.27-2-3.27-2 0-2.3 1.56-2.3 3.17V21h-4z' },
    { label: 'Share on X', href: 'https://twitter.com/intent/tweet?url=' + encodeURIComponent(url) + '&text=' + encodeURIComponent(title), path: 'M17.5 3h3.1l-6.8 7.8L22 21h-6.3l-4.4-5.8L6.2 21H3.1l7.3-8.3L2.6 3H9l4 5.3zm-1.1 16h1.7L7.7 4.8H5.9z' },
    { label: 'Share by email', href: 'mailto:?subject=' + encodeURIComponent(title) + '&body=' + encodeURIComponent(url), path: 'M3 5h18a1 1 0 011 1v12a1 1 0 01-1 1H3a1 1 0 01-1-1V6a1 1 0 011-1zm9 7.2L4.6 7h14.8z' },
  ];
  const btn: React.CSSProperties = { display: 'grid', placeItems: 'center', width: 34, height: 34, borderRadius: '50%', border: '1px solid var(--lc-line-strong)', color: 'var(--lc-ink)', textDecoration: 'none', background: '#fff' };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {links.map((l) => (
        <a key={l.label} href={l.href} target="_blank" rel="noopener" aria-label={l.label} title={l.label} style={btn}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d={l.path} /></svg>
        </a>
      ))}
      <button
        aria-label="Copy link"
        title={copied ? 'Link copied' : 'Copy link'}
        onClick={() => { if (navigator.clipboard) { navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1800); } }}
        style={{ ...btn, cursor: 'pointer', font: 'inherit', padding: 0 }}
      >
        {copied
          ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--lc-teal-deep)" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
          : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" aria-hidden="true"><path d="M10 13.5a3.5 3.5 0 005 0l3-3a3.54 3.54 0 00-5-5l-1 1" /><path d="M14 10.5a3.5 3.5 0 00-5 0l-3 3a3.54 3.54 0 005 5l1-1" /></svg>}
      </button>
    </div>
  );
}

export default function StickyToc({ toc, url, title, top = 0 }: { toc: { id: string; label: string }[]; url: string; title: string; top?: number }) {
  const m = useM();
  const [active, setActive] = React.useState(toc[0]?.id);
  React.useEffect(() => {
    const els = toc.map((t) => document.getElementById(t.id)).filter(Boolean) as HTMLElement[];
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (vis[0]) setActive(vis[0].target.id);
      },
      { rootMargin: `-${88 + top}px 0px -70% 0px`, threshold: 0 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [toc, top]);

  return (
    <div style={{ position: 'sticky', top, zIndex: 40, background: 'rgba(255,255,255,0.92)', backdropFilter: 'saturate(180%) blur(12px)', WebkitBackdropFilter: 'saturate(180%) blur(12px)', borderBottom: '1px solid var(--lc-line)' }}>
      <div style={{ maxWidth: 1312, margin: '0 auto', padding: m ? '0 20px' : '0 64px', boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: 24 }}>
        <nav aria-label="On this page" className="rs-toc-scroll" style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 4, overflowX: 'auto', padding: '10px 0' }}>
          {toc.map((t) => {
            const on = t.id === active;
            return (
              <a
                key={t.id}
                href={'#' + t.id}
                aria-current={on ? 'true' : undefined}
                style={{ flex: 'none', fontSize: 13.5, fontWeight: on ? 600 : 400, letterSpacing: '0.01em', textDecoration: 'none', padding: '8px 14px', borderRadius: 'var(--radius-pill)', whiteSpace: 'nowrap', color: on ? 'var(--lc-ink)' : 'var(--text-muted)', background: on ? 'var(--lc-gray-100)' : 'transparent' }}
              >
                {t.label}
              </a>
            );
          })}
        </nav>
        {m ? null : <ShareRow url={url} title={title} />}
      </div>
    </div>
  );
}
