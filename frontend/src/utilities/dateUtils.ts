/**
 * Return YYYY-MM-DD (strip time part) from a date string or Date
 */
export const stripTimeFromDate = (dateInput: string | Date): string => {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};


/**
 * Entry representing a recorded date and the number of sacks for that date.
 *
 * @property date - The entry date, either an ISO date string or a Date object.
 * @property numberOfSacks - The number of sacks recorded for the given date.
 */
export interface Entry {
  date: string | Date;
  numberOfSacks: number;
}

/**
 * Fills missing dates between the first and last entry with zero values
 * @param {Array} data - Array of entries with date and numberOfSacks properties
 * @returns {Array} - Array with missing dates filled with zero values
 */
export const fillMissingDates = (data: Entry[]): Entry[] => {
    if (!data || data.length === 0) return data;

  const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  const result: Entry[] = [];
  const startDate = new Date(sortedData[0].date);
  const endDate = new Date(sortedData[sortedData.length - 1].date);
  const dataMap = new Map<string, Entry>();

  sortedData.forEach(entry => {
    const dateKey = stripTimeFromDate(entry.date);
    dataMap.set(dateKey, entry);
  });

  for (let d = new Date(startDate); d.getTime() <= endDate.getTime(); d.setDate(d.getDate() + 1)) {
    const dateKey = stripTimeFromDate(d);

    if (dataMap.has(dateKey)) {
      result.push(dataMap.get(dateKey)!);
    } else {
      result.push({
        date: `${dateKey}T00:00:00`,
        numberOfSacks: 0,
      });
    }
  }

  return result;
};
