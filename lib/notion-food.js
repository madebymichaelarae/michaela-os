const FOOD_LOG_DATA_SOURCE_ID =
  "3a6dbd80-1b57-80c7-acb2-000b6f4d58b9";

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

async function queryFoodPage({
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
      `https://api.notion.com/v1/data_sources/${FOOD_LOG_DATA_SOURCE_ID}/query`,
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
      "Notion could not return Food Log entries"
    );
  }

  return data;
}

/*
 * Existing behavior.
 *
 * Keeps returning one query result set so anything already
 * using queryFoodEntries() continues to work exactly as it
 * does now.
 */
export async function queryFoodEntries(
  options = {}
) {
  const data =
    await queryFoodPage(
      options
    );

  return data.results || [];
}

/*
 * New behavior for reports.
 *
 * Automatically follows every Notion cursor so longer
 * reporting periods never get truncated at 100 entries.
 */
export async function queryAllFoodEntries(
  options = {}
) {
  const results = [];

  let startCursor;

  do {
    const data =
      await queryFoodPage({
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
