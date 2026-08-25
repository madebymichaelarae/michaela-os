/* =========================================================
   MICHAELA OS
   Reading Session Writer
   ========================================================= */

const BOOKS_DATABASE_ID =
  "3a5dbd80-1b57-8032-93ca-d553c45705e4";

const READING_LOG_DATABASE_ID =
  "3a5dbd80-1b57-8064-8369-f5e598888013";

const DAILY_HABITS_DATA_SOURCE_ID =
  "3aadbd80-1b57-8006-98ad-000bf81818ad";

const NOTION_VERSION =
  "2025-09-03";

const TIME_ZONE =
  "America/New_York";

const READ_HABIT_PROPERTY =
  "Read 10 Pages";


/* =========================================================
   NOTION
   ========================================================= */

function getToken() {
  const token =
    process.env.NOTION_TOKEN;

  if (!token) {
    throw new Error(
      "NOTION_TOKEN not found"
    );
  }

  return token;
}


function getHeaders() {
  return {
    Authorization:
      `Bearer ${getToken()}`,

    "Notion-Version":
      NOTION_VERSION,

    "Content-Type":
      "application/json"
  };
}


async function notionRequest(
  path,
  options = {},
  fallbackMessage =
    "Notion request failed"
) {
  const response =
    await fetch(
      `https://api.notion.com/v1${path}`,
      {
        ...options,

        headers: {
          ...getHeaders(),
          ...(options.headers || {})
        }
      }
    );

  let data;

  try {
    data =
      await response.json();
  } catch {
    throw new Error(
      fallbackMessage
    );
  }

  if (!response.ok) {
    throw new Error(
      data.message ||
        fallbackMessage
    );
  }

  return data;
}


/* =========================================================
   DATE
   ========================================================= */

function getTodayDateKey() {
  return new Intl.DateTimeFormat(
    "en-CA",
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
  ).format(
    new Date()
  );
}


function getTodayHabitTitle() {
  return new Intl.DateTimeFormat(
    "en-US",
    {
      timeZone:
        TIME_ZONE,

      weekday:
        "short",

      month:
        "short",

      day:
        "numeric"
    }
  ).format(
    new Date()
  );
}


function getDateKey(
  timestamp
) {
  if (!timestamp) {
    return "";
  }

  return new Intl.DateTimeFormat(
    "en-CA",
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
  ).format(
    new Date(timestamp)
  );
}


/* =========================================================
   DATABASE HELPERS
   ========================================================= */

async function getDataSourceId(
  databaseId
) {
  const data =
    await notionRequest(
      `/databases/${databaseId}`,
      {
        method:
          "GET"
      },
      `Could not retrieve database ${databaseId}`
    );

  const dataSourceId =
    data.data_sources?.[0]?.id;

  if (!dataSourceId) {
    throw new Error(
      `No data source found for database ${databaseId}`
    );
  }

  return dataSourceId;
}


async function queryDataSource(
  dataSourceId,
  {
    filter,
    sorts = [],
    pageSize = 100
  } = {}
) {
  const body = {
    page_size:
      pageSize
  };

  if (filter) {
    body.filter =
      filter;
  }

  if (
    Array.isArray(sorts) &&
    sorts.length > 0
  ) {
    body.sorts =
      sorts;
  }

  return notionRequest(
    `/data_sources/${dataSourceId}/query`,
    {
      method:
        "POST",

      body:
        JSON.stringify(body)
    },
    "Could not query Notion"
  );
}


/* =========================================================
   PROPERTY HELPERS
   ========================================================= */

function getTitle(
  property
) {
  return (
    property?.title
      ?.map(
        item =>
          item.plain_text || ""
      )
      .join("")
      .trim() ||
    ""
  );
}


function getPageTitle(
  page
) {
  for (
    const property
    of Object.values(
      page?.properties || {}
    )
  ) {
    if (
      property?.type ===
      "title"
    ) {
      return getTitle(
        property
      );
    }
  }

  return "";
}


function getStatusName(
  page
) {
  const property =
    page.properties?.Status;

  return (
    property?.status?.name ||
    property?.select?.name ||
    ""
  );
}


/* =========================================================
   CURRENT BOOK
   ========================================================= */

async function findCurrentBook() {
  const booksDataSourceId =
    await getDataSourceId(
      BOOKS_DATABASE_ID
    );

  const data =
    await queryDataSource(
      booksDataSourceId,
      {
        sorts: [
          {
            property:
              "Date Started",

            direction:
              "descending"
          }
        ]
      }
    );

  const currentBook =
    (data.results || [])
      .find(
        page =>
          getStatusName(page)
            .trim()
            .toLowerCase() ===
          "currently reading"
      );

  if (!currentBook) {
    throw new Error(
      "No Currently Reading book was found."
    );
  }

  return currentBook;
}


/* =========================================================
   CREATE READING SESSION
   ========================================================= */

async function createReadingSession({
  bookId,
  pagesRead,
  minutes
}) {
  const dataSourceId =
    await getDataSourceId(
      READING_LOG_DATABASE_ID
    );

  /*
   * Retrieve the data-source schema so we can
   * find its title property without guessing
   * what you named it.
   */
  const dataSource =
    await notionRequest(
      `/data_sources/${dataSourceId}`,
      {
        method:
          "GET"
      },
      "Could not retrieve Reading Log schema"
    );

  const properties = {
    Date: {
      date: {
        start:
          getTodayDateKey()
      }
    },

    "Pages Read": {
      number:
        pagesRead
    },

    Minutes: {
      number:
        minutes
    },

    Book: {
      relation: [
        {
          id:
            bookId
        }
      ]
    }
  };

  /*
   * Populate the database's title property
   * automatically if one exists.
   */
  const titleEntry =
    Object.entries(
      dataSource.properties || {}
    ).find(
      ([, property]) =>
        property?.type ===
        "title"
    );

  if (titleEntry) {
    const [
      titlePropertyName
    ] =
      titleEntry;

    properties[
      titlePropertyName
    ] = {
      title: [
        {
          type:
            "text",

          text: {
            content:
              "Reading Session"
          }
        }
      ]
    };
  }

  return notionRequest(
    "/pages",
    {
      method:
        "POST",

      body:
        JSON.stringify({
          parent: {
            type:
              "data_source_id",

            data_source_id:
              dataSourceId
          },

          properties
        })
    },
    "Could not create Reading Log entry"
  );
}


/* =========================================================
   UPDATE CURRENT PAGE
   ========================================================= */

async function updateCurrentPage(
  bookId,
  currentPage
) {
  return notionRequest(
    `/pages/${bookId}`,
    {
      method:
        "PATCH",

      body:
        JSON.stringify({
          properties: {
            "Current Page": {
              number:
                currentPage
            }
          }
        })
    },
    "Could not update Current Page"
  );
}


/* =========================================================
   TODAY'S READING TOTAL
   ========================================================= */

async function getPagesReadToday() {
  const dataSourceId =
    await getDataSourceId(
      READING_LOG_DATABASE_ID
    );

  const data =
    await queryDataSource(
      dataSourceId,
      {
        filter: {
          property:
            "Date",

          date: {
            equals:
              getTodayDateKey()
          }
        }
      }
    );

  return (
    data.results || []
  ).reduce(
    (
      total,
      page
    ) => {
      const pages =
        page.properties?.[
          "Pages Read"
        ]?.number;

      return (
        total +
        (
          typeof pages ===
            "number"
            ? pages
            : 0
        )
      );
    },
    0
  );
}


/* =========================================================
   DAILY HABITS
   ========================================================= */

async function findTodayHabitsPage() {
  const data =
    await queryDataSource(
      DAILY_HABITS_DATA_SOURCE_ID,
      {
        sorts: [
          {
            timestamp:
              "created_time",

            direction:
              "descending"
          }
        ],

        pageSize:
          30
      }
    );

  const pages =
    data.results || [];

  const expectedTitle =
    getTodayHabitTitle()
      .trim()
      .toLowerCase();

  /*
   * Prefer the visible daily-row title.
   */
  const titleMatch =
    pages.find(
      page =>
        getPageTitle(page)
          .trim()
          .toLowerCase() ===
        expectedTitle
    );

  if (titleMatch) {
    return titleMatch;
  }

  /*
   * Fallback to a row created today.
   */
  const today =
    getTodayDateKey();

  return (
    pages.find(
      page =>
        getDateKey(
          page.created_time
        ) === today
    ) ||
    null
  );
}


async function markReadHabitComplete() {
  const page =
    await findTodayHabitsPage();

  if (!page) {
    throw new Error(
      "Today's Daily Habits row was not found."
    );
  }

  if (
    !Object.prototype
      .hasOwnProperty.call(
        page.properties || {},
        READ_HABIT_PROPERTY
      )
  ) {
    throw new Error(
      `"${READ_HABIT_PROPERTY}" is not a property in Daily Habits.`
    );
  }

  if (
    page.properties?.[
      READ_HABIT_PROPERTY
    ]?.checkbox === true
  ) {
    return;
  }

  await notionRequest(
    `/pages/${page.id}`,
    {
      method:
        "PATCH",

      body:
        JSON.stringify({
          properties: {
            [READ_HABIT_PROPERTY]: {
              checkbox:
                true
            }
          }
        })
    },
    "Could not mark Read 10 Pages complete"
  );
}


/* =========================================================
   HANDLER
   ========================================================= */

export default async function readingLogHandler(
  request,
  response
) {
  if (
    request.method !== "POST"
  ) {
    response.setHeader(
      "Allow",
      "POST"
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
    let body =
      request.body || {};

    if (
      typeof body ===
        "string"
    ) {
      body =
        JSON.parse(body);
    }

    const newPage =
      Number(
        body.currentPage
      );

    const minutes =
      Number(
        body.minutes
      );

    if (
      !Number.isFinite(
        newPage
      ) ||
      newPage < 0
    ) {
      return response
        .status(400)
        .json({
          success:
            false,

          error:
            "Current page must be a valid number."
        });
    }

    if (
      !Number.isFinite(
        minutes
      ) ||
      minutes < 0
    ) {
      return response
        .status(400)
        .json({
          success:
            false,

          error:
            "Minutes must be a valid number."
        });
    }

    const currentBook =
  await findCurrentBook();

const previousPage =
  currentBook
    .properties?.[
      "Current Page"
    ]?.number ?? 0;

const pagesRead =
  Math.max(
    0,
    newPage -
      previousPage
  );

/*
 * Get today's total BEFORE creating
 * the new session so we do not depend
 * on Notion immediately indexing the
 * newly-created page.
 */
const previousPagesToday =
  await getPagesReadToday();

const session =
  await createReadingSession({
    bookId:
      currentBook.id,

    pagesRead,

    minutes
  });

await updateCurrentPage(
  currentBook.id,
  newPage
);

const pagesToday =
  previousPagesToday +
  pagesRead;

let habitCompleted =
  false;

if (
  pagesToday >= 10
) {
  await markReadHabitComplete();

  habitCompleted =
    true;
}

    const bookTitle =
      getPageTitle(
        currentBook
      ) ||
      "Current Book";

    return response
      .status(200)
      .setHeader(
        "Cache-Control",
        "no-store"
      )
      .json({
        success:
          true,

        book: {
          id:
            currentBook.id,

          title:
            bookTitle,

          previousPage,

          currentPage:
            newPage
        },

        session: {
          id:
            session.id,

          pagesRead,

          minutes
        },

        pagesToday,

        read10Pages:
          habitCompleted
      });

  } catch (error) {
    console.error(
      "Reading log API error:",
      error
    );

    return response
      .status(500)
      .json({
        success:
          false,

        error:
          "Reading session could not be logged.",

        details:
          error instanceof Error
            ? error.message
            : String(error)
      });
  }
}
