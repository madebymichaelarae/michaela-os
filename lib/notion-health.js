const HEALTH_DATA_SOURCE_ID =
  "3a5dbd80-1b57-80a2-aff5-000b486606bb";

const NOTION_VERSION =
  "2025-09-03";

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

async function queryHealthPage({
  filter,
  sorts = [],
  pageSize = 100,
  startCursor
} = {}) {
  const requestBody = {
    page_size:
      Math.min(
        Math.max(
          Number(pageSize) || 100,
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

  if (startCursor) {
    requestBody.start_cursor =
      startCursor;
  }

  const response =
    await fetch(
      `https://api.notion.com/v1/data_sources/${HEALTH_DATA_SOURCE_ID}/query`,
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
      "Notion could not return Health entries"
    );
  }

  return data;
}

/*
 * Existing behavior stays intact.
 */
export async function queryHealthEntries(
  options = {}
) {
  const data =
    await queryHealthPage(
      options
    );

  return data.results || [];
}

/*
 * New paginated version for reports and longer histories.
 */
export async function queryAllHealthEntries(
  options = {}
) {
  const results = [];

  let startCursor;

  do {
    const data =
      await queryHealthPage({
        ...options,
        startCursor
      });

    results.push(
      ...(data.results || [])
    );

    startCursor =
      data.has_more &&
      data.next_cursor
        ? data.next_cursor
        : undefined;
  } while (
    startCursor
  );

  return results;
}
