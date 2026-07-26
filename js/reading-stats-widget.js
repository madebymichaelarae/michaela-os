const READING_STATS_ENDPOINT =
  "/api/reading?view=stats";

async function loadReadingStatsWidget() {
  try {
    const response = await fetch(
      READING_STATS_ENDPOINT,
      {
        headers: {
          Accept: "application/json"
        }
      }
    );

    const result =
      await response.json();

    if (
      !response.ok ||
      result?.success === false
    ) {
      throw new Error(
        result?.error ||
          `Reading stats request failed: ${response.status}`
      );
    }

    renderReadingStats(
      result?.stats || result
    );
  } catch (error) {
    console.error(
      "Reading stats widget error:",
      error
    );

    showReadingStatsError(
      "Reading statistics could not be loaded."
    );
  }
}

function renderReadingStats(stats) {
  const booksThisMonth =
    document.getElementById(
      "booksThisMonth"
    );

  const booksThisYear =
    document.getElementById(
      "booksThisYear"
    );

  const pagesThisMonth =
    document.getElementById(
      "pagesThisMonth"
    );

  const pagesThisYear =
    document.getElementById(
      "pagesThisYear"
    );

  if (
    !booksThisMonth ||
    !booksThisYear ||
    !pagesThisMonth ||
    !pagesThisYear
  ) {
    console.error(
      "One or more Reading Stats elements were not found."
    );

    return;
  }

  booksThisMonth.textContent =
    formatWholeNumber(
      getFirstNumber(
        stats.booksThisMonth,
        stats.booksMonth
      )
    );

  booksThisYear.textContent =
    formatWholeNumber(
      getFirstNumber(
        stats.booksThisYear,
        stats.booksYear
      )
    );

  pagesThisMonth.textContent =
    formatWholeNumber(
      getFirstNumber(
        stats.pagesThisMonth,
        stats.pagesMonth
      )
    );

  pagesThisYear.textContent =
    formatWholeNumber(
      getFirstNumber(
        stats.pagesThisYear,
        stats.pagesYear
      )
    );
}

function getFirstNumber(
  ...values
) {
  for (const value of values) {
    const number =
      Number(value);

    if (Number.isFinite(number)) {
      return number;
    }
  }

  return 0;
}

function formatWholeNumber(value) {
  return new Intl.NumberFormat(
    "en-US",
    {
      maximumFractionDigits: 0
    }
  ).format(value);
}

function showReadingStatsError(
  message
) {
  const errorElement =
    document.getElementById(
      "readingStatsError"
    );

  if (!errorElement) {
    return;
  }

  errorElement.textContent =
    message;

  errorElement.hidden = false;
}

loadReadingStatsWidget();
