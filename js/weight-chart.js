const chartCanvas = document.getElementById("weightChart");

if (!chartCanvas) {
  throw new Error("Weight chart canvas was not found.");
}

async function loadWeightChart() {
  try {
    const response = await fetch("/api/health/weight");

    if (!response.ok) {
      throw new Error(`Weight request failed: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Weight data could not be loaded.");
    }

    if (!result.weights.length) {
      showChartMessage("No weight entries found.");
      return;
    }

    const labels = result.weights.map((entry) =>
      formatDate(entry.date)
    );

    const values = result.weights.map((entry) =>
      entry.weight
    );

    createWeightChart(labels, values);
  } catch (error) {
    console.error("Weight chart error:", error);
    showChartMessage("Weight data could not be loaded.");
  }
}

function createWeightChart(labels, values) {
  new Chart(chartCanvas, {
    type: "line",

    data: {
      labels,

      datasets: [
        {
          label: "Weight",
          data: values,
          borderWidth: 3,
          pointRadius: 4,
          pointHoverRadius: 6,
          tension: 0.35,
          fill: false
        }
      ]
    },

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
          grace: "10%",

          ticks: {
            callback(value) {
              return `${value} lb`;
            }
          }
        }
      }
    }
  });
}

function formatDate(dateString) {
  const date = new Date(`${dateString}T12:00:00`);

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric"
  }).format(date);
}

function showChartMessage(message) {
  const container = chartCanvas.closest(".chart-container");

  if (!container) {
    return;
  }

  container.innerHTML = `
    <p class="chart-message">${message}</p>
  `;
}

loadWeightChart();
