import { stripTimeFromDate } from '../main.js';

/**
 * Fills missing dates between the first and last entry with zero values
 * @param {Array} data - Array of entries with date and numberOfSacks properties
 * @returns {Array} - Array with missing dates filled with zero values
 */
export const fillMissingDates = (data) => {
    if (!data || data.length === 0) return data;

    // Sort data by date
    const sortedData = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    const result = [];
    const startDate = new Date(sortedData[0].date);
    const endDate = new Date(sortedData[sortedData.length - 1].date);
    
    // Create a map for quick lookup
    const dataMap = new Map();
    sortedData.forEach(entry => {
        const dateKey = stripTimeFromDate(entry.date);
        dataMap.set(dateKey, entry);
    });

    // Fill in all dates between start and end
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateKey = d.toISOString().split('T')[0];
        
        if (dataMap.has(dateKey)) {
            result.push(dataMap.get(dateKey));
        } else {
            result.push({
                date: `${dateKey}T00:00:00`,
                numberOfSacks: 0
            });
        }
    }

    return result;
};