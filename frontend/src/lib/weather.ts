import { Entry } from '../types/Entry';
import { DailyTemperature, WeatherStation } from '../types/Weather';
import { stripTimeFromDate } from '../utilities/dateUtils';

// Heating degree days are counted below this daily mean, the base usually used in Sweden
export const BASE_TEMP_C = 17;

// Consumption is logged when sacks are moved to the weekly store, not when they burn, so per-day
// figures are noisy; compare over whole periods of this many days instead
export const COMPARISON_DAYS = 28;

// A period needs temperatures for at least this many days to be compared
const MIN_DAYS_WITH_TEMPERATURE = 14;

export const degreeDays = (meanC: number) => Math.max(0, BASE_TEMP_C - meanC);

export type DegreeDayPeriod = {
  from: string; // YYYY-MM-DD, inclusive
  to: string;
  kg: number;
  degreeDays: number;
  kgPerDegreeDay: number | null; // null when it was too warm to compare (almost no degree days)
  meanC: number;
};

const addDays = (isoDate: string, days: number) => {
  const d = new Date(`${isoDate}T00:00:00`);
  d.setDate(d.getDate() + days);
  return stripTimeFromDate(d);
};

const period = (
  entries: Entry[],
  temperatures: DailyTemperature[],
  from: string,
  to: string,
): DegreeDayPeriod | null => {
  const temps = temperatures.filter(t => t.date >= from && t.date <= to);
  if (temps.length < MIN_DAYS_WITH_TEMPERATURE) return null;

  const kg = entries
    .filter(e => {
      const date = stripTimeFromDate(e.date);
      return date >= from && date <= to;
    })
    .reduce((acc, e) => acc + Number(e.amountKg || 0), 0);
  const dd = temps.reduce((acc, t) => acc + degreeDays(t.meanC), 0);
  const meanC = temps.reduce((acc, t) => acc + t.meanC, 0) / temps.length;

  return { from, to, kg, degreeDays: dd, kgPerDegreeDay: dd >= 1 ? kg / dd : null, meanC };
};

/**
 * kg per degree day for the latest COMPARISON_DAYS days that have temperatures, and for the
 * period before it. SMHI publishes a day's mean the morning after, so the latest period ends on
 * the last day with a temperature. Periods are clipped to start at the first consumption entry,
 * so days before logging started do not count as zero consumption.
 */
export const compareDegreeDays = (
  entries: Entry[],
  temperatures: DailyTemperature[],
): { current: DegreeDayPeriod | null; previous: DegreeDayPeriod | null } => {
  if (entries.length === 0 || temperatures.length === 0) return { current: null, previous: null };

  const firstEntry = entries.map(e => stripTimeFromDate(e.date)).sort()[0];
  const lastTemperature = temperatures.map(t => t.date).sort()[temperatures.length - 1];
  const clip = (from: string) => (from < firstEntry ? firstEntry : from);

  const currentFrom = addDays(lastTemperature, -(COMPARISON_DAYS - 1));
  const previousTo = addDays(currentFrom, -1);
  const previousFrom = addDays(previousTo, -(COMPARISON_DAYS - 1));

  return {
    current: period(entries, temperatures, clip(currentFrom), lastTemperature),
    previous:
      previousTo < firstEntry
        ? null
        : period(entries, temperatures, clip(previousFrom), previousTo),
  };
};

/**
 * Great-circle distance in km, for sorting stations by how close they are
 */
export const distanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
};

export const sortByDistance = (stations: WeatherStation[], latitude: number, longitude: number) =>
  stations
    .map(station => ({
      station,
      km: distanceKm(latitude, longitude, station.latitude, station.longitude),
    }))
    .sort((a, b) => a.km - b.km);
