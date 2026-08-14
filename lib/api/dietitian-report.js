/* =========================================================
   MICHAELA OS
   Dietitian Report API

   Combines:
   - Food Log
   - Related Meal / Food names
   - Health / Water entries

   ========================================================= */

import {
  queryAllFoodEntries,
  retrieveFoodRelatedPage
} from "../notion-food.js";

import {
  queryAllHealthEntries
} from "../notion-health.js";

const TIME_ZONE =
  "America/New_York";

/* =========================================================
   BASIC TEXT HELPERS
   ========================================================= */

function getPlainText(
  items = []
) {
  if (
    !Array.isArray(
      items
    )
  ) {
    return "";
  }

  return items
    .map(
      (item) =>
        item?.plain_text ||
        item?.text?.content ||
        ""
    )
    .join("")
    .trim();
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

/* =========================================================
   NUMBER / DATE / URL HELPERS
   ========================================================= */

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
    typeof property.formula
      ?.number === "number"
  ) {
    return (
      property.formula.number
    );
  }

  if (
    typeof property.rollup
      ?.number === "number"
  ) {
    return (
      property.rollup.number
    );
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

  /*
   * Standard URL property.
   */
  if (
    typeof property.url ===
    "string"
  ) {
    return property.url;
  }

  /*
   * Files & Media property.
   */
  if (
    Array.isArray(
      property.files
    ) &&
    property.files.length > 0
  ) {
    const firstFile =
      property.files[0];

    if (
      firstFile?.type ===
      "external"
    ) {
      return (
        firstFile.external
          ?.url ||
        ""
      );
    }

    if (
      firstFile?.type ===
      "file"
    ) {
      return (
        firstFile.file
          ?.url ||
        ""
      );
    }
  }

  return "";
}

/* =========================================================
   PROPERTY LOOKUP HELPERS
   ========================================================= */

function findPropertyByType(
  properties,
  type
) {
  return Object.values(
    properties || {}
  ).find(
    (property) =>
      property?.type ===
      type
  );
}

function getPageTitle(
  page
) {
  const properties =
    page?.properties || {};

  /*
   * Rather than assuming the related food database
   * uses "Name", "Food", "Recipe", etc., find whatever
   * property Notion marks as the title.
   */
  const titleProperty =
    findPropertyByType(
      properties,
      "title"
    );

  return (
    getTitle(
      titleProperty
    ) ||
    "Untitled Food"
  );
}

/* =========================================================
   RELATION HELPERS
   ========================================================= */

function getRelationIds(
  property
) {
  if (
    !Array.isArray(
      property?.relation
    )
  ) {
    return [];
  }

  return property.relation
    .map(
      (relation) =>
        relation?.id
    )
    .filter(Boolean);
}

/*
 * Cache related food names for the duration of one API call.
 *
 * Example:
 * Protein Coffee may be related from several Food Log rows.
 * We only need to ask Notion for its name once.
 */
function createRelatedFoodResolver() {
  const cache =
    new Map();

  async function resolveOne(
    pageId
  ) {
    if (
      cache.has(
        pageId
      )
    ) {
      return cache.get(
        pageId
      );
    }

    const promise =
      retrieveFoodRelatedPage(
        pageId
      )
        .then(
          (page) => ({
            id:
              page?.id ||
              pageId,

            name:
              getPageTitle(
                page
              ),

            notionUrl:
              page?.url ||
              ""
          })
        )
        .catch(
          (error) => {
            console.error(
              `Could not retrieve related food "${pageId}":`,
              error
            );

            return {
              id:
                pageId,

              name:
                "Related food unavailable",

              notionUrl:
                "",

              unavailable:
                true
            };
          }
        );

    cache.set(
      pageId,
      promise
    );

    return promise;
  }

  async function resolveMany(
    pageIds
  ) {
    if (
      !Array.isArray(
        pageIds
      ) ||
      pageIds.length === 0
    ) {
      return [];
    }

    return Promise.all(
      pageIds.map(
        resolveOne
      )
    );
  }

  return resolveMany;
}

/* =========================================================
   DATE HELPERS
   ========================================================= */

function getDateKey(
  dateValue = new Date()
) {
  /*
   * Keep Notion date-only values exactly as written.
   */
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
  ] = String(
    dateKey
  )
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
   REQUESTED RANGE
   ========================================================= */

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

  /*
   * Preferred report behavior:
   *
   * /api/dietitian-report?start=2026-06-05
   */
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

  /*
   * Still support:
   *
   * /api/dietitian-report?days=14
   */
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
   FOOD NORMALIZER
   ========================================================= */

async function normalizeMeal(
  page,
  resolveRelatedFoods
) {
  const properties =
    page?.properties || {};

  /*
   * Meal is a Notion relation.
   */
  const relatedFoodIds =
    getRelationIds(
      properties.Meal
    );

  const relatedFoods =
    await resolveRelatedFoods(
      relatedFoodIds
    );

  /*
   * Your Food Log title property has been represented
   * as "Title" in the database.
   *
   * The fallback also makes this resilient if the
   * property is renamed later.
   */
  const namedTitle =
    getTitle(
      properties.Title
    );

  const fallbackTitle =
    getTitle(
      findPropertyByType(
        properties,
        "title"
      )
    );

  /*
   * The Health database currently has a trailing space
   * on "Notes ". The Food Log appears to use "Notes",
   * but supporting both costs us nothing.
   */
  const notesProperty =
    properties.Notes ||
    properties["Notes "] ||
    null;

  return {
    id:
      page?.id || "",

    title:
      namedTitle ||
      fallbackTitle ||
      "Untitled Meal",

    date:
      getDate(
        properties.Date
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
        notesProperty
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

    /*
     * NEW:
     * Full related-food objects.
     */
    relatedFoods,

    /*
     * Convenience array for the report UI.
     *
     * Example:
     * ["Burger Bowl", "Greek Yogurt Ranch"]
     */
    relatedFoodNames:
      relatedFoods
        .filter(
          (food) =>
            !food.unavailable
        )
        .map(
          (food) =>
            food.name
        ),

    notionUrl:
      page?.url ||
      ""
  };
}

/* =========================================================
   HEALTH NORMALIZER
   ========================================================= */

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
        properties.Notes ||
        properties["Notes "]
      )
  };
}

/* =========================================================
   REPORT MATH
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
    calories:
      0,

    protein:
      0,

    carbs:
      0,

    fiber:
      0,

    fat:
      0
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

/* =========================================================
   WATER
   ========================================================= */

function normalizeWaterToOz(
  entry
) {
  const category =
    String(
      entry?.category ||
      ""
    )
      .trim()
      .toLowerCase();

  /*
   * Actual Notion value:
   * "💧 Water"
   */
  if (
    !category.includes(
      "water"
    )
  ) {
    return 0;
  }

  const amount =
    Number(
      entry?.amount
    );

  if (
    !Number.isFinite(
      amount
    )
  ) {
    return 0;
  }

  const unit =
    String(
      entry?.unit ||
      ""
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
    return (
      amount * 8
    );
  }

  /*
   * Keep the amount rather than silently throwing
   * away an unfamiliar hydration entry.
   */
  return amount;
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

  /*
   * Build the calendar range first.
   */
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

  /*
   * Add meals to their dates.
   */
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

  /*
   * Add hydration.
   */
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

  let hydrationDayCount =
    0;

  /* =======================================================
     FINALIZE DAYS + PERIOD TOTALS
     ======================================================= */

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

    /*
     * Hydration averages should only use dates where
     * hydration was actually logged.
     *
     * A blank water day is not the same thing as drinking
     * zero ounces.
     */
    if (
      day.waterOz > 0
    ) {
      totalWaterOz +=
        day.waterOz;

      hydrationDayCount +=
        1;
    }

    for (
      const meal
      of day.meals
    ) {
      mealCount +=
        1;

      if (
        meal.hungerBefore > 0
      ) {
        totalHunger +=
          meal.hungerBefore;

        hungerCount +=
          1;
      }

      if (
        meal.fullnessAfter > 0
      ) {
        totalFullness +=
          meal.fullnessAfter;

        fullnessCount +=
          1;
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

  /*
   * Food averages use days containing food entries.
   *
   * Missing/unlogged dates do not become artificial
   * zero-calorie days.
   */
  const loggedDays =
    days.filter(
      (day) =>
        Array.isArray(
          day.meals
        ) &&
        day.meals.length > 0
    );

  const loggedDayCount =
    loggedDays.length ||
    1;

  return {
    days,

    summary: {
      calendarDays:
        days.length,

      loggedDays:
        loggedDays.length,

      hydrationDays:
        hydrationDayCount,

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

        /*
         * Hydration is averaged across hydration-logged
         * days rather than food-logged days.
         */
        waterOz:
          hydrationDayCount > 0
            ? roundOne(
                totalWaterOz /
                hydrationDayCount
              )
            : null,

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

    /*
     * Food and health can be queried in parallel.
     */
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

    /*
     * Create one related-food resolver/cache for this
     * report request.
     */
    const resolveRelatedFoods =
      createRelatedFoodResolver();

    /*
     * Normalize meals in parallel.
     *
     * This is where the Meal relations get resolved into
     * actual food / recipe names.
     */
    const meals =
      await Promise.all(
        foodPages.map(
          (page) =>
            normalizeMeal(
              page,
              resolveRelatedFoods
            )
        )
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
      "no-store, no-cache, must-revalidate"
    );

    response.setHeader(
      "Pragma",
      "no-cache"
    );

    response.setHeader(
      "Expires",
      "0"
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
