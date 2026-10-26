import { Entry } from '../types/Entry';

/**
 * Parse a date string or Date. Plain YYYY-MM-DD strings are read as local dates
 * (new Date('YYYY-MM-DD') would be UTC midnight, which can shift the day).
 */
export const parseLocalDate = (dateInput: string | Date): Date => {
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    return new Date(`${dateInput}T00:00:00`);
  }
  return new Date(dateInput);
};

/**
 * Return YYYY-MM-DD (strip time part) from a date string or Date
 */
export const stripTimeFromDate = (dateInput: string | Date): string => {
  const date = parseLocalDate(dateInput);

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

/**
 * Return the Monday (00:00) of the week the date falls in
 */
export const startOfWeek = (dateInput: string | Date): Date => {
  const d = parseLocalDate(dateInput);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // Monday = 0
  return d;
};

/**
 * ISO 8601 week number (weeks start on Monday, week 1 contains the first Thursday)
 */
export const getIsoWeek = (dateInput: string | Date): number => {
  const d = startOfWeek(dateInput);
  d.setDate(d.getDate() + 3); // Thursday of this week decides the year
  const firstThursday = new Date(d.getFullYear(), 0, 4);
  const firstMonday = startOfWeek(firstThursday);
  return 1 + Math.round((d.getTime() - firstMonday.getTime() - 3 * 86400000) / (7 * 86400000));
};

/**
 * Fills missing dates from the first entry until `until` (default: today, or the last
 * entry if that is later) with zero values
 * @param {Array} data - Array of entries with date and numberOfSacks properties
 * @returns {Array} - Array sorted by date with missing dates filled with zero values
 */
export const fillMissingDates = (data: Entry[], until: Date = new Date()): Entry[] => {
  if (!data || data.length === 0) return data;

  const sortedData = [...data].sort(
    (a, b) => parseLocalDate(a.date).getTime() - parseLocalDate(b.date).getTime(),
  );

  const result: Entry[] = [];
  const startDate = parseLocalDate(sortedData[0].date);
  const lastDate = parseLocalDate(sortedData[sortedData.length - 1].date);
  const endDate = lastDate > until ? lastDate : until;
  const dataMap = new Map<string, Entry>();

  sortedData.forEach(entry => {
    dataMap.set(stripTimeFromDate(entry.date), entry);
  });

  for (let d = new Date(startDate); d.getTime() <= endDate.getTime(); d.setDate(d.getDate() + 1)) {
    const dateKey = stripTimeFromDate(d);

    if (dataMap.has(dateKey)) {
      result.push(dataMap.get(dateKey)!);
    } else {
      result.push({
        date: dateKey,
        numberOfSacks: 0,
      });
    }
  }

  return result;
};
