import Chart from 'chart.js/auto';

export const createChart = () => {
    const ctx = document.getElementById('pelletsChart').getContext('2d');

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['2025-07-01', '2025-07-05', '2025-07-10', '2025-07-12', '2025-07-15'],
            datasets: [{
                label: 'Number of Sacks',
                data: [2, 3, 1, 4, 2]
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Date'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Number of Sacks'
                    },
                    beginAtZero: true
                }
            }
        }
    });
};