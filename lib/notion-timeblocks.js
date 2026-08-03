const TIME_BLOCKS_DATA_SOURCE_ID =
  "PASTE_YOUR_TIME_BLOCKS_DATA_SOURCE_ID_HERE";

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

export async function queryTimeBlocks({
  filter,
  sorts = [],
  pageSize = 100
} = {}) {
  const requestBody = {
    page_size: pageSize
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
    await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
      "Notion could not return Time Block entries"
    );
  }

  return data.results || [];
}

export async function retrieveNotionPage(
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
      method: "GET",
      headers:
        getNotionHeaders()
    }
  );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
      `Notion could not retrieve page ${pageId}`
    );
  }

  return data;
}
