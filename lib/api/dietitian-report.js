/* =========================================================
   MICHAELA OS
   Dietitian Report API
   ========================================================= */

import {
  queryAllFoodEntries
} from "../notion-food.js";

import {
  queryAllHealthEntries
} from "../notion-health.js";

const TIME_ZONE =
  "America/New_York";

/* =========================================================
   BASIC PROPERTY READERS
   ========================================================= */

function getPlainText(
  items = []
) {
  return (
    Array.isArray(items)
      ? items
          .map(
            (item) =>
              item?.plain_text ||
              item?.text?.content ||
              ""
          )
          .join("")
          .trim()
      : ""
  );
}

function getTitle(
  property
) {
  return getPlainText(
    property?.title || []
  );
}

function getRichText(
  property
) {
  return getPlainText(
    property?.rich_text || []
  );
}

function getSelect(
  property
) {
  return (
    property?.select?.name ||
    property?.status?.name ||
    ""
  );
}

function getNumber(
  property
) {
  if (!property) {
    return 0;
  }

  if (
    typeof property.number ===
    "number"
  ) {
    return property.number;
  }

  if (
    typeof property.formula?.number ===
    "number"
  ) {
    return property.formula.number;
  }

  if (
    typeof property.rollup?.number ===
    "number"
  ) {
    return property.rollup.number;
  }

  return 0;
}

function getDate(
  property
) {
  return (
    property?.date?.start ||
    null
  );
}

function getUrl(
  property
) {
  if (!property) {
    return "";
  }

  if (
    typeof property.url ===
    "string"
  ) {
    return property.url;
  }

  if (
    Array.isArray(
      property.files
    ) &&
    property.files.length
  ) {
    const firstFile =
      property.files[0];

    if (
      firstFile?.type ===
      "external"
    ) {
      return (
        firstFile.external
          ?.url || ""
      );
    }

    if (
      firstFile?.type ===
      "file"
    ) {
      return (
        firstFile.file
          ?.url || ""
      );
    }
  }

  return "";
}

/* =========================================================
   DATE HELPERS
   ========================================================= */

function getDateKey(
  dateValue = new Date()
) {
  if (
    typeof dateValue ===
    "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(
      dateValue
    )
  ) {
    return dateValue;
  }

  const date =
    dateValue instanceof Date
      ? dateValue
      : new Date(
          dateValue
        );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  const parts =
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone:
          TIME_ZONE,

        year:
          "numeric",

        month:
          "2-digit",

        day:
          "2-digit"
      }
    ).formatToParts(
      date
    );

  const values =
    Object.fromEntries(
      parts.map(
        (part) => [
          part.type,
          part.value
        ]
      )
    );

  return `${values.year}-${values.month}-${values.day}`;
}

function shiftDateKey(
  dateKey,
  amount
) {
  const [
    year,
    month,
    day
  ] = dateKey
    .split("-")
    .map(Number);

  const date =
    new Date(
      Date.UTC(
        year,
        month - 1,
        day,
        12
      )
    );

  date.setUTCDate(
    date.getUTCDate() +
      amount
  );

  return date
    .toISOString()
    .slice(
      0,
      10
    );
}

function getRequestedRange(
  request
) {
  const rawStart =
    String(
      request.query?.start ||
      ""
    ).trim();

  const hasValidStart =
    /^\d{4}-\d{2}-\d{2}$/.test(
      rawStart
    );

  const endDate =
    getDateKey();

  if (
    hasValidStart
  ) {
    return {
      startDate:
        rawStart,

      endDate,

      days:
        null
    };
  }

  const requestedDays =
    Number(
      request.query?.days
    );

  const days =
    Number.isInteger(
      requestedDays
    ) &&
    requestedDays >= 1 &&
    requestedDays <= 180
      ? requestedDays
      : 14;

  const startDate =
    shiftDateKey(
      endDate,
      -(days - 1)
    );

  return {
    startDate,
    endDate,
    days
  };
}

/* =========================================================
   NORMALIZERS
   ========================================================= */

function normalizeMeal(
  page
) {
  const properties =
    page?.properties || {};

  return {
    id:
      page?.id || "",

    title:
      getTitle(
        properties.Title
      ) ||
      "Untitled Meal",

    date:
      getDate(
        properties.Date
      ),

    meal:
      getUrl(
        properties.Meal
      ),

    mealType:
      getSelect(
        properties[
          "Meal Type"
        ]
      ),

    portion:
      getNumber(
        properties.Portion
      ),

    photo:
      getUrl(
        properties.Photo
      ),

    hungerBefore:
      getNumber(
        properties[
          "Hunger Before"
        ]
      ),

    fullnessAfter:
      getNumber(
        properties[
          "Fullness After"
        ]
      ),

    satisfaction:
      getNumber(
        properties.Satisfaction
      ),

    notes:
      getRichText(
        properties.Notes
      ),

    calories:
      getNumber(
        properties.Calories
      ),

    protein:
      getNumber(
        properties.Protein
      ),

    carbs:
      getNumber(
        properties.Carbs
      ),

    fiber:
      getNumber(
        properties.Fiber
      ),

    fat:
      getNumber(
        properties.Fat
      ),

    notionUrl:
      page?.url || ""
  };
}

function normalizeHealthEntry(
  page
) {
  const properties =
    page?.properties || {};

  return {
    id:
      page?.id || "",

    date:
      getDate(
        properties.Date
      ),

    category:
      getSelect(
        properties.Category
      ),

    amount:
      getNumber(
        properties.Amount
      ),

    unit:
      getSelect(
        properties.Unit
      ),

    notes:
      getRichText(
        properties.Notes
      )
  };
}

/* =========================================================
   REPORT HELPERS
   ========================================================= */

function roundOne(
  value
) {
  return (
    Math.round(
      (
        Number(value) ||
        0
      ) * 10
    ) / 10
  );
}

function emptyTotals() {
  return {
    calories: 0,
    protein: 0,
    carbs: 0,
    fiber: 0,
    fat: 0
  };
}

function addMealToTotals(
  totals,
  meal
) {
  totals.calories +=
    meal.calories;

  totals.protein +=
    meal.protein;

  totals.carbs +=
    meal.carbs;

  totals.fiber +=
    meal.fiber;

  totals.fat +=
    meal.fat;
}

function normalizeWaterToOz(
  entry
) {
  const category =
    String(
      entry.category || ""
    )
      .trim()
      .toLowerCase();

  if (
    category !== "water"
  ) {
    return 0;
  }

  const amount =
    Number(
      entry.amount
    ) || 0;

  const unit =
    String(
      entry.unit || ""
    )
      .trim()
      .toLowerCase();

  if (
    unit === "oz" ||
    unit === "ounce" ||
    unit === "ounces"
  ) {
    return amount;
  }

  if (
    unit === "ml" ||
    unit === "milliliter" ||
    unit === "milliliters"
  ) {
    return (
      amount /
      29.5735
    );
  }

  if (
    unit === "cup" ||
    unit === "cups"
  ) {
    return amount * 8;
  }

  return amount;
}

function formatDayLabel(
  dateKey
) {
  return new Intl.DateTimeFormat(
    "en-US",
    {
      timeZone:
        "UTC",

      weekday:
        "long",

      month:
        "long",

      day:
        "numeric"
    }
  ).format(
    new Date(
      `${dateKey}T12:00:00Z`
    )
  );
}

/* =========================================================
   BUILD REPORT
   ========================================================= */

function buildReport(
  meals,
  healthEntries,
  startDate,
  endDate
) {
  const dayMap =
    new Map();

  let currentDate =
    startDate;

  while (
    currentDate <=
    endDate
  ) {
    dayMap.set(
      currentDate,
      {
        date:
          currentDate,

        dateLabel:
          formatDayLabel(
            currentDate
          ),

        meals:
          [],

        waterOz:
          0,

        totals:
          emptyTotals()
      }
    );

    currentDate =
      shiftDateKey(
        currentDate,
        1
      );
  }

  for (
    const meal
    of meals
  ) {
    const dateKey =
      getDateKey(
        meal.date
      );

    if (
      !dateKey ||
      !dayMap.has(
        dateKey
      )
    ) {
      continue;
    }

    const day =
      dayMap.get(
        dateKey
      );

    day.meals.push(
      meal
    );

    addMealToTotals(
      day.totals,
      meal
    );
  }

  for (
    const entry
    of healthEntries
  ) {
    const dateKey =
      getDateKey(
        entry.date
      );

    if (
      !dateKey ||
      !dayMap.has(
        dateKey
      )
    ) {
      continue;
    }

    dayMap.get(
      dateKey
    ).waterOz +=
      normalizeWaterToOz(
        entry
      );
  }

  const days =
    Array.from(
      dayMap.values()
    );

  let totalCalories =
    0;

  let totalProtein =
    0;

  let totalCarbs =
    0;

  let totalFiber =
    0;

  let totalFat =
    0;

  let totalWaterOz =
    0;

  let totalHunger =
    0;

  let hungerCount =
    0;

  let totalFullness =
    0;

  let fullnessCount =
    0;

  let totalSatisfaction =
    0;

  let satisfactionCount =
    0;

  let mealCount =
    0;

  for (
    const day
    of days
  ) {
    day.totals.calories =
      roundOne(
        day.totals.calories
      );

    day.totals.protein =
      roundOne(
        day.totals.protein
      );

    day.totals.carbs =
      roundOne(
        day.totals.carbs
      );

    day.totals.fiber =
      roundOne(
        day.totals.fiber
      );

    day.totals.fat =
      roundOne(
        day.totals.fat
      );

    day.waterOz =
      roundOne(
        day.waterOz
      );

    totalCalories +=
      day.totals.calories;

    totalProtein +=
      day.totals.protein;

    totalCarbs +=
      day.totals.carbs;

    totalFiber +=
      day.totals.fiber;

    totalFat +=
      day.totals.fat;

    totalWaterOz +=
      day.waterOz;

    for (
      const meal
      of day.meals
    ) {
      mealCount += 1;

      if (
        meal.hungerBefore > 0
      ) {
        totalHunger +=
          meal.hungerBefore;

        hungerCount += 1;
      }

      if (
        meal.fullnessAfter > 0
      ) {
        totalFullness +=
          meal.fullnessAfter;

        fullnessCount += 1;
      }

      if (
        meal.satisfaction > 0
      ) {
        totalSatisfaction +=
          meal.satisfaction;

        satisfactionCount +=
          1;
      }
    }
  }

  const loggedDays =
    days.filter(
      (day) =>
        day.meals.length > 0
    );

  const loggedDayCount =
    loggedDays.length || 1;

  return {
    days,

    summary: {
      calendarDays:
        days.length,

      loggedDays:
        loggedDays.length,

      mealCount,

      averages: {
        calories:
          roundOne(
            totalCalories /
            loggedDayCount
          ),

        protein:
          roundOne(
            totalProtein /
            loggedDayCount
          ),

        carbs:
          roundOne(
            totalCarbs /
            loggedDayCount
          ),

        fiber:
          roundOne(
            totalFiber /
            loggedDayCount
          ),

        fat:
          roundOne(
            totalFat /
            loggedDayCount
          ),

        waterOz:
          roundOne(
            totalWaterOz /
            loggedDayCount
          ),

        hungerBefore:
          hungerCount > 0
            ? roundOne(
                totalHunger /
                hungerCount
              )
            : null,

        fullnessAfter:
          fullnessCount > 0
            ? roundOne(
                totalFullness /
                fullnessCount
              )
            : null,

        satisfaction:
          satisfactionCount > 0
            ? roundOne(
                totalSatisfaction /
                satisfactionCount
              )
            : null
      }
    }
  };
}

/* =========================================================
   MAIN HANDLER
   ========================================================= */

export default async function handler(
  request,
  response
) {
  if (
    request.method !==
    "GET"
  ) {
    response.setHeader(
      "Allow",
      "GET"
    );

    return response
      .status(405)
      .json({
        success:
          false,

        error:
          "Method not allowed"
      });
  }

  try {
    const {
      days,
      startDate,
      endDate
    } =
      getRequestedRange(
        request
      );

    const [
      foodPages,
      healthPages
    ] =
      await Promise.all([
        queryAllFoodEntries({
          filter: {
            and: [
              {
                property:
                  "Date",

                date: {
                  on_or_after:
                    startDate
                }
              },

              {
                property:
                  "Date",

                date: {
                  on_or_before:
                    endDate
                }
              }
            ]
          },

          sorts: [
            {
              property:
                "Date",

              direction:
                "ascending"
            }
          ]
        }),

        queryAllHealthEntries({
          filter: {
            and: [
              {
                property:
                  "Date",

                date: {
                  on_or_after:
                    startDate
                }
              },

              {
                property:
                  "Date",

                date: {
                  on_or_before:
                    endDate
                }
              }
            ]
          },

          sorts: [
            {
              property:
                "Date",

              direction:
                "ascending"
            }
          ]
        })
      ]);

    const meals =
      foodPages.map(
        normalizeMeal
      );

    const healthEntries =
      healthPages.map(
        normalizeHealthEntry
      );

    const report =
      buildReport(
        meals,
        healthEntries,
        startDate,
        endDate
      );

    response.setHeader(
      "Cache-Control",
      "no-store"
    );

    return response
      .status(200)
      .json({
        success:
          true,

        range: {
          days,
          startDate,
          endDate
        },

        ...report
      });
  } catch (
    error
  ) {
    console.error(
      "Dietitian report API error:",
      error
    );

    return response
      .status(500)
      .json({
        success:
          false,

        error:
          "Dietitian report could not be loaded.",

        details:
          error instanceof Error
            ? error.message
            : String(
                error
              )
      });
  }
}
