/* SpecimenSelector — true-relative-scale specimen picker + spec table.
   Reuses the existing Sample/SAMPLES design-system data (src/lib/samples.tsx)
   that already powers the homepage hero rail, so a new resource page just
   filters by `standard`. */
import React from 'react';
import { SAMPLES, Sample } from '../../lib/samples';

// Always starts `false` (matching what the server renders) and corrects
// itself in an effect after mount. Computing the initial value from
// `window.innerWidth` instead causes a React hydration mismatch for any
// client viewport that disagrees with the server's "assume desktop" guess —
// this island uses client:visible, so it hydrates well after load and a
// mismatch there doesn't get the same forgiving recovery client:load gets.
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

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, padding: '0 0 16px', borderBottom: '1px solid var(--lc-line)' }}>
      <span style={{ fontWeight: 300, fontSize: 16, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{label}</span>
      <span style={{ flex: 1 }} />
      <span style={{ fontWeight: 500, fontSize: 16, letterSpacing: '0.03em', color: 'var(--lc-ink)', whiteSpace: 'nowrap' }}>{value}</span>
    </div>
  );
}

export default function SpecimenSelector({ standard, useCases, defaultId }: { standard: string | string[]; useCases: Record<string, string>; defaultId: string }) {
  const m = useM();
  const standards = Array.isArray(standard) ? standard : [standard];
  const list = React.useMemo(() => SAMPLES.filter((s: any) => standards.includes(s.standard)), [standards.join('|')]);
  const [sel, setSel] = React.useState(defaultId);
  const s = list.find((x: any) => x.id === sel) || list[0];
  if (!s) return null;
  const maxLO = Math.max(...list.map((x: any) => x.geom.LO));

  return (
    <div>
      <div style={{ padding: m ? 24 : 36, borderRadius: 'var(--radius-card)', background: 'var(--lc-gray-100)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>True relative scale — drawn to one another's real proportions</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: m ? 20 : 34, flexWrap: 'wrap', marginTop: 24 }}>
          {list.map((x: any) => {
            const on = x.id === sel;
            return (
              <button key={x.id} onClick={() => setSel(x.id)} style={{ all: 'unset', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 10, padding: 12, borderRadius: 12, transition: 'background .2s ease', background: on ? 'rgba(23,221,197,0.12)' : 'transparent' }}>
                <Sample spec={x} color={on ? 'teal' : undefined} pxPerMm={(m ? 190 : 300) / maxLO} />
                <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.03em', color: on ? 'var(--lc-teal-deep)' : 'var(--lc-ink)' }}>{x.name} <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>· {x.geom.LO} mm</span></span>
              </button>
            );
          })}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: m ? '1fr' : '1.25fr 1fr', gap: m ? 28 : 64, alignItems: 'center', marginTop: 36 }}>
        <div style={{ padding: m ? 24 : 48, borderRadius: 'var(--radius-card)', background: 'var(--surface-card)', boxShadow: 'var(--shadow-edge)' }}>
          <Sample spec={s} callouts style={{ maxWidth: '100%' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <span style={{ fontWeight: 700, fontSize: 12, letterSpacing: '0.08em', color: 'var(--lc-teal-deep)' }}>{s.standard}</span>
            <span style={{ fontWeight: 600, fontSize: 26, letterSpacing: '-0.02em', color: 'var(--lc-ink)' }}>{s.name}</span>
          </div>
          <p style={{ fontWeight: 300, fontSize: 16, lineHeight: 1.65, color: 'var(--text-muted)', margin: 0, maxWidth: 720 }}>{s.blurb}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <SpecRow label="Overall length" value={`${s.geom.LO} mm`} />
            <SpecRow label="Narrow width" value={`${s.geom.W} mm`} />
            <SpecRow label="Gauge length" value={`${s.geom.G} mm`} />
            <SpecRow label="Thickness" value={s.thickness} />
            <SpecRow label="Use case" value={useCases[s.id]} />
          </div>
        </div>
      </div>
    </div>
  );
}
