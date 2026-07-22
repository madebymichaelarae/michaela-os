const DAILY_WATER_GOAL = 72;

const chartCanvas = document.getElementById("waterChart");

if (!chartCanvas) {
  throw new Error("Water chart canvas was not found.");
}

async function loadWaterChart() {
  try {
    const response = await fetch("/api/health/water");

    if (!response.ok) {
      throw new Error(
        `Water request failed: ${response.status}`
      );
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(
        result.error || "Water data could not be loaded."
      );
    }

    if (!result.water || !result.water.length) {
      updateWaterSummary([]);
      showChartMessage("No water entries found.");
      return;
    }

    const labels = result.water.map((entry) =>
      formatDate(entry.date)
    );

    const values = result.water.map((entry) =>
      entry.ounces
    );

    updateWaterSummary(result.water);
    createWaterChart(labels, values);
  } catch (error) {
    console.error("Water chart error:", error);
    showChartMessage("Water data could not be loaded.");
  }
}

function updateWaterSummary(waterEntries) {
  const waterCurrent =
    document.getElementById("waterCurrent");

  const waterAverage =
    document.getElementById("waterAverage");

  const waterRecognition =
    document.getElementById("waterRecognition");

  const goalLabel =
    document.getElementById("waterGoalLabel");

  const goalRemaining =
    document.getElementById("waterGoalRemaining");

  const goalDetails =
    document.getElementById("waterGoalDetails");

  const progressBar =
    document.getElementById("waterProgressBar");

  const progressTrack =
    document.querySelector(".tracker-progress-track");

  if (
    !waterCurrent ||
    !waterAverage ||
    !waterRecognition ||
    !goalLabel ||
    !goalRemaining ||
    !goalDetails ||
    !progressBar ||
    !progressTrack
  ) {
    return;
  }

  const today = getTodayDateString();

  const todayEntry = waterEntries.find(
    (entry) => entry.date === today
  );

  const todayWater = todayEntry
    ? todayEntry.ounces
    : 0;

  const mostRecentSevenDays =
    waterEntries.slice(-7);

  const sevenDayTotal =
    mostRecentSevenDays.reduce(
      (total, entry) => total + entry.ounces,
      0
    );

  const sevenDayAverage =
    mostRecentSevenDays.length > 0
      ? sevenDayTotal / mostRecentSevenDays.length
      : 0;

  const percent = Math.max(
    0,
    Math.min(
      100,
      (todayWater / DAILY_WATER_GOAL) * 100
    )
  );

  waterCurrent.textContent =
    `${todayWater.toFixed(0)} oz`;

  waterAverage.textContent =
    `${sevenDayAverage.toFixed(0)} oz`;

  if (todayWater >= DAILY_WATER_GOAL) {
    waterRecognition.textContent =
      "💦 Hydration goal reached!";
  } else if (todayWater >= 60) {
    waterRecognition.textContent =
      "🌊 Almost there!";
  } else if (todayWater >= 48) {
    waterRecognition.textContent =
      "✨ Great progress!";
  } else if (todayWater >= 24) {
    waterRecognition.textContent =
      "💧 Keep sipping!";
  } else if (todayWater > 0) {
    waterRecognition.textContent =
      "🌱 Hydration started!";
  } else {
    waterRecognition.textContent =
      "🥤 Time for some water!";
  }

  goalLabel.textContent =
    `Daily Goal: ${DAILY_WATER_GOAL} oz`;

  goalRemaining.textContent =
    `${todayWater.toFixed(0)} / ${DAILY_WATER_GOAL} oz`;

  goalDetails.textContent =
    `${percent.toFixed(0)}% complete`;

  progressBar.style.width = `${percent}%`;

  progressTrack.setAttribute(
    "aria-valuenow",
    Math.round(percent)
  );

  progressTrack.setAttribute(
    "aria-label",
    `Progress toward ${DAILY_WATER_GOAL} ounce daily water goal`
  );
}

function createWaterChart(labels, values) {
  new Chart(chartCanvas, {
    type: "line",

    data: {
      labels,

      datasets: [
        {
          label: "Water",
          data: values,

          borderColor: "#3b9fc4",
          pointBackgroundColor: "#3b9fc4",
          pointBorderColor: "#3b9fc4",

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
              return `${context.parsed.y} oz`;
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
          beginAtZero: true,
          grace: "10%",

          ticks: {
            callback(value) {
              return `${value} oz`;
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

function getTodayDateString() {
  const today = new Date();

  const year = today.getFullYear();

  const month = String(
    today.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    today.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function showChartMessage(message) {
  const container =
    chartCanvas.closest(".tracker-chart-panel");

  if (!container) {
    return;
  }

  container.innerHTML = `
    <p class="chart-message">${message}</p>
  `;
}

loadWaterChart();
