/* =========================================================
   MICHAELA OS
   Notion Tasks Database Helper
   ========================================================= */

/*
 * This is the database ID from your Tasks database URL.
 *
 * You may optionally create a Vercel environment variable:
 *
 * TASKS_DATABASE_ID
 *
 * If that environment variable exists, it will be used
 * instead of this fallback value.
 */
const DEFAULT_TASKS_DATABASE_ID =
  "3a4dbd80-1b57-8023-9c19-e70a45ffd954";

const NOTION_VERSION =
  "2025-09-03";

/*
 * Removes accidental quote marks and whitespace from
 * environment variables.
 */
function cleanEnvironmentValue(
  value
) {
  return String(
    value || ""
  )
    .trim()
    .replace(
      /^["']|["']$/g,
      ""
    );
}

function getNotionToken() {
  const token =
    cleanEnvironmentValue(
      process.env.NOTION_TOKEN
    );

  if (!token) {
    throw new Error(
      "NOTION_TOKEN not found"
    );
  }

  return token;
}

function getTasksDatabaseId() {
  const environmentDatabaseId =
    cleanEnvironmentValue(
      process.env
        .TASKS_DATABASE_ID
    );

  return (
    environmentDatabaseId ||
    DEFAULT_TASKS_DATABASE_ID
  );
}

function getNotionHeaders() {
  return {
    Authorization:
      `Bearer ${getNotionToken()}`,

    "Notion-Version":
      NOTION_VERSION,

    "Content-Type":
      "application/json"
  };
}

/* =========================================================
   GENERIC NOTION REQUEST
   ========================================================= */

async function notionRequest(
  endpoint,
  options = {}
) {
  const response =
    await fetch(
      `https://api.notion.com/v1${endpoint}`,
      {
        ...options,

        headers: {
          ...getNotionHeaders(),
          ...(options.headers || {})
        }
      }
    );

  const rawText =
    await response.text();

  let data;

  try {
    data = rawText
      ? JSON.parse(rawText)
      : {};
  } catch {
    throw new Error(
      `Notion returned an unreadable response: ${rawText.slice(
        0,
        200
      )}`
    );
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
      `Notion request failed with status ${response.status}`
    );
  }

  return data;
}

/* =========================================================
   DATA SOURCE DISCOVERY
   ========================================================= */

/*
 * Notion databases can contain one or more data sources.
 * We retrieve the database first so we do not have to
 * hard-code a second UUID.
 */
let cachedTasksDataSourceId =
  null;

export async function getTasksDataSourceId() {
  if (
    cachedTasksDataSourceId
  ) {
    return cachedTasksDataSourceId;
  }

  const databaseId =
    getTasksDatabaseId();

  const database =
    await notionRequest(
      `/databases/${databaseId}`,
      {
        method: "GET"
      }
    );

  const dataSources =
    Array.isArray(
      database?.data_sources
    )
      ? database.data_sources
      : [];

  const firstDataSource =
    dataSources[0];

  if (!firstDataSource?.id) {
    throw new Error(
      "No data source was found inside the Tasks database"
    );
  }

  cachedTasksDataSourceId =
    firstDataSource.id;

  return cachedTasksDataSourceId;
}

/* =========================================================
   TASK QUERY
   ========================================================= */

/*
 * Query every matching page from the Tasks data source.
 *
 * Supports:
 * - filters
 * - sorts
 * - pagination
 *
 * Example:
 *
 * queryTaskEntries({
 *   filter: {
 *     property: "Area",
 *     select: {
 *       equals: "Work"
 *     }
 *   }
 * });
 */
export async function queryTaskEntries({
  filter,
  sorts = [],
  pageSize = 100
} = {}) {
  const dataSourceId =
    await getTasksDataSourceId();

  const results = [];

  let cursor =
    null;

  do {
    const requestBody = {
      page_size:
        Math.min(
          Math.max(
            Number(pageSize) ||
              100,
            1
          ),
          100
        )
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

    if (cursor) {
      requestBody.start_cursor =
        cursor;
    }

    const data =
      await notionRequest(
        `/data_sources/${dataSourceId}/query`,
        {
          method: "POST",

          body:
            JSON.stringify(
              requestBody
            )
        }
      );

    results.push(
      ...(data.results || [])
    );

    cursor =
      data.has_more &&
      data.next_cursor
        ? data.next_cursor
        : null;
  } while (cursor);

  return results;
}

/* =========================================================
   RETRIEVE ONE TASK PAGE
   ========================================================= */

export async function retrieveTaskPage(
  pageId
) {
  const normalizedPageId =
    String(
      pageId || ""
    ).trim();

  if (!normalizedPageId) {
    throw new Error(
      "A Notion task page ID is required"
    );
  }

  return notionRequest(
    `/pages/${normalizedPageId}`,
    {
      method: "GET"
    }
  );
}

/* =========================================================
   OPTIONAL CACHE RESET
   ========================================================= */

/*
 * Useful during development if the Tasks database is ever
 * replaced and you want to force data-source rediscovery
 * without restarting the process.
 */
export function clearTasksDataSourceCache() {
  cachedTasksDataSourceId =
    null;
}
