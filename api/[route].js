import contentHandler from "../lib/api/content.js";
import foodSummaryHandler from "../lib/api/food-summary.js";
import healthSummaryHandler from "../lib/api/health-summary.js";
import healthHandler from "../lib/api/health.js";
import morningFocusHandler from "../lib/api/morning-focus.js";
import readingHandler from "../lib/api/reading.js";
import weatherHandler from "../lib/api/weather.js";

import {
  handleFinanceRequest
} from "../lib/api/finance.js";

import dailyWrapUpHandler from "../lib/api/daily-wrap-up.js";

import timeBlocksHandler
  from "../lib/api/timeblocks.js";

/**
 * Adapts the finance function to match the same
 * request/response handler format as the other routes.
 */
async function financeHandler(
  request,
  response
) {
  const data =
    await handleFinanceRequest(request);

  const statusCode =
    data.success === false ? 400 : 200;

  return response
    .status(statusCode)
    .json(data);
}

const ROUTE_HANDLERS = {
  "content-summary": contentHandler,
  "today-workflow": contentHandler,
  "approval-summary": contentHandler,

  "food-summary": foodSummaryHandler,

  "health-summary": healthSummaryHandler,
  health: healthHandler,

  "morning-focus": morningFocusHandler,

  reading: readingHandler,

  weather: weatherHandler,

  finance: financeHandler,

  "daily-wrap-up": dailyWrapUpHandler

   timeblocks: timeBlocksHandler
};

function getRequestedRoute(request) {
  const rawRoute = request.query?.route;

  const route = Array.isArray(rawRoute)
    ? rawRoute[0]
    : rawRoute;

  return String(route || "")
    .trim()
    .toLowerCase();
}

export default async function handler(
  request,
  response
) {
  const route = getRequestedRoute(request);

  const routeHandler =
    ROUTE_HANDLERS[route];

  if (!routeHandler) {
    return response.status(404).json({
      success: false,
      error: "API route not found.",
      route
    });
  }

  try {
    return await routeHandler(
      request,
      response
    );
  } catch (error) {
    console.error(
      `Unhandled API error for route "${route}":`,
      error
    );

    if (response.headersSent) {
      return;
    }

    return response.status(500).json({
      success: false,
      error:
        "An unexpected API error occurred.",
      details:
        error instanceof Error
          ? error.message
          : String(error)
    });
  }
}
