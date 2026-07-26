const DAILY_WATER_GOAL = 72;

async function loadWaterWidget() {
  try {
    const response = await fetch(
      "/api/health?view=water"
    );

    if (!response.ok) {
      throw new Error(
        `Water request failed: ${response.status}`
      );
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(
        result.error ||
          "Water data could not be loaded."
      );
    }

    const waterEntries =
      Array.isArray(result.water)
        ? result.water
        : [];

    const dailyTotals =
      buildDailyTotals(waterEntries);

    updateTodayProgress(dailyTotals);
    updateGoalHistory(dailyTotals);
  } catch (error) {
    console.error(
      "Water widget error:",
      error
    );

    showWaterError(
      "Water data could not be loaded."
    );
  }
}

function buildDailyTotals(
  waterEntries
) {
  const totalsByDate = {};

  waterEntries.forEach((entry) => {
    if (
      !entry.date ||
      typeof entry.ounces !==
        "number"
    ) {
      return;
    }

    if (!totalsByDate[entry.date]) {
      totalsByDate[entry.date] = 0;
    }

    totalsByDate[entry.date] +=
      entry.ounces;
  });

  return totalsByDate;
}

function updateTodayProgress(
  dailyTotals
) {
  const waterCurrent =
    document.getElementById(
      "waterCurrent"
    );

  const waterPercentage =
    document.getElementById(
      "waterPercentage"
    );

  const waterGoalLabel =
    document.getElementById(
      "waterGoalLabel"
    );

  const waterRemaining =
    document.getElementById(
      "waterRemaining"
    );

  const waterRecognition =
    document.getElementById(
      "waterRecognition"
    );

  const waterProgressBar =
    document.getElementById(
      "waterProgressBar"
    );

  const progressTrack =
    document.querySelector(
      ".health-water__progress-track"
    );

  if (
    !waterCurrent ||
    !waterPercentage ||
    !waterGoalLabel ||
    !waterRemaining ||
    !waterRecognition ||
    !waterProgressBar ||
    !progressTrack
  ) {
    console.error(
      "One or more Water widget elements were not found."
    );

    return;
  }

  const today =
    getLocalDateString(
      new Date()
    );

  const todayWater =
    dailyTotals[today] || 0;

  const percent = Math.max(
    0,
    Math.min(
      100,
      (
        todayWater /
        DAILY_WATER_GOAL
      ) * 100
    )
  );

  const ouncesRemaining =
    Math.max(
      0,
      DAILY_WATER_GOAL -
        todayWater
    );

  waterCurrent.textContent =
    todayWater.toFixed(0);

  waterPercentage.textContent =
    `${percent.toFixed(0)}%`;

  waterGoalLabel.textContent =
    `Daily Goal: ` +
    `${DAILY_WATER_GOAL} oz`;

  waterProgressBar.style.width =
    `${percent}%`;

  progressTrack.setAttribute(
    "aria-valuenow",
    Math.round(percent)
  );

  progressTrack.setAttribute(
    "aria-label",
    `${todayWater.toFixed(0)} ` +
      `of ${DAILY_WATER_GOAL} ` +
      `ounces completed`
  );

  if (
    todayWater >=
    DAILY_WATER_GOAL
  ) {
    waterRemaining.textContent =
      "Goal reached";

    waterRecognition.textContent =
      "💦 Hydration goal reached!";
  } else {
    waterRemaining.textContent =
      `${ouncesRemaining.toFixed(
        0
      )} oz remaining`;

    waterRecognition.textContent =
      "";
  }
}

function updateGoalHistory(
  dailyTotals
) {
  const weekGoalCount =
    document.getElementById(
      "waterWeekGoalCount"
    );

  const currentStreak =
    document.getElementById(
      "waterCurrentStreak"
    );

  if (
    !weekGoalCount ||
    !currentStreak
  ) {
    console.error(
      "Water history elements were not found."
    );

    return;
  }

  const today = new Date();

  today.setHours(
    12,
    0,
    0,
    0
  );

  const weekDates =
    getCurrentWeekDates(today);

  const completedWeekDates =
    weekDates.filter((date) => {
      /*
       * Future days should not count
       * against this week's current
       * progress display.
       */
      if (date > today) {
        return false;
      }

      const dateString =
        getLocalDateString(date);

      return (
        (
          dailyTotals[dateString] ||
          0
        ) >= DAILY_WATER_GOAL
      );
    });

  const weekGoalsHit =
    completedWeekDates.length;

  const currentWeekDayCount =
    weekDates.filter(
      (date) => date <= today
    ).length;

  const streak =
    calculateCurrentStreak(
      dailyTotals,
      today
    );

  weekGoalCount.textContent =
    `${weekGoalsHit} / ` +
    `${currentWeekDayCount} days`;

  currentStreak.textContent =
    `${streak} ` +
    `${streak === 1
      ? "day"
      : "days"}`;
}

function getCurrentWeekDates(
  today
) {
  const dayOfWeek =
    today.getDay();

  const mondayOffset =
    dayOfWeek === 0
      ? -6
      : 1 - dayOfWeek;

  const monday =
    new Date(today);

  monday.setDate(
    today.getDate() +
      mondayOffset
  );

  const dates = [];

  for (
    let index = 0;
    index < 7;
    index += 1
  ) {
    const date =
      new Date(monday);

    date.setDate(
      monday.getDate() +
        index
    );

    dates.push(date);
  }

  return dates;
}

function calculateCurrentStreak(
  dailyTotals,
  today
) {
  let streak = 0;

  const date =
    new Date(today);

  /*
   * If today's goal has not been
   * completed yet, begin checking
   * with yesterday. This prevents
   * an unfinished current day from
   * immediately displaying a
   * zero-day streak.
   */
  const todayString =
    getLocalDateString(date);

  const todayTotal =
    dailyTotals[todayString] || 0;

  if (
    todayTotal <
    DAILY_WATER_GOAL
  ) {
    date.setDate(
      date.getDate() - 1
    );
  }

  while (true) {
    const dateString =
      getLocalDateString(date);

    const total =
      dailyTotals[dateString] ||
      0;

    if (
      total <
      DAILY_WATER_GOAL
    ) {
      break;
    }

    streak += 1;

    date.setDate(
      date.getDate() - 1
    );
  }

  return streak;
}

function getLocalDateString(
  date
) {
  const year =
    date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return (
    `${year}-${month}-${day}`
  );
}

function showWaterError(
  message
) {
  const waterError =
    document.getElementById(
      "waterError"
    );

  if (!waterError) {
    return;
  }

  waterError.textContent =
    message;

  waterError.hidden = false;
}

loadWaterWidget();
