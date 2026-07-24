const CONTENT_DATA_SOURCE_ID =
  "3a7dbd80-1b57-8091-85a7-000b5e096477";

const NOTION_VERSION = "2025-09-03";

/**
 * Queries every page in the Client Content Schedule.
 *
 * Pagination is included so the widget continues working if the database
 * grows beyond Notion's 100-page response limit.
 */
export async function queryContentEntries({
  filter,
  sorts = [],
  pageSize = 100
} = {}) {
  const token = process.env.NOTION_TOKEN;

  if (!token) {
    throw new Error("NOTION_TOKEN not found");
  }

  const results = [];
  let cursor;

  do {
    const requestBody = {
      page_size: pageSize
    };

    if (filter) {
      requestBody.filter = filter;
    }

    if (sorts.length > 0) {
      requestBody.sorts = sorts;
    }

    if (cursor) {
      requestBody.start_cursor = cursor;
    }

    const response = await fetch(
      `https://api.notion.com/v1/data_sources/${CONTENT_DATA_SOURCE_ID}/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Notion-Version": NOTION_VERSION,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ||
          "Notion could not return content schedule entries"
      );
    }

    results.push(...(data.results || []));

    cursor = data.has_more
      ? data.next_cursor
      : undefined;
  } while (cursor);

  return results;
}
