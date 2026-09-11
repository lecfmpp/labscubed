/* Machine recommendation — shared between the homepage configurator
   (ConfiguratorFlow.tsx) and the Get a Quote wizard (QuoteWizard.tsx) so the
   two can never drift. Logic mirrors the design handoff's pseudocode exactly:
     isRubber = selection has rubber AND no plastic
     machine  = dailyIdx === 0 ? CubeGo : isRubber ? CubeOne : CubeTen
     standard = first selected specimen's standard, else "Multi-standard"
*/
import { getSample } from './samples';

export interface DailyOption { value: number; label: string; sub: string }

export const DAILY_OPTIONS: DailyOption[] = [
  { value: 0, label: 'Under 20', sub: 'Entry volume' },
  { value: 1, label: '20–50', sub: 'Mid volume' },
  { value: 2, label: '50–100', sub: 'High volume' },
  { value: 3, label: '100+', sub: 'Max throughput' },
];

export interface MachineInfo {
  name: string;
  href: string;
  img: string;
  blurb: string;
  specs: [string, string][];
}

export const MACHINES: Record<string, MachineInfo> = {
  CubeTen: {
    name: 'CubeTen',
    href: 'https://www.labscubed.com/plastic-testing',
    img: '/assets/img/media/cubeten-01.webp',
    blurb: 'Automated plastic tensile and flexure testing — up to 10kN on a 20-specimen carousel.',
    specs: [['Force (Omega Load Cell)', 'Up to 10kN'], ['Elongation', 'Up to 1000%'], ['Footprint', '0.8 × 1.2m']],
  },
  CubeOne: {
    name: 'CubeOne',
    href: 'https://www.labscubed.com/rubber-testing',
    img: '/assets/img/media/cubeone-01.webp',
    blurb: 'Built for rubber and elastomers — high-elongation pulls, tear dies and unattended runs.',
    specs: [['Force (Omega Load Cell)', 'Up to 1kN'], ['Max Speed', '150 mm/s (6 in/s)'], ['Footprint', '0.8 × 1.1m']],
  },
  CubeGo: {
    name: 'CubeGo',
    href: 'https://www.labscubed.com/cubego',
    img: '/assets/img/media/machine-cubego-v3.webp',
    blurb: 'Benchtop and portable — sized for lower daily volumes and multi-standard work.',
    specs: [['Force (Load Cell)', 'Up to 5kN'], ['Weight', '35 lbs (16 kg)'], ['Footprint', 'Benchtop']],
  },
};

export interface Recommendation {
  name: string | null;
  standard: string | null;
  samples: any[];
  dailyLabel: string | null;
  href?: string;
  img?: string;
  blurb?: string;
  specs?: [string, string][];
}

/** dailyIdx may be null (not yet answered). otherSample is the free-text spec
 *  field — its presence alone (with no picked specimen) still counts as an
 *  answer to step 01, matching the wizard's own validity rule. */
export function recommendMachine(selected: string[], dailyIdx: number | null | undefined, otherSample = ''): Recommendation {
  const sel = (selected || []).map((id) => getSample(id)).filter(Boolean) as any[];
  const isRubber = sel.some((s) => s.material === 'rubber') && !sel.some((s) => s.material === 'plastic');
  const noAnswers = !sel.length && !otherSample.trim();
  if (noAnswers || dailyIdx === null || dailyIdx === undefined) {
    return { name: null, standard: null, samples: sel, dailyLabel: null };
  }
  const name = dailyIdx === 0 ? 'CubeGo' : isRubber ? 'CubeOne' : 'CubeTen';
  const standard = sel[0] ? sel[0].standard : 'Multi-standard';
  const daily = DAILY_OPTIONS[dailyIdx];
  return { ...MACHINES[name], standard, samples: sel, dailyLabel: daily ? daily.label : null };
}
