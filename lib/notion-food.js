const FOOD_LOG_DATA_SOURCE_ID =
  "3a6dbd80-1b57-80c7-acb2-000b6f4d58b9";

const NOTION_VERSION =
  "2025-09-03";

/* =========================================================
   AUTH
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
   FOOD LOG QUERY
   ========================================================= */

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
 * Existing one-page behavior.
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
 * Paginated report-safe behavior.
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

/* =========================================================
   RELATED NOTION PAGES
   ========================================================= */

/*
 * Used by the Dietitian Report to resolve the Meal
 * relation into the actual related food / recipe name.
 */
export async function retrieveFoodRelatedPage(
  pageId
) {
  const normalizedPageId =
    String(
      pageId || ""
    ).trim();

  if (!normalizedPageId) {
    throw new Error(
      "A related Notion page ID is required"
    );
  }

  const response =
    await fetch(
      `https://api.notion.com/v1/pages/${normalizedPageId}`,
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
      `Notion could not retrieve related food page ${normalizedPageId}`
    );
  }

  return data;
}
