/* =========================================================
   MICHAELA OS
   Reading API
   ========================================================= */

import {
  queryBooks,
  queryAllBooks,
  queryAllReadingLog,
  startReadingBook
} from "../notion-reading.js";

const TIME_ZONE =
  "America/New_York";

const BOOK_STATUS = {
  WANT_TO_READ:
    "want to read",

  CURRENTLY_READING:
    "currently reading"
};

/* =========================================================
   BASIC PROPERTY READERS
   ========================================================= */

function getTitle(property) {
  return (
    property?.title
      ?.map(
        (item) =>
          item.plain_text
      )
      .join("")
      .trim() || ""
  );
}

function getRichText(property) {
  return (
    property?.rich_text
      ?.map(
        (item) =>
          item.plain_text
      )
      .join("")
      .trim() || ""
  );
}

function getNumberOrNull(
  property
) {
  if (!property) {
    return null;
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
    return property.formula
      .number;
  }

  if (
    typeof property.rollup
      ?.number === "number"
  ) {
    return property.rollup
      .number;
  }

  if (
    Array.isArray(
      property.rollup?.array
    )
  ) {
    const total =
      property.rollup.array.reduce(
        (
          sum,
          item
        ) => {
          if (
            typeof item?.number ===
            "number"
          ) {
            return (
              sum +
              item.number
            );
          }

          if (
            typeof item?.formula
              ?.number ===
            "number"
          ) {
            return (
              sum +
              item.formula
                .number
            );
          }

          return sum;
        },
        0
      );

    return total;
  }

  return null;
}

function getNumber(
  property
) {
  return (
    getNumberOrNull(
      property
    ) ?? 0
  );
}

function normalizeValue(
  value
) {
  return String(
    value || ""
  )
    .trim()
    .toLocaleLowerCase(
      "en-US"
    );
}

/* =========================================================
   BOOK PROPERTY HELPERS
   ========================================================= */

function getCoverUrl(page) {
  const coverProperty =
    page.properties?.[
      "Cover URL"
    ];

  if (
    coverProperty?.url
  ) {
    return coverProperty.url;
  }

  if (
    page.cover?.type ===
    "external"
  ) {
    return (
      page.cover.external
        ?.url ||
      null
    );
  }

  if (
    page.cover?.type ===
    "file"
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
    statusProperty?.status
      ?.name ||
    statusProperty?.select
      ?.name ||
    ""
  );
}

function normalizeProgress(
  progress,
  currentPage,
  totalPages
) {
  let percentage =
    progress;

  if (
    typeof percentage ===
    "number"
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
        Math.round(
          percentage
        )
      )
    );
  }

  if (
    typeof currentPage ===
      "number" &&
    typeof totalPages ===
      "number" &&
    totalPages > 0
  ) {
    return Math.max(
      0,
      Math.min(
        100,
        Math.round(
          (
            currentPage /
            totalPages
          ) * 100
        )
      )
    );
  }

  return 0;
}

/* =========================================================
   DATE HELPERS
   ========================================================= */

function getDateKey(
  dateValue = new Date()
) {
  /*
   * Preserve date-only values exactly so they do not shift
   * backward when interpreted in America/New_York.
   */
  if (
    typeof dateValue ===
    "string"
  ) {
    const dateOnlyMatch =
      dateValue.match(
        /^(\d{4}-\d{2}-\d{2})$/
      );

    if (
      dateOnlyMatch
    ) {
      return (
        dateOnlyMatch[1]
      );
    }
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

  const year =
    parts.find(
      (part) =>
        part.type ===
        "year"
    )?.value;

  const month =
    parts.find(
      (part) =>
        part.type ===
        "month"
    )?.value;

  const day =
    parts.find(
      (part) =>
        part.type ===
        "day"
    )?.value;

  if (
    !year ||
    !month ||
    !day
  ) {
    return null;
  }

  return `${year}-${month}-${day}`;
}

function shiftDateKey(
  dateKey,
  amount
) {
  if (!dateKey) {
    return null;
  }

  const [
    year,
    month,
    day
  ] = dateKey
    .split("-")
    .map(Number);

  if (
    !Number.isFinite(
      year
    ) ||
    !Number.isFinite(
      month
    ) ||
    !Number.isFinite(
      day
    )
  ) {
    return null;
  }

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

function getMonthKey(
  dateKey
) {
  return (
    dateKey?.slice(
      0,
      7
    ) || null
  );
}

function getYearKey(
  dateKey
) {
  return (
    dateKey?.slice(
      0,
      4
    ) || null
  );
}

function getPropertyDate(
  property
) {
  return (
    property?.date?.start ||
    null
  );
}

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
      (item) =>
        item.id
    )
    .filter(Boolean);
}

/* =========================================================
   BOOK NORMALIZERS
   ========================================================= */

function normalizeReadingSession(
  page
) {
  const properties =
    page.properties || {};

  const rawDate =
    getPropertyDate(
      properties.Date
    );

  return {
    id:
      page.id,

    date:
      rawDate
        ? getDateKey(
            rawDate
          )
        : null,

    pagesRead:
      getNumber(
        properties[
          "Pages Read"
        ]
      ),

    minutes:
      getNumber(
        properties.Minutes
      ),

    bookIds:
      getRelationIds(
        properties.Book
      )
  };
}

function normalizeBook(page) {
  const properties =
    page.properties || {};

  const rawFinishedDate =
    getPropertyDate(
      properties[
        "Date Finished"
      ]
    );

  return {
    id:
      page.id,

    finishedDate:
      rawFinishedDate
        ? getDateKey(
            rawFinishedDate
          )
        : null
  };
}

/*
 * Creates the object used by the Pick My Next Read widget.
 */
function normalizePickerBook(
  page
) {
  const properties =
    page?.properties || {};

  return {
    id:
      page?.id || "",

    title:
      getTitle(
        properties.Book
      ) ||
      "Untitled Book",

    author:
      getRichText(
        properties.Author
      ) ||
      "Unknown Author",

    cover:
      getCoverUrl(
        page
      ),

    totalPages:
      getNumberOrNull(
        properties[
          "Total Pages"
        ]
      ) ?? 0,

    status:
      getStatusName(
        page
      ),

    notionUrl:
      page?.url || ""
  };
}

function pickRandomItem(
  items
) {
  if (
    !Array.isArray(
      items
    ) ||
    items.length === 0
  ) {
    return null;
  }

  const randomIndex =
    Math.floor(
      Math.random() *
      items.length
    );

  return (
    items[
      randomIndex
    ]
  );
}

/* =========================================================
   CURRENTLY READING RESPONSE
   ========================================================= */

function buildCurrentReadingResponse(
  pages
) {
  const currentBookPage =
    pages.find(
      (page) => {
        const status =
          normalizeValue(
            getStatusName(
              page
            )
          );

        return (
          status ===
            BOOK_STATUS
              .CURRENTLY_READING ||
          status ===
            "reading" ||
          status ===
            "in progress"
        );
      }
    );

  if (
    !currentBookPage
  ) {
    return {
      success: true,
      hasCurrentBook:
        false,
      book: null
    };
  }

  const properties =
    currentBookPage
      .properties || {};

  const title =
    getTitle(
      properties.Book
    ) ||
    "Untitled Book";

  const author =
    getRichText(
      properties.Author
    ) ||
    "Unknown Author";

  const currentPage =
    getNumberOrNull(
      properties[
        "Current Page"
      ]
    ) ?? 0;

  const totalPages =
    getNumberOrNull(
      properties[
        "Total Pages"
      ]
    ) ?? 0;

  const storedProgress =
    getNumberOrNull(
      properties[
        "Progress %"
      ]
    );

  const progress =
    normalizeProgress(
      storedProgress,
      currentPage,
      totalPages
    );

  const minutesRead =
    getNumberOrNull(
      properties[
        "Minutes Read"
      ]
    ) ?? 0;

  const sessions =
    getNumberOrNull(
      properties[
        "Reading Sessions Count"
      ]
    ) ?? 0;

  return {
    success: true,

    hasCurrentBook:
      true,

    book: {
      id:
        currentBookPage.id,

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

/* =========================================================
   NEXT READ RESPONSE
   ========================================================= */

function buildNextReadResponse(
  pages
) {
  const eligibleBooks =
    pages.filter(
      (page) =>
        normalizeValue(
          getStatusName(
            page
          )
        ) ===
        BOOK_STATUS
          .WANT_TO_READ
    );

  const selectedPage =
    pickRandomItem(
      eligibleBooks
    );

  if (!selectedPage) {
    return {
      success: true,

      hasBook:
        false,

      count:
        0,

      book:
        null
    };
  }

  return {
    success: true,

    hasBook:
      true,

    count:
      eligibleBooks.length,

    book:
      normalizePickerBook(
        selectedPage
      )
  };
}

/* =========================================================
   READING STATISTICS
   ========================================================= */

function calculateReadingStreak(
  readingDates,
  todayKey
) {
  if (
    readingDates.size ===
      0 ||
    !todayKey
  ) {
    return 0;
  }

  let checkDate =
    readingDates.has(
      todayKey
    )
      ? todayKey
      : shiftDateKey(
          todayKey,
          -1
        );

  let streak =
    0;

  while (
    checkDate &&
    readingDates.has(
      checkDate
    )
  ) {
    streak +=
      1;

    checkDate =
      shiftDateKey(
        checkDate,
        -1
      );
  }

  return streak;
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
    bookPages.map(
      normalizeBook
    );

  const todayKey =
    getDateKey();

  const currentMonthKey =
    getMonthKey(
      todayKey
    );

  const currentYearKey =
    getYearKey(
      todayKey
    );

  const weekStartKey =
    shiftDateKey(
      todayKey,
      -6
    );

  let pagesToday =
    0;

  let pagesThisWeek =
    0;

  let pagesThisMonth =
    0;

  let pagesThisYear =
    0;

  let minutesThisMonth =
    0;

  let totalSessionMinutes =
    0;

  let validSessionCount =
    0;

  const readingDates =
    new Set();

  for (
    const session
    of sessions
  ) {
    const pagesRead =
      Number.isFinite(
        Number(
          session.pagesRead
        )
      )
        ? Number(
            session.pagesRead
          )
        : 0;

    const minutes =
      Number.isFinite(
        Number(
          session.minutes
        )
      )
        ? Number(
            session.minutes
          )
        : 0;

    if (
      pagesRead > 0 ||
      minutes > 0
    ) {
      readingDates.add(
        session.date
      );
    }

    if (
      session.date ===
      todayKey
    ) {
      pagesToday +=
        pagesRead;
    }

    if (
      weekStartKey &&
      session.date >=
        weekStartKey &&
      session.date <=
        todayKey
    ) {
      pagesThisWeek +=
        pagesRead;
    }

    if (
      getMonthKey(
        session.date
      ) ===
      currentMonthKey
    ) {
      pagesThisMonth +=
        pagesRead;

      minutesThisMonth +=
        minutes;
    }

    if (
      getYearKey(
        session.date
      ) ===
      currentYearKey
    ) {
      pagesThisYear +=
        pagesRead;
    }

    if (
      minutes > 0
    ) {
      totalSessionMinutes +=
        minutes;

      validSessionCount +=
        1;
    }
  }

  const booksThisMonth =
    books.filter(
      (book) =>
        book.finishedDate &&
        getMonthKey(
          book.finishedDate
        ) ===
        currentMonthKey
    ).length;

  const booksThisYear =
    books.filter(
      (book) =>
        book.finishedDate &&
        getYearKey(
          book.finishedDate
        ) ===
        currentYearKey
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
      pagesThisMonth,
      pagesThisYear,

      readingStreak,

      booksThisMonth,
      booksThisYear,

      averageSession,
      minutesThisMonth
    }
  };
}

/* =========================================================
   REQUEST HELPERS
   ========================================================= */

function getRequestedView(
  request
) {
  return String(
    request.query?.view ||
    "all"
  )
    .trim()
    .toLowerCase();
}

function getRequestedBookId(
  request
) {
  const body =
    request.body || {};

  const rawBookId =
    body.bookId ||
    body.pageId ||
    request.query?.bookId ||
    request.query?.pageId;

  const bookId =
    Array.isArray(
      rawBookId
    )
      ? rawBookId[0]
      : rawBookId;

  return String(
    bookId || ""
  ).trim();
}

function setNoCacheHeaders(
  response
) {
  response.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate"
  );

  response.setHeader(
    "Pragma",
    "no-cache"
  );

  response.setHeader(
    "Expires",
    "0"
  );
}

/* =========================================================
   POST — START READING
   ========================================================= */

async function handleStartReading(
  request,
  response
) {
  const bookId =
    getRequestedBookId(
      request
    );

  if (!bookId) {
    return response
      .status(400)
      .json({
        success:
          false,

        error:
          "A bookId is required."
      });
  }

  const updatedPage =
    await startReadingBook(
      bookId
    );

  setNoCacheHeaders(
    response
  );

  return response
    .status(200)
    .json({
      success:
        true,

      message:
        "The book is now marked as Currently Reading.",

      book:
        normalizePickerBook(
          updatedPage
        )
    });
}

/* =========================================================
   MAIN HANDLER
   ========================================================= */

export default async function handler(
  request,
  response
) {
  const view =
    getRequestedView(
      request
    );

  /*
   * The Start Reading action is the only write operation.
   */
  if (
    request.method ===
    "POST"
  ) {
    if (
      view !==
      "start-reading"
    ) {
      return response
        .status(404)
        .json({
          success:
            false,

          error:
            "Reading action not found.",

          availableActions: [
            "start-reading"
          ]
        });
    }

    try {
      return await handleStartReading(
        request,
        response
      );
    } catch (
      error
    ) {
      console.error(
        "Start Reading API error:",
        error
      );

      return response
        .status(500)
        .json({
          success:
            false,

          error:
            error?.message ||
            "The selected book could not be started."
        });
    }
  }

  if (
    request.method !==
    "GET"
  ) {
    response.setHeader(
      "Allow",
      "GET, POST"
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

  const validViews =
    new Set([
      "all",
      "current",
      "stats",
      "history",
      "next-read"
    ]);

  if (
    !validViews.has(
      view
    )
  ) {
    return response
      .status(404)
      .json({
        success:
          false,

        error:
          "Reading view not found.",

        availableViews: [
          "all",
          "current",
          "stats",
          "history",
          "next-read"
        ]
      });
  }

  try {
    setNoCacheHeaders(
      response
    );

    if (
      view ===
      "current"
    ) {
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

    if (
      view ===
      "next-read"
    ) {
      const pages =
        await queryAllBooks({
          filter: {
            property:
              "Status",

            status: {
              equals:
                "Want to Read"
            }
          }
        });

      return response
        .status(200)
        .json(
          buildNextReadResponse(
            pages
          )
        );
    }

    if (
      view ===
      "stats"
    ) {
      const [
        readingLogPages,
        bookPages
      ] =
        await Promise.all([
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

    if (
      view ===
      "history"
    ) {
      return response
        .status(501)
        .json({
          success:
            false,

          error:
            "Reading history is not implemented yet."
        });
    }

    const [
      currentBookPages,
      readingLogPages,
      allBookPages
    ] =
      await Promise.all([
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

    return response
      .status(200)
      .json({
        success:
          true,

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
          success:
            false,

          error:
            "Reading history is not implemented yet."
        }
      });
  } catch (
    error
  ) {
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

      "next-read":
        "Your TBR could not be loaded",

      all:
        "Reading data could not be loaded"
    };

    return response
      .status(500)
      .json({
        success:
          false,

        error:
          error?.message ||
          errorMessages[
            view
          ] ||
          "Reading data could not be loaded"
      });
  }
}
