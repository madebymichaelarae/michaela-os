/* =========================================================
   MICHAELA OS
   Daily Habits API

   GET
   Returns today's habit checklist.

   POST
   Updates one habit checkbox on today's row.
   ========================================================= */

const DAILY_HABITS_DATA_SOURCE_ID =
  "3aadbd80-1b57-8006-98ad-000bf81818ad";

const NOTION_VERSION =
  "2025-09-03";

const TIME_ZONE =
  "America/New_York";


/* =========================================================
   HABITS

   These names MUST match the Notion properties exactly.
   ========================================================= */

const HABITS = [
  "Up by 7:AM",
  "Make Bed",
  "Morning Routine",
  "Stretch",
  "Walk",
  "Journal",
  "15 Minutes Creative Time",
  "Read 10 Pages",
  "70 oz Water",
  "Log All Food",
  "Night Routine"
];


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


async function notionRequest(
  path,
  options = {},
  fallbackMessage =
    "Notion request failed"
) {
  const response =
    await fetch(
      `https://api.notion.com/v1${path}`,
      {
        ...options,

        headers: {
          ...getHeaders(),
          ...(options.headers || {})
        }
      }
    );

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

function getDateKey(
  value = new Date()
) {
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
    value instanceof Date
      ? value
      : new Date(value)
  );
}


function getTodayHabitTitle() {
  return new Intl.DateTimeFormat(
    "en-US",
    {
      timeZone:
        TIME_ZONE,

      weekday:
        "long"
    }
  ).format(
    new Date()
  );
}


/* =========================================================
   PAGE HELPERS
   ========================================================= */

function getPageTitle(
  page
) {
  for (
    const property
    of Object.values(
      page?.properties || {}
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


/* =========================================================
   FIND TODAY'S HABIT ROW
   ========================================================= */

async function findTodayHabitsPage() {
  const data =
    await notionRequest(
      `/data_sources/${DAILY_HABITS_DATA_SOURCE_ID}/query`,
      {
        method:
          "POST",

        body:
          JSON.stringify({
            page_size:
              30,

            sorts: [
              {
                timestamp:
                  "created_time",

                direction:
                  "descending"
              }
            ]
          })
      },
      "Could not query Daily Habits"
    );

  const pages =
    data.results || [];

  const today =
    getDateKey();

  /*
   * Primary method:
   * find the row created today.
   */
  const todayPage =
    pages.find(
      page =>
        page.created_time &&
        getDateKey(
          page.created_time
        ) === today
    );

  if (todayPage) {
    return todayPage;
  }

  /*
   * Fallback:
   * match today's weekday title.
   */
  const todayTitle =
    getTodayHabitTitle()
      .trim()
      .toLowerCase();

  const titleMatch =
    pages.find(
      page =>
        getPageTitle(page)
          .trim()
          .toLowerCase() ===
        todayTitle
    );

  if (titleMatch) {
    return titleMatch;
  }

  throw new Error(
    "Today's Daily Habits row was not found."
  );
}


/* =========================================================
   BUILD CHECKLIST
   ========================================================= */

function buildHabitList(
  page
) {
  return HABITS.map(
    (
      name,
      index
    ) => {
      const property =
        page.properties?.[
          name
        ];

      return {
        name,

        order:
          index + 1,

        completed:
          property?.checkbox ===
          true
      };
    }
  );
}


/* =========================================================
   GET
   ========================================================= */

async function handleGet(
  response
) {
  const page =
    await findTodayHabitsPage();

  const habits =
    buildHabitList(
      page
    );

  const completed =
    habits.filter(
      habit =>
        habit.completed
    ).length;

  return response
    .status(200)
    .setHeader(
      "Cache-Control",
      "no-store"
    )
    .json({
      success:
        true,

      date:
        getDateKey(),

      day:
        getTodayHabitTitle(),

      pageId:
        page.id,

      count:
        habits.length,

      completed,

      remaining:
        habits.length -
        completed,

      habits
    });
}


/* =========================================================
   POST
   ========================================================= */

async function handlePost(
  request,
  response
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

  const habit =
    String(
      body.habit || ""
    ).trim();

  if (
    !HABITS.includes(
      habit
    )
  ) {
    return response
      .status(400)
      .json({
        success:
          false,

        error:
          "Unknown habit.",

        habit,

        availableHabits:
          HABITS
      });
  }

  /*
   * Defaults to true so later our
   * Shortcut can simply send the
   * habit name when something gets
   * checked.
   */
  const completed =
    body.completed ===
      undefined
      ? true
      : body.completed ===
        true;

  const page =
    await findTodayHabitsPage();

  const property =
    page.properties?.[
      habit
    ];

  if (
    property?.type !==
      "checkbox"
  ) {
    throw new Error(
      `"${habit}" is not a checkbox property in Daily Habits.`
    );
  }

  /*
   * Don't make an unnecessary
   * Notion request if it already
   * has the requested state.
   */
  if (
    property.checkbox ===
    completed
  ) {
    return response
      .status(200)
      .setHeader(
        "Cache-Control",
        "no-store"
      )
      .json({
        success:
          true,

        habit,

        completed,

        changed:
          false
      });
  }

  await notionRequest(
    `/pages/${page.id}`,
    {
      method:
        "PATCH",

      body:
        JSON.stringify({
          properties: {
            [habit]: {
              checkbox:
                completed
            }
          }
        })
    },
    `Could not update "${habit}"`
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

      habit,

      completed,

      changed:
        true
    });
}


/* =========================================================
   HANDLER
   ========================================================= */

export default async function habitsHandler(
  request,
  response
) {
  try {
    if (
      request.method ===
      "GET"
    ) {
      return await handleGet(
        response
      );
    }

    if (
      request.method ===
      "POST"
    ) {
      return await handlePost(
        request,
        response
      );
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
          "Method not allowed"
      });

  } catch (error) {
    console.error(
      "Daily Habits API error:",
      error
    );

    return response
      .status(500)
      .json({
        success:
          false,

        error:
          "Daily Habits request failed.",

        details:
          error instanceof Error
            ? error.message
            : String(error)
      });
  }
}
