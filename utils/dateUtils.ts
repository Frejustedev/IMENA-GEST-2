
import { PeriodOption } from '../types';

/**
 * Calculates the start and end dates of the week for a given date.
 * Sunday is considered the first day of the week.
 * @param date The date for which to calculate the week's start and end.
 * @returns An object with startOfWeek and endOfWeek Date objects.
 */
const getWeekDates = (date: Date): { startOfWeek: Date, endOfWeek: Date } => {
  const d = new Date(date);
  const day = d.getDay(); // 0 (Sun) - 6 (Sat)
  const diffToSunday = d.getDate() - day;
  const startOfWeek = new Date(d.setDate(diffToSunday));
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  return { startOfWeek, endOfWeek };
};

/**
 * Checks if a given date string falls within the specified period.
 * @param dateString The ISO date string to check.
 * @param period The period to check against ('today', 'thisWeek', 'thisMonth').
 * @returns True if the date is within the period, false otherwise.
 */
export const isDateInPeriod = (dateString: string | undefined, period: PeriodOption): boolean => {
  if (!dateString) return false;

  const dateToCheck = new Date(dateString);
  const today = new Date();
  today.setHours(0,0,0,0); // Start of today

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1); // Start of tomorrow

  switch (period) {
    case 'today':
      return dateToCheck >= today && dateToCheck < tomorrow;
    
    case 'thisWeek':
      const { startOfWeek, endOfWeek } = getWeekDates(new Date()); // Current week
      return dateToCheck >= startOfWeek && dateToCheck <= endOfWeek;

    case 'thisMonth':
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0); // Last day of current month
      endOfMonth.setHours(23, 59, 59, 999);
      return dateToCheck >= startOfMonth && dateToCheck <= endOfMonth;
      
    default:
      return false;
  }
};

/**
 * Calculates the age of a person given their date of birth.
 * @param dateOfBirth The date of birth as a string (e.g., "YYYY-MM-DD").
 * @returns The age in years, or undefined if the dateOfBirth is invalid.
 */
export const calculateAge = (dateOfBirth: string): number | undefined => {
  if (!dateOfBirth) return undefined;
  const birthDate = new Date(dateOfBirth);
  if (isNaN(birthDate.getTime())) return undefined; // Invalid date
  
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};
