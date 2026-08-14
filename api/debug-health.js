import {
  queryAllHealthEntries
} from "../lib/notion-health.js";

export default async function handler(
  request,
  response
) {
  try {
    const pages =
      await queryAllHealthEntries({
        filter: {
          property: "Date",
          date: {
            equals: "2026-08-11"
          }
        }
      });

    return response
      .status(200)
      .json({
        success: true,
        count: pages.length,
        entries: pages.map(
          (page) => ({
            id: page.id,
            properties:
              page.properties
          })
        )
      });
  } catch (error) {
    console.error(
      "Health debug error:",
      error
    );

    return response
      .status(500)
      .json({
        success: false,
        error:
          error?.message ||
          String(error)
      });
  }
}
