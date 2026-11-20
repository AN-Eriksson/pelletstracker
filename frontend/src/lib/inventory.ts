import { Delivery } from '../types/Delivery';
import { Entry } from '../types/Entry';
import { stripTimeFromDate } from '../utilities/dateUtils';

// Consumption over this many days (including today) drives the forecast
export const FORECAST_WINDOW_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

export type Inventory = {
  balanceKg: number;
  since: string; // YYYY-MM-DD of the first delivery; consumption before it is not counted
  dailyAverageKg: number | null; // null when nothing was consumed in the window
  daysLeft: number | null; // null when there is no average to forecast with
  emptyDate: Date | null;
};

const sumKg = (items: { amountKg: number }[]) =>
  items.reduce((acc, item) => acc + Number(item.amountKg || 0), 0);

const addDays = (date: Date, days: number) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

/**
 * Stock balance and refill forecast.
 *
 * The first delivery is the starting point (register the stock on hand as a delivery when starting
 * to track), so the balance is all deliveries minus the consumption from that date on. The forecast
 * divides the balance by the average daily consumption over the last FORECAST_WINDOW_DAYS days,
 * or since the first consumption entry if that is more recent, so a short history is not diluted.
 * Returns null until there is at least one delivery.
 */
export const computeInventory = (
  entries: Entry[],
  deliveries: Delivery[],
  now: Date = new Date(),
): Inventory | null => {
  if (deliveries.length === 0) return null;

  // YYYY-MM-DD strings compare correctly as text
  const since = deliveries.map(d => stripTimeFromDate(d.date)).sort()[0];
  const consumedSince = entries.filter(e => stripTimeFromDate(e.date) >= since);
  const balanceKg = sumKg(deliveries) - sumKg(consumedSince);

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const todayIso = stripTimeFromDate(today);

  const firstEntry = entries.map(e => stripTimeFromDate(e.date)).sort()[0];
  const windowStart = stripTimeFromDate(addDays(today, -(FORECAST_WINDOW_DAYS - 1)));
  const from = firstEntry && firstEntry > windowStart ? firstEntry : windowStart;

  const inWindow = entries.filter(e => {
    const date = stripTimeFromDate(e.date);
    return date >= from && date <= todayIso;
  });
  const days = Math.round((today.getTime() - new Date(`${from}T00:00:00`).getTime()) / DAY_MS) + 1;
  const windowKg = sumKg(inWindow);
  const dailyAverageKg = windowKg > 0 && days > 0 ? windowKg / days : null;

  if (balanceKg <= 0) {
    return { balanceKg, since, dailyAverageKg, daysLeft: 0, emptyDate: today };
  }

  if (dailyAverageKg === null) {
    return { balanceKg, since, dailyAverageKg, daysLeft: null, emptyDate: null };
  }

  const daysLeft = Math.floor(balanceKg / dailyAverageKg);
  return { balanceKg, since, dailyAverageKg, daysLeft, emptyDate: addDays(today, daysLeft) };
};
