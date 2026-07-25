import { queryHealthEntries } from "../notion-health.js";

const DAILY_WALK_GOAL = 2;
const TIME_ZONE = "America/New_York";

const CATEGORY_NAMES = {
  walking: "🚶 Walk",
  water: "💧 Water",
  weight: "⚖️ Weight"
};

function getDateKey(date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

function getTodayKey() {
  return getDateKey(new Date());
}

function roundMiles(value) {
  return Math.round(value * 100) / 100;
}

function getStartOfWeek(date) {
  const localDate = new Date(
    new Intl.DateTimeFormat("en-US", {
      timeZone: TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(date)
  );

  const day = localDate.getDay();
  const daysSinceMonday =
    day === 0 ? 6 : day - 1;

  localDate.setDate(
    localDate.getDate() - daysSinceMonday
  );

  localDate.setHours(12, 0, 0, 0);

  return localDate;
}

function buildHistory(walks, today) {
  const totalsByDate = {};

  for (const walk of walks) {
    totalsByDate[walk.date] =
      (totalsByDate[walk.date] || 0) +
      walk.miles;
  }

  const history = [];

  for (
    let daysAgo = 6;
    daysAgo >= 0;
    daysAgo -= 1
  ) {
    const date = new Date(
      `${today}T12:00:00`
    );

    date.setDate(
      date.getDate() - daysAgo
    );

    const dateKey = getDateKey(date);

    history.push({
      date: dateKey,
      miles: roundMiles(
        totalsByDate[dateKey] || 0
      )
    });
  }

  return history;
}

function normalizeWalks(pages) {
  return pages
    .filter(
      (page) =>
        page.properties?.Category
          ?.select?.name ===
        CATEGORY_NAMES.walking
    )
    .map((page) => {
      const date =
        page.properties?.Date?.date
          ?.start;

      const miles =
        page.properties?.Amount?.number;

      if (
        !date ||
        typeof miles !== "number"
      ) {
        return null;
      }

      return {
        id: page.id,
        date,
        miles
      };
    })
    .filter(Boolean);
}

function normalizeWater(pages) {
  return pages
    .filter(
      (page) =>
        page.properties?.Category
          ?.select?.name ===
        CATEGORY_NAMES.water
    )
    .map((page) => {
      const date =
        page.properties?.Date?.date
          ?.start;

      const ounces =
        page.properties?.Amount?.number;

      if (
        !date ||
        typeof ounces !== "number"
      ) {
        return null;
      }

      return {
        id: page.id,
        date,
        ounces
      };
    })
    .filter(Boolean);
}

function normalizeWeights(pages) {
  return pages
    .filter(
      (page) =>
        page.properties?.Category
          ?.select?.name ===
        CATEGORY_NAMES.weight
    )
    .map((page) => {
      const date =
        page.properties?.Date?.date
          ?.start;

      const weight =
        page.properties?.Amount?.number;

      if (
        !date ||
        typeof weight !== "number"
      ) {
        return null;
      }

      return {
        id: page.id,
        date,
        weight
      };
    })
    .filter(Boolean);
}

function buildWalkingResponse(walks) {
  const today = getTodayKey();

  const todayMiles = roundMiles(
    walks
      .filter(
        (walk) => walk.date === today
      )
      .reduce(
        (total, walk) =>
          total + walk.miles,
        0
      )
  );

  const percent = Math.min(
    100,
    Math.round(
      (todayMiles / DAILY_WALK_GOAL) *
        100
    )
  );

  const remaining = roundMiles(
    Math.max(
      0,
      DAILY_WALK_GOAL - todayMiles
    )
  );

  const weekStart =
    getStartOfWeek(new Date());

  const weekStartKey =
    getDateKey(weekStart);

  const weekTotal = roundMiles(
    walks
      .filter(
        (walk) =>
          walk.date >= weekStartKey &&
          walk.date <= today
      )
      .reduce(
        (total, walk) =>
          total + walk.miles,
        0
      )
  );

  return {
    success: true,
    count: walks.length,
    date: today,
    today: todayMiles,
    goal: DAILY_WALK_GOAL,
    percent,
    remaining,
    weekStart: weekStartKey,
    weekTotal,
    history: buildHistory(
      walks,
      today
    ),
    walks
  };
}

function buildWaterResponse(water) {
  return {
    success: true,
    count: water.length,
    water
  };
}

function buildWeightResponse(weights) {
  return {
    success: true,
    count: weights.length,
    weights
  };
}

function getRequestedView(request) {
  return String(
    request.query?.view || "all"
  )
    .trim()
    .toLowerCase();
}

export default async function handler(
  request,
  response
) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");

    return response.status(405).json({
      success: false,
      error: "Method not allowed"
    });
  }

  const view = getRequestedView(request);

  const validViews = new Set([
    "all",
    "walking",
    "water",
    "weight"
  ]);

  if (!validViews.has(view)) {
    return response.status(404).json({
      success: false,
      error: "Health view not found.",
      availableViews: [
        "all",
        "walking",
        "water",
        "weight"
      ]
    });
  }

  try {
    const pages =
      await queryHealthEntries({
        sorts: [
          {
            property: "Date",
            direction: "ascending"
          }
        ]
      });

    const walks =
      normalizeWalks(pages);

    const water =
      normalizeWater(pages);

    const weights =
      normalizeWeights(pages);

    if (view === "walking") {
      return response
        .status(200)
        .json(
          buildWalkingResponse(walks)
        );
    }

    if (view === "water") {
      return response
        .status(200)
        .json(
          buildWaterResponse(water)
        );
    }

    if (view === "weight") {
      return response
        .status(200)
        .json(
          buildWeightResponse(weights)
        );
    }

    return response.status(200).json({
      success: true,
      walking:
        buildWalkingResponse(walks),
      water:
        buildWaterResponse(water),
      weight:
        buildWeightResponse(weights)
    });
  } catch (error) {
    console.error(
      `Health API error for view "${view}":`,
      error
    );

    const errorMessages = {
      walking:
        "Walking data could not be loaded",
      water:
        "Water data could not be loaded",
      weight:
        "Weight data could not be loaded",
      all:
        "Health data could not be loaded"
    };

    return response.status(500).json({
      success: false,
      error:
        error?.message ||
        errorMessages[view] ||
        "Health data could not be loaded"
    });
  }
}
