import { queryHealthEntries } from "../../lib/notion-health.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed"
    });
  }

  try {
    const pages = await queryHealthEntries({
      sorts: [
        {
          property: "Date",
          direction: "ascending"
        }
      ]
    });

    return res.status(200).json({
  count: pages.length
});

    const weights = pages
      .filter((page) => {
        const categoryName =
          page.properties?.Category?.select?.name || "";

        return categoryName.includes("Weight");
      })
      .map((page) => {
        const date = page.properties?.Date?.date?.start;
        const weight = page.properties?.Amount?.number;

        if (!date || typeof weight !== "number") {
          return null;
        }

        return {
          id: page.id,
          date,
          weight
        };
      })
      .filter(Boolean);

    return res.status(200).json({
      success: true,
      count: weights.length,
      weights
    });
  } catch (error) {
    console.error("Weight endpoint error:", error);

    return res.status(500).json({
      success: false,
      error: error.message || "Weight data could not be loaded"
    });
  }
}
