const DAY_TEMPLATES_DATA_SOURCE_ID =
  "3b2dbd80-1b57-80cf-9438-000b67ee6ff7";

const TIME_BLOCKS_DATA_SOURCE_ID =
  "3b1dbd80-1b57-8051-ab57-000b8c0e49f6";

const NOTION_VERSION =
  "2025-09-03";

function getNotionToken() {
  const token =
    process.env.NOTION_TOKEN;

  if (!token) {
    throw new Error(
      "NOTION_TOKEN not found"
    );
  }

  return token;
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

export async function queryDayTemplates({
  filter,
  sorts = [],
  pageSize = 100
} = {}) {
  const requestBody = {
    page_size:
      pageSize
  };

  if (filter) {
    requestBody.filter =
      filter;
  }

  if (sorts.length > 0) {
    requestBody.sorts =
      sorts;
  }

  const response = await fetch(
    `https://api.notion.com/v1/data_sources/${DAY_TEMPLATES_DATA_SOURCE_ID}/query`,
    {
      method: "POST",

      headers:
        getNotionHeaders(),

      body:
        JSON.stringify(
          requestBody
        )
    }
  );

  const data =
    await parseNotionResponse(
      response,
      "Notion could not return Day Template entries"
    );

  return data.results || [];
}

export async function queryGeneratedTimeBlocks({
  filter,
  sorts = [],
  pageSize = 100
} = {}) {
  const requestBody = {
    page_size:
      pageSize
  };

  if (filter) {
    requestBody.filter =
      filter;
  }

  if (sorts.length > 0) {
    requestBody.sorts =
      sorts;
  }

  const response = await fetch(
    `https://api.notion.com/v1/data_sources/${TIME_BLOCKS_DATA_SOURCE_ID}/query`,
    {
      method: "POST",

      headers:
        getNotionHeaders(),

      body:
        JSON.stringify(
          requestBody
        )
    }
  );

  const data =
    await parseNotionResponse(
      response,
      "Notion could not return existing Time Blocks"
    );

  return data.results || [];
}

export async function createTimeBlock(
  properties
) {
  if (
    !properties ||
    typeof properties !==
      "object"
  ) {
    throw new Error(
      "Time Block properties are required"
    );
  }

  const response = await fetch(
    "https://api.notion.com/v1/pages",
    {
      method: "POST",

      headers:
        getNotionHeaders(),

      body:
        JSON.stringify({
          parent: {
            type:
              "data_source_id",

            data_source_id:
              TIME_BLOCKS_DATA_SOURCE_ID
          },

          properties
        })
    }
  );

  return parseNotionResponse(
    response,
    "Notion could not create a Time Block"
  );
}

export async function trashNotionPage(
  pageId
) {
  if (!pageId) {
    throw new Error(
      "A Notion page ID is required"
    );
  }

  const response = await fetch(
    `https://api.notion.com/v1/pages/${pageId}`,
    {
      method: "PATCH",

      headers:
        getNotionHeaders(),

      body:
        JSON.stringify({
          in_trash: true
        })
    }
  );

  return parseNotionResponse(
    response,
    `Notion could not move page ${pageId} to trash`
  );
}
