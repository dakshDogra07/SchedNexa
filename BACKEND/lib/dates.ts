/**
 * lib/dates.ts — UTC Date helpers for SchedNexa.
 * Dates are YYYY-MM-DD strings. Weekday is computed in UTC:
 * 1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday, 5 = Friday.
 * 6 = Saturday, 7 = Sunday (weekend).
 */

export function getUTCDayOfWeek(dateStr: string): number {
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) {
    throw new Error(`Invalid date format: ${dateStr}. Expected YYYY-MM-DD.`);
  }
  const [year, month, day] = parts;
  const date = new Date(Date.UTC(year, month - 1, day));
  const dayOfWeek = date.getUTCDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  if (dayOfWeek === 0) return 7; // Map Sunday to 7
  return dayOfWeek;
}

export function isWeekend(dateStr: string): boolean {
  const day = getUTCDayOfWeek(dateStr);
  return day === 6 || day === 7;
}
