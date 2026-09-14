/* Shape of a "real test" dataset for the LiveTestDemo island. One module per
   material (ppLiveTest.ts for CubeTen / polypropylene, neoLiveTest.ts for
   CubeOne / neoprene) exports a LiveTestData, and the product page passes it
   to the island as a prop.

   Two clocks are involved:
   - VIDEO seconds drive the speed readout: speedKeyframes, phases, speedMarks.
   - TEST seconds index the specimen series: data time = video time + syncOffset.
   Retime those four fields when a video is synchronized exactly. */

export type SummaryRow = { label: string; unit: string; mean: number; median: number; min: number; max: number; sd: number; cv: number };

export type LiveTestPhase = {
  /** Video second this phase starts at. */
  from: number;
  /** slow = grey dot, ramp = blinking teal, active = teal ring, done = dark grey. */
  key: 'slow' | 'ramp' | 'active' | 'done';
  label: string;
  detail: string;
};

export type LiveTestColumn = { key: string; label: string; unit?: string; digits: number };

export type LiveTestData = {
  /** [test seconds, strain %, stress MPa] for the specimen in the video. */
  series: [number, number, number][];
  syncOffset: number;
  speedKeyframes: { t: number; v: number }[];
  speedMax: number;
  graphScale: [string, string];
  graphAria: string;
  phases: LiveTestPhase[];
  /** Video seconds marked on the seek bar (e.g. the speed switch). */
  speedMarks: { t: number; title: string }[];
  /** Video length in seconds, used to place speedMarks before metadata loads. */
  duration: number;
  videoAria: string;
  resultsLabel: string;
  kpis: { value: string; label: string; detail: string }[];
  summary: SummaryRow[];
  specimensTabLabel: string;
  sampleIdLabel: string;
  sampleColumns: LiveTestColumn[];
  /** Each row has an `id` (shown in the first column) plus the column keys. */
  samples: ({ id: string } & Record<string, number | string>)[];
  conditions: [string, string][];
  overlayAlt: string;
  overlayCaption: string;
};
