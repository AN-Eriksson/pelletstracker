import Chart from 'chart.js/auto';
import type { TooltipItem } from 'chart.js';
import { fillMissingDates, getIsoWeek, parseLocalDate, startOfWeek } from '../utilities/dateUtils';
import { Entry } from '../types/Entry';

export type ChartView = 'week' | 'day';
export type ChartRange = '30d' | '3m' | 'all';

type Bucket = {
  start: Date; // the day, or the Monday of the week
  total: number;
  average: number | null; // rolling average, null until the window is full
};

const BAR_COLOR = '#2563eb'; // Tailwind blue-600, same as the app's buttons
const TREND_COLOR = '#d97706'; // amber-600
const TEXT_COLOR = '#6b7280'; // gray-500
const GRID_COLOR = '#e5e7eb'; // gray-200

// Rolling average window: 7 days in the daily view, 4 weeks in the weekly view
const AVERAGE_WINDOW: Record<ChartView, number> = { day: 7, week: 4 };

const formatSacks = (value: number) => {
  if (value === 0) return 'Inga säckar';
  const formatted = value.toLocaleString('sv-SE', { maximumFractionDigits: 1 });
  return `${formatted} ${value === 1 ? 'säck' : 'säckar'}`;
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
export const buildBuckets = (entries: Entry[], view: ChartView, range: ChartRange): Bucket[] => {
  const days = fillMissingDates(entries);
  if (!days || days.length === 0) return [];

  let buckets: Bucket[] = days.map(e => ({
    start: parseLocalDate(e.date),
    total: Number(e.numberOfSacks || 0),
    average: null,
  }));

  if (view === 'week') {
    const weeks = new Map<number, Bucket>();
    for (const day of buckets) {
      const monday = startOfWeek(day.start);
      const week = weeks.get(monday.getTime()) ?? { start: monday, total: 0, average: null };
      week.total += day.total;
      weeks.set(monday.getTime(), week);
    }
    buckets = [...weeks.values()];
  }

  const window = AVERAGE_WINDOW[view];
  buckets.forEach((bucket, i) => {
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
   * Renders sacks per day or per week as bars, with a rolling average as a line.
   * Replaces any chart previously rendered on the canvas.
   */
  render(entries: Entry[], view: ChartView, range: ChartRange) {
    this.destroy();

    const buckets = buildBuckets(entries, view, range);
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
            label: view === 'week' ? 'Säckar per vecka' : 'Säckar per dag',
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
            title: { display: true, text: 'Antal säckar', color: TEXT_COLOR },
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
                return context.datasetIndex === 0
                  ? formatSacks(value)
                  : `${context.dataset.label}: ${formatSacks(value)}`;
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
