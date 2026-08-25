const ROUTINE_STEPS_DATA_SOURCE_ID =
  "3b2dbd80-1b57-803a-b9e2-000b4be46f9d";

const DAILY_HABITS_DATA_SOURCE_ID =
  "3aadbd80-1b57-8006-98ad-000bf81818ad";

const NOTION_VERSION =
  "2025-09-03";

const TIME_ZONE =
  "America/New_York";

const HABIT_PROPERTY_BY_MODULE = {
  "Morning Routine":
    "☀️ Morning Routine",

  "Night Routine":
    "🌙 Night Routine"
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
    property.type === "formula"
  ) {
    if (
      property.formula?.type ===
      "string"
    ) {
      return (
        property.formula.string ||
        ""
      ).trim();
    }
  }

  return "";
}

async function queryDataSource(
  dataSourceId,
  {
    filter,
    sorts = [],
    pageSize = 100,
    startCursor
  } = {}
) {
  const requestBody = {
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
    requestBody.filter =
      filter;
  }

  if (
    Array.isArray(sorts) &&
    sorts.length > 0
  ) {
    requestBody.sorts =
      sorts;
  }

  if (startCursor) {
    requestBody.start_cursor =
      startCursor;
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
          JSON.stringify(
            requestBody
          )
      }
    );

  return parseNotionResponse(
    response,
    `Notion could not query data source ${dataSourceId}`
  );
}

async function queryAllPages(
  dataSourceId,
  options = {}
) {
  const results = [];

  let startCursor;

  do {
    const data =
      await queryDataSource(
        dataSourceId,
        {
          ...options,
          startCursor
        }
      );

    results.push(
      ...(data.results || [])
    );

    startCursor =
      data.has_more &&
      data.next_cursor
        ? data.next_cursor
        : undefined;
  } while (
    startCursor
  );

  return results;
}

async function getPageTitle(
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
      `Notion could not retrieve page ${pageId}`
    );

  const properties =
    page.properties || {};

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
      return getPlainText(
        property
      );
    }
  }

  return "";
}

async function resolveModuleNames(
  relationIds
) {
  const names = [];

  for (
    const relationId
    of relationIds
  ) {
    const name =
      await getPageTitle(
        relationId
      );

    if (name) {
      names.push(name);
    }
  }

  return names;
}

export async function getRoutineSteps(
  moduleName
) {
  const normalizedModule =
    String(
      moduleName || ""
    ).trim();

  if (!normalizedModule) {
    throw new Error(
      "A routine module name is required"
    );
  }

  const pages =
    await queryAllPages(
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

  const moduleNameCache =
    new Map();

  const steps = [];

  for (
    const page
    of pages
  ) {
    const properties =
      page.properties || {};

    const moduleProperty =
      properties.Module;

    const relationIds =
      moduleProperty?.type ===
        "relation"
        ? (
            moduleProperty.relation ||
            []
          ).map(
            relation =>
              relation.id
          )
        : [];

    const moduleNames = [];

    for (
      const relationId
      of relationIds
    ) {
      if (
        !moduleNameCache.has(
          relationId
        )
      ) {
        moduleNameCache.set(
          relationId,
          await getPageTitle(
            relationId
          )
        );
      }

      const resolvedName =
        moduleNameCache.get(
          relationId
        );

      if (resolvedName) {
        moduleNames.push(
          resolvedName
        );
      }
    }

    const belongsToModule =
      moduleNames.some(
        name =>
          name
            .toLowerCase() ===
          normalizedModule
            .toLowerCase()
      );

    if (!belongsToModule) {
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

      emoji,

      name,

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

async function findTodayDailyHabitsPage() {
  const today =
    getTodayDateKey();

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

  const todayPage =
    pages.find(
      page =>
        getDateKeyFromTimestamp(
          page.created_time
        ) === today
    );

  if (!todayPage) {
    throw new Error(
      `No Daily Habits row exists for ${today}`
    );
  }

  return todayPage;
}

export async function completeRoutineModule(
  moduleName
) {
  const normalizedModule =
    String(
      moduleName || ""
    ).trim();

  if (!normalizedModule) {
    throw new Error(
      "A routine module name is required"
    );
  }

  const habitProperty =
    HABIT_PROPERTY_BY_MODULE[
      normalizedModule
    ];

  if (!habitProperty) {
    throw new Error(
      `No Daily Habits property is mapped for "${normalizedModule}"`
    );
  }

  const page =
    await findTodayDailyHabitsPage();

  const alreadyComplete =
    page.properties?.[
      habitProperty
    ]?.checkbox === true;

  if (alreadyComplete) {
    return {
      success:
        true,

      alreadyComplete:
        true,

      pageId:
        page.id,

      module:
        normalizedModule,

      habitProperty
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
              [habitProperty]: {
                checkbox:
                  true
              }
            }
          })
      }
    );

  await parseNotionResponse(
    response,
    `Notion could not complete ${habitProperty}`
  );

  return {
    success:
      true,

    alreadyComplete:
      false,

    pageId:
      page.id,

    module:
      normalizedModule,

    habitProperty
  };
}
