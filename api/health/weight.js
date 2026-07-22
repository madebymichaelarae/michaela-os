const HEALTH_DATA_SOURCE_ID =
  "3a5dbd80-1b57-80a2-aff5-000b486606bb";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed"
    });
  }

  const token = process.env.NOTION_TOKEN;

  if (!token) {
    return res.status(500).json({
      success: false,
      error: "NOTION_TOKEN not found"
    });
  }

  try {
    const notionResponse = await fetch(
      `https://api.notion.com/v1/data_sources/${HEALTH_DATA_SOURCE_ID}/query`,
      {
        method: "POST",

        headers: {
          Authorization: `Bearer ${token}`,
          "Notion-Version": "2025-09-03",
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          filter: {
            property: "Category",
            select: {
              equals: "⚖️ Weight"
            }
          },

          sorts: [
            {
              property: "Date",
              direction: "ascending"
            }
          ],

          page_size: 100
        })
      }
    );

    const notionData = await notionResponse.json();

    if (!notionResponse.ok) {
      console.error("Notion weight query failed:", notionData);

      return res.status(notionResponse.status).json({
        success: false,
        error:
          notionData.message ||
          "Notion could not return the weight entries"
      });
    }

    const weights = notionData.results
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
      error: "The server could not retrieve weight data"
    });
  }
}
