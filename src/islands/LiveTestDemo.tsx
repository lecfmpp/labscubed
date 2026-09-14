/* LiveTestDemo island — the "watch a real test" section on the product pages.

   Three stacked parts inside one card:
   1. Live readout: crosshead speed (the number that matters), a mini
      speed-over-time graph with a playhead, and live time / strain / stress.
   2. The test video (chart left, camera right). Plays muted when scrolled
      into view, pauses when it leaves; custom play/restart/seek controls.
   3. Tabbed results table for the whole run.

   Everything material-specific arrives in the `data` prop (a LiveTestData from
   src/data/ — ppLiveTest.ts for CubeTen, neoLiveTest.ts for CubeOne), so the
   same island serves both pages. Speed and phase follow VIDEO time; strain and
   stress follow the specimen series at video time + data.syncOffset.

   The readout owns its own rAF loop and state so the table never re-renders at
   60 fps. Styles are global .lc-lt-* (scoped styles miss islands); layout is
   CSS-responsive, no useIsMobile. */
import React from 'react';
import type { LiveTestData } from '../data/liveTest';

type Props = {
  data: LiveTestData;
  video: { src: string; poster: string; width: number; height: number };
  overlay: { src: string; width: number; height: number };
};

function speedAt(kf: LiveTestData['speedKeyframes'], t: number) {
  if (t <= kf[0].t) return kf[0].v;
  for (let i = 1; i < kf.length; i++) {
    if (t <= kf[i].t) {
      const a = kf[i - 1], b = kf[i];
      return b.t === a.t ? b.v : a.v + (b.v - a.v) * ((t - a.t) / (b.t - a.t));
    }
  }
  return kf[kf.length - 1].v;
}

function seriesAt(s: LiveTestData['series'], t: number): [number, number] {
  if (t <= s[0][0]) return [s[0][1], s[0][2]];
  if (t >= s[s.length - 1][0]) return [s[s.length - 1][1], s[s.length - 1][2]];
  let lo = 0, hi = s.length - 1;
  while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (s[mid][0] <= t) lo = mid; else hi = mid; }
  const a = s[lo], b = s[hi], k = (t - a[0]) / (b[0] - a[0] || 1);
  return [a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
}

const fmtSpeed = (v: number) => (v < 0.05 ? '0' : v < 9.95 ? v.toFixed(1) : String(Math.round(v)));
const nf = (v: number, d: number) => v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });

/* ---- 1. Live readout -------------------------------------------------- */
function Readout({ data, videoRef }: { data: LiveTestData; videoRef: React.RefObject<HTMLVideoElement> }) {
  const [t, setT] = React.useState(0);
  const [dur, setDur] = React.useState(data.duration);
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
  const speed = speedAt(data.speedKeyframes, vt);
  const [strain, stress] = seriesAt(data.series, Math.max(0, vt + data.syncOffset));
  const phase = data.phases.reduce((cur, p) => (vt >= p.from ? p : cur), data.phases[0]);

  // Mini speed-over-time graph (linear on purpose, so a slow phase really looks slow).
  const W = 280, H = 64, P = 4;
  const x = (s: number) => P + (Math.min(Math.max(s, 0), dur) / dur) * (W - P * 2);
  const y = (v: number) => H - P - (v / data.speedMax) * (H - P * 2);
  const pts = data.speedKeyframes.filter((k) => k.t <= dur).concat([{ t: dur, v: speedAt(data.speedKeyframes, dur) }]);
  const path = pts.map((k, i) => `${i ? 'L' : 'M'}${x(k.t).toFixed(1)} ${y(k.v).toFixed(1)}`).join(' ');

  return (
    <div className="lc-lt-readout">
      <div className="lc-lt-speed">
        <div className="lc-lt-label">Crosshead speed</div>
        <div className="lc-lt-speed-val">
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
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={data.graphAria}>
          <line x1={P} x2={W - P} y1={y(0)} y2={y(0)} className="lc-lt-graph-axis" />
          <line x1={P} x2={W - P} y1={y(data.speedMax)} y2={y(data.speedMax)} className="lc-lt-graph-grid" />
          <path d={path} className="lc-lt-graph-line" />
          <line x1={x(vt)} x2={x(vt)} y1={P} y2={H - P} className="lc-lt-graph-head" />
          <circle cx={x(vt)} cy={y(speed)} r="4" className="lc-lt-graph-dot" />
        </svg>
        <div className="lc-lt-graph-scale"><span>{data.graphScale[0]}</span><span>{data.graphScale[1]}</span></div>
      </div>
      <dl className="lc-lt-stats">
        <div><dt>Video time</dt><dd>{nf(vt, 1)}<small> s</small></dd></div>
        <div><dt>Strain</dt><dd>{nf(Math.max(0, strain), strain >= 100 ? 0 : 2)}<small> %</small></dd></div>
        <div><dt>Stress</dt><dd>{nf(Math.max(0, stress), 2)}<small> MPa</small></dd></div>
      </dl>
    </div>
  );
}

/* ---- 2. Video ------------------------------------------------------- */
function Player({ data, video, videoRef }: { data: LiveTestData; video: Props['video']; videoRef: React.RefObject<HTMLVideoElement> }) {
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [dur, setDur] = React.useState(data.duration);
  const userPaused = React.useRef(false);

  React.useEffect(() => {
    const v = videoRef.current, wrap = wrapRef.current;
    if (!v || !wrap) return undefined;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onTime = () => setProgress(v.duration ? v.currentTime / v.duration : 0);
    const onMeta = () => { if (isFinite(v.duration) && v.duration > 0) setDur(v.duration); };
    v.addEventListener('play', onPlay); v.addEventListener('pause', onPause); v.addEventListener('timeupdate', onTime); v.addEventListener('loadedmetadata', onMeta);
    let io: IntersectionObserver | null = null;
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(([e]) => {
        if (e.isIntersecting && !userPaused.current) v.play().catch(() => {});
        else if (!e.isIntersecting && !v.paused) v.pause();
      }, { threshold: 0.4 });
      io.observe(wrap);
    }
    return () => { io?.disconnect(); v.removeEventListener('play', onPlay); v.removeEventListener('pause', onPause); v.removeEventListener('timeupdate', onTime); v.removeEventListener('loadedmetadata', onMeta); };
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
        <video ref={videoRef} src={video.src} poster={video.poster} width={video.width} height={video.height} muted playsInline loop preload="none" aria-label={data.videoAria} />
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
          {data.speedMarks.map((m) => (
            <div key={m.t} className="lc-lt-seek-switch" style={{ left: `${Math.min((m.t / dur) * 100, 100)}%` }} title={m.title} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---- 3. Results table -------------------------------------------------- */
function Results({ data, overlay }: { data: LiveTestData; overlay: Props['overlay'] }) {
  const TABS = [
    { id: 'summary', label: 'Summary statistics' },
    { id: 'specimens', label: data.specimensTabLabel },
    { id: 'overlay', label: 'Stress–strain overlay' },
    { id: 'conditions', label: 'Test conditions' },
  ];
  const [tab, setTab] = React.useState('summary');
  const refs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const onKey = (e: React.KeyboardEvent, i: number) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const n = (i + (e.key === 'ArrowRight' ? 1 : -1) + TABS.length) % TABS.length;
    setTab(TABS[n].id); refs.current[n]?.focus();
  };
  const mean = (k: string) => data.samples.reduce((a, s) => a + Number(s[k]), 0) / data.samples.length;

  return (
    <div className="lc-lt-results">
      <div className="lc-lt-kpis">
        {data.kpis.map((k) => (
          <div key={k.label} className="lc-lt-kpi">
            <div className="lc-lt-kpi-v">{k.value}</div>
            <div className="lc-lt-kpi-l">{k.label}</div>
            <div className="lc-lt-kpi-d">{k.detail}</div>
          </div>
        ))}
      </div>

      <div className="lc-lt-tabs" role="tablist" aria-label={data.resultsLabel}>
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
                {data.summary.map((r) => {
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
                  <th scope="col">{data.sampleIdLabel}</th>
                  {data.sampleColumns.map((c) => (
                    <th key={c.key} scope="col">{c.label}{c.unit ? <> <span className="lc-lt-unit">{c.unit}</span></> : null}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.samples.map((s) => (
                  <tr key={s.id}>
                    <th scope="row">{s.id}</th>
                    {data.sampleColumns.map((c) => <td key={c.key}>{nf(Number(s[c.key]), c.digits)}</td>)}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row">Mean</th>
                  {data.sampleColumns.map((c) => <td key={c.key}>{nf(mean(c.key), c.digits)}</td>)}
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {tab === 'overlay' && (
          <figure className="lc-lt-overlay">
            <img src={overlay.src} width={overlay.width} height={overlay.height} loading="lazy" alt={data.overlayAlt} />
            <figcaption>{data.overlayCaption}</figcaption>
          </figure>
        )}

        {tab === 'conditions' && (
          <dl className="lc-lt-conditions">
            {data.conditions.map(([k, v]) => (<div key={k}><dt>{k}</dt><dd>{v}</dd></div>))}
          </dl>
        )}
      </div>
    </div>
  );
}

export default function LiveTestDemo({ data, video, overlay }: Props) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  return (
    <div className="lc-lt">
      <div className="lc-lt-card">
        <Readout data={data} videoRef={videoRef} />
        <Player data={data} video={video} videoRef={videoRef} />
      </div>
      <Results data={data} overlay={overlay} />
    </div>
  );
}
