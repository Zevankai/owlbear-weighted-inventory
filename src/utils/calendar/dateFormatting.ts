import type { CalendarConfig, DateTimeState } from '../../types/calendar';

/**
 * Get ordinal suffix for a day number (1st, 2nd, 3rd, 4th, etc.)
 */
export const getOrdinalSuffix = (day: number): string => {
  const j = day % 10;
  const k = day % 100;
  
  if (j === 1 && k !== 11) return 'st';
  if (j === 2 && k !== 12) return 'nd';
  if (j === 3 && k !== 13) return 'rd';
  return 'th';
};

/**
 * Format a calendar date using custom calendar settings
 * Returns format like: "Tuesday, July 6th, 462 ASC"
 */
export const formatCustomDate = (
  config: CalendarConfig,
  date: { year: number; monthIndex: number; day: number }
): string => {
  const month = config.months[date.monthIndex];
  const monthName = month?.name || 'Unknown';
  
  // Calculate day of week
  let dayOfWeekName = '';
  if (config.weekDays.length > 0) {
    // Calculate total days elapsed to get the day of week
    const daysInYear = config.months.reduce((acc, m) => acc + m.days, 0);
    let totalDays = date.year * daysInYear;
    for (let i = 0; i < date.monthIndex; i++) {
      if (config.months[i]) {
        totalDays += config.months[i].days;
      }
    }
    totalDays += date.day;
    
    const startOffset = config.yearStartDayOffset || 0;
    const dayOfWeekIndex = (totalDays + startOffset - 1) % config.weekDays.length;
    dayOfWeekName = config.weekDays[dayOfWeekIndex]?.name || '';
  }
  
  const dayWithSuffix = `${date.day}${getOrdinalSuffix(date.day)}`;
  const yearSuffix = config.yearName || '';
  
  // Build the formatted string
  let formatted = '';
  if (dayOfWeekName) {
    formatted += `${dayOfWeekName}, `;
  }
  formatted += `${monthName} ${dayWithSuffix}, ${date.year}`;
  if (yearSuffix) {
    formatted += ` ${yearSuffix}`;
  }
  
  return formatted;
};

/**
 * Calculate time elapsed between two calendar dates
 * Returns an object with days and hours elapsed
 */
export const calculateTimeElapsed = (
  config: CalendarConfig,
  fromDate: DateTimeState,
  toDate: DateTimeState
): { days: number; hours: number; minutes: number; totalMinutes: number } => {
  // Calculate total minutes elapsed
  let totalMinutes = 0;
  
  // Calculate year difference
  const daysInYear = config.months.reduce((acc, m) => acc + m.days, 0);
  const yearDiff = toDate.year - fromDate.year;
  totalMinutes += yearDiff * daysInYear * 24 * 60;
  
  // Calculate month difference within the same or different years
  if (toDate.monthIndex > fromDate.monthIndex || yearDiff !== 0) {
    // Add days from remaining months in the from year
    for (let i = fromDate.monthIndex + 1; i < config.months.length && yearDiff >= 0; i++) {
      totalMinutes += config.months[i].days * 24 * 60;
    }
    // Add days from months in the to year
    for (let i = 0; i < toDate.monthIndex; i++) {
      totalMinutes += config.months[i].days * 24 * 60;
    }
  } else if (toDate.monthIndex < fromDate.monthIndex) {
    // Going backwards, subtract months
    for (let i = toDate.monthIndex + 1; i < fromDate.monthIndex; i++) {
      totalMinutes -= config.months[i].days * 24 * 60;
    }
  }
  
  // Calculate day difference
  const dayDiff = toDate.day - fromDate.day;
  totalMinutes += dayDiff * 24 * 60;
  
  // Calculate hour difference
  const hourDiff = toDate.hour - fromDate.hour;
  totalMinutes += hourDiff * 60;
  
  // Calculate minute difference
  const minuteDiff = toDate.minute - fromDate.minute;
  totalMinutes += minuteDiff;
  
  // Convert to days, hours, and minutes
  const days = Math.floor(Math.abs(totalMinutes) / (24 * 60));
  const remainingMinutes = Math.abs(totalMinutes) % (24 * 60);
  const hours = Math.floor(remainingMinutes / 60);
  const minutes = remainingMinutes % 60;
  
  return {
    days,
    hours,
    minutes,
    totalMinutes: Math.abs(totalMinutes),
  };
};

/**
 * Format time elapsed in a human-readable way
 * Examples: "2 days, 14 hours ago", "6 hours ago", "1 day ago"
 */
export const formatTimeElapsed = (
  config: CalendarConfig,
  fromDate: DateTimeState,
  toDate: DateTimeState
): string => {
  const elapsed = calculateTimeElapsed(config, fromDate, toDate);
  
  if (elapsed.days === 0 && elapsed.hours === 0 && elapsed.minutes === 0) {
    return 'Just now';
  }
  
  if (elapsed.days === 0 && elapsed.hours === 0) {
    return `${elapsed.minutes} minute${elapsed.minutes !== 1 ? 's' : ''} ago`;
  }
  
  if (elapsed.days === 0) {
    return `${elapsed.hours} hour${elapsed.hours !== 1 ? 's' : ''} ago`;
  }
  
  if (elapsed.days === 1 && elapsed.hours === 0) {
    return '1 day ago';
  }
  
  if (elapsed.hours === 0) {
    return `${elapsed.days} days ago`;
  }
  
  return `${elapsed.days} day${elapsed.days !== 1 ? 's' : ''}, ${elapsed.hours} hour${elapsed.hours !== 1 ? 's' : ''} ago`;
};
