const {
  generateRandomItem,
} = require(
  "../lib/api/random-generator"
);

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
    const rawCategory =
      request.query.category;

    const category =
      typeof rawCategory === "string"
        ? rawCategory.trim()
        : "";

    const result =
      await generateRandomItem(category);

    if (!result.item) {
      return response.status(404).json({
        success: false,
        category: category || "All",
        count: 0,
        item: null,
        error: category
          ? `No active entries were found for "${category}".`
          : "No active generator entries were found.",
      });
    }

    return response.status(200).json(
      result
    );
  } catch (error) {
    console.error(
      "Random generator API error:",
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
