const WEIGHT_API_URL = "/api/health/weight";
const WATER_API_URL = "/api/health/water";

const WATER_GOAL = 72;
const TIME_ZONE = "America/New_York";

function getTodayDate() {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: TIME_ZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).format(new Date());
}

async function fetchLocalApi(request, path) {
    const protocol =
        request.headers["x-forwarded-proto"] || "https";

    const host = request.headers.host;

    const response = await fetch(
        `${protocol}://${host}${path}`
    );

    if (!response.ok) {
        const text = await response.text();

        throw new Error(
            `${path} failed with ${response.status}: ${text}`
        );
    }

    return response.json();
}

function roundToOneDecimal(value) {
    return Math.round(value * 10) / 10;
}

function buildWaterHistory(entries, today) {
    const totalsByDate = {};

    for (const entry of entries) {
        if (!entry.date) {
            continue;
        }

        totalsByDate[entry.date] =
            (totalsByDate[entry.date] || 0) +
            Number(entry.ounces || 0);
    }

    const history = [];

    for (let daysAgo = 6; daysAgo >= 0; daysAgo -= 1) {
        const date = new Date(`${today}T12:00:00`);

        date.setDate(date.getDate() - daysAgo);

        const dateKey = new Intl.DateTimeFormat("en-CA", {
            timeZone: TIME_ZONE,
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
        }).format(date);

        history.push({
            date: dateKey,
            ounces: totalsByDate[dateKey] || 0
        });
    }

    return history;
}

export default async function handler(request, response) {
    if (request.method !== "GET") {
        response.setHeader("Allow", "GET");

        return response.status(405).json({
            error: "Method not allowed."
        });
    }

    try {
        const today = getTodayDate();

        const [weightData, waterData] = await Promise.all([
            fetchLocalApi(request, WEIGHT_API_URL),
            fetchLocalApi(request, WATER_API_URL)
        ]);

        const weights = Array.isArray(weightData.weights)
            ? [...weightData.weights]
            : [];

        const waterEntries = Array.isArray(waterData.water)
            ? waterData.water
            : [];

        weights.sort((a, b) =>
            String(a.date).localeCompare(String(b.date))
        );

        const startingWeight =
            weights.length > 0
                ? Number(weights[0].weight)
                : null;

        const currentWeight =
            weights.length > 0
                ? Number(weights[weights.length - 1].weight)
                : null;

        const poundsDown =
            startingWeight !== null &&
            currentWeight !== null
                ? Math.max(
                    0,
                    roundToOneDecimal(
                        startingWeight - currentWeight
                    )
                )
                : null;

        const todayWater = waterEntries
            .filter((entry) => entry.date === today)
            .reduce(
                (total, entry) =>
                    total + Number(entry.ounces || 0),
                0
            );

        const waterPercent = Math.min(
            100,
            Math.round(
                (todayWater / WATER_GOAL) * 100
            )
        );

        return response.status(200).json({
            success: true,
            date: today,

            water: {
                today: todayWater,
                goal: WATER_GOAL,
                percent: waterPercent,
                history: buildWaterHistory(
                    waterEntries,
                    today
                )
            },

            walking: {
                available: false,
                today: null,
                dailyGoal: null,
                weekTotal: null
            },

            weight: {
                starting: startingWeight,
                current: currentWeight,
                poundsDown
            }
        });
    } catch (error) {
        console.error("Health summary API error:", error);

        return response.status(500).json({
            error: "Unable to load health summary.",
            details: error.message
        });
    }
}
