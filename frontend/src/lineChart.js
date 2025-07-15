import Chart from 'chart.js/auto';
import { stripTimeFromDate } from './main.js';

let chartInstance = null;

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
export const createChart = (data = null) => {
    // Destroy existing chart if it exists
    if (chartInstance) {
        chartInstance.destroy();
    }

    const ctx = document.getElementById('pelletsChart').getContext('2d');

    // Prepare data for the chart
    let chartData;

    if (data && data.length > 0) {
        // Sort data by date
        const sortedData = data.sort((a, b) => new Date(a.date) - new Date(b.date));
        const labels = sortedData.map(entry => stripTimeFromDate(entry.date));

        chartData = {
            labels: labels,
            datasets: [{
                label: 'Antal säckar per dag',
                data: sortedData.map(entry => entry.numberOfSacks)
            }]
        };
    }

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: chartData,
        options: {
            responsive: true,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Datum'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Antal säckar'
                    },
                    beginAtZero: true
                }
            }
        }
    });

    return chartInstance;
};