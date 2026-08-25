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


async function parseNotionResponse(
  response,
  fallbackMessage
) {
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
   QUERY
   ========================================================= */

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

  return parseNotionResponse(
    response,
    "Notion could not return Health entries"
  );
}


export async function queryHealthEntries(
  options = {}
) {
  const data =
    await queryHealthPage(
      options
    );

  return data.results || [];
}


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


/* =========================================================
   CREATE
   ========================================================= */

export async function createHealthEntry({
  title,
  category,
  amount,
  unit,
  date
}) {
  if (!category) {
    throw new Error(
      "Health category is required"
    );
  }

  if (
    typeof amount !== "number" ||
    Number.isNaN(amount)
  ) {
    throw new Error(
      "Health amount must be a number"
    );
  }

  if (!unit) {
    throw new Error(
      "Health unit is required"
    );
  }

  if (!date) {
    throw new Error(
      "Health date is required"
    );
  }

  const response =
    await fetch(
      "https://api.notion.com/v1/pages",
      {
        method:
          "POST",

        headers:
          getHeaders(),

        body:
          JSON.stringify({
            parent: {
              type:
                "data_source_id",

              data_source_id:
                HEALTH_DATA_SOURCE_ID
            },

            properties: {
              /*
               * Your Notion title property
               * currently has a trailing space.
               */
              "Entry ": {
                title: [
                  {
                    type:
                      "text",

                    text: {
                      content:
                        title ||
                        category
                    }
                  }
                ]
              },

              Category: {
                select: {
                  name:
                    category
                }
              },

              Amount: {
                number:
                  amount
              },

              Unit: {
                select: {
                  name:
                    unit
                }
              },

              Date: {
                date: {
                  start:
                    date
                }
              }
            }
          })
      }
    );

  return parseNotionResponse(
    response,
    "Notion could not create Health entry"
  );
}
