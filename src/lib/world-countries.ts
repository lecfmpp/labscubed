/* Every country, for the booth kiosk's country picker. Names come from the browser's own
   English region names so the list needs no translation table; `fallback` covers a browser
   without Intl.DisplayNames (the code is shown instead of leaving the option blank). */
const CODES = (
  'AF AL DZ AD AO AG AR AM AU AT AZ BS BH BD BB BY BE BZ BJ BT BO BA BW BR BN BG BF BI KH CM CA CV CF TD CL CN CO KM CG CD CR CI HR CU CY CZ DK DJ DM DO EC EG SV GQ ER EE SZ ET FJ FI FR GA GM GE DE GH GR GD GT GN GW GY HT HN HU IS IN ID IR IQ IE IL IT JM JP JO KZ KE KI KW KG LA LV LB LS LR LY LI LT LU MG MW MY MV ML MT MH MR MU MX FM MD MC MN ME MA MZ MM NA NR NP NL NZ NI NE NG KP MK NO OM PK PW PS PA PG PY PE PH PL PT QA RO RU RW KN LC VC WS SM ST SA SN RS SC SL SG SK SI SB SO ZA KR SS ES LK SD SR SE CH SY TW TJ TZ TH TL TG TO TT TN TR TM TV UG UA AE GB US UY UZ VU VA VE VN YE ZM ZW HK MO PR'
).split(' ');

const NAME_OVERRIDE: Record<string, string> = { TR: 'Türkiye', TW: 'Taiwan' };

export type WorldCountry = { c: string; n: string };

export function worldCountries(first: string[] = ['US', 'CA']): WorldCountry[] {
  let names: Intl.DisplayNames | null = null;
  try { names = new Intl.DisplayNames(['en'], { type: 'region' }); } catch { names = null; }
  const name = (c: string) => NAME_OVERRIDE[c] || (names ? names.of(c) : '') || c;
  const all = CODES.map((c) => ({ c, n: name(c) }));
  const top = first.map((c) => all.find((x) => x.c === c)).filter(Boolean) as WorldCountry[];
  const rest = all.filter((x) => !first.includes(x.c)).sort((a, b) => a.n.localeCompare(b.n, 'en'));
  return [...top, ...rest];
}
