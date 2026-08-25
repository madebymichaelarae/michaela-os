const HEALTH_DATA_SOURCE_ID =
  "3a5dbd80-1b57-80a2-aff5-000b486606bb";

const NOTION_VERSION =
  "2025-09-03";

const TIME_ZONE =
  "America/New_York";

const ENTRY_CONFIG = {
  water: {
    title: "Water",
    category: "💧 Water",
    unit: "oz"
  },

  walking: {
    title: "Walk",
    category: "🚶 Walk",
    unit: "miles"
  }
};

function getToken() {
  const token =
    process.env.NOTION_TOKEN;

  if (!token) {
    throw new Error(
      "NOTION_TOKEN not found"
    );
  }

  return token;
}

function getHeaders() {
  return {
    Authorization:
      `Bearer ${getToken()}`,

    "Notion-Version":
      NOTION_VERSION,

    "Content-Type":
      "application/json"
  };
}

function getTodayDate() {
  return new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone:
        TIME_ZONE,

      year:
        "numeric",

      month:
        "2-digit",

      day:
        "2-digit"
    }
  ).format(
    new Date()
  );
}

async function parseNotionResponse(
  response,
  fallbackMessage
) {
  let data;

  try {
    data =
      await response.json();
  } catch {
    throw new Error(
      fallbackMessage
    );
  }

  if (!response.ok) {
    throw new Error(
      data.message ||
        fallbackMessage
    );
  }

  return data;
}

async function createHealthEntry({
  type,
  amount
}) {
  const config =
    ENTRY_CONFIG[type];

  if (!config) {
    throw new Error(
      `Unsupported health log type: ${type}`
    );
  }

  const numericAmount =
    Number(amount);

  if (
    !Number.isFinite(
      numericAmount
    ) ||
    numericAmount <= 0
  ) {
    throw new Error(
      "Amount must be greater than zero"
    );
  }

  const response =
    await fetch(
      "https://api.notion.com/v1/pages",
      {
        method:
          "POST",

        headers:
          getHeaders(),

        body:
          JSON.stringify({
            parent: {
              type:
                "data_source_id",

              data_source_id:
                HEALTH_DATA_SOURCE_ID
            },

            properties: {
              /*
               * Your title property is
               * currently named "Entry "
               * with a trailing space.
               */
              "Entry ": {
                title: [
                  {
                    type:
                      "text",

                    text: {
                      content:
                        config.title
                    }
                  }
                ]
              },

              Category: {
                select: {
                  name:
                    config.category
                }
              },

              Amount: {
                number:
                  numericAmount
              },

              Unit: {
                select: {
                  name:
                    config.unit
                }
              },

              Date: {
                date: {
                  start:
                    getTodayDate()
                }
              }
            }
          })
      }
    );

  const page =
    await parseNotionResponse(
      response,
      "Notion could not create Health entry"
    );

  return {
    id:
      page.id,

    type,

    amount:
      numericAmount,

    unit:
      config.unit,

    date:
      getTodayDate()
  };
}

export default async function healthLogHandler(
  request,
  response
) {
  if (
    request.method !== "POST"
  ) {
    response.setHeader(
      "Allow",
      "POST"
    );

    return response
      .status(405)
      .json({
        success:
          false,

        error:
          "Method not allowed"
      });
  }

  try {
    let body =
      request.body || {};

    if (
      typeof body === "string"
    ) {
      body =
        JSON.parse(body);
    }

    const type =
      String(
        body.type || ""
      )
        .trim()
        .toLowerCase();

    const result =
      await createHealthEntry({
        type,
        amount:
          body.amount
      });

    return response
      .status(200)
      .setHeader(
        "Cache-Control",
        "no-store"
      )
      .json({
        success:
          true,

        ...result
      });

  } catch (error) {
    console.error(
      "Health log API error:",
      error
    );

    return response
      .status(500)
      .json({
        success:
          false,

        error:
          "Health entry could not be logged.",

        details:
          error instanceof Error
            ? error.message
            : String(error)
      });
  }
}
