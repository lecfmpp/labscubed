/* Click-to-load YouTube facade.

   The page paints a first-party thumbnail and a play button; the YouTube
   iframe is only created once someone actually clicks. That keeps the ~1MB
   player, its cookies and the youtube.com handshake off the initial load of
   the About page, which carries two videos.

   The thumbnail comes from /assets/img/yt/<id>.webp, baked at build time by
   scripts/fetch-yt-thumbs.mjs (both About ids are already in its list), with
   the same img.youtube.com fallback VideoCarousel uses for the case where the
   prebuild fetch was skipped. Styling lives in styles.css, not here: Astro's
   scoped styles never reach island-rendered DOM. */
import React from 'react';

export default function VideoFacade({ id, title }: { id: string; title: string }) {
  const [on, setOn] = React.useState(false);
  return (
    <div className="lc-vf">
      {on ? (
        <iframe
          src={`https://www.youtube.com/embed/${id}?rel=0&controls=1&autoplay=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="lc-vf-frame"
        />
      ) : (
        <button type="button" onClick={() => setOn(true)} aria-label={`Play: ${title}`} className="lc-vf-btn">
          <img
            src={`/assets/img/yt/${id}.webp`}
            alt=""
            loading="lazy"
            className="lc-vf-thumb"
            onError={(e) => {
              const img = e.currentTarget as HTMLImageElement;
              if (!img.dataset.fb) { img.dataset.fb = '1'; img.src = `https://img.youtube.com/vi/${id}/hqdefault.jpg`; }
            }}
          />
          <span className="lc-vf-play">
            <span className="lc-vf-disc">
              <svg width="26" height="30" viewBox="0 0 26 30" fill="#000" aria-hidden="true"><path d="M25 13.27a2 2 0 0 1 0 3.46L3 29.46A2 2 0 0 1 0 27.73V2.27A2 2 0 0 1 3 .54l22 12.73Z" /></svg>
            </span>
          </span>
        </button>
      )}
    </div>
  );
}
