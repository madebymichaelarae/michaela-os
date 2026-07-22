const DAILY_WATER_GOAL = 72;

async function loadWaterWidget() {
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

    const waterEntries = Array.isArray(result.water)
      ? result.water
      : [];

    const dailyTotals = buildDailyTotals(waterEntries);

    updateTodayProgress(dailyTotals);
    updateGoalHistory(dailyTotals);
  } catch (error) {
    console.error("Water widget error:", error);
    showWaterError();
  }
}

function buildDailyTotals(waterEntries) {
  const totalsByDate = {};

  waterEntries.forEach((entry) => {
    if (
      !entry.date ||
      typeof entry.ounces !== "number"
    ) {
      return;
    }

    if (!totalsByDate[entry.date]) {
      totalsByDate[entry.date] = 0;
    }

    totalsByDate[entry.date] += entry.ounces;
  });

  return totalsByDate;
}

function updateTodayProgress(dailyTotals) {
  const waterCurrent =
    document.getElementById("waterCurrent");

  const waterRemaining =
    document.getElementById("waterRemaining");

  const waterRecognition =
    document.getElementById("waterRecognition");

  const waterGoalLabel =
    document.getElementById("waterGoalLabel");

  const waterGoalProgress =
    document.getElementById("waterGoalProgress");

  const waterPercentage =
    document.getElementById("waterPercentage");

  const waterProgressBar =
    document.getElementById("waterProgressBar");

  const progressTrack =
    document.querySelector(".tracker-progress-track");

  if (
    !waterCurrent ||
    !waterRemaining ||
    !waterRecognition ||
    !waterGoalLabel ||
    !waterGoalProgress ||
    !waterPercentage ||
    !waterProgressBar ||
    !progressTrack
  ) {
    return;
  }

  const today =
    getLocalDateString(new Date());

  const todayWater =
    dailyTotals[today] || 0;

  const percent = Math.max(
    0,
    Math.min(
      100,
      (todayWater / DAILY_WATER_GOAL) * 100
    )
  );

  const ouncesRemaining = Math.max(
    0,
    DAILY_WATER_GOAL - todayWater
  );

  waterCurrent.textContent =
    `${todayWater.toFixed(0)} oz`;

  waterGoalLabel.textContent =
    `Daily Goal: ${DAILY_WATER_GOAL} oz`;

  waterGoalProgress.textContent =
    `${todayWater.toFixed(0)} / ${DAILY_WATER_GOAL} oz`;

  waterPercentage.textContent =
    `${percent.toFixed(0)}% complete`;

  waterProgressBar.style.width =
    `${percent}%`;

  if (todayWater >= DAILY_WATER_GOAL) {
    waterRemaining.textContent =
      "Goal reached!";

    waterRecognition.textContent =
      "💦 Hydration goal reached!";
  } else {
    waterRemaining.textContent =
      `${ouncesRemaining.toFixed(0)} oz`;

    if (todayWater >= 60) {
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
  }

  progressTrack.setAttribute(
    "aria-valuenow",
    Math.round(percent)
  );
}

function updateGoalHistory(dailyTotals) {
  const weekGoalCount =
    document.getElementById("waterWeekGoalCount");

  const monthGoalCount =
    document.getElementById("waterMonthGoalCount");

  const currentStreak =
    document.getElementById("waterCurrentStreak");

  if (
    !weekGoalCount ||
    !monthGoalCount ||
    !currentStreak
  ) {
    return;
  }

  const today = new Date();
  today.setHours(12, 0, 0, 0);

  const weekDates = getCurrentWeekDates(today);

  const weekGoalsHit =
    weekDates.filter((date) => {
      const dateString =
        getLocalDateString(date);

      return (
        dailyTotals[dateString] >= DAILY_WATER_GOAL
      );
    }).length;

  const monthGoalsHit =
    countMonthGoalsHit(dailyTotals, today);

  const streak =
    calculateCurrentStreak(dailyTotals, today);

  weekGoalCount.textContent =
    `${weekGoalsHit} / 7 days`;

  monthGoalCount.textContent =
    `${monthGoalsHit} ${
      monthGoalsHit === 1 ? "day" : "days"
    }`;

  currentStreak.textContent =
    `${streak} ${
      streak === 1 ? "day" : "days"
    }`;
}

function getCurrentWeekDates(today) {
  const dayOfWeek = today.getDay();

  const mondayOffset =
    dayOfWeek === 0
      ? -6
      : 1 - dayOfWeek;

  const monday = new Date(today);

  monday.setDate(
    today.getDate() + mondayOffset
  );

  const dates = [];

  for (let index = 0; index < 7; index += 1) {
    const date = new Date(monday);

    date.setDate(
      monday.getDate() + index
    );

    dates.push(date);
  }

  return dates;
}

function countMonthGoalsHit(dailyTotals, today) {
  const year = today.getFullYear();
  const month = today.getMonth();

  let count = 0;

  Object.entries(dailyTotals).forEach(
    ([dateString, total]) => {
      const date = parseLocalDate(dateString);

      if (
        date.getFullYear() === year &&
        date.getMonth() === month &&
        total >= DAILY_WATER_GOAL
      ) {
        count += 1;
      }
    }
  );

  return count;
}

function calculateCurrentStreak(dailyTotals, today) {
  let streak = 0;

  const date = new Date(today);

  while (true) {
    const dateString =
      getLocalDateString(date);

    const total =
      dailyTotals[dateString] || 0;

    if (total < DAILY_WATER_GOAL) {
      break;
    }

    streak += 1;

    date.setDate(
      date.getDate() - 1
    );
  }

  return streak;
}

function getLocalDateString(date) {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseLocalDate(dateString) {
  const [year, month, day] =
    dateString.split("-").map(Number);

  return new Date(
    year,
    month - 1,
    day,
    12,
    0,
    0,
    0
  );
}

function showWaterError() {
  const waterRecognition =
    document.getElementById("waterRecognition");

  if (waterRecognition) {
    waterRecognition.textContent =
      "Water data could not be loaded.";
  }
}

loadWaterWidget();
