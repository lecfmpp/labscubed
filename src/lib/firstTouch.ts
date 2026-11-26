// First-touch attribution, shared by every form on the site.
//
// On a visitor's first page view we store where they came from — UTMs, the
// external referrer, ad click ids, and the landing page — in the
// lc_first_touch cookie (90 days). Forms then send that record, so a lead that
// arrived from Google or LinkedIn and converted three pages later still carries
// its real source into webform_leads, where the attribution trigger reads it.
//
// Rules:
// - The first visit wins. A later visit only replaces it when the stored record
//   has no source at all (a direct visit) and the new visit does — otherwise
//   "direct" would hide a campaign that brought the visitor back.
// - Internal navigation (referrer on our own domain) never counts as a source.

const COOKIE = 'lc_first_touch';
const MAX_AGE = 60 * 60 * 24 * 90;
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;
const CLICK_IDS = ['gclid', 'li_fat_id', 'fbclid', 'msclkid'] as const;
const OWN_HOSTS = /(^|\.)labscubed\.com$/i;

export type FirstTouch = Partial<Record<(typeof UTM_KEYS)[number] | (typeof CLICK_IDS)[number], string>> & {
  referrer?: string;
  landing_page?: string;
  ts?: string;
};

function readCookie(): FirstTouch | null {
  try {
    const m = document.cookie.match('(^|;)\\s*' + COOKIE + '\\s*=\\s*([^;]+)');
    return m ? JSON.parse(decodeURIComponent(m.pop() as string)) || null : null;
  } catch {
    return null;
  }
}

function writeCookie(v: FirstTouch): void {
  try {
    document.cookie = `${COOKIE}=${encodeURIComponent(JSON.stringify(v))};path=/;max-age=${MAX_AGE};SameSite=Lax`;
  } catch { /* cookies blocked: forms fall back to the current page */ }
}

function externalReferrer(): string {
  const r = document.referrer || '';
  if (!r) return '';
  try {
    return OWN_HOSTS.test(new URL(r).hostname) ? '' : r;
  } catch {
    return '';
  }
}

function currentTouch(): FirstTouch {
  const p = new URLSearchParams(location.search);
  const t: FirstTouch = {};
  for (const k of UTM_KEYS) { const v = p.get(k); if (v) t[k] = v; }
  for (const k of CLICK_IDS) { const v = p.get(k); if (v) t[k] = v; }
  const ref = externalReferrer();
  if (ref) t.referrer = ref;
  t.landing_page = location.pathname + location.search;
  t.ts = new Date().toISOString();
  return t;
}

const hasSource = (t: FirstTouch | null) =>
  !!t && (UTM_KEYS.some((k) => t[k]) || CLICK_IDS.some((k) => t[k]) || !!t.referrer);

/** Record the first touch if we don't have one yet. Safe to call on every page. */
export function captureFirstTouch(): FirstTouch {
  if (typeof document === 'undefined') return {};
  const stored = readCookie();
  const now = currentTouch();
  if (!stored || (!hasSource(stored) && hasSource(now))) {
    writeCookie(now);
    return now;
  }
  return stored;
}

/** The fields every form sends with a submission. */
export function attributionFields(): Record<string, string> {
  const ft = captureFirstTouch();
  return {
    utm_source: ft.utm_source || '',
    utm_medium: ft.utm_medium || '',
    utm_campaign: ft.utm_campaign || '',
    utm_content: ft.utm_content || '',
    utm_term: ft.utm_term || '',
    gclid: ft.gclid || '',
    li_fat_id: ft.li_fat_id || '',
    referrer: ft.referrer || '',
    landing_page: ft.landing_page || location.pathname,
    first_touch_at: ft.ts || '',
    hutk: (document.cookie.match(/(?:^|;\s*)hubspotutk=([^;]+)/) || [])[1] || '',
  };
}
