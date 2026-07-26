async function loadWalkingWidget() {
  try {
    const response = await fetch(
      "/api/health?view=walking"
    );

    if (!response.ok) {
      throw new Error(
        `Walking request failed: ${response.status}`
      );
    }

    const result =
      await response.json();

    if (!result.success) {
      throw new Error(
        result.error ||
          "Walking data could not be loaded."
      );
    }

    updateWalkingStats(result);
  } catch (error) {
    console.error(
      "Walking widget error:",
      error
    );

    showWalkingError(
      "Walking data could not be loaded."
    );
  }
}

function updateWalkingStats(
  walkingData
) {
  const walkingToday =
    document.getElementById(
      "walkingToday"
    );

  const walkingWeek =
    document.getElementById(
      "walkingWeek"
    );

  const walkingMonth =
    document.getElementById(
      "walkingMonth"
    );

  const walkingYear =
    document.getElementById(
      "walkingYear"
    );

  if (
    !walkingToday ||
    !walkingWeek ||
    !walkingMonth ||
    !walkingYear
  ) {
    console.error(
      "One or more Walking widget elements were not found."
    );

    return;
  }

  const today =
    getSafeNumber(
      walkingData.today
    );

  const week =
    getSafeNumber(
      walkingData.weekTotal
    );

  const month =
    getSafeNumber(
      walkingData.monthTotal ??
        walkingData.month
    );

  const year =
    getSafeNumber(
      walkingData.yearTotal ??
        walkingData.year
    );

  walkingToday.textContent =
    formatMiles(today);

  walkingWeek.textContent =
    formatMiles(week);

  walkingMonth.textContent =
    formatMiles(month);

  walkingYear.textContent =
    formatMiles(year);
}

function getSafeNumber(value) {
  const number =
    Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
}

function formatMiles(value) {
  /*
   * Whole numbers stay clean:
   * 2 instead of 2.0
   *
   * Decimal mileage keeps up
   * to two decimal places:
   * 1.5 or 2.25
   */
  return new Intl.NumberFormat(
    "en-US",
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }
  ).format(value);
}

function showWalkingError(
  message
) {
  const walkingError =
    document.getElementById(
      "walkingError"
    );

  if (!walkingError) {
    return;
  }

  walkingError.textContent =
    message;

  walkingError.hidden = false;
}

loadWalkingWidget();
