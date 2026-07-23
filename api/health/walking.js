import { queryHealthEntries } from "../../lib/notion-health.js";

const DAILY_WALK_GOAL = 2;
const TIME_ZONE = "America/New_York";

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
  const daysSinceMonday = day === 0 ? 6 : day - 1;

  localDate.setDate(localDate.getDate() - daysSinceMonday);
  localDate.setHours(12, 0, 0, 0);

  return localDate;
}

function buildHistory(walks, today) {
  const totalsByDate = {};

  for (const walk of walks) {
    totalsByDate[walk.date] =
      (totalsByDate[walk.date] || 0) + walk.miles;
  }

  const history = [];

  for (let daysAgo = 6; daysAgo >= 0; daysAgo -= 1) {
    const date = new Date(`${today}T12:00:00`);

    date.setDate(date.getDate() - daysAgo);

    const dateKey = getDateKey(date);

    history.push({
      date: dateKey,
      miles: roundMiles(totalsByDate[dateKey] || 0)
    });
  }

  return history;
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed"
    });
  }

  try {
    const pages = await queryHealthEntries({
      sorts: [
        {
          property: "Date",
          direction: "ascending"
        }
      ]
    });

    const walks = pages
      .filter(
        (page) =>
          page.properties?.Category?.select?.name === "🚶 Walk"
      )
      .map((page) => {
        const date = page.properties?.Date?.date?.start;
        const miles = page.properties?.Amount?.number;

        if (!date || typeof miles !== "number") {
          return null;
        }

        return {
          id: page.id,
          date,
          miles
        };
      })
      .filter(Boolean);

    const today = getTodayKey();

    const todayMiles = roundMiles(
      walks
        .filter((walk) => walk.date === today)
        .reduce((total, walk) => total + walk.miles, 0)
    );

    const percent = Math.min(
      100,
      Math.round((todayMiles / DAILY_WALK_GOAL) * 100)
    );

    const remaining = roundMiles(
      Math.max(0, DAILY_WALK_GOAL - todayMiles)
    );

    const weekStart = getStartOfWeek(new Date());
    const weekStartKey = getDateKey(weekStart);

    const weekTotal = roundMiles(
      walks
        .filter(
          (walk) =>
            walk.date >= weekStartKey &&
            walk.date <= today
        )
        .reduce((total, walk) => total + walk.miles, 0)
    );

    return res.status(200).json({
      success: true,
      count: walks.length,
      date: today,
      today: todayMiles,
      goal: DAILY_WALK_GOAL,
      percent,
      remaining,
      weekStart: weekStartKey,
      weekTotal,
      history: buildHistory(walks, today),
      walks
    });
  } catch (error) {
    console.error("Walking endpoint error:", error);

    return res.status(500).json({
      success: false,
      error: error.message || "Walking data could not be loaded"
    });
  }
}
