/**
 * The collection is always written as `2.369`, never `2369` or `2,369`.
 *
 * Intl's `es` locale deliberately omits the group separator for four-digit
 * numbers (so years read as years), which is exactly wrong here — the dotted
 * form is the project's own typographic signature and appears that way on the
 * garments. So group it ourselves.
 */
export function num(value: number): string {
  const sign = value < 0 ? "-" : "";
  const digits = Math.abs(Math.trunc(value)).toString();
  let out = "";
  for (let i = 0; i < digits.length; i++) {
    const fromEnd = digits.length - i;
    out += digits[i];
    if (fromEnd > 1 && fromEnd % 3 === 1) out += ".";
  }
  return sign + out;
}

/** Trait and estado keys are stored SCREAMING_SNAKE; the UI is lowercase. */
export function label(key: string): string {
  return key.toLowerCase().replace(/_/g, " ");
}

export function pct(share: number, digits = 1): string {
  return `${(share * 100).toFixed(digits)}%`;
}
