import {
    queryAllBooks,
    queryAllReadingLog
} from "../../lib/notion-reading.js";

const TIME_ZONE = "America/New_York";

/*
 * Returns a date as YYYY-MM-DD in Michaela's local time zone.
 */
function getDateKey(dateValue = new Date()) {
    const date =
        dateValue instanceof Date
            ? dateValue
            : new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return null;
    }

    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: TIME_ZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).formatToParts(date);

    const year = parts.find(
        (part) => part.type === "year"
    )?.value;

    const month = parts.find(
        (part) => part.type === "month"
    )?.value;

    const day = parts.find(
        (part) => part.type === "day"
    )?.value;

    if (!year || !month || !day) {
        return null;
    }

    return `${year}-${month}-${day}`;
}

/*
 * Safely adds or subtracts calendar days from YYYY-MM-DD.
 * Using noon UTC prevents daylight-saving boundary problems.
 */
function shiftDateKey(dateKey, amount) {
    const [year, month, day] = dateKey
        .split("-")
        .map(Number);

    const date = new Date(
        Date.UTC(year, month - 1, day, 12)
    );

    date.setUTCDate(date.getUTCDate() + amount);

    return date.toISOString().slice(0, 10);
}

function getMonthKey(dateKey) {
    return dateKey?.slice(0, 7) || null;
}

function getPropertyDate(property) {
    return property?.date?.start || null;
}

function getNumber(property) {
    if (!property) {
        return 0;
    }

    if (typeof property.number === "number") {
        return property.number;
    }

    if (typeof property.formula?.number === "number") {
        return property.formula.number;
    }

    if (typeof property.rollup?.number === "number") {
        return property.rollup.number;
    }

    if (Array.isArray(property.rollup?.array)) {
        return property.rollup.array.reduce(
            (total, item) => {
                if (typeof item?.number === "number") {
                    return total + item.number;
                }

                if (
                    typeof item?.formula?.number ===
                    "number"
                ) {
                    return (
                        total + item.formula.number
                    );
                }

                return total;
            },
            0
        );
    }

    return 0;
}

function getRelationIds(property) {
    if (!Array.isArray(property?.relation)) {
        return [];
    }

    return property.relation
        .map((item) => item.id)
        .filter(Boolean);
}

function normalizeReadingSession(page) {
    const properties = page.properties || {};

    const rawDate = getPropertyDate(
        properties.Date
    );

    return {
        id: page.id,
        date: rawDate
            ? getDateKey(rawDate)
            : null,
        pagesRead: getNumber(
            properties["Pages Read"]
        ),
        minutes: getNumber(
            properties.Minutes
        ),
        bookIds: getRelationIds(
            properties.Book
        )
    };
}

function normalizeBook(page) {
    const properties = page.properties || {};

    const rawFinishedDate = getPropertyDate(
        properties["Date Finished"]
    );

    return {
        id: page.id,
        finishedDate: rawFinishedDate
            ? getDateKey(rawFinishedDate)
            : null
    };
}

function calculateReadingStreak(
    readingDates,
    todayKey
) {
    if (readingDates.size === 0) {
        return 0;
    }

    /*
     * Before the user reads today, preserve a streak that
     * continued through yesterday.
     */
    let checkDate = readingDates.has(todayKey)
        ? todayKey
        : shiftDateKey(todayKey, -1);

    let streak = 0;

    while (readingDates.has(checkDate)) {
        streak += 1;
        checkDate = shiftDateKey(checkDate, -1);
    }

    return streak;
}

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({
            success: false,
            error: "Method not allowed"
        });
    }

    try {
        const [
            readingLogPages,
            bookPages
        ] = await Promise.all([
            queryAllReadingLog(),
            queryAllBooks()
        ]);

        const sessions = readingLogPages
            .map(normalizeReadingSession)
            .filter((session) => session.date);

        const books = bookPages.map(normalizeBook);

        const todayKey = getDateKey();
        const currentMonthKey =
            getMonthKey(todayKey);

        /*
         * This is a rolling seven-day total:
         * today plus the previous six days.
         */
        const weekStartKey = shiftDateKey(
            todayKey,
            -6
        );

        let pagesToday = 0;
        let pagesThisWeek = 0;
        let minutesThisMonth = 0;
        let totalSessionMinutes = 0;
        let validSessionCount = 0;

        const readingDates = new Set();

        for (const session of sessions) {
            readingDates.add(session.date);

            if (session.date === todayKey) {
                pagesToday += session.pagesRead;
            }

            if (
                session.date >= weekStartKey &&
                session.date <= todayKey
            ) {
                pagesThisWeek += session.pagesRead;
            }

            if (
                getMonthKey(session.date) ===
                currentMonthKey
            ) {
                minutesThisMonth +=
                    session.minutes;
            }

            /*
             * Only sessions with recorded minutes count
             * toward Average Session.
             */
            if (session.minutes > 0) {
                totalSessionMinutes +=
                    session.minutes;

                validSessionCount += 1;
            }
        }

        const booksThisMonth = books.filter(
            (book) =>
                book.finishedDate &&
                getMonthKey(book.finishedDate) ===
                    currentMonthKey
        ).length;

        const averageSession =
            validSessionCount > 0
                ? Math.round(
                      totalSessionMinutes /
                          validSessionCount
                  )
                : 0;

        const readingStreak =
            calculateReadingStreak(
                readingDates,
                todayKey
            );

        return res.status(200).json({
            success: true,
            stats: {
                pagesToday,
                pagesThisWeek,
                readingStreak,
                booksThisMonth,
                averageSession,
                minutesThisMonth
            }
        });
    } catch (error) {
        console.error(
            "Reading stats endpoint error:",
            error
        );

        return res.status(500).json({
            success: false,
            error:
                error.message ||
                "Reading statistics could not be loaded"
        });
    }
}
