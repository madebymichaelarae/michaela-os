import {
  queryBooks,
  queryAllBooks,
  queryAllReadingLog
} from "../notion-reading.js";

const TIME_ZONE =
  "America/New_York";

function getTitle(property) {
  return (
    property?.title
      ?.map(
        (item) => item.plain_text
      )
      .join("")
      .trim() || ""
  );
}

function getRichText(property) {
  return (
    property?.rich_text
      ?.map(
        (item) => item.plain_text
      )
      .join("")
      .trim() || ""
  );
}

function getNumberOrNull(property) {
  if (!property) {
    return null;
  }

  if (
    typeof property.number === "number"
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

  return null;
}

function getNumber(property) {
  if (!property) {
    return 0;
  }

  if (
    typeof property.number === "number"
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

  if (
    Array.isArray(
      property.rollup?.array
    )
  ) {
    return property.rollup.array.reduce(
      (total, item) => {
        if (
          typeof item?.number ===
          "number"
        ) {
          return total + item.number;
        }

        if (
          typeof item?.formula
            ?.number === "number"
        ) {
          return (
            total +
            item.formula.number
          );
        }

        return total;
      },
      0
    );
  }

  return 0;
}

function getCoverUrl(page) {
  const coverProperty =
    page.properties?.["Cover URL"];

  if (coverProperty?.url) {
    return coverProperty.url;
  }

  if (
    page.cover?.type === "external"
  ) {
    return (
      page.cover.external?.url ||
      null
    );
  }

  if (
    page.cover?.type === "file"
  ) {
    return (
      page.cover.file?.url ||
      null
    );
  }

  return null;
}

function getStatusName(page) {
  const statusProperty =
    page.properties?.Status;

  return (
    statusProperty?.status?.name ||
    statusProperty?.select?.name ||
    ""
  );
}

function normalizeProgress(
  progress,
  currentPage,
  totalPages
) {
  let percentage = progress;

  if (
    typeof percentage === "number"
  ) {
    if (
      percentage >= 0 &&
      percentage <= 1
    ) {
      percentage *= 100;
    }

    return Math.max(
      0,
      Math.min(
        100,
        Math.round(percentage)
      )
    );
  }

  if (
    typeof currentPage === "number" &&
    typeof totalPages === "number" &&
    totalPages > 0
  ) {
    return Math.max(
      0,
      Math.min(
        100,
        Math.round(
          (currentPage / totalPages) *
            100
        )
      )
    );
  }

  return 0;
}

function getDateKey(
  dateValue = new Date()
) {
  const date =
    dateValue instanceof Date
      ? dateValue
      : new Date(dateValue);

  if (
    Number.isNaN(date.getTime())
  ) {
    return null;
  }

  const parts =
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone: TIME_ZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      }
    ).formatToParts(date);

  const year = parts.find(
    (part) =>
      part.type === "year"
  )?.value;

  const month = parts.find(
    (part) =>
      part.type === "month"
  )?.value;

  const day = parts.find(
    (part) =>
      part.type === "day"
  )?.value;

  if (!year || !month || !day) {
    return null;
  }

  return `${year}-${month}-${day}`;
}

function shiftDateKey(
  dateKey,
  amount
) {
  const [year, month, day] =
    dateKey
      .split("-")
      .map(Number);

  const date = new Date(
    Date.UTC(
      year,
      month - 1,
      day,
      12
    )
  );

  date.setUTCDate(
    date.getUTCDate() + amount
  );

  return date
    .toISOString()
    .slice(0, 10);
}

function getMonthKey(dateKey) {
  return dateKey?.slice(0, 7) || null;
}

function getPropertyDate(property) {
  return property?.date?.start || null;
}

function getRelationIds(property) {
  if (
    !Array.isArray(
      property?.relation
    )
  ) {
    return [];
  }

  return property.relation
    .map((item) => item.id)
    .filter(Boolean);
}

function normalizeReadingSession(page) {
  const properties =
    page.properties || {};

  const rawDate =
    getPropertyDate(
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
  const properties =
    page.properties || {};

  const rawFinishedDate =
    getPropertyDate(
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
  if (
    readingDates.size === 0
  ) {
    return 0;
  }

  let checkDate =
    readingDates.has(todayKey)
      ? todayKey
      : shiftDateKey(
          todayKey,
          -1
        );

  let streak = 0;

  while (
    readingDates.has(checkDate)
  ) {
    streak += 1;

    checkDate = shiftDateKey(
      checkDate,
      -1
    );
  }

  return streak;
}

function buildCurrentReadingResponse(
  pages
) {
  const currentBookPage =
    pages.find((page) => {
      const status =
        getStatusName(page)
          .trim()
          .toLowerCase();

      return (
        status ===
          "currently reading" ||
        status === "reading" ||
        status === "in progress"
      );
    });

  if (!currentBookPage) {
    return {
      success: true,
      hasCurrentBook: false,
      book: null
    };
  }

  const properties =
    currentBookPage.properties || {};

  const title =
    getTitle(properties.Book) ||
    "Untitled Book";

  const author =
    getRichText(
      properties.Author
    ) || "Unknown Author";

  const currentPage =
    getNumberOrNull(
      properties["Current Page"]
    ) ?? 0;

  const totalPages =
    getNumberOrNull(
      properties["Total Pages"]
    ) ?? 0;

  const storedProgress =
    getNumberOrNull(
      properties["Progress %"]
    );

  const progress =
    normalizeProgress(
      storedProgress,
      currentPage,
      totalPages
    );

  const minutesRead =
    getNumberOrNull(
      properties["Minutes Read"]
    ) ?? 0;

  const sessions =
    getNumberOrNull(
      properties[
        "Reading Sessions Count"
      ]
    ) ?? 0;

  return {
    success: true,
    hasCurrentBook: true,
    book: {
      id: currentBookPage.id,
      title,
      author,
      cover:
        getCoverUrl(
          currentBookPage
        ),
      currentPage,
      totalPages,
      progress,
      minutesRead,
      sessions
    }
  };
}

function buildStatsResponse(
  readingLogPages,
  bookPages
) {
  const sessions =
    readingLogPages
      .map(
        normalizeReadingSession
      )
      .filter(
        (session) =>
          session.date
      );

  const books =
    bookPages.map(normalizeBook);

  const todayKey = getDateKey();

  const currentMonthKey =
    getMonthKey(todayKey);

  const weekStartKey =
    shiftDateKey(
      todayKey,
      -6
    );

  let pagesToday = 0;
  let pagesThisWeek = 0;
  let minutesThisMonth = 0;
  let totalSessionMinutes = 0;
  let validSessionCount = 0;

  const readingDates =
    new Set();

  for (const session of sessions) {
    readingDates.add(
      session.date
    );

    if (
      session.date === todayKey
    ) {
      pagesToday +=
        session.pagesRead;
    }

    if (
      session.date >=
        weekStartKey &&
      session.date <= todayKey
    ) {
      pagesThisWeek +=
        session.pagesRead;
    }

    if (
      getMonthKey(
        session.date
      ) === currentMonthKey
    ) {
      minutesThisMonth +=
        session.minutes;
    }

    if (
      session.minutes > 0
    ) {
      totalSessionMinutes +=
        session.minutes;

      validSessionCount += 1;
    }
  }

  const booksThisMonth =
    books.filter(
      (book) =>
        book.finishedDate &&
        getMonthKey(
          book.finishedDate
        ) === currentMonthKey
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

  return {
    success: true,
    stats: {
      pagesToday,
      pagesThisWeek,
      readingStreak,
      booksThisMonth,
      averageSession,
      minutesThisMonth
    }
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

  const view =
    getRequestedView(request);

  const validViews = new Set([
    "all",
    "current",
    "stats",
    "history"
  ]);

  if (!validViews.has(view)) {
    return response.status(404).json({
      success: false,
      error:
        "Reading view not found.",
      availableViews: [
        "all",
        "current",
        "stats",
        "history"
      ]
    });
  }

  try {
    if (view === "current") {
      const pages =
        await queryBooks({
          sorts: [
            {
              property:
                "Date Started",
              direction:
                "descending"
            }
          ]
        });

      return response
        .status(200)
        .json(
          buildCurrentReadingResponse(
            pages
          )
        );
    }

    if (view === "stats") {
      const [
        readingLogPages,
        bookPages
      ] = await Promise.all([
        queryAllReadingLog(),
        queryAllBooks()
      ]);

      return response
        .status(200)
        .json(
          buildStatsResponse(
            readingLogPages,
            bookPages
          )
        );
    }

    if (view === "history") {
      return response
        .status(501)
        .json({
          success: false,
          error:
            "Reading history is not implemented yet."
        });
    }

    const [
      currentBookPages,
      readingLogPages,
      allBookPages
    ] = await Promise.all([
      queryBooks({
        sorts: [
          {
            property:
              "Date Started",
            direction:
              "descending"
          }
        ]
      }),
      queryAllReadingLog(),
      queryAllBooks()
    ]);

    return response.status(200).json({
      success: true,
      current:
        buildCurrentReadingResponse(
          currentBookPages
        ),
      stats:
        buildStatsResponse(
          readingLogPages,
          allBookPages
        ),
      history: {
        success: false,
        error:
          "Reading history is not implemented yet."
      }
    });
  } catch (error) {
    console.error(
      `Reading API error for view "${view}":`,
      error
    );

    const errorMessages = {
      current:
        "Current reading data could not be loaded",
      stats:
        "Reading statistics could not be loaded",
      history:
        "Reading history could not be loaded",
      all:
        "Reading data could not be loaded"
    };

    return response.status(500).json({
      success: false,
      error:
        error?.message ||
        errorMessages[view] ||
        "Reading data could not be loaded"
    });
  }
}
