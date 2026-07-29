const {
  generateRandomItem,
} = require("../lib/api/random-generator");

/**
 * Vercel API route:
 * GET /api/random-generator
 * GET /api/random-generator?category=Creative
 */
module.exports = async function handler(request, response) {
  /*
   * Allow the widget to access the route when embedded in Notion.
   */
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  response.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type"
  );

  /*
   * Browsers may send an OPTIONS request before the real request.
   */
  if (request.method === "OPTIONS") {
    return response.status(204).end();
  }

  /*
   * This route only supports GET requests.
   */
  if (request.method !== "GET") {
    return response.status(405).json({
      success: false,
      error: "Method not allowed.",
    });
  }

  try {
    /*
     * Read the optional category from the URL.
     *
     * Example:
     * /api/random-generator?category=Creative
     */
    const rawCategory = request.query.category;

    const category =
      typeof rawCategory === "string"
        ? rawCategory.trim()
        : "";

    const result = await generateRandomItem(category);

    /*
     * A successful request can still have no matching entries.
     */
    if (!result.item) {
      return response.status(404).json({
        success: false,
        category: category || "All",
        count: 0,
        item: null,
        error: category
          ? `No active entries were found in the "${category}" category.`
          : "No active entries were found.",
      });
    }

    return response.status(200).json(result);
  } catch (error) {
    console.error("Random generator API error:", error);

    return response.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Something went wrong while generating an item.",
    });
  }
};
