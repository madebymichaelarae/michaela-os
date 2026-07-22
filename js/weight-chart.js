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

    updateWeightSummary(result.weights);
    createWeightChart(labels, values);
  } catch (error) {
    console.error("Weight chart error:", error);
    showChartMessage("Weight data could not be loaded.");
  }
}

function updateWeightSummary(weights) {
  const GOAL_WEIGHT = 200;

  const firstEntry = weights[0];
  const latestEntry = weights[weights.length - 1];

  const currentWeight = document.getElementById("currentWeight");
  const weightChange = document.getElementById("weightChange");
  const weightUpdated = document.getElementById("weightUpdated");

  const goalRemaining = document.getElementById(
    "weightGoalRemaining"
  );

  const goalDetails = document.getElementById(
    "weightGoalDetails"
  );

  const progressBar = document.getElementById(
    "weightProgressBar"
  );

  const progressTrack = document.querySelector(
    ".weight-progress-track"
  );

  if (
    !currentWeight ||
    !weightChange ||
    !weightUpdated ||
    !goalRemaining ||
    !goalDetails ||
    !progressBar ||
    !progressTrack
  ) {
    return;
  }

  const startingWeight = firstEntry.weight;
  const latestWeight = latestEntry.weight;

  currentWeight.textContent = latestWeight.toFixed(1);

  const totalChange = latestWeight - startingWeight;
  const absoluteChange = Math.abs(totalChange).toFixed(1);

  if (totalChange < 0) {
    weightChange.textContent = `↓ ${absoluteChange} lbs overall`;
  } else if (totalChange > 0) {
    weightChange.textContent = `↑ ${absoluteChange} lbs overall`;
  } else {
    weightChange.textContent = "No overall change";
  }

  weightUpdated.textContent =
    `Last updated ${formatLongDate(latestEntry.date)}`;

  const totalNeeded = startingWeight - GOAL_WEIGHT;
  const totalCompleted = startingWeight - latestWeight;

  const percent =
    totalNeeded > 0
      ? Math.max(
          0,
          Math.min(
            100,
            (totalCompleted / totalNeeded) * 100
          )
        )
      : 100;

  const poundsRemaining = Math.max(
    0,
    latestWeight - GOAL_WEIGHT
  );

  progressBar.style.width = `${percent}%`;

  progressTrack.setAttribute(
    "aria-valuenow",
    Math.round(percent)
  );

  goalRemaining.textContent =
    poundsRemaining > 0
      ? `${poundsRemaining.toFixed(1)} lbs to goal`
      : "Goal reached!";

  goalDetails.textContent =
    `${percent.toFixed(0)}% complete • Goal: ${GOAL_WEIGHT} lbs`;
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

function formatLongDate(dateString) {
  const date = new Date(`${dateString}T12:00:00`);

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
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
