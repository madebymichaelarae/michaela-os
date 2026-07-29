const { Client } = require("@notionhq/client");

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

const DATABASE_ID = process.env.RANDOM_GENERATOR_DATABASE_ID;

/**
 * Safely reads plain text from a Notion property.
 */
function getText(property) {
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

/**
 * Reads the selected option from a Notion Select property.
 */
function getSelect(property) {
  if (!property || property.type !== "select") return "";

  return property.select?.name || "";
}

/**
 * Reads a Notion checkbox property.
 */
function getCheckbox(property) {
  if (!property || property.type !== "checkbox") return false;

  return property.checkbox;
}

/**
 * Picks one random item from an array.
 */
function pickRandom(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }

  const randomIndex = Math.floor(Math.random() * items.length);
  return items[randomIndex];
}

/**
 * Fetches all eligible generator options from Notion.
 */
async function getRandomGeneratorOptions(category) {
  if (!DATABASE_ID) {
    throw new Error(
      "Missing RANDOM_GENERATOR_DATABASE_ID environment variable."
    );
  }

  const options = [];
  let cursor;

  do {
    const response = await notion.databases.query({
      database_id: DATABASE_ID,
      start_cursor: cursor,
      page_size: 100,
    });

    for (const page of response.results) {
      const properties = page.properties || {};

      const name = getText(properties.Name);
      const itemCategory = getSelect(properties.Category);
      const active = properties.Active
        ? getCheckbox(properties.Active)
        : true;

      if (!name || !active) {
        continue;
      }

      if (
        category &&
        itemCategory.toLowerCase() !== category.toLowerCase()
      ) {
        continue;
      }

      options.push({
        id: page.id,
        name,
        category: itemCategory,
      });
    }

    cursor = response.has_more
      ? response.next_cursor
      : undefined;
  } while (cursor);

  return options;
}

/**
 * Returns one random entry from the requested category.
 */
async function generateRandomItem(category) {
  const options = await getRandomGeneratorOptions(category);
  const selectedItem = pickRandom(options);

  return {
    success: true,
    category: category || "All",
    count: options.length,
    item: selectedItem,
  };
}

module.exports = {
  generateRandomItem,
  getRandomGeneratorOptions,
};
