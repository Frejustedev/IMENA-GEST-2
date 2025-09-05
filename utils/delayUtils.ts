// utils/delayUtils.ts

/**
 * Calculates the time difference in milliseconds between two ISO date strings.
 * @param startDateStr The start date ISO string.
 * @param endDateStr The end date ISO string.
 * @returns The difference in milliseconds, or null if either date is invalid or start is after end.
 */
export const calculateTimeDiff = (startDateStr: string | undefined, endDateStr: string | undefined): number | null => {
  if (!startDateStr || !endDateStr) {
    return null;
  }
  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return null; // Invalid date(s)
  }

  const diff = endDate.getTime() - startDate.getTime();
  return diff >= 0 ? diff : null; // Return null if start is after end
};

/**
 * Formats a duration in milliseconds into a human-readable string (e.g., "1j 2h 30min").
 * @param milliseconds The duration in milliseconds.
 * @returns A formatted string representing the duration.
 */
export const formatDuration = (milliseconds: number): string => {
  if (milliseconds < 0) return 'N/A';

  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  const d = days;
  const h = hours % 24;
  const m = minutes % 60;
  // const s = seconds % 60; // Seconds usually not needed for these delays

  let parts: string[] = [];
  if (d > 0) parts.push(`${d}j`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}min`);
  
  if (parts.length === 0) {
    if (seconds > 0) return `${seconds}s`;
    return '< 1min'; // Or '0min' if preferred
  }

  return parts.join(' ');
};