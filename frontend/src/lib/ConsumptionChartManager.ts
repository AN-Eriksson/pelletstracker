import Chart from 'chart.js/auto';
import type { TooltipItem } from 'chart.js';
import {
  fillMissingDates,
  getIsoWeek,
  getIsoWeekYear,
  parseLocalDate,
  startOfMonth,
  startOfWeek,
} from '../utilities/dateUtils';
import { Entry } from '../types/Entry';
import { DailyTemperature } from '../types/Weather';
import { formatAsSacks, formatKg } from './units';

export type ChartView = 'day' | 'week' | 'month';
export type ChartRange = '30d' | '3m' | '1y' | 'all';

type Bucket = {
  start: Date; // the day, the Monday of the week or the first of the month
  total: number;
  average: number | null; // rolling average, null until the window is full
  meanC: number | null; // mean outdoor temperature over the days in the bucket that have one
  tempSum: number;
  tempDays: number;
};

const BAR_COLOR = '#2563eb'; // Tailwind blue-600, same as the app's buttons
const TREND_COLOR = '#d97706'; // amber-600
const TEMP_COLOR = '#0891b2'; // cyan-600
const TEXT_COLOR = '#6b7280'; // gray-500
const GRID_COLOR = '#e5e7eb'; // gray-200

// Rolling average window: 7 days, 4 weeks or 3 months
const AVERAGE_WINDOW: Record<ChartView, number> = { day: 7, week: 4, month: 3 };
const AVERAGE_LABEL: Record<ChartView, string> = {
  day: 'Snitt 7 dagar',
  week: 'Snitt 4 veckor',
  month: 'Snitt 3 mån',
};
const BAR_LABEL: Record<ChartView, string> = {
  day: 'kg per dag',
  week: 'kg per vecka',
  month: 'kg per månad',
};

// Roughly the width of one x-axis label ("v. 52", "13 nov") plus some space
const TICK_SPACING_PX = 56;

// Label every n:th bar, with n from these steps (week, two weeks, quarter, year...) so the labels
// fall on the same day, week or month of the period instead of drifting
const TICK_STEPS: Record<ChartView, number[]> = {
  day: [1, 2, 7, 14, 28, 91, 182, 364],
  week: [1, 2, 4, 8, 13, 26, 52, 104],
  month: [1, 2, 3, 6, 12, 24, 48],
};

const formatAmount = (kg: number) => {
  if (kg === 0) return 'Ingen förbrukning';
  return `${formatKg(kg)} (${formatAsSacks(kg)})`;
};

const shortDate = (d: Date) => d.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' });

const rangeCutoff = (range: ChartRange): Date | null => {
  if (range === 'all') return null;

  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  if (range === '30d') {
    cutoff.setDate(cutoff.getDate() - 29);
  } else if (range === '3m') {
    cutoff.setMonth(cutoff.getMonth() - 3);
  } else {
    cutoff.setFullYear(cutoff.getFullYear() - 1);
  }
  return cutoff;
};

// The start of the week or month a day belongs to; days are their own bucket
const bucketStart = (day: Date, view: ChartView): Date => {
  if (view === 'week') return startOfWeek(day);
  if (view === 'month') return startOfMonth(day);
  return day;
};

// The year shown under the x-axis labels. A week belongs to the year of its Thursday (ISO)
const bucketYear = (start: Date, view: ChartView): number =>
  view === 'week' ? getIsoWeekYear(start) : start.getFullYear();

/**
 * Turns entries into one bucket per day, ISO week or month, from the first entry until today,
 * with a rolling average over the previous buckets. The average is computed over the full
 * history before the range is applied, so it is correct at the left edge of the chart too.
 */
export const buildBuckets = (
  entries: Entry[],
  view: ChartView,
  range: ChartRange,
  temperatures: DailyTemperature[] = [],
): Bucket[] => {
  const days = fillMissingDates(entries);
  if (!days || days.length === 0) return [];

  const tempByDate = new Map(temperatures.map(t => [t.date, t.meanC]));
  let buckets: Bucket[] = days.map(e => {
    const meanC = tempByDate.get(e.date);
    return {
      start: parseLocalDate(e.date),
      total: Number(e.amountKg || 0),
      average: null,
      meanC: null,
      tempSum: meanC ?? 0,
      tempDays: meanC === undefined ? 0 : 1,
    };
  });

  if (view !== 'day') {
    const groups = new Map<number, Bucket>();
    for (const day of buckets) {
      const start = bucketStart(day.start, view);
      const group = groups.get(start.getTime()) ?? {
        start,
        total: 0,
        average: null,
        meanC: null,
        tempSum: 0,
        tempDays: 0,
      };
      group.total += day.total;
      group.tempSum += day.tempSum;
      group.tempDays += day.tempDays;
      groups.set(start.getTime(), group);
    }
    buckets = [...groups.values()];
  }

  const window = AVERAGE_WINDOW[view];
  buckets.forEach((bucket, i) => {
    bucket.meanC = bucket.tempDays > 0 ? bucket.tempSum / bucket.tempDays : null;
    if (i >= window - 1) {
      const sum = buckets.slice(i - window + 1, i + 1).reduce((acc, b) => acc + b.total, 0);
      bucket.average = sum / window;
    }
  });

  const cutoff = rangeCutoff(range);
  if (!cutoff) return buckets;

  const from = bucketStart(cutoff, view);
  return buckets.filter(b => b.start >= from);
};

export class ConsumptionChartManager {
  private canvas: HTMLCanvasElement;
  private chartInstance: Chart | null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.chartInstance = null;
  }

  /**
   * Renders kg per day, week or month as bars, with a rolling average as a line and, when there are
   * temperatures, the mean outdoor temperature on a second axis.
   * Replaces any chart previously rendered on the canvas.
   */
  render(
    entries: Entry[],
    view: ChartView,
    range: ChartRange,
    temperatures: DailyTemperature[] = [],
  ) {
    this.destroy();

    const buckets = buildBuckets(entries, view, range, temperatures);
    const hasTemperature = buckets.some(b => b.meanC !== null);
    const currentBucket = view === 'day' ? null : bucketStart(new Date(), view).getTime(); // the ongoing week or month

    const labels = buckets.map(b => {
      if (view === 'week') return `v. ${getIsoWeek(b.start)}`;
      if (view === 'month') return b.start.toLocaleDateString('sv-SE', { month: 'short' });
      return shortDate(b.start);
    });

    /**
     * Picks which labels to show instead of Chart.js' autoSkip, so the year can go under the first
     * label shown and under every label where a new year has begun. Counted back from the newest
     * bucket so today always has a label. Runs again on resize, since it reads the chart width.
     */
    const tickLabel = (index: number, chartWidth: number): string | string[] | null => {
      const maxTicks = Math.max(2, Math.floor(chartWidth / TICK_SPACING_PX));
      const steps = TICK_STEPS[view];
      const step =
        steps.find(s => Math.ceil(buckets.length / s) <= maxTicks) ?? steps[steps.length - 1];
      const fromEnd = buckets.length - 1 - index;
      if (fromEnd % step !== 0) return null;

      const year = bucketYear(buckets[index].start, view);
      const previous = index - step;
      const newYear = previous < 0 || bucketYear(buckets[previous].start, view) !== year;
      return newYear ? [labels[index], String(year)] : labels[index];
    };

    const tooltipTitle = (items: TooltipItem<'bar'>[]) => {
      const bucket = buckets[items[0].dataIndex];
      const ongoing = bucket.start.getTime() === currentBucket ? ', pågående' : '';
      if (view === 'day') {
        return bucket.start.toLocaleDateString('sv-SE', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
      }
      if (view === 'month') {
        const month = bucket.start.toLocaleDateString('sv-SE', { month: 'long', year: 'numeric' });
        return ongoing ? `${month} (pågående)` : month;
      }
      const sunday = new Date(bucket.start);
      sunday.setDate(sunday.getDate() + 6);
      const week = `Vecka ${getIsoWeek(bucket.start)} ${getIsoWeekYear(bucket.start)}`;
      return `${week} (${shortDate(bucket.start)} – ${shortDate(sunday)}${ongoing})`;
    };

    this.chartInstance = new Chart(this.canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            type: 'bar',
            label: BAR_LABEL[view],
            data: buckets.map(b => b.total),
            backgroundColor: BAR_COLOR,
            hoverBackgroundColor: '#1d4ed8', // blue-700
            borderRadius: { topLeft: 4, topRight: 4, bottomLeft: 0, bottomRight: 0 },
            borderSkipped: false,
            maxBarThickness: 24,
            order: 2,
          },
          {
            type: 'line',
            label: AVERAGE_LABEL[view],
            data: buckets.map(b => b.average),
            borderColor: TREND_COLOR,
            backgroundColor: TREND_COLOR,
            borderWidth: 2,
            borderCapStyle: 'round',
            borderJoinStyle: 'round',
            tension: 0.3,
            pointRadius: 0,
            pointHoverRadius: 5,
            pointHoverBorderColor: '#ffffff',
            pointHoverBorderWidth: 2,
            order: 1,
          },
          ...(hasTemperature
            ? [
                {
                  type: 'line' as const,
                  label: 'Utetemp',
                  data: buckets.map(b => b.meanC),
                  yAxisID: 'temp',
                  borderColor: TEMP_COLOR,
                  backgroundColor: TEMP_COLOR,
                  borderWidth: 2,
                  borderDash: [4, 4],
                  tension: 0.3,
                  pointRadius: 0,
                  pointHoverRadius: 5,
                  pointHoverBorderColor: '#ffffff',
                  pointHoverBorderWidth: 2,
                  spanGaps: true,
                  order: 0,
                },
              ]
            : []),
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index',
        },
        scales: {
          x: {
            grid: { display: false },
            border: { color: GRID_COLOR },
            ticks: {
              color: TEXT_COLOR,
              maxRotation: 0,
              autoSkip: false, // tickLabel picks the labels
              callback(_value, index) {
                return tickLabel(index, this.chart.width);
              },
            },
          },
          y: {
            beginAtZero: true,
            grid: { color: GRID_COLOR },
            border: { display: false },
            ticks: { color: TEXT_COLOR, precision: 0 },
            title: { display: true, text: 'kg', color: TEXT_COLOR },
          },
          temp: {
            display: hasTemperature,
            position: 'right',
            grid: { drawOnChartArea: false },
            border: { display: false },
            ticks: { color: TEMP_COLOR, precision: 0 },
            title: { display: true, text: '°C', color: TEMP_COLOR },
          },
        },
        plugins: {
          legend: {
            position: 'top',
            align: 'end',
            labels: {
              color: TEXT_COLOR,
              usePointStyle: true,
              boxWidth: 8,
              boxHeight: 8,
              sort: (a, b) => (a.datasetIndex ?? 0) - (b.datasetIndex ?? 0), // bars first
            },
          },
          tooltip: {
            callbacks: {
              title: tooltipTitle,
              label: (context: TooltipItem<'bar'>) => {
                const value = context.parsed.y;
                if (value === null || value === undefined) return '';
                if (context.dataset.yAxisID === 'temp') {
                  return `${context.dataset.label}: ${value.toLocaleString('sv-SE', { maximumFractionDigits: 1 })} °C`;
                }
                return context.datasetIndex === 0
                  ? formatAmount(value)
                  : `${context.dataset.label}: ${formatAmount(value)}`;
              },
            },
          },
        },
      },
    });
  }

  /**
   * Destroys the chart instance
   */
  destroy() {
    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }
  }
}
