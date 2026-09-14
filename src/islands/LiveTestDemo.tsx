/* LiveTestDemo island — "watch a real test" section on /plastic-testing.

   Three stacked parts inside one card:
   1. Live readout: crosshead speed (the number that matters — the method runs
      1 mm/min to 0.3% strain, then 50 mm/min), a mini speed-over-time graph
      with a playhead, and live time / strain / stress from the same specimen.
   2. The test video (chart left, camera right). Plays muted when scrolled
      into view, pauses when it leaves; custom play/restart/seek controls.
   3. Tabbed results table for all 10 PP specimens.

   Sync: readout time = video.currentTime + syncOffset. Speed comes from
   PP_SPEED_KEYFRAMES (video seconds); strain/stress from PP_SERIES (specimen 1,
   test seconds). Tune `syncOffset` / the keyframes once the video is timed.

   The readout owns its own rAF loop and writes state locally so the table
   never re-renders at 60 fps. Styles are global .lc-lt-* (scoped styles miss
   islands); layout is CSS-responsive, no useIsMobile. */
import React from 'react';
import {
  PP_SERIES, PP_SPEED_KEYFRAMES, PP_SWITCH_TIME, PP_SUMMARY, PP_SAMPLES, PP_CONDITIONS, PP_KPIS,
} from '../data/ppLiveTest';

type Props = {
  video: { src: string; poster: string; width: number; height: number };
  overlay: { src: string; width: number; height: number };
  syncOffset?: number;
};

const SPEED_MAX = 50;

function speedAt(t: number) {
  const kf = PP_SPEED_KEYFRAMES;
  if (t <= kf[0].t) return kf[0].v;
  for (let i = 1; i < kf.length; i++) {
    if (t <= kf[i].t) {
      const a = kf[i - 1], b = kf[i];
      return b.t === a.t ? b.v : a.v + (b.v - a.v) * ((t - a.t) / (b.t - a.t));
    }
  }
  return kf[kf.length - 1].v;
}

function seriesAt(t: number): [number, number] {
  const s = PP_SERIES;
  if (t <= s[0][0]) return [s[0][1], s[0][2]];
  if (t >= s[s.length - 1][0]) return [s[s.length - 1][1], s[s.length - 1][2]];
  let lo = 0, hi = s.length - 1;
  while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (s[mid][0] <= t) lo = mid; else hi = mid; }
  const a = s[lo], b = s[hi], k = (t - a[0]) / (b[0] - a[0] || 1);
  return [a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
}

const fmtSpeed = (v: number) => (v < 9.95 ? v.toFixed(1) : String(Math.round(v)));
const nf = (v: number, d: number) => v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });

/* ---- 1. Live readout -------------------------------------------------- */
function Readout({ videoRef, syncOffset }: { videoRef: React.RefObject<HTMLVideoElement>; syncOffset: number }) {
  const [t, setT] = React.useState(0);
  const [dur, setDur] = React.useState(50);
  React.useEffect(() => {
    const v = videoRef.current;
    if (!v) return undefined;
    let raf = 0;
    const tick = () => { setT(v.currentTime); if (!v.paused && !v.ended) raf = requestAnimationFrame(tick); };
    const onPlay = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(tick); };
    const onSync = () => setT(v.currentTime);
    const onMeta = () => { if (isFinite(v.duration) && v.duration > 0) setDur(v.duration); };
    v.addEventListener('play', onPlay);
    v.addEventListener('seeked', onSync);
    v.addEventListener('timeupdate', onSync);
    v.addEventListener('loadedmetadata', onMeta);
    onMeta();
    return () => { cancelAnimationFrame(raf); v.removeEventListener('play', onPlay); v.removeEventListener('seeked', onSync); v.removeEventListener('timeupdate', onSync); v.removeEventListener('loadedmetadata', onMeta); };
  }, [videoRef]);

  const vt = t;
  const speed = speedAt(vt);
  const [strain, stress] = seriesAt(Math.max(0, vt + syncOffset));
  const switchEnd = PP_SPEED_KEYFRAMES[2].t;
  const phase = vt < PP_SWITCH_TIME
    ? { key: 'mod', label: 'Modulus phase', detail: 'Slow pull at 1 mm/min until 0.3% strain' }
    : vt < switchEnd
      ? { key: 'ramp', label: 'Speed change', detail: 'Accelerating from 1 to 50 mm/min' }
      : { key: 'break', label: 'Pull to break', detail: 'Constant 50 mm/min until the specimen breaks' };

  // Mini speed-over-time graph (linear on purpose: 1 mm/min really is ~0 next to 50).
  const W = 280, H = 64, P = 4;
  const x = (s: number) => P + (Math.min(s, dur) / dur) * (W - P * 2);
  const y = (v: number) => H - P - (v / SPEED_MAX) * (H - P * 2);
  const pts = PP_SPEED_KEYFRAMES.filter((k) => k.t <= dur).concat([{ t: dur, v: speedAt(dur) }]);
  const path = pts.map((k, i) => `${i ? 'L' : 'M'}${x(k.t).toFixed(1)} ${y(k.v).toFixed(1)}`).join(' ');

  return (
    <div className="lc-lt-readout">
      <div className="lc-lt-speed">
        <div className="lc-lt-label">Crosshead speed</div>
        <div className="lc-lt-speed-val" aria-live="off">
          <span className="lc-lt-speed-num">{fmtSpeed(speed)}</span>
          <span className="lc-lt-speed-unit">mm/min</span>
        </div>
        <div className={`lc-lt-phase lc-lt-phase--${phase.key}`}>
          <span className="lc-lt-phase-dot" aria-hidden="true" />
          <span><strong>{phase.label}</strong> · {phase.detail}</span>
        </div>
      </div>
      <div className="lc-lt-graph">
        <div className="lc-lt-label">Speed over the test</div>
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Crosshead speed over time: 1 mm/min, then 50 mm/min after the 0.3% strain point">
          <line x1={P} x2={W - P} y1={y(0)} y2={y(0)} className="lc-lt-graph-axis" />
          <line x1={P} x2={W - P} y1={y(50)} y2={y(50)} className="lc-lt-graph-grid" />
          <path d={path} className="lc-lt-graph-line" />
          <line x1={x(vt)} x2={x(vt)} y1={P} y2={H - P} className="lc-lt-graph-head" />
          <circle cx={x(vt)} cy={y(speed)} r="4" className="lc-lt-graph-dot" />
        </svg>
        <div className="lc-lt-graph-scale"><span>1 mm/min</span><span>50 mm/min</span></div>
      </div>
      <dl className="lc-lt-stats">
        <div><dt>Test time</dt><dd>{nf(vt, 1)}<small> s</small></dd></div>
        <div><dt>Strain</dt><dd>{nf(Math.max(0, strain), 2)}<small> %</small></dd></div>
        <div><dt>Stress</dt><dd>{nf(Math.max(0, stress), 1)}<small> MPa</small></dd></div>
      </dl>
    </div>
  );
}

/* ---- 2. Video ------------------------------------------------------- */
function Player({ video, videoRef }: { video: Props['video']; videoRef: React.RefObject<HTMLVideoElement> }) {
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const userPaused = React.useRef(false);

  React.useEffect(() => {
    const v = videoRef.current, wrap = wrapRef.current;
    if (!v || !wrap) return undefined;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onTime = () => setProgress(v.duration ? v.currentTime / v.duration : 0);
    v.addEventListener('play', onPlay); v.addEventListener('pause', onPause); v.addEventListener('timeupdate', onTime);
    let io: IntersectionObserver | null = null;
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(([e]) => {
        if (e.isIntersecting && !userPaused.current) v.play().catch(() => {});
        else if (!e.isIntersecting && !v.paused) v.pause();
      }, { threshold: 0.4 });
      io.observe(wrap);
    }
    return () => { io?.disconnect(); v.removeEventListener('play', onPlay); v.removeEventListener('pause', onPause); v.removeEventListener('timeupdate', onTime); };
  }, [videoRef]);

  const toggle = () => {
    const v = videoRef.current; if (!v) return;
    if (v.paused) { userPaused.current = false; v.play().catch(() => {}); } else { userPaused.current = true; v.pause(); }
  };
  const restart = () => { const v = videoRef.current; if (!v) return; v.currentTime = 0; userPaused.current = false; v.play().catch(() => {}); };
  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current; if (!v || !v.duration) return;
    const r = e.currentTarget.getBoundingClientRect();
    v.currentTime = Math.min(Math.max((e.clientX - r.left) / r.width, 0), 1) * v.duration;
  };

  return (
    <div className="lc-lt-player" ref={wrapRef}>
      <div className="lc-lt-video-frame" style={{ aspectRatio: `${video.width} / ${video.height}` }}>
        <video ref={videoRef} src={video.src} poster={video.poster} width={video.width} height={video.height} muted playsInline loop preload="none" aria-label="Polypropylene tensile test: stress–strain chart synced with the camera view of the specimen" />
        <div className="lc-lt-video-tags" aria-hidden="true">
          <span>Stress–strain curve</span><span>Specimen camera</span>
        </div>
      </div>
      <div className="lc-lt-controls">
        <button type="button" className="lc-lt-btn" onClick={toggle} aria-label={playing ? 'Pause test video' : 'Play test video'}>
          {playing
            ? <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 4h4v16H6zM14 4h4v16h-4z" /></svg>
            : <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4v16l13-8z" /></svg>}
        </button>
        <button type="button" className="lc-lt-btn" onClick={restart} aria-label="Restart test video">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /></svg>
        </button>
        <div className="lc-lt-seek" onClick={seek} role="presentation">
          <div className="lc-lt-seek-fill" style={{ width: `${progress * 100}%` }} />
          <div className="lc-lt-seek-switch" style={{ left: `${(PP_SWITCH_TIME / 49.87) * 100}%` }} title="Speed switches to 50 mm/min" />
        </div>
      </div>
    </div>
  );
}

/* ---- 3. Results table -------------------------------------------------- */
const TABS = [
  { id: 'summary', label: 'Summary statistics' },
  { id: 'specimens', label: 'All 10 specimens' },
  { id: 'overlay', label: 'Stress–strain overlay' },
  { id: 'conditions', label: 'Test conditions' },
] as const;

function Results({ overlay }: { overlay: Props['overlay'] }) {
  const [tab, setTab] = React.useState<(typeof TABS)[number]['id']>('summary');
  const refs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const onKey = (e: React.KeyboardEvent, i: number) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const n = (i + (e.key === 'ArrowRight' ? 1 : -1) + TABS.length) % TABS.length;
    setTab(TABS[n].id); refs.current[n]?.focus();
  };
  const mean = (k: keyof (typeof PP_SAMPLES)[number]) => PP_SAMPLES.reduce((a, s) => a + (s[k] as number), 0) / PP_SAMPLES.length;

  return (
    <div className="lc-lt-results">
      <div className="lc-lt-kpis">
        {PP_KPIS.map((k) => (
          <div key={k.label} className="lc-lt-kpi">
            <div className="lc-lt-kpi-v">{k.value}</div>
            <div className="lc-lt-kpi-l">{k.label}</div>
            <div className="lc-lt-kpi-d">{k.detail}</div>
          </div>
        ))}
      </div>

      <div className="lc-lt-tabs" role="tablist" aria-label="Polypropylene test results">
        {TABS.map((t, i) => (
          <button key={t.id} ref={(el) => { refs.current[i] = el; }} type="button" role="tab" id={`lt-tab-${t.id}`} aria-controls={`lt-panel-${t.id}`} aria-selected={tab === t.id} tabIndex={tab === t.id ? 0 : -1} className={`lc-lt-tab${tab === t.id ? ' is-on' : ''}`} onClick={() => setTab(t.id)} onKeyDown={(e) => onKey(e, i)}>{t.label}</button>
        ))}
      </div>

      <div className="lc-lt-panel" role="tabpanel" id={`lt-panel-${tab}`} aria-labelledby={`lt-tab-${tab}`}>
        {tab === 'summary' && (
          <div className="lc-lt-scroll">
            <table className="lc-lt-table">
              <thead><tr><th scope="col">Property</th><th scope="col">Mean</th><th scope="col">± SD</th><th scope="col">CV</th><th scope="col">Min</th><th scope="col">Max</th></tr></thead>
              <tbody>
                {PP_SUMMARY.map((r) => {
                  const d = r.unit === 'MPa' && r.mean > 200 ? 1 : 2;
                  return (
                    <tr key={r.label}>
                      <th scope="row">{r.label} <span className="lc-lt-unit">{r.unit}</span></th>
                      <td className="lc-lt-strong">{nf(r.mean, d)}</td>
                      <td>{nf(r.sd, d)}</td>
                      <td><span className="lc-lt-cv">{nf(r.cv, 2)}%</span></td>
                      <td>{nf(r.min, d)}</td>
                      <td>{nf(r.max, d)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'specimens' && (
          <div className="lc-lt-scroll">
            <table className="lc-lt-table lc-lt-table--num">
              <thead>
                <tr>
                  <th scope="col">#</th>
                  <th scope="col">Yield stress <span className="lc-lt-unit">MPa</span></th>
                  <th scope="col">Elong. at yield <span className="lc-lt-unit">%</span></th>
                  <th scope="col">Break stress <span className="lc-lt-unit">MPa</span></th>
                  <th scope="col">Break strain <span className="lc-lt-unit">%</span></th>
                  <th scope="col">Chord modulus <span className="lc-lt-unit">MPa</span></th>
                  <th scope="col">Auto modulus <span className="lc-lt-unit">MPa</span></th>
                  <th scope="col">Width (auto) <span className="lc-lt-unit">mm</span></th>
                </tr>
              </thead>
              <tbody>
                {PP_SAMPLES.map((s) => (
                  <tr key={s.n}>
                    <th scope="row">{String(s.n).padStart(2, '0')}</th>
                    <td>{nf(s.yieldStress, 2)}</td><td>{nf(s.elongYield, 2)}</td><td>{nf(s.breakStress, 2)}</td><td>{nf(s.breakStrain, 2)}</td>
                    <td>{nf(s.chordMoE, 1)}</td><td>{nf(s.autoMoE, 1)}</td><td>{nf(s.width, 2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row">Mean</th>
                  <td>{nf(mean('yieldStress'), 2)}</td><td>{nf(mean('elongYield'), 2)}</td><td>{nf(mean('breakStress'), 2)}</td><td>{nf(mean('breakStrain'), 2)}</td>
                  <td>{nf(mean('chordMoE'), 1)}</td><td>{nf(mean('autoMoE'), 1)}</td><td>{nf(mean('width'), 2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {tab === 'overlay' && (
          <figure className="lc-lt-overlay">
            <img src={overlay.src} width={overlay.width} height={overlay.height} loading="lazy" alt="Stress–strain curves of all 10 polypropylene specimens overlaid, nearly identical up to break around 290–300% strain" />
            <figcaption>All 10 specimens overlaid — the curves sit on top of each other from yield to the long drawing plateau, and diverge only at break.</figcaption>
          </figure>
        )}

        {tab === 'conditions' && (
          <dl className="lc-lt-conditions">
            {PP_CONDITIONS.map(([k, v]) => (<div key={k}><dt>{k}</dt><dd>{v}</dd></div>))}
          </dl>
        )}
      </div>
    </div>
  );
}

export default function LiveTestDemo({ video, overlay, syncOffset = 0 }: Props) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  return (
    <div className="lc-lt">
      <div className="lc-lt-card">
        <Readout videoRef={videoRef} syncOffset={syncOffset} />
        <Player video={video} videoRef={videoRef} />
      </div>
      <Results overlay={overlay} />
    </div>
  );
}
