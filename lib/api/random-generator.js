const {
  Client,
} = require("@notionhq/client");

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

const DATABASE_ID =
  process.env.RANDOM_GENERATOR_DATABASE_ID;

function readText(property) {
  if (!property) {
    return "";
  }

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

  if (property.type === "formula") {
    if (
      property.formula?.type === "string"
    ) {
      return property.formula.string || "";
    }
  }

  return "";
}

function readCategory(property) {
  if (!property) {
    return "";
  }

  if (property.type === "select") {
    return property.select?.name || "";
  }

  if (property.type === "status") {
    return property.status?.name || "";
  }

  if (property.type === "multi_select") {
    return property.multi_select
      .map((option) => option.name)
      .join(", ");
  }

  if (property.type === "rich_text") {
    return readText(property);
  }

  return "";
}

function readCheckbox(property) {
  if (!property) {
    return true;
  }

  if (property.type !== "checkbox") {
    return true;
  }

  return property.checkbox;
}

function findTitleProperty(properties) {
  const namedProperty =
    properties.Name ||
    properties.Prompt ||
    properties.Item ||
    properties.Title;

  if (namedProperty) {
    return namedProperty;
  }

  return Object.values(properties).find(
    (property) =>
      property.type === "title"
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
  if (!items.length) {
    return null;
  }

  const index = Math.floor(
    Math.random() * items.length
  );

  return items[index];
}

async function queryAllPages() {
  const pages = [];
  let startCursor;

  do {
    const response =
      await notion.databases.query({
        database_id: DATABASE_ID,
        page_size: 100,
        start_cursor: startCursor,
      });

    pages.push(...response.results);

    startCursor =
      response.has_more
        ? response.next_cursor
        : undefined;
  } while (startCursor);

  return pages;
}

async function getRandomGeneratorOptions(
  requestedCategory = ""
) {
  if (!process.env.NOTION_TOKEN) {
    throw new Error(
      "NOTION_TOKEN is missing in Vercel."
    );
  }

  if (!DATABASE_ID) {
    throw new Error(
      "RANDOM_GENERATOR_DATABASE_ID is missing in Vercel."
    );
  }

  const pages = await queryAllPages();

  const normalizedRequestedCategory =
    requestedCategory
      .trim()
      .toLowerCase();

  const options = [];

  for (const page of pages) {
    const properties =
      page.properties || {};

    const titleProperty =
      findTitleProperty(properties);

    const categoryProperty =
      findCategoryProperty(properties);

    const activeProperty =
      properties.Active ||
      properties.Enabled;

    const name =
      readText(titleProperty);

    const category =
      readCategory(categoryProperty);

    const active =
      readCheckbox(activeProperty);

    if (!name || !active) {
      continue;
    }

    if (
      normalizedRequestedCategory &&
      category.trim().toLowerCase() !==
        normalizedRequestedCategory
    ) {
      continue;
    }

    options.push({
      id: page.id,
      name,
      category,
    });
  }

  return options;
}

async function generateRandomItem(
  category = ""
) {
  const options =
    await getRandomGeneratorOptions(
      category
    );

  return {
    success: true,
    category: category || "All",
    count: options.length,
    item: pickRandom(options),
  };
}

module.exports = {
  generateRandomItem,
  getRandomGeneratorOptions,
};
