import Chart from 'chart.js/auto';
import { stripTimeFromDate, fillMissingDates, Entry } from '../utilities/dateUtils.ts';

export class LineChartManager {
  private canvasId: string;
  private chartInstance: Chart | null;

  constructor(canvasId: string) {
    this.canvasId = canvasId;
    this.chartInstance = null;
  }

  /**
   * Creates and renders a line chart displaying the number of sacks per day.
   *
   * @param {Array<Object>} [data=null] - The input data for the chart.
   *   Each element in the array should be an object with the following properties:
   *   - {string} date - The date in a format parseable by `new Date()`. Example: '2024-06-01'.
   *   - {number} numberOfSacks - The number of sacks for the given date.
   *
   * @returns {Chart} The created Chart.js instance.
   */
  createChart(data: Entry[] | null = null): Chart | void {
    // Destroy existing chart if it exists
    if (this.chartInstance) {
      this.chartInstance.destroy();
    }

    const element = document.getElementById(this.canvasId);
    if (!element) {
      throw new Error(`Element with id "${this.canvasId}" not found`);
    }
    if (!(element instanceof HTMLCanvasElement)) {
      throw new Error(`Element with id "${this.canvasId}" is not a <canvas>`);
    }

    const ctx = element.getContext('2d');
    if (!ctx) {
      throw new Error('Unable to obtain 2D rendering context from canvas');
    }

    // Prepare data for the chart
    let chartData: any = { labels: [], datasets: []}

    if (data && data.length > 0) {
      // Fill missing dates with zeros and sort data by date
      const filledData = fillMissingDates(data);
      const sortedData = filledData.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      const labels = sortedData.map(entry => stripTimeFromDate(entry.date));

      chartData = {
        labels: labels,
        datasets: [
          {
            label: 'Antal säckar per dag',
            data: sortedData.map(entry => entry.numberOfSacks),
          },
        ],
      };
    }

    this.chartInstance = new Chart(ctx, {
      type: 'line',
      data: chartData,
      options: {
        responsive: true,
        interaction: {
          intersect: false,
          mode: 'index',
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Datum',
            },
          },
          y: {
            title: {
              display: true,
              text: 'Antal säckar',
            },
            beginAtZero: true,
            ticks: {
              stepSize: 1, // Show only integer values
            },
          },
        },
        elements: {
          point: {
            radius: 2, // Size of points
            hoverRadius: 6, // Size when hovering
            backgroundColor: 'rgb(75, 192, 192)',
            borderColor: 'rgb(75, 192, 192)',
            borderWidth: 2,
          },
          line: {
            tension: 0, // Straight lines (0) or curved (0.4)
            borderWidth: 2,
          },
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function (context: any) {
                const value = context.parsed.y;
                if (value === 0) {
                  return 'Inga säckar fylldes på';
                }
                return `${value} säckar fylldes på`;
              },
            },
          },
        },
      },
    });
  }

  /**
   * Updates the chart with new data
   */
  updateChart(data: Entry[] | null) {
    return this.createChart(data);
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
