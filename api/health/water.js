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

    const water = pages
      .filter(
        (page) =>
          page.properties?.Category?.select?.name === "💧 Water"
      )
      .map((page) => {
        const date = page.properties?.Date?.date?.start;
        const ounces = page.properties?.Amount?.number;

        if (!date || typeof ounces !== "number") {
          return null;
        }

        return {
          id: page.id,
          date,
          ounces
        };
      })
      .filter(Boolean);

    return res.status(200).json({
      success: true,
      count: water.length,
      water
    });
  } catch (error) {
    console.error("Water endpoint error:", error);

    return res.status(500).json({
      success: false,
      error: error.message || "Water data could not be loaded"
    });
  }
}
