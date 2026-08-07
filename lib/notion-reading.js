/* =========================================================
   MICHAELA OS
   Notion Reading Database Helper
   ========================================================= */

const BOOKS_DATABASE_ID =
  "3a5dbd80-1b57-8032-93ca-d553c45705e4";

const READING_LOG_DATABASE_ID =
  "3a5dbd80-1b57-8064-8369-f5e598888013";

const NOTION_VERSION =
  "2025-09-03";

const TIME_ZONE =
  "America/New_York";

/* =========================================================
   AUTHENTICATION
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

/* =========================================================
   DATE HELPERS
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

/* =========================================================
   DATABASE HELPERS
   ========================================================= */

async function getDataSourceId(
  databaseId
) {
  const response =
    await fetch(
      `https://api.notion.com/v1/databases/${databaseId}`,
      {
        method:
          "GET",

        headers:
          getHeaders()
      }
    );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
      `Notion could not retrieve database ${databaseId}`
    );
  }

  const dataSourceId =
    data.data_sources?.[0]?.id;

  if (!dataSourceId) {
    throw new Error(
      `No data source was found for database ${databaseId}`
    );
  }

  return dataSourceId;
}

async function queryDatabase(
  databaseId,
  {
    filter,
    sorts = [],
    pageSize = 100,
    startCursor
  } = {}
) {
  const dataSourceId =
    await getDataSourceId(
      databaseId
    );

  const requestBody = {
    page_size:
      pageSize
  };

  if (filter) {
    requestBody.filter =
      filter;
  }

  if (
    Array.isArray(sorts) &&
    sorts.length > 0
  ) {
    requestBody.sorts =
      sorts;
  }

  if (startCursor) {
    requestBody.start_cursor =
      startCursor;
  }

  const response =
    await fetch(
      `https://api.notion.com/v1/data_sources/${dataSourceId}/query`,
      {
        method:
          "POST",

        headers:
          getHeaders(),

        body:
          JSON.stringify(
            requestBody
          )
      }
    );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
      `Notion could not query data source ${dataSourceId}`
    );
  }

  return data;
}

/* =========================================================
   BOOK QUERIES
   ========================================================= */

export async function queryBooks(
  options = {}
) {
  const data =
    await queryDatabase(
      BOOKS_DATABASE_ID,
      options
    );

  return data.results || [];
}

export async function queryAllBooks(
  options = {}
) {
  return queryAllPages(
    BOOKS_DATABASE_ID,
    options
  );
}

/* =========================================================
   READING LOG QUERIES
   ========================================================= */

export async function queryReadingLog(
  options = {}
) {
  const data =
    await queryDatabase(
      READING_LOG_DATABASE_ID,
      options
    );

  return data.results || [];
}

export async function queryAllReadingLog(
  options = {}
) {
  return queryAllPages(
    READING_LOG_DATABASE_ID,
    options
  );
}

/* =========================================================
   PAGINATION
   ========================================================= */

async function queryAllPages(
  databaseId,
  options = {}
) {
  const results = [];

  let startCursor;

  do {
    const data =
      await queryDatabase(
        databaseId,
        {
          ...options,
          startCursor
        }
      );

    results.push(
      ...(data.results || [])
    );

    startCursor =
      data.has_more
        ? data.next_cursor
        : undefined;
  } while (
    startCursor
  );

  return results;
}

/* =========================================================
   BOOK UPDATES
   ========================================================= */

/*
 * Marks a selected TBR book as Currently Reading.
 *
 * It also fills Date Started with today's date.
 *
 * This does not automatically change another currently
 * reading book to Paused. We can add that later if useful.
 */
export async function startReadingBook(
  pageId
) {
  const normalizedPageId =
    String(
      pageId || ""
    ).trim();

  if (!normalizedPageId) {
    throw new Error(
      "A Notion book page ID is required"
    );
  }

  const response =
    await fetch(
      `https://api.notion.com/v1/pages/${normalizedPageId}`,
      {
        method:
          "PATCH",

        headers:
          getHeaders(),

        body:
          JSON.stringify({
            properties: {
              Status: {
                status: {
                  name:
                    "Currently Reading"
                }
              },

              "Date Started": {
                date: {
                  start:
                    getTodayDateKey()
                }
              }
            }
          })
      }
    );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
      "Notion could not start the selected book"
    );
  }

  return data;
}
