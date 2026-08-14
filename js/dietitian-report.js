/* =========================================================
   MICHAELA OS
   Dietitian Report
   ========================================================= */

const DEFAULT_START_DATE =
  "2026-06-05";

const elements = {
  start:
    document.getElementById(
      "report-start"
    ),

  generate:
    document.getElementById(
      "report-generate"
    ),

  print:
    document.getElementById(
      "report-print"
    ),

  range:
    document.getElementById(
      "report-range"
    ),

  loading:
    document.getElementById(
      "report-loading"
    ),

  error:
    document.getElementById(
      "report-error"
    ),

  content:
    document.getElementById(
      "report-content"
    ),

  days:
    document.getElementById(
      "report-days"
    ),

  loggedDays:
    document.getElementById(
      "summary-logged-days"
    ),

  meals:
    document.getElementById(
      "summary-meals"
    ),

  calories:
    document.getElementById(
      "summary-calories"
    ),

  protein:
    document.getElementById(
      "summary-protein"
    ),

  fiber:
    document.getElementById(
      "summary-fiber"
    ),

  water:
    document.getElementById(
      "summary-water"
    ),

  hunger:
    document.getElementById(
      "summary-hunger"
    ),

  fullness:
    document.getElementById(
      "summary-fullness"
    ),

  satisfaction:
    document.getElementById(
      "summary-satisfaction"
    )
};

let currentReport =
  null;

let isLoading =
  false;

/* =========================================================
   BASIC HELPERS
   ========================================================= */

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

function formatNumber(
  value,
  digits = 1
) {
  const number =
    Number(
      value
    );

  if (
    !Number.isFinite(
      number
    )
  ) {
    return "—";
  }

  return number.toLocaleString(
    "en-US",
    {
      maximumFractionDigits:
        digits
    }
  );
}

function formatDate(
  dateString
) {
  if (
    !dateString
  ) {
    return "";
  }

  const date =
    new Date(
      `${dateString}T12:00:00Z`
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return dateString;
  }

  return new Intl.DateTimeFormat(
    "en-US",
    {
      month:
        "long",

      day:
        "numeric",

      year:
        "numeric",

      timeZone:
        "UTC"
    }
  ).format(
    date
  );
}

function hasBehaviorValue(
  value
) {
  return (
    typeof value ===
      "number" &&
    Number.isFinite(
      value
    ) &&
    value > 0
  );
}

function setLoading(
  loading
) {
  isLoading =
    loading;

  elements.generate.disabled =
    loading;

  elements.print.disabled =
    loading;

  if (
    loading
  ) {
    elements.loading.hidden =
      false;

    elements.error.hidden =
      true;

    elements.content.hidden =
      true;
  } else {
    elements.loading.hidden =
      true;
  }
}

function showError(
  message
) {
  elements.loading.hidden =
    true;

  elements.content.hidden =
    true;

  elements.error.hidden =
    false;

  elements.error.textContent =
    message ||
    "Report could not be loaded.";
}

/* =========================================================
   API
   ========================================================= */

async function fetchReport(
  startDate
) {
  const url =
    new URL(
      "/api/dietitian-report",
      window.location.origin
    );

  url.searchParams.set(
    "start",
    startDate
  );

  const response =
    await fetch(
      url.toString(),
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

  const rawText =
    await response.text();

  let data;

  try {
    data =
      rawText
        ? JSON.parse(
            rawText
          )
        : {};
  } catch {
    throw new Error(
      "The report API returned an unreadable response."
    );
  }

  if (
    !response.ok ||
    data?.success === false
  ) {
    throw new Error(
      data?.details ||
      data?.error ||
      `Request failed with status ${response.status}.`
    );
  }

  return data;
}

/* =========================================================
   SUMMARY
   ========================================================= */

function renderSummary(
  report
) {
  const summary =
    report?.summary || {};

  const averages =
    summary.averages || {};

  elements.loggedDays.textContent =
    formatNumber(
      summary.loggedDays,
      0
    );

  elements.meals.textContent =
    formatNumber(
      summary.mealCount,
      0
    );

  elements.calories.textContent =
    averages.calories !==
      null &&
    averages.calories !==
      undefined
      ? `${formatNumber(
          averages.calories,
          0
        )}`
      : "—";

  elements.protein.textContent =
    averages.protein !==
      null &&
    averages.protein !==
      undefined
      ? `${formatNumber(
          averages.protein
        )}g`
      : "—";

  elements.fiber.textContent =
    averages.fiber !==
      null &&
    averages.fiber !==
      undefined
      ? `${formatNumber(
          averages.fiber
        )}g`
      : "—";

  elements.water.textContent =
    averages.waterOz !==
      null &&
    averages.waterOz !==
      undefined
      ? `${formatNumber(
          averages.waterOz
        )} oz`
      : "—";

  elements.hunger.textContent =
    averages.hungerBefore !==
      null &&
    averages.hungerBefore !==
      undefined
      ? formatNumber(
          averages.hungerBefore
        )
      : "—";

  elements.fullness.textContent =
    averages.fullnessAfter !==
      null &&
    averages.fullnessAfter !==
      undefined
      ? formatNumber(
          averages.fullnessAfter
        )
      : "—";

  elements.satisfaction.textContent =
    averages.satisfaction !==
      null &&
    averages.satisfaction !==
      undefined
      ? formatNumber(
          averages.satisfaction
        )
      : "—";
}

/* =========================================================
   MEAL RENDERING
   ========================================================= */

function createBehaviorHtml(
  meal
) {
  const items = [];

  if (
    hasBehaviorValue(
      meal.hungerBefore
    )
  ) {
    items.push(
      `<span>Hunger ${escapeHtml(
        formatNumber(
          meal.hungerBefore
        )
      )}</span>`
    );
  }

  if (
    hasBehaviorValue(
      meal.fullnessAfter
    )
  ) {
    items.push(
      `<span>Fullness ${escapeHtml(
        formatNumber(
          meal.fullnessAfter
        )
      )}</span>`
    );
  }

  if (
    hasBehaviorValue(
      meal.satisfaction
    )
  ) {
    items.push(
      `<span>Satisfaction ${escapeHtml(
        formatNumber(
          meal.satisfaction
        )
      )}</span>`
    );
  }

  if (
    items.length ===
    0
  ) {
    return "";
  }

  return `
    <div class="dietitian-meal__behavior">
      ${items.join("")}
    </div>
  `;
}

function createNutritionHtml(
  meal
) {
  return `
    <div class="dietitian-meal__nutrition">
      <span class="dietitian-meal__calories">
        ${escapeHtml(
          formatNumber(
            meal.calories,
            0
          )
        )} cal
      </span>

      <span>
        Protein
        ${escapeHtml(
          formatNumber(
            meal.protein
          )
        )}g
      </span>

      <span>
        Carbs
        ${escapeHtml(
          formatNumber(
            meal.carbs
          )
        )}g
      </span>

      <span>
        Fiber
        ${escapeHtml(
          formatNumber(
            meal.fiber
          )
        )}g
      </span>

      <span>
        Fat
        ${escapeHtml(
          formatNumber(
            meal.fat
          )
        )}g
      </span>
    </div>
  `;
}

function createMealHtml(
  meal
) {
  const hasPhoto =
    Boolean(
      meal.photo
    );

  const mealType =
    String(
      meal.mealType || ""
    ).trim();

  const title =
    String(
      meal.title ||
      "Meal"
    ).trim();

  const notes =
    String(
      meal.notes || ""
    ).trim();

  const portion =
    Number(
      meal.portion
    );

  const shouldShowPortion =
    Number.isFinite(
      portion
    ) &&
    portion > 0 &&
    portion !== 1;

  const metaParts = [];

  if (
    shouldShowPortion
  ) {
    metaParts.push(
      `Portion ${formatNumber(
        portion
      )}`
    );
  }

  const photoHtml =
    hasPhoto
      ? `
        <img
          class="dietitian-meal__photo"
          src="${escapeHtml(
            meal.photo
          )}"
          alt="${escapeHtml(
            title
          )}"
        />
      `
      : "";

  const notesHtml =
    notes
      ? `
        <p class="dietitian-meal__notes">
          ${escapeHtml(
            notes
          )}
        </p>
      `
      : "";

  const metaHtml =
    metaParts.length > 0
      ? `
        <p class="dietitian-meal__notes">
          ${escapeHtml(
            metaParts.join(
              " · "
            )
          )}
        </p>
      `
      : "";

  return `
    <article
      class="dietitian-meal ${
        hasPhoto
          ? "dietitian-meal--has-photo"
          : ""
      }"
    >
      ${photoHtml}

      <div class="dietitian-meal__main">
        ${
          mealType
            ? `
              <p class="dietitian-meal__type">
                ${escapeHtml(
                  mealType
                )}
              </p>
            `
            : ""
        }

        <h4 class="dietitian-meal__title">
          ${escapeHtml(
            title
          )}
        </h4>

        ${metaHtml}
        ${notesHtml}

        ${createBehaviorHtml(
          meal
        )}
      </div>

      ${createNutritionHtml(
        meal
      )}
    </article>
  `;
}

/* =========================================================
   DAY RENDERING
   ========================================================= */

function createDayHtml(
  day
) {
  const meals =
    Array.isArray(
      day.meals
    )
      ? day.meals
      : [];

  return `
    <article class="dietitian-day">
      <header class="dietitian-day__header">
        <h3 class="dietitian-day__date">
          ${escapeHtml(
            day.dateLabel ||
            formatDate(
              day.date
            )
          )}
        </h3>

        <div class="dietitian-day__totals">
          <span>
            ${escapeHtml(
              formatNumber(
                day.totals?.calories,
                0
              )
            )} cal
          </span>

          <span>
            ${escapeHtml(
              formatNumber(
                day.totals?.protein
              )
            )}g protein
          </span>

          <span>
            ${escapeHtml(
              formatNumber(
                day.totals?.fiber
              )
            )}g fiber
          </span>

          ${
            Number(
              day.waterOz
            ) > 0
              ? `
                <span class="dietitian-day__water">
                  💧 ${escapeHtml(
                    formatNumber(
                      day.waterOz
                    )
                  )} oz
                </span>
              `
              : ""
          }
        </div>
      </header>

      <div class="dietitian-day__meals">
        ${meals
          .map(
            createMealHtml
          )
          .join("")}
      </div>
    </article>
  `;
}

function renderDays(
  report
) {
  const days =
    Array.isArray(
      report?.days
    )
      ? report.days
      : [];

  /*
   * Only show dates that contain actual food entries.
   *
   * This keeps the PDF compact instead of printing
   * dozens of blank June/July dates.
   */
  const loggedDays =
    days.filter(
      (day) =>
        Array.isArray(
          day.meals
        ) &&
        day.meals.length > 0
    );

  if (
    loggedDays.length ===
    0
  ) {
    elements.days.innerHTML = `
      <div class="dietitian-report__state">
        No food entries were found for this reporting period.
      </div>
    `;

    return;
  }

  elements.days.innerHTML =
    loggedDays
      .map(
        createDayHtml
      )
      .join("");
}

/* =========================================================
   FULL REPORT
   ========================================================= */

function renderReport(
  report
) {
  currentReport =
    report;

  const range =
    report?.range || {};

  elements.range.textContent =
    `${formatDate(
      range.startDate
    )} – ${formatDate(
      range.endDate
    )}`;

  renderSummary(
    report
  );

  renderDays(
    report
  );

  elements.error.hidden =
    true;

  elements.content.hidden =
    false;
}

/* =========================================================
   LOAD REPORT
   ========================================================= */

async function loadReport() {
  if (
    isLoading
  ) {
    return;
  }

  const startDate =
    String(
      elements.start.value ||
      DEFAULT_START_DATE
    ).trim();

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      startDate
    )
  ) {
    showError(
      "Please choose a valid start date."
    );

    return;
  }

  setLoading(
    true
  );

  try {
    const report =
      await fetchReport(
        startDate
      );

    renderReport(
      report
    );
  } catch (
    error
  ) {
    console.error(
      "Dietitian report error:",
      error
    );

    showError(
      error instanceof Error
        ? error.message
        : "Report could not be loaded."
    );
  } finally {
    setLoading(
      false
    );
  }
}

/* =========================================================
   EVENTS
   ========================================================= */

elements.generate.addEventListener(
  "click",
  loadReport
);

elements.print.addEventListener(
  "click",
  () => {
    if (
      !currentReport
    ) {
      return;
    }

    window.print();
  }
);

elements.start.addEventListener(
  "change",
  () => {
    /*
     * Do not auto-query while the date picker is still being
     * adjusted. The Refresh Report button keeps it deliberate.
     */
  }
);

/* =========================================================
   INITIAL LOAD
   ========================================================= */

elements.start.value =
  DEFAULT_START_DATE;

loadReport();
