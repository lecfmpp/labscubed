/* Country data for the Get a Quote wizard's country/phone picker — code, name,
   dial code, and phone digit-grouping. Ported verbatim from the design
   handoff's quote-wizard.jsx (29 countries). Flags come from flagcdn.com. */
export interface Country { c: string; n: string; d: string; g: number[] }

export const COUNTRIES: Country[] = [
  { c: 'CA', n: 'Canada', d: '+1', g: [3, 3, 4] },
  { c: 'US', n: 'United States', d: '+1', g: [3, 3, 4] },
  { c: 'MX', n: 'Mexico', d: '+52', g: [2, 4, 4] },
  { c: 'BR', n: 'Brazil', d: '+55', g: [2, 5, 4] },
  { c: 'GB', n: 'United Kingdom', d: '+44', g: [4, 6] },
  { c: 'IE', n: 'Ireland', d: '+353', g: [2, 3, 4] },
  { c: 'DE', n: 'Germany', d: '+49', g: [3, 4, 4] },
  { c: 'FR', n: 'France', d: '+33', g: [1, 2, 2, 2, 2] },
  { c: 'IT', n: 'Italy', d: '+39', g: [3, 3, 4] },
  { c: 'ES', n: 'Spain', d: '+34', g: [3, 3, 3] },
  { c: 'NL', n: 'Netherlands', d: '+31', g: [2, 3, 4] },
  { c: 'BE', n: 'Belgium', d: '+32', g: [3, 2, 2, 2] },
  { c: 'SE', n: 'Sweden', d: '+46', g: [2, 3, 2, 2] },
  { c: 'PL', n: 'Poland', d: '+48', g: [3, 3, 3] },
  { c: 'CZ', n: 'Czechia', d: '+420', g: [3, 3, 3] },
  { c: 'TR', n: 'Türkiye', d: '+90', g: [3, 3, 4] },
  { c: 'IN', n: 'India', d: '+91', g: [5, 5] },
  { c: 'CN', n: 'China', d: '+86', g: [3, 4, 4] },
  { c: 'JP', n: 'Japan', d: '+81', g: [2, 4, 4] },
  { c: 'KR', n: 'South Korea', d: '+82', g: [2, 4, 4] },
  { c: 'TW', n: 'Taiwan', d: '+886', g: [2, 4, 4] },
  { c: 'SG', n: 'Singapore', d: '+65', g: [4, 4] },
  { c: 'MY', n: 'Malaysia', d: '+60', g: [2, 4, 4] },
  { c: 'TH', n: 'Thailand', d: '+66', g: [2, 3, 4] },
  { c: 'VN', n: 'Vietnam', d: '+84', g: [3, 4, 3] },
  { c: 'AU', n: 'Australia', d: '+61', g: [1, 4, 4] },
  { c: 'AE', n: 'United Arab Emirates', d: '+971', g: [2, 3, 4] },
  { c: 'SA', n: 'Saudi Arabia', d: '+966', g: [2, 3, 4] },
  { c: 'ZA', n: 'South Africa', d: '+27', g: [2, 3, 4] },
];

export const getCountry = (c: string): Country | null => COUNTRIES.find((x) => x.c === c) || null;
export const flagSrc = (c: string) => 'https://flagcdn.com/w40/' + c.toLowerCase() + '.png';

export function formatPhone(digits: string, country: Country | null): string {
  const g = (country && country.g) || [3, 3, 4];
  let i = 0;
  const out: string[] = [];
  for (const len of g) {
    if (i >= digits.length) break;
    out.push(digits.slice(i, i + len));
    i += len;
  }
  if (i < digits.length) out.push(digits.slice(i));
  if (country && country.g[0] === 3 && country.d === '+1' && out.length > 1) {
    return '(' + out[0] + ')' + (out[1] ? ' ' + out[1] : '') + (out[2] ? '-' + out[2] : '');
  }
  return out.join(' ');
}
