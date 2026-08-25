const ROUTINE_STEPS_DATA_SOURCE_ID =
  "3b2dbd80-1b57-803a-b9e2-000b4be46f9d";

const DAILY_HABITS_DATA_SOURCE_ID =
  "3aadbd80-1b57-8006-98ad-000bf81818ad";

const NOTION_VERSION =
  "2025-09-03";

const TIME_ZONE =
  "America/New_York";

/*
 * For now we are only wiring Morning Routine.
 * We can add Night Routine once Morning is working.
 */
const DAILY_HABIT_PROPERTY_BY_MODULE = {
  "Morning Routine":
    "Morning Routine"
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


async function queryDataSource(
  dataSourceId,
  {
    filter,
    sorts = [],
    pageSize = 100
  } = {}
) {
  const body = {
    page_size:
      Math.min(
        Math.max(
          Number(pageSize) || 100,
          1
        ),
        100
      )
  };

  if (filter) {
    body.filter =
      filter;
  }

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
    "Notion query failed"
  );
}


/* =========================================================
   PROPERTY HELPERS
   ========================================================= */

function getPlainText(
  property
) {
  if (!property) {
    return "";
  }

  if (
    property.type === "title"
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

  if (
    property.type ===
    "rich_text"
  ) {
    return (
      property.rich_text || []
    )
      .map(
        item =>
          item.plain_text || ""
      )
      .join("")
      .trim();
  }

  if (
    property.type === "select"
  ) {
    return (
      property.select?.name || ""
    ).trim();
  }

  if (
    property.type === "status"
  ) {
    return (
      property.status?.name || ""
    ).trim();
  }

  if (
    property.type === "formula" &&
    property.formula?.type ===
      "string"
  ) {
    return (
      property.formula.string ||
      ""
    ).trim();
  }

  return "";
}


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
      property?.type === "title"
    ) {
      return getPlainText(
        property
      );
    }
  }

  return "";
}


/* =========================================================
   DATE HELPERS
   ========================================================= */

function getTodayDateKey() {
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
  /*
   * Matches your Daily Habits titles:
   * Mon, Aug 24
   */
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


function getDateKeyFromTimestamp(
  timestamp
) {
  if (!timestamp) {
    return "";
  }

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
    new Date(timestamp)
  );
}


/* =========================================================
   ROUTINE STEPS
   ========================================================= */

async function getRelatedPageTitle(
  pageId
) {
  const response =
    await fetch(
      `https://api.notion.com/v1/pages/${pageId}`,
      {
        method:
          "GET",

        headers:
          getHeaders()
      }
    );

  const page =
    await parseNotionResponse(
      response,
      "Could not retrieve routine module"
    );

  return getPageTitle(
    page
  );
}


async function getRoutineSteps(
  moduleName
) {
  const pagesData =
    await queryDataSource(
      ROUTINE_STEPS_DATA_SOURCE_ID,
      {
        filter: {
          property:
            "Active",

          checkbox: {
            equals:
              true
          }
        },

        sorts: [
          {
            property:
              "Order",

            direction:
              "ascending"
          }
        ]
      }
    );

  const pages =
    pagesData.results || [];

  const steps = [];

  const moduleCache =
    new Map();

  for (
    const page
    of pages
  ) {
    const properties =
      page.properties || {};

    const moduleProperty =
      properties.Module;

    let matchesModule =
      false;

    /*
     * Your Module property is a relation,
     * so we resolve the related page title.
     */
    if (
      moduleProperty?.type ===
      "relation"
    ) {
      const relations =
        moduleProperty.relation ||
        [];

      for (
        const relation
        of relations
      ) {
        let relatedTitle =
          moduleCache.get(
            relation.id
          );

        if (
          relatedTitle ===
          undefined
        ) {
          relatedTitle =
            await getRelatedPageTitle(
              relation.id
            );

          moduleCache.set(
            relation.id,
            relatedTitle
          );
        }

        if (
          relatedTitle
            .toLowerCase() ===
          moduleName
            .toLowerCase()
        ) {
          matchesModule =
            true;

          break;
        }
      }
    }

    /*
     * Fallback in case Module ever
     * becomes select/text later.
     */
    if (
      !matchesModule
    ) {
      const plainModule =
        getPlainText(
          moduleProperty
        );

      matchesModule =
        plainModule
          .toLowerCase() ===
        moduleName
          .toLowerCase();
    }

    if (
      !matchesModule
    ) {
      continue;
    }

    const name =
      getPlainText(
        properties.Name
      );

    const emoji =
      getPlainText(
        properties.Emoji
      );

    const order =
      properties.Order?.type ===
        "number"
        ? (
            properties.Order
              .number ?? 0
          )
        : 0;

    const duration =
      properties.Duration
        ?.type === "number"
        ? (
            properties.Duration
              .number ?? null
          )
        : null;

    steps.push({
      id:
        page.id,

      name,

      emoji,

      order,

      duration,

      label:
        [
          emoji,
          name
        ]
          .filter(Boolean)
          .join(" ")
    });
  }

  steps.sort(
    (a, b) =>
      a.order - b.order
  );

  return steps;
}


/* =========================================================
   DAILY HABITS
   ========================================================= */

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
      .toLowerCase();

  /*
   * First try the visible title,
   * e.g. "Mon, Aug 24".
   */
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
   * Fallback: find a page created today.
   */
  const today =
    getTodayDateKey();

  const createdToday =
    pages.find(
      page =>
        getDateKeyFromTimestamp(
          page.created_time
        ) === today
    );

  if (createdToday) {
    return createdToday;
  }

  throw new Error(
    `Could not find today's Daily Habits row (${getTodayHabitTitle()})`
  );
}


async function completeRoutine(
  moduleName
) {
  const propertyName =
    DAILY_HABIT_PROPERTY_BY_MODULE[
      moduleName
    ];

  if (!propertyName) {
    throw new Error(
      `No Daily Habits property is configured for "${moduleName}"`
    );
  }

  const page =
    await findTodayHabitsPage();

 const availableProperties =
  Object.keys(
    page.properties || {}
  );

if (
  !Object.prototype.hasOwnProperty.call(
    page.properties || {},
    propertyName
  )
) {
  throw new Error(
    `Property "${propertyName}" was not found. Available properties: ${availableProperties.join(", ")}`
  );
}

const currentValue =
  page.properties[
    propertyName
  ]?.checkbox;

  /*
   * Already checked = success.
   */
  if (
    currentValue === true
  ) {
    return {
      success:
        true,

      module:
        moduleName,

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
              [propertyName]: {
                checkbox:
                  true
              }
            }
          })
      }
    );

  await parseNotionResponse(
    response,
    `Could not complete ${moduleName}`
  );

  return {
    success:
      true,

    module:
      moduleName,

    alreadyComplete:
      false
  };
}


/* =========================================================
   API HANDLER
   ========================================================= */

export default async function routinesHandler(
  request,
  response
) {
  try {
    /*
     * GET
     *
     * /api/route?route=routines
     * &module=Morning%20Routine
     */
    if (
      request.method === "GET"
    ) {
      const rawModule =
        request.query?.module;

      const moduleName =
        String(
          Array.isArray(rawModule)
            ? rawModule[0]
            : (
                rawModule ||
                "Morning Routine"
              )
        ).trim();

      const steps =
        await getRoutineSteps(
          moduleName
        );

      return response
        .status(200)
        .setHeader(
          "Cache-Control",
          "no-store"
        )
        .json({
          success:
            true,

          module:
            moduleName,

          count:
            steps.length,

          steps
        });
    }


    /*
     * POST
     *
     * {
     *   "action": "complete",
     *   "module": "Morning Routine"
     * }
     */
    if (
      request.method === "POST"
    ) {
      let body =
        request.body || {};

      if (
        typeof body ===
        "string"
      ) {
        body =
          JSON.parse(body);
      }

      const action =
        String(
          body.action || ""
        ).trim();

      if (
        action !== "complete"
      ) {
        return response
          .status(400)
          .json({
            success:
              false,

            error:
              'Action must be "complete".'
          });
      }

      const moduleName =
        String(
          body.module ||
            "Morning Routine"
        ).trim();

      const result =
        await completeRoutine(
          moduleName
        );

      return response
        .status(200)
        .setHeader(
          "Cache-Control",
          "no-store"
        )
        .json(result);
    }


    response.setHeader(
      "Allow",
      "GET, POST"
    );

    return response
      .status(405)
      .json({
        success:
          false,

        error:
          `Method ${request.method} not allowed`
      });

  } catch (error) {
    console.error(
      "Routines API error:",
      error
    );

    return response
      .status(500)
      .json({
        success:
          false,

        error:
          "Routine request failed.",

        details:
          error instanceof Error
            ? error.message
            : String(error)
      });
  }
}
