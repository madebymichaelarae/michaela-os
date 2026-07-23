const HEALTH_SUMMARY_ENDPOINT = "/api/health-summary";

/*
  Replace this with the URL for your full Health page.

  It may be:
  - a page inside Michaela OS
  - a public Notion page
  - another widget route
*/
const HEALTH_PAGE_URL = "/";

const loadingElement =
  document.getElementById("health-loading");

const errorElement =
  document.getElementById("health-error");

const contentElement =
  document.getElementById("health-content");

const healthCard =
  document.getElementById("health-card");

function formatNumber(value, maximumDecimals = 1) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "0";
  }

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: maximumDecimals
  }).format(number);
}

function clampPercent(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return Math.max(0, Math.min(100, number));
}

function setProgressBar(elementId, percent) {
  const element = document.getElementById(elementId);

  if (!element) {
    return;
  }

  const safePercent = clampPercent(percent);

  requestAnimationFrame(() => {
    element.style.width = `${safePercent}%`;
  });
}

function renderWaterChart(history, goal) {
  const svg = document.getElementById(
    "water-chart-svg"
  );

  const line = document.getElementById(
    "water-chart-line"
  );

  const dotsGroup = document.getElementById(
    "water-chart-dots"
  );

  const goalLine = document.getElementById(
    "water-goal-line"
  );

  const chartElement = document.getElementById(
    "water-chart"
  );

  if (
    !svg ||
    !line ||
    !dotsGroup ||
    !goalLine ||
    !chartElement
  ) {
    return;
  }

  const entries = Array.isArray(history)
    ? history.slice(-7)
    : [];

  while (entries.length < 7) {
    entries.unshift({
      date: "",
      ounces: 0
    });
  }

  const values = entries.map((entry) =>
    Math.max(0, Number(entry.ounces) || 0)
  );

  const safeGoal = Math.max(
    1,
    Number(goal) || 72
  );

  const maximumValue = Math.max(
    safeGoal,
    ...values,
    1
  );

  const width = 140;
  const height = 48;
  const topPadding = 5;
  const bottomPadding = 5;

  const usableHeight =
    height - topPadding - bottomPadding;

  const xStep = width / (values.length - 1);

  const points = values.map((value, index) => {
    const x = index * xStep;

    const normalizedValue =
      value / maximumValue;

    const y =
      height -
      bottomPadding -
      normalizedValue * usableHeight;

    return {
      x,
      y,
      value,
      date: entries[index].date
    };
  });

  line.setAttribute(
    "points",
    points
      .map((point) => `${point.x},${point.y}`)
      .join(" ")
  );

  const goalY =
    height -
    bottomPadding -
    (safeGoal / maximumValue) * usableHeight;

  goalLine.setAttribute("y1", goalY);
  goalLine.setAttribute("y2", goalY);

  dotsGroup.innerHTML = "";

  for (const point of points) {
    const circle = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle"
    );

    circle.setAttribute("class", "water-chart__dot");
    circle.setAttribute("cx", point.x);
    circle.setAttribute("cy", point.y);
    circle.setAttribute("r", "2.7");

    dotsGroup.appendChild(circle);
  }

  const description = entries
    .map((entry) => {
      const date = entry.date || "No date";
      const ounces = Number(entry.ounces) || 0;

      return `${date}: ${ounces} ounces`;
    })
    .join(", ");

  chartElement.setAttribute(
    "aria-label",
    `Seven-day water history. ${description}`
  );
}

function renderHealthSummary(data) {
  const water = data?.water || {};
  const walking = data?.walking || {};
  const weight = data?.weight || {};

  const waterToday = Number(water.today) || 0;
  const waterGoal = Number(water.goal) || 72;
  const waterPercent = clampPercent(
    water.percent
  );

  const walkingToday =
    Number(walking.today) || 0;

  const walkingGoal =
    Number(walking.goal) || 2;

  const walkingPercent = clampPercent(
    walking.percent
  );

  const weekTotal =
    Number(walking.weekTotal) || 0;

  const poundsDown =
    Number(weight.poundsDown) || 0;

  document.getElementById(
    "water-today"
  ).textContent = formatNumber(waterToday);

  document.getElementById(
    "water-goal"
  ).textContent = formatNumber(waterGoal);

  document.getElementById(
    "water-percent"
  ).textContent = `${Math.round(
    waterPercent
  )}%`;

  document.getElementById(
    "walking-today"
  ).textContent = formatNumber(
    walkingToday,
    2
  );

  document.getElementById(
    "walking-goal"
  ).textContent = formatNumber(
    walkingGoal,
    2
  );

  document.getElementById(
    "walking-percent"
  ).textContent = `${Math.round(
    walkingPercent
  )}%`;

  document.getElementById(
    "walking-week-total"
  ).textContent = formatNumber(
    weekTotal,
    2
  );

  document.getElementById(
    "pounds-down"
  ).textContent = formatNumber(
    poundsDown,
    1
  );

  setProgressBar(
    "water-progress",
    waterPercent
  );

  setProgressBar(
    "walking-progress",
    walkingPercent
  );

  renderWaterChart(
    water.history,
    waterGoal
  );

  loadingElement.hidden = true;
  errorElement.hidden = true;
  contentElement.hidden = false;
}

function showError(message) {
  loadingElement.hidden = true;
  contentElement.hidden = true;
  errorElement.hidden = false;

  errorElement.textContent =
    message || "Health data could not be loaded.";
}

async function loadHealthSummary() {
  try {
    const response = await fetch(
      HEALTH_SUMMARY_ENDPOINT,
      {
        headers: {
          Accept: "application/json"
        }
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.error ||
          data.details ||
          "Health summary request failed."
      );
    }

    renderHealthSummary(data);
  } catch (error) {
    console.error(
      "Health summary widget error:",
      error
    );

    showError(
      "Your health summary could not be loaded."
    );
  }
}

healthCard.addEventListener("click", () => {
  if (!HEALTH_PAGE_URL || HEALTH_PAGE_URL === "/") {
    return;
  }

  window.open(
    HEALTH_PAGE_URL,
    "_blank",
    "noopener,noreferrer"
  );
});

loadHealthSummary();
