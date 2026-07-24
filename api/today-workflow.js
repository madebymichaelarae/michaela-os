import { getTodayWorkflow } from "../lib/notion-today-workflow.js";

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");

    return response.status(405).json({
      success: false,
      error: "Method not allowed."
    });
  }

  try {
    const workflow = await getTodayWorkflow();

    response.setHeader(
      "Cache-Control",
      "s-maxage=60, stale-while-revalidate=300"
    );

    return response.status(200).json(workflow);
  } catch (error) {
    console.error("Today workflow error:", error);

    return response.status(500).json({
      success: false,
      error: "Unable to load today's workflow.",
      details:
        error instanceof Error
          ? error.message
          : String(error)
    });
  }
}
