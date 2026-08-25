const HEALTH_DATA_SOURCE_ID =
  "3a5dbd80-1b57-80a2-aff5-000b486606bb";

const DAILY_HABITS_DATA_SOURCE_ID =
  "3aadbd80-1b57-8006-98ad-000bf81818ad";

const NOTION_VERSION =
  "2025-09-03";

const TIME_ZONE =
  "America/New_York";

const WALK_HABIT_PROPERTY =
  "Walk";

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
  },

  weight: {
    title: "Weight",
    category: "⚖️ Weight",
    unit: "lbs"
  }
};


/* =========================================================
   NOTION HELPERS
   ========================================================= */

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


/* =========================================================
   DATE HELPERS
   ========================================================= */

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


function getTodayHabitTitle() {
  return new Intl.DateTimeFormat(
    "en-US",
    {
      timeZone:
        TIME_ZONE,

      weekday:
        "short",

      month:
        "short",

      day:
        "numeric"
    }
  ).format(
    new Date()
  );
}


/* =========================================================
   GENERIC NOTION QUERY
   ========================================================= */

async function queryDataSource(
  dataSourceId,
  {
    sorts = [],
    pageSize = 30
  } = {}
) {
  const body = {
    page_size:
      pageSize
  };

  if (
    Array.isArray(sorts) &&
    sorts.length > 0
  ) {
    body.sorts =
      sorts;
  }

  const response =
    await fetch(
      `https://api.notion.com/v1/data_sources/${dataSourceId}/query`,
      {
        method:
          "POST",

        headers:
          getHeaders(),

        body:
          JSON.stringify(body)
      }
    );

  return parseNotionResponse(
    response,
    "Could not query Notion"
  );
}


/* =========================================================
   CREATE HEALTH ENTRY
   ========================================================= */

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
               * Your Health database title
               * property is "Entry "
               * WITH a trailing space.
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


/* =========================================================
   DAILY HABITS HELPERS
   ========================================================= */

function getPageTitle(
  page
) {
  const properties =
    page?.properties || {};

  for (
    const property
    of Object.values(
      properties
    )
  ) {
    if (
      property?.type ===
      "title"
    ) {
      return (
        property.title || []
      )
        .map(
          item =>
            item.plain_text || ""
        )
        .join("")
        .trim();
    }
  }

  return "";
}


async function findTodayHabitsPage() {
  const data =
    await queryDataSource(
      DAILY_HABITS_DATA_SOURCE_ID,
      {
        sorts: [
          {
            timestamp:
              "created_time",

            direction:
              "descending"
          }
        ],

        pageSize:
          30
      }
    );

  const pages =
    data.results || [];

  const expectedTitle =
    getTodayHabitTitle()
      .trim()
      .toLowerCase();

  const titleMatch =
    pages.find(
      page =>
        getPageTitle(page)
          .trim()
          .toLowerCase() ===
        expectedTitle
    );

  if (titleMatch) {
    return titleMatch;
  }

  /*
   * Fallback to a Daily Habits row
   * created today.
   */
  const today =
    getTodayDate();

  const createdToday =
    pages.find(
      page => {
        const createdTime =
          page.created_time;

        if (!createdTime) {
          return false;
        }

        const date =
          new Intl.DateTimeFormat(
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
            new Date(
              createdTime
            )
          );

        return (
          date === today
        );
      }
    );

  return (
    createdToday ||
    null
  );
}


async function markWalkHabitComplete() {
  const page =
    await findTodayHabitsPage();

  if (!page) {
    throw new Error(
      "Today's Daily Habits row was not found."
    );
  }

  if (
    !Object.prototype
      .hasOwnProperty.call(
        page.properties || {},
        WALK_HABIT_PROPERTY
      )
  ) {
    throw new Error(
      `"${WALK_HABIT_PROPERTY}" is not a property in Daily Habits.`
    );
  }

  if (
    page.properties?.[
      WALK_HABIT_PROPERTY
    ]?.checkbox === true
  ) {
    return {
      alreadyComplete:
        true
    };
  }

  const response =
    await fetch(
      `https://api.notion.com/v1/pages/${page.id}`,
      {
        method:
          "PATCH",

        headers:
          getHeaders(),

        body:
          JSON.stringify({
            properties: {
              [WALK_HABIT_PROPERTY]: {
                checkbox:
                  true
              }
            }
          })
      }
    );

  await parseNotionResponse(
    response,
    "Could not mark Walk habit complete"
  );

  return {
    alreadyComplete:
      false
  };
}


/* =========================================================
   HANDLER
   ========================================================= */

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
      typeof body ===
        "string"
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

    let habitCompleted =
      false;

    let habitAlreadyComplete =
      false;

    /*
     * Walking checks the Walk habit.
     *
     * Water and Weight only create
     * Health entries.
     */
    if (
      type === "walking"
    ) {
      const habitResult =
        await markWalkHabitComplete();

      habitCompleted =
        true;

      habitAlreadyComplete =
        habitResult
          ?.alreadyComplete ===
        true;
    }

    return response
      .status(200)
      .setHeader(
        "Cache-Control",
        "no-store"
      )
      .json({
        success:
          true,

        ...result,

        habitCompleted,

        habitAlreadyComplete
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
