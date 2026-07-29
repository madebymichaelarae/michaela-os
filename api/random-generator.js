const NOTION_TOKEN =
  process.env.NOTION_TOKEN;

const DATABASE_ID =
  process.env.RANDOM_GENERATOR_DATABASE_ID;

const NOTION_VERSION = "2026-03-11";

function readText(property) {
  if (!property) return "";

  if (property.type === "title") {
    return property.title
      .map((item) => item.plain_text)
      .join("")
      .trim();
  }

  if (property.type === "rich_text") {
    return property.rich_text
      .map((item) => item.plain_text)
      .join("")
      .trim();
  }

  return "";
}

function readCategory(property) {
  if (!property) return "";

  if (property.type === "select") {
    return property.select?.name || "";
  }

  if (property.type === "status") {
    return property.status?.name || "";
  }

  if (property.type === "multi_select") {
    return property.multi_select
      .map((item) => item.name)
      .join(", ");
  }

  if (property.type === "rich_text") {
    return readText(property);
  }

  return "";
}

function readActive(property) {
  if (!property) return true;

  if (property.type !== "checkbox") {
    return true;
  }

  return property.checkbox;
}

function findTitleProperty(properties) {
  return (
    properties.Name ||
    properties.Prompt ||
    properties.Item ||
    properties.Title ||
    Object.values(properties).find(
      (property) =>
        property.type === "title"
    )
  );
}

function findCategoryProperty(properties) {
  return (
    properties.Category ||
    properties.Type ||
    properties.Group ||
    Object.values(properties).find(
      (property) =>
        property.type === "select" ||
        property.type === "status" ||
        property.type === "multi_select"
    )
  );
}

function pickRandom(items) {
  if (!items.length) return null;

  const index = Math.floor(
    Math.random() * items.length
  );

  return items[index];
}

async function notionRequest(
  endpoint,
  options = {}
) {
  const response = await fetch(
    `https://api.notion.com/v1${endpoint}`,
    {
      ...options,

      headers: {
        Authorization:
          `Bearer ${NOTION_TOKEN}`,

        "Notion-Version":
          NOTION_VERSION,

        "Content-Type":
          "application/json",

        ...(options.headers || {}),
      },
    }
  );

  const text = await response.text();

  let data;

  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(
      `Notion returned an unreadable response: ${text.slice(
        0,
        200
      )}`
    );
  }

  if (!response.ok) {
    throw new Error(
      data.message ||
      `Notion request failed with status ${response.status}.`
    );
  }

  return data;
}

/**
 * Finds the data source connected to the database.
 */
async function getDataSourceId() {
  const database = await notionRequest(
    `/databases/${DATABASE_ID}`,
    {
      method: "GET",
    }
  );

  const dataSource =
    database.data_sources?.[0];

  if (!dataSource?.id) {
    throw new Error(
      "No data source was found inside the Notion database."
    );
  }

  return dataSource.id;
}

/**
 * Retrieves every row from the Notion data source.
 */
async function getAllPages(
  dataSourceId
) {
  const pages = [];
  let startCursor = null;

  do {
    const body = {
      page_size: 100,
    };

    if (startCursor) {
      body.start_cursor =
        startCursor;
    }

    const data = await notionRequest(
      `/data_sources/${dataSourceId}/query`,
      {
        method: "POST",
        body: JSON.stringify(body),
      }
    );

    pages.push(
      ...(data.results || [])
    );

    startCursor =
      data.has_more
        ? data.next_cursor
        : null;
  } while (startCursor);

  return pages;
}

module.exports = async function handler(
  request,
  response
) {
  response.setHeader(
    "Access-Control-Allow-Origin",
    "*"
  );

  response.setHeader(
    "Access-Control-Allow-Methods",
    "GET, OPTIONS"
  );

  response.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type"
  );

  if (request.method === "OPTIONS") {
    return response
      .status(204)
      .end();
  }

  if (request.method !== "GET") {
    return response.status(405).json({
      success: false,
      error: "Method not allowed.",
    });
  }

  try {
    if (!NOTION_TOKEN) {
      throw new Error(
        "NOTION_TOKEN is missing in Vercel."
      );
    }

    if (!DATABASE_ID) {
      throw new Error(
        "RANDOM_GENERATOR_DATABASE_ID is missing in Vercel."
      );
    }

    const rawCategory =
      request.query.category;

    const requestedCategory =
      typeof rawCategory === "string"
        ? rawCategory.trim()
        : "";

    const normalizedCategory =
      requestedCategory.toLowerCase();

    const dataSourceId =
      await getDataSourceId();

    const pages =
      await getAllPages(
        dataSourceId
      );

    const options = [];

    for (const page of pages) {
      const properties =
        page.properties || {};

      const name = readText(
        findTitleProperty(properties)
      );

      const category =
        readCategory(
          findCategoryProperty(
            properties
          )
        );

      const active =
        readActive(
          properties.Active ||
          properties.Enabled
        );

      if (!name || !active) {
        continue;
      }

      if (
        normalizedCategory &&
        category.trim().toLowerCase() !==
          normalizedCategory
      ) {
        continue;
      }

      options.push({
        id: page.id,
        name,
        category,
      });
    }

    const item =
      pickRandom(options);

    if (!item) {
      return response.status(404).json({
        success: false,
        category:
          requestedCategory || "All",
        count: 0,
        item: null,

        error: requestedCategory
          ? `No active entries were found for "${requestedCategory}".`
          : "No active generator entries were found.",
      });
    }

    return response.status(200).json({
      success: true,
      category:
        requestedCategory || "All",
      count: options.length,
      item,
    });
  } catch (error) {
    console.error(
      "Random generator error:",
      error
    );

    return response.status(500).json({
      success: false,

      error:
        error instanceof Error
          ? error.message
          : "The random generator failed.",
    });
  }
};
