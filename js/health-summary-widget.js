const HEALTH_SUMMARY_ENDPOINT = "/api/health-summary";

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

function renderHealthSummary(data) {
  const water = data?.water || {};
  const walking = data?.walking || {};
  const weight = data?.weight || {};

  const waterToday = Number(water.today) || 0;
  const waterGoal = Number(water.goal) || 72;
  const waterPercent = clampPercent(water.percent);

  const walkingToday = Number(walking.today) || 0;
  const walkingGoal = Number(walking.goal) || 2;
  const walkingPercent = clampPercent(walking.percent);

  const weekTotal = Number(walking.weekTotal) || 0;
  const poundsDown = Number(weight.poundsDown) || 0;

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
