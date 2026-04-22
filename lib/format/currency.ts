/**
 * Israeli Shekel display helpers — thousands separators (he-IL locale) and parsing.
 */

/** Removes everything except digits (and optional leading minus if needed later). */
export function parseAmountDigits(input: string): string {
  return input.replace(/[^\d]/g, '');
}

/** Integer ILS display with thousands separators (e.g. 12,345 in he-IL). */
export function formatIlsInteger(amount: number): string {
  if (!Number.isFinite(amount)) return '0';
  return Math.round(amount).toLocaleString('he-IL');
}

/** Format a digit-only string as grouped integer; empty string if not a valid number. */
export function formatDigitsAsIls(digits: string): string {
  const d = parseAmountDigits(digits);
  if (!d) return '';
  const n = parseInt(d, 10);
  if (Number.isNaN(n)) return '';
  return formatIlsInteger(n);
}

/** Parse grouped string to integer (0 if empty/invalid). */
export function parseGroupedToInt(grouped: string): number {
  const n = parseInt(parseAmountDigits(grouped), 10);
  return Number.isNaN(n) ? 0 : n;
}

/**
 * מעצב רצפי ספרות במחרוזת (למשל "3000 מתוך 10000" → עם פסיקים).
 * לא משנה תאריכי DD/MM/YYYY כיון שהם קצרים מדי או מופרדים ב־/.
 */
export function formatDigitRunsInText(text: string): string {
  return text.replace(/\d{4,}/g, (match) => {
    const n = parseInt(match, 10);
    return Number.isNaN(n) ? match : formatIlsInteger(n);
  });
}
