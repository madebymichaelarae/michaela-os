const chartCanvas = document.getElementById("weightChart");

if (!chartCanvas) {
    throw new Error("Weight chart canvas was not found.");
}

const weightData = {
    labels: [
        "Jun 10",
        "Jun 17",
        "Jun 24",
        "Jul 1",
        "Jul 8",
        "Jul 15"
    ],
    datasets: [
        {
            label: "Weight",
            data: [243, 241.8, 240.5, 239.9, 238.7, 237.6],
            borderWidth: 3,
            pointRadius: 4,
            pointHoverRadius: 6,
            tension: 0.35,
            fill: false
        }
    ]
};

const weightChart = new Chart(chartCanvas, {
    type: "line",

    data: weightData,

    options: {
        responsive: true,
        maintainAspectRatio: false,

        interaction: {
            mode: "index",
            intersect: false
        },

        plugins: {
            legend: {
                display: false
            },

            tooltip: {
                callbacks: {
                    label(context) {
                        return `${context.parsed.y} lb`;
                    }
                }
            }
        },

        scales: {
            x: {
                grid: {
                    display: false
                },

                ticks: {
                    maxRotation: 0
                }
            },

            y: {
                suggestedMin: 235,
                suggestedMax: 245,

                ticks: {
                    callback(value) {
                        return `${value} lb`;
                    }
                }
            }
        }
    }
});

window.addEventListener("beforeunload", () => {
    weightChart.destroy();
});
