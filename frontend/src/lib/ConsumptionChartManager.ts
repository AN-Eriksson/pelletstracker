import Chart from 'chart.js/auto';
import type { TooltipItem } from 'chart.js';
import { fillMissingDates, getIsoWeek, parseLocalDate, startOfWeek } from '../utilities/dateUtils';
import { Entry } from '../types/Entry';
import { DailyTemperature } from '../types/Weather';
import { formatAsSacks, formatKg } from './units';

export type ChartView = 'week' | 'day';
export type ChartRange = '30d' | '3m' | 'all';

type Bucket = {
  start: Date; // the day, or the Monday of the week
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

// Rolling average window: 7 days in the daily view, 4 weeks in the weekly view
const AVERAGE_WINDOW: Record<ChartView, number> = { day: 7, week: 4 };

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
  } else {
    cutoff.setMonth(cutoff.getMonth() - 3);
  }
  return cutoff;
};

/**
 * Turns entries into one bucket per day or per ISO week, from the first entry until today,
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

  if (view === 'week') {
    const weeks = new Map<number, Bucket>();
    for (const day of buckets) {
      const monday = startOfWeek(day.start);
      const week = weeks.get(monday.getTime()) ?? {
        start: monday,
        total: 0,
        average: null,
        meanC: null,
        tempSum: 0,
        tempDays: 0,
      };
      week.total += day.total;
      week.tempSum += day.tempSum;
      week.tempDays += day.tempDays;
      weeks.set(monday.getTime(), week);
    }
    buckets = [...weeks.values()];
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

  const from = view === 'week' ? startOfWeek(cutoff) : cutoff;
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
   * Renders kg per day or per week as bars, with a rolling average as a line and, when there are
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
    const currentWeek = startOfWeek(new Date()).getTime();
    const window = AVERAGE_WINDOW[view];

    const labels = buckets.map(b =>
      view === 'week' ? `v. ${getIsoWeek(b.start)}` : shortDate(b.start),
    );

    const tooltipTitle = (items: TooltipItem<'bar'>[]) => {
      const bucket = buckets[items[0].dataIndex];
      if (view === 'day') {
        return bucket.start.toLocaleDateString('sv-SE', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        });
      }
      const sunday = new Date(bucket.start);
      sunday.setDate(sunday.getDate() + 6);
      const ongoing = bucket.start.getTime() === currentWeek ? ', pågående' : '';
      return `Vecka ${getIsoWeek(bucket.start)} (${shortDate(bucket.start)} – ${shortDate(sunday)}${ongoing})`;
    };

    this.chartInstance = new Chart(this.canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            type: 'bar',
            label: view === 'week' ? 'kg per vecka' : 'kg per dag',
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
            label: view === 'week' ? `Snitt ${window} veckor` : `Snitt ${window} dagar`,
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
            ticks: { color: TEXT_COLOR, maxRotation: 0, autoSkip: true, maxTicksLimit: 8 },
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
