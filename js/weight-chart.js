const chartCanvas =
  document.getElementById("weightChart");

if (!chartCanvas) {
  throw new Error(
    "Weight chart canvas was not found."
  );
}

async function loadWeightChart() {
  try {
    const response = await fetch(
      "/api/health?view=weight"
    );

    if (!response.ok) {
      throw new Error(
        `Weight request failed: ${response.status}`
      );
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(
        result.error ||
          "Weight data could not be loaded."
      );
    }

    if (!result.weights.length) {
      showChartMessage(
        "No weight entries found."
      );

      return;
    }

    const labels = result.weights.map(
      (entry) => formatDate(entry.date)
    );

    const values = result.weights.map(
      (entry) => entry.weight
    );

    updateWeightSummary(result.weights);

    createWeightChart(
      labels,
      values
    );
  } catch (error) {
    console.error(
      "Weight chart error:",
      error
    );

    showChartMessage(
      "Weight data could not be loaded."
    );
  }
}

function updateWeightSummary(weights) {
  const GOAL_ONE_WEIGHT = 200;
  const GOAL_TWO_WEIGHT = 150;

  const firstEntry = weights[0];

  const latestEntry =
    weights[weights.length - 1];

  const currentWeight =
    document.getElementById(
      "currentWeight"
    );

  const weightChange =
    document.getElementById(
      "weightChange"
    );

  const goalLabel =
    document.getElementById(
      "weightGoalLabel"
    );

  const goalRemaining =
    document.getElementById(
      "weightGoalRemaining"
    );

  const goalDetails =
    document.getElementById(
      "weightGoalDetails"
    );

  const progressBar =
    document.getElementById(
      "weightProgressBar"
    );

  const progressTrack =
    document.querySelector(
      ".health-weight__progress-track"
    );

  if (
    !currentWeight ||
    !weightChange ||
    !goalLabel ||
    !goalRemaining ||
    !goalDetails ||
    !progressBar ||
    !progressTrack
  ) {
    console.error(
      "One or more Weight widget elements were not found."
    );

    return;
  }

  const startingWeight =
    firstEntry.weight;

  const latestWeight =
    latestEntry.weight;

  const totalChange =
    latestWeight - startingWeight;

  currentWeight.textContent =
    latestWeight.toFixed(1);

  if (totalChange < 0) {
    weightChange.textContent =
      `↓ ${Math.abs(
        totalChange
      ).toFixed(1)} lbs`;
  } else if (totalChange > 0) {
    weightChange.textContent =
      `↑ ${totalChange.toFixed(
        1
      )} lbs`;
  } else {
    weightChange.textContent =
      "No change";
  }

  let activeGoalLabel;
  let activeGoalWeight;
  let goalStartWeight;

  if (
    latestWeight >
    GOAL_ONE_WEIGHT
  ) {
    activeGoalLabel = "Goal 1";
    activeGoalWeight =
      GOAL_ONE_WEIGHT;
    goalStartWeight =
      startingWeight;
  } else {
    activeGoalLabel = "Goal 2";
    activeGoalWeight =
      GOAL_TWO_WEIGHT;
    goalStartWeight =
      GOAL_ONE_WEIGHT;
  }

  const totalNeeded =
    goalStartWeight -
    activeGoalWeight;

  const totalCompleted =
    goalStartWeight -
    latestWeight;

  const percent =
    totalNeeded > 0
      ? Math.max(
          0,
          Math.min(
            100,
            (
              totalCompleted /
              totalNeeded
            ) * 100
          )
        )
      : 100;

  const poundsRemaining =
    Math.max(
      0,
      latestWeight -
        activeGoalWeight
    );

  goalLabel.textContent =
    `${activeGoalLabel}: ` +
    `${activeGoalWeight} lbs`;

  goalRemaining.textContent =
    poundsRemaining > 0
      ? `${poundsRemaining.toFixed(
          1
        )} lbs remaining`
      : "Goal reached!";

  goalDetails.textContent =
    `${percent.toFixed(0)}%`;

  progressBar.style.width =
    `${percent}%`;

  progressTrack.setAttribute(
    "aria-valuenow",
    Math.round(percent)
  );

  progressTrack.setAttribute(
    "aria-label",
    `Progress toward ` +
      `${activeGoalWeight} pound goal`
  );
}

function createWeightChart(
  labels,
  values
) {
  const rootStyles =
    getComputedStyle(
      document.documentElement
    );

  const accentColor =
    rootStyles
      .getPropertyValue("--accent")
      .trim() || "#d94f9a";

  const textColor =
    rootStyles
      .getPropertyValue(
        "--text-secondary"
      )
      .trim() || "#6f5f55";

  const gridColor =
    rootStyles
      .getPropertyValue(
        "--border-soft"
      )
      .trim() || "#eadfd6";

  new Chart(chartCanvas, {
    type: "line",

    data: {
      labels,

      datasets: [
        {
          label: "Weight",
          data: values,

          borderColor:
            accentColor,

          pointBackgroundColor:
            accentColor,

          pointBorderColor:
            accentColor,

          borderWidth: 2.25,
          pointRadius: 2.75,
          pointHoverRadius: 5,
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

      layout: {
        padding: {
          top: 2,
          right: 2,
          bottom: 0,
          left: 0
        }
      },

      plugins: {
        legend: {
          display: false
        },

        tooltip: {
          callbacks: {
            label(context) {
              return (
                `${context.parsed.y} lb`
              );
            }
          }
        }
      },

      scales: {
        x: {
          border: {
            display: false
          },

          grid: {
            display: false
          },

          ticks: {
            color: textColor,
            font: {
              size: 9
            },
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: 7,
            padding: 4
          }
        },

        y: {
          grace: "8%",

          border: {
            display: false
          },

          grid: {
            color: gridColor,
            lineWidth: 1
          },

          ticks: {
            color: textColor,
            font: {
              size: 9
            },
            maxTicksLimit: 4,
            padding: 5,

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
  const date = new Date(
    `${dateString}T12:00:00`
  );

  return new Intl.DateTimeFormat(
    "en-US",
    {
      month: "short",
      day: "numeric"
    }
  ).format(date);
}

function showChartMessage(message) {
  const container =
    chartCanvas.closest(
      ".health-weight__chart-container"
    );

  if (!container) {
    return;
  }

  container.innerHTML = `
    <p class="health-weight__chart-message">
      ${message}
    </p>
  `;
}

loadWeightChart();
