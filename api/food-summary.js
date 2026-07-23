import { queryFoodEntries } from "../lib/notion-food.js";
import { getSettings } from "../lib/settings.js";

function getDatePartsInTimeZone(
  date = new Date(),
  timeZone = "America/New_York"
) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });

  const parts = formatter.formatToParts(date);

  const values = {};

  for (const part of parts) {
    if (part.type !== "literal") {
      values[part.type] = part.value;
    }
  }

  return {
    year: values.year,
    month: values.month,
    day: values.day
  };
}

function getTodayDateString() {
  const { year, month, day } =
    getDatePartsInTimeZone();

  return `${year}-${month}-${day}`;
}

function getNumberProperty(page, propertyName) {
  const property = page?.properties?.[propertyName];

  if (!property) {
    return 0;
  }

  if (property.type === "number") {
    const value = Number(property.number);

    return Number.isFinite(value) ? value : 0;
  }

  if (property.type === "formula") {
    const formulaValue = property.formula;

    if (formulaValue?.type === "number") {
      const value = Number(formulaValue.number);

      return Number.isFinite(value) ? value : 0;
    }
  }

  if (property.type === "rollup") {
    const rollupValue = property.rollup;

    if (rollupValue?.type === "number") {
      const value = Number(rollupValue.number);

      return Number.isFinite(value) ? value : 0;
    }
  }

  return 0;
}

function roundToOneDecimal(value) {
  return Math.round((Number(value) || 0) * 10) / 10;
}

function calculatePercent(current, goal) {
  const safeCurrent = Number(current) || 0;
  const safeGoal = Number(goal) || 0;

  if (safeGoal <= 0) {
    return 0;
  }

  return roundToOneDecimal(
    (safeCurrent / safeGoal) * 100
  );
}

function buildMetric(current, goal) {
  const safeCurrent = roundToOneDecimal(current);
  const safeGoal = roundToOneDecimal(goal);

  return {
    current: safeCurrent,
    goal: safeGoal,
    remaining: roundToOneDecimal(
      Math.max(0, safeGoal - safeCurrent)
    ),
    percent: calculatePercent(
      safeCurrent,
      safeGoal
    )
  };
}

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");

    return response.status(405).json({
      success: false,
      error: "Method not allowed"
    });
  }

  try {
    const today = getTodayDateString();

    const [entries, settings] = await Promise.all([
      queryFoodEntries({
        filter: {
          property: "Date",
          date: {
            equals: today
          }
        },
        sorts: [
          {
            property: "Date",
            direction: "descending"
          }
        ],
        pageSize: 100
      }),
      getSettings()
    ]);

    const totals = entries.reduce(
      (summary, page) => {
        summary.calories += getNumberProperty(
          page,
          "Calories"
        );

        summary.protein += getNumberProperty(
          page,
          "Protein"
        );

        summary.fiber += getNumberProperty(
          page,
          "Fiber"
        );

        return summary;
      },
      {
        calories: 0,
        protein: 0,
        fiber: 0
      }
    );

    return response.status(200).json({
      success: true,
      date: today,
      entryCount: entries.length,

      calories: buildMetric(
        totals.calories,
        settings.calorieGoal
      ),

      protein: buildMetric(
        totals.protein,
        settings.proteinGoal
      ),

      fiber: buildMetric(
        totals.fiber,
        settings.fiberGoal
      )
    });
  } catch (error) {
    console.error("Food summary API error:", error);

    return response.status(500).json({
      success: false,
      error: "Food summary could not be loaded.",
      details:
        error instanceof Error
          ? error.message
          : "Unknown error"
    });
  }
}
