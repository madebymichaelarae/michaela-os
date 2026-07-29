const API_URL =
  "/api/finance?view=spending-report";

const contentElement =
  document.getElementById(
    "spending-content"
  );

let spendingChart =
  null;

function formatCurrency(
  value,
  includeCents = false
) {
  const amount =
    Number(value);

  if (
    !Number.isFinite(
      amount
    )
  ) {
    return "$0";
  }

  return new Intl.NumberFormat(
    "en-US",
    {
      style:
        "currency",

      currency:
        "USD",

      minimumFractionDigits:
        includeCents
          ? 2
          : 0,

      maximumFractionDigits:
        includeCents
          ? 2
          : 0
    }
  ).format(
    amount
  );
}

function formatSignedCurrency(
  value
) {
  const amount =
    Number(value || 0);

  const absoluteValue =
    formatCurrency(
      Math.abs(
        amount
      )
    );

  if (
    amount > 0
  ) {
    return `+${absoluteValue}`;
  }

  if (
    amount < 0
  ) {
    return `−${absoluteValue}`;
  }

  return "$0";
}

function escapeHtml(
  value
) {
  return String(
    value ?? ""
  )
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );
}

function getThemeValue(
  variableName,
  fallback
) {
  const value =
    getComputedStyle(
      document.documentElement
    )
      .getPropertyValue(
        variableName
      )
      .trim();

  return (
    value ||
    fallback
  );
}

function getChartColors() {
  return [
    getThemeValue(
      "--cozy-chart-1",
      "#a995f4", // lavender
    ),

    getThemeValue(
      "--cozy-chart-2",
     "#8fcff4", // aqua blue
    ),

    getThemeValue(
      "--cozy-chart-3",
      "#a7eee0", // mint
    ),

    getThemeValue(
      "--cozy-chart-4",
      "#efa6dc", // blush pink
    ),

    getThemeValue(
      "--cozy-chart-5",
      "#f4da91", // soft yellow
    )
  ];
}

function getTrendClass(
  value
) {
  const number =
    Number(value || 0);

  if (
    number < 0
  ) {
    return "trend-good";
  }

  if (
    number > 0
  ) {
    return "trend-bad";
  }

  return "trend-neutral";
}

function getTrendArrow(
  value
) {
  const number =
    Number(value || 0);

  if (
    number < 0
  ) {
    return "↓";
  }

  if (
    number > 0
  ) {
    return "↑";
  }

  return "—";
}

function createLegendItem(
  category,
  index
) {
  return `
    <li class="spending-legend-item">
      <span
        class="spending-legend-dot spending-legend-dot-${index + 1}"
        aria-hidden="true"
      ></span>

      <span class="spending-legend-name">
        ${escapeHtml(
          category.name
        )}
      </span>

      <span class="spending-legend-amount">
        ${formatCurrency(
          category.amount
        )}
      </span>
    </li>
  `;
}

function createOverallTrend(
  trend,
  previousMonth
) {
  if (
    trend?.percent ===
    null ||
    trend?.percent ===
    undefined
  ) {
    return `
      <div class="spending-trend trend-neutral">
        <span class="spending-trend-main">
          First month
        </span>

        <span class="spending-trend-label">
          No ${escapeHtml(
            previousMonth
          )} comparison
        </span>
      </div>
    `;
  }

  const percent =
    Number(
      trend.percent
    );

  return `
    <div class="spending-trend ${getTrendClass(
      percent
    )}">
      <span class="spending-trend-main">
        ${getTrendArrow(
          percent
        )}
        ${Math.abs(
          percent
        ).toFixed(1)}%
      </span>

      <span class="spending-trend-label">
        vs ${escapeHtml(
          previousMonth
        )}
      </span>
    </div>
  `;
}

function createCategoryTrend(
  trend,
  type
) {
  if (!trend) {
    return `
      <div class="spending-trend trend-neutral">
        <span class="spending-trend-main">
          —
        </span>

        <span class="spending-trend-label">
          No category change
        </span>
      </div>
    `;
  }

  const difference =
    Number(
      trend.difference || 0
    );

  const isIncrease =
    type ===
    "increase";

  return `
    <div class="spending-trend ${
      isIncrease
        ? "trend-bad"
        : "trend-good"
    }">
      <span class="spending-trend-main">
        ${
          isIncrease
            ? "↑"
            : "↓"
        }
        ${escapeHtml(
          trend.category
        )}
      </span>

      <span class="spending-trend-label">
        ${formatSignedCurrency(
          difference
        )}
      </span>
    </div>
  `;
}

function renderEmpty(
  data
) {
  contentElement.innerHTML = `
    <div class="spending-empty">
      <div
        class="spending-empty-icon"
        aria-hidden="true"
      >
        ✨
      </div>

      <p class="spending-empty-title">
        No spending yet
      </p>

      <p class="spending-empty-text">
        Transactions from ${escapeHtml(
          data.month
        )} will appear here.
      </p>
    </div>
  `;
}

function renderReport(
  data
) {
  const categories =
    Array.isArray(
      data.categories
    )
      ? data.categories
      : [];

  if (
    categories.length ===
      0 ||
    Number(
      data.totalSpent
    ) <= 0
  ) {
    renderEmpty(
      data
    );

    return;
  }

  contentElement.innerHTML = `
    <div class="spending-main">
      <div class="spending-chart-area">
        <div class="spending-chart-wrapper">
          <canvas
            id="spending-chart"
            aria-label="Spending by category for ${escapeHtml(
              data.month
            )}"
          ></canvas>

          <div class="spending-chart-center">
            <span class="spending-total">
              ${formatCurrency(
                data.totalSpent
              )}
            </span>

            <span class="spending-month">
              ${escapeHtml(
                data.month
              )}
            </span>
          </div>
        </div>
      </div>

      <div class="spending-legend-area">
        <ul class="spending-legend">
          ${categories
            .map(
              createLegendItem
            )
            .join("")}
        </ul>
      </div>
    </div>

    <footer class="spending-trends">
      ${createOverallTrend(
        data.trends?.overall,
        data.previousMonth
      )}

      ${createCategoryTrend(
        data.trends?.increase,
        "increase"
      )}

      ${createCategoryTrend(
        data.trends?.decrease,
        "decrease"
      )}
    </footer>
  `;

  createChart(
    categories
  );
}

function createChart(
  categories
) {
  const canvas =
    document.getElementById(
      "spending-chart"
    );

  if (!canvas) {
    return;
  }

  if (
    spendingChart
  ) {
    spendingChart.destroy();
  }

  const chartColors =
    getChartColors();

  spendingChart =
    new Chart(
      canvas,
      {
        type:
          "doughnut",

        data: {
          labels:
            categories.map(
              (category) =>
                category.name
            ),

          datasets: [
            {
              data:
                categories.map(
                  (category) =>
                    category.amount
                ),

              backgroundColor:
                categories.map(
                  (
                    category,
                    index
                  ) =>
                    chartColors[
                      index %
                      chartColors.length
                    ]
                ),

              borderWidth:
                0,

              hoverBorderWidth:
                0,

              spacing:
                2,

              borderRadius:
                4
            }
          ]
        },

        options: {
          responsive:
            true,

          maintainAspectRatio:
            false,

          cutout:
            "68%",

          animation: {
            duration:
              650
          },

          plugins: {
            legend: {
              display:
                false
            },

            tooltip: {
              displayColors:
                false,

              callbacks: {
                label:
                  function (
                    context
                  ) {
                    return `${context.label}: ${formatCurrency(
                      context.raw,
                      true
                    )}`;
                  }
              }
            }
          }
        }
      }
    );
}

function renderError(
  message
) {
  contentElement.innerHTML = `
    <div class="spending-error">
      <div
        class="spending-error-icon"
        aria-hidden="true"
      >
        !
      </div>

      <div>
        <p class="spending-error-title">
          Spending could not load
        </p>

        <p class="spending-error-text">
          ${escapeHtml(
            message
          )}
        </p>
      </div>
    </div>
  `;
}

async function loadSpendingReport() {
  try {
    const response =
      await fetch(
        API_URL,
        {
          method:
            "GET",

          headers: {
            Accept:
              "application/json"
          },

          cache:
            "no-store"
        }
      );

    const data =
      await response.json();

    if (
      !response.ok
    ) {
      throw new Error(
        data?.error ||
        `Request failed with status ${response.status}.`
      );
    }

    if (
      !data?.success
    ) {
      throw new Error(
        data?.error ||
        "The Spending Report API returned an error."
      );
    }

    renderReport(
      data
    );
  } catch (error) {
    console.error(
      "Unable to load spending report:",
      error
    );

    renderError(
      error?.message ||
      "Please refresh and try again."
    );
  }
}

loadSpendingReport();
