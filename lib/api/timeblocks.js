import {
  queryTimeBlocks,
  retrieveNotionPage
} from "../notion-timeblocks.js";

const TIME_ZONE =
  "America/New_York";

/*
 * Change only these values if your
 * Notion property names are different.
 */
const PROPERTY_NAMES = {
  title: "Name",
  day: "Day",
  start: "Start",
  duration: "Duration",
  end: "End",
  remaining: "Remaining",
  status: "Status",
  category: "Category",
  type: "Type",
  flex: "Flex",
  tasks: "Tasks"
};

function getDateKey(date) {
  return new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone: TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }
  ).format(date);
}

function getTodayKey() {
  return getDateKey(
    new Date()
  );
}

function getPlainText(
  richText = []
) {
  return richText
    .map(
      (item) =>
        item?.plain_text ||
        item?.text?.content ||
        ""
    )
    .join("")
    .trim();
}

function getTitleFromProperty(
  property
) {
  return getPlainText(
    property?.title || []
  );
}

function findPropertyByType(
  properties,
  type
) {
  return Object.values(
    properties || {}
  ).find(
    (property) =>
      property?.type === type
  );
}

function getPageTitle(page) {
  const properties =
    page?.properties || {};

  const namedProperty =
    properties[
      PROPERTY_NAMES.title
    ];

  if (
    namedProperty?.type ===
    "title"
  ) {
    return (
      getTitleFromProperty(
        namedProperty
      ) ||
      "Untitled"
    );
  }

  const titleProperty =
    findPropertyByType(
      properties,
      "title"
    );

  return (
    getTitleFromProperty(
      titleProperty
    ) ||
    "Untitled"
  );
}

function getPageStatus(page) {
  const properties =
    page?.properties || {};

  const namedProperty =
    properties[
      PROPERTY_NAMES.status
    ];

  if (
    namedProperty?.type ===
    "status"
  ) {
    return (
      namedProperty.status
        ?.name || null
    );
  }

  const statusProperty =
    findPropertyByType(
      properties,
      "status"
    );

  return (
    statusProperty?.status
      ?.name || null
  );
}

function getDateValue(
  property
) {
  return (
    property?.date?.start ||
    null
  );
}

function getNumberValue(
  property
) {
  return typeof property
    ?.number === "number"
    ? property.number
    : null;
}

function getSelectValue(
  property
) {
  return (
    property?.select?.name ||
    null
  );
}

function getStatusValue(
  property
) {
  return (
    property?.status?.name ||
    null
  );
}

function getCheckboxValue(
  property
) {
  return Boolean(
    property?.checkbox
  );
}

function getFormulaValue(
  property
) {
  const formula =
    property?.formula;

  if (!formula) {
    return null;
  }

  if (
    formula.type === "date"
  ) {
    return (
      formula.date?.start ||
      null
    );
  }

  if (
    formula.type === "number"
  ) {
    return typeof formula
      .number === "number"
      ? formula.number
      : null;
  }

  if (
    formula.type === "string"
  ) {
    return (
      formula.string || null
    );
  }

  if (
    formula.type === "boolean"
  ) {
    return formula.boolean;
  }

  return null;
}

function getRelationIds(
  property
) {
  return (
    property?.relation || []
  )
    .map(
      (relation) =>
        relation?.id
    )
    .filter(Boolean);
}

async function normalizeTask(
  taskId
) {
  try {
    const page =
      await retrieveNotionPage(
        taskId
      );

    return {
      id: page.id,

      title:
        getPageTitle(page),

      status:
        getPageStatus(page),

      url:
        page.url || null
    };
  } catch (error) {
    console.error(
      `Could not retrieve related task "${taskId}":`,
      error
    );

    /*
     * Keep the time block usable even
     * if one related task cannot load.
     */
    return {
      id: taskId,
      title:
        "Task unavailable",
      status: null,
      url: null,
      unavailable: true
    };
  }
}

async function normalizeTasks(
  taskIds
) {
  return Promise.all(
    taskIds.map(
      normalizeTask
    )
  );
}

async function normalizeTimeBlock(
  page
) {
  const properties =
    page.properties || {};

  const day =
    getDateValue(
      properties[
        PROPERTY_NAMES.day
      ]
    );

  const start =
    getDateValue(
      properties[
        PROPERTY_NAMES.start
      ]
    );

  const duration =
    getNumberValue(
      properties[
        PROPERTY_NAMES.duration
      ]
    );

  const end =
    getFormulaValue(
      properties[
        PROPERTY_NAMES.end
      ]
    );

  const remaining =
    getFormulaValue(
      properties[
        PROPERTY_NAMES.remaining
      ]
    );

  const taskIds =
    getRelationIds(
      properties[
        PROPERTY_NAMES.tasks
      ]
    );

  const tasks =
    await normalizeTasks(
      taskIds
    );

  return {
    id: page.id,

    title:
      getPageTitle(page),

    day:
      day
        ? String(day).slice(
            0,
            10
          )
        : null,

    start,

    end,

    duration,

    remaining,

    status:
      getStatusValue(
        properties[
          PROPERTY_NAMES.status
        ]
      ),

    category:
      getSelectValue(
        properties[
          PROPERTY_NAMES.category
        ]
      ),

    type:
      getSelectValue(
        properties[
          PROPERTY_NAMES.type
        ]
      ),

    flex:
      getCheckboxValue(
        properties[
          PROPERTY_NAMES.flex
        ]
      ),

    tasks,

    taskCount:
      tasks.length,

    completedTaskCount:
      tasks.filter(
        (task) =>
          isTaskComplete(
            task.status
          )
      ).length,

    url:
      page.url || null
  };
}

function isTaskComplete(
  status
) {
  const normalized =
    String(status || "")
      .trim()
      .toLowerCase();

  return [
    "done",
    "complete",
    "completed",
    "finished"
  ].includes(normalized);
}

function compareBlocks(
  first,
  second
) {
  if (
    !first.start &&
    !second.start
  ) {
    return 0;
  }

  if (!first.start) {
    return 1;
  }

  if (!second.start) {
    return -1;
  }

  return (
    new Date(
      first.start
    ).getTime() -
    new Date(
      second.start
    ).getTime()
  );
}

function getRequestedDate(
  request
) {
  const rawDate =
    request.query?.date;

  const date =
    Array.isArray(rawDate)
      ? rawDate[0]
      : rawDate;

  const normalized =
    String(date || "")
      .trim();

  /*
   * Allows:
   * /api/timeblocks
   * /api/timeblocks?date=2026-08-03
   */
  if (
    /^\d{4}-\d{2}-\d{2}$/.test(
      normalized
    )
  ) {
    return normalized;
  }

  return getTodayKey();
}

export default async function handler(
  request,
  response
) {
  if (
    request.method !== "GET"
  ) {
    response.setHeader(
      "Allow",
      "GET"
    );

    return response
      .status(405)
      .json({
        success: false,
        error:
          "Method not allowed"
      });
  }

  const date =
    getRequestedDate(
      request
    );

  try {
    const pages =
      await queryTimeBlocks({
        filter: {
          property:
            PROPERTY_NAMES.day,

          date: {
            equals: date
          }
        },

        sorts: [
          {
            property:
              PROPERTY_NAMES.start,

            direction:
              "ascending"
          }
        ]
      });

    const blocks =
      (
        await Promise.all(
          pages.map(
            normalizeTimeBlock
          )
        )
      ).sort(
        compareBlocks
      );

    return response
      .status(200)
      .json({
        success: true,
        date,
        count:
          blocks.length,
        blocks
      });
  } catch (error) {
    console.error(
      `Time Blocks API error for "${date}":`,
      error
    );

    return response
      .status(500)
      .json({
        success: false,

        date,

        error:
          error?.message ||
          "Time Block data could not be loaded"
      });
  }
}
