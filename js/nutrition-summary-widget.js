const FOOD_SUMMARY_ENDPOINT =
  "/api/food-summary";

const NUTRITION_PAGE_URL = "/";

const loadingElement =
  document.getElementById(
    "nutrition-loading"
  );

const errorElement =
  document.getElementById(
    "nutrition-error"
  );

const contentElement =
  document.getElementById(
    "nutrition-content"
  );

const nutritionCard =
  document.getElementById(
    "nutrition-card"
  );

function formatNumber(
  value,
  maximumDecimals = 1
) {
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

  return Math.max(
    0,
    Math.min(100, number)
  );
}

function setProgressBar(
  elementId,
  percent
) {
  const element =
    document.getElementById(elementId);

  if (!element) {
    return;
  }

  const safePercent =
    clampPercent(percent);

  requestAnimationFrame(() => {
    element.style.width =
      `${safePercent}%`;
  });
}

function setProgressRing(
  elementId,
  percent
) {
  const element =
    document.getElementById(elementId);

  if (!element) {
    return;
  }

  const safePercent =
    clampPercent(percent);

  const degrees =
    (safePercent / 100) * 360;

  requestAnimationFrame(() => {
    element.style.setProperty(
      "--progress",
      `${degrees}deg`
    );
  });
}

function setText(elementId, value) {
  const element =
    document.getElementById(elementId);

  if (element) {
    element.textContent = value;
  }
}

function renderNutritionSummary(data) {
  const calories = data?.calories || {};
  const protein = data?.protein || {};
  const fiber = data?.fiber || {};

  const caloriesCurrent =
    Number(calories.current) || 0;

  const caloriesGoal =
    Number(calories.goal) || 1800;

  const caloriesRemaining =
    Number(calories.remaining) || 0;

  const caloriesPercent =
    clampPercent(calories.percent);

  const proteinCurrent =
    Number(protein.current) || 0;

  const proteinGoal =
    Number(protein.goal) || 70;

  const proteinRemaining =
    Number(protein.remaining) || 0;

  const proteinPercent =
    clampPercent(protein.percent);

  const fiberCurrent =
    Number(fiber.current) || 0;

  const fiberGoal =
    Number(fiber.goal) || 25;

  const fiberRemaining =
    Number(fiber.remaining) || 0;

  const fiberPercent =
    clampPercent(fiber.percent);

  setText(
    "calories-current",
    formatNumber(caloriesCurrent, 0)
  );

  setText(
    "calories-goal",
    formatNumber(caloriesGoal, 0)
  );

  setText(
    "calories-remaining",
    `${formatNumber(
      caloriesRemaining,
      0
    )} left`
  );

  setText(
    "calories-percent",
    `${Math.round(
      caloriesPercent
    )}%`
  );

  setText(
    "protein-current",
    formatNumber(proteinCurrent, 1)
  );

  setText(
    "protein-goal",
    formatNumber(proteinGoal, 1)
  );

  setText(
    "protein-remaining",
    `${formatNumber(
      proteinRemaining,
      1
    )}g left`
  );

  setText(
    "fiber-current",
    formatNumber(fiberCurrent, 1)
  );

  setText(
    "fiber-goal",
    formatNumber(fiberGoal, 1)
  );

  setText(
    "fiber-remaining",
    `${formatNumber(
      fiberRemaining,
      1
    )}g left`
  );

  setProgressBar(
    "calories-progress",
    caloriesPercent
  );

  setProgressRing(
    "protein-ring",
    proteinPercent
  );

  setProgressRing(
    "fiber-ring",
    fiberPercent
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
    message ||
    "Nutrition data could not be loaded.";
}

async function loadNutritionSummary() {
  try {
    const response = await fetch(
      FOOD_SUMMARY_ENDPOINT,
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
          "Food summary request failed."
      );
    }

    renderNutritionSummary(data);
  } catch (error) {
    console.error(
      "Nutrition summary widget error:",
      error
    );

    showError(
      "Your nutrition summary could not be loaded."
    );
  }
}

nutritionCard.addEventListener(
  "click",
  () => {
    if (
      !NUTRITION_PAGE_URL ||
      NUTRITION_PAGE_URL === "/"
    ) {
      return;
    }

    window.open(
      NUTRITION_PAGE_URL,
      "_blank",
      "noopener,noreferrer"
    );
  }
);

loadNutritionSummary();
