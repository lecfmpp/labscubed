/* Conversion tracking for islands and bundled scripts. Thin wrapper around
   window.lcTrack, defined inline by components/Analytics.astro on every page;
   a no-op if it is missing (e.g. an island rendered outside Base). */
export function track(event: string, params: Record<string, unknown> = {}, linkedinConversionId?: number) {
  try { (window as any).lcTrack?.(event, params, linkedinConversionId); } catch { /* never break a form over analytics */ }
}

/* LinkedIn conversion ids — the same ones the Webflow brochure forms fired. */
export const LI_CONVERSIONS: Record<string, number> = {
  'cubeone-brochure': 21037570,
  'cubeten-brochure': 21037578,
};
