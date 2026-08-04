import {
  queryTimeBlocks,
  retrieveNotionPage,
  updateNotionPage,
  retrieveNotionDataSource
} from "../notion-timeblocks.js";

const TIME_ZONE =
  "America/New_York";

const TASKS_DATA_SOURCE_ID =
  "3a4dbd80-1b57-8075-b9e4-000bab13cce4";

const PROPERTY_NAMES = {
  title: "Name",
  order: "Order",
  day: "Day",
  start: "Start",
  duration: "Duration",
  end: "End",
  remaining: "Remaining",
  status: "Status",
  category: "Category",
  type: "Type",
  flex: "Flex",
  pinned: "Pinned",
  tasks: "Tasks",
  actualEnd: "Actual End",
  actualDuration:
    "Actual Duration"
};

const TASK_PROPERTY_NAMES = {
  status: "Status"
};

const BLOCK_COMPLETE_STATUS =
  "Done";

const FALLBACK_TASK_STATUS_OPTIONS = [
  "Not started",
  "In progress",
  "Changes requested",
  "Waiting on Review",
  "Skipped",
  "Done"
];

/* =========================================================
   Date helpers
   ========================================================= */

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

  if (
    /^\d{4}-\d{2}-\d{2}$/.test(
      normalized
    )
  ) {
    return normalized;
  }

  return getTodayKey();
}

function parseDate(value) {
  if (!value) {
    return null;
  }

  const date =
    new Date(value);

  return Number.isNaN(
    date.getTime()
  )
    ? null
    : date;
}

function addMinutes(
  date,
  minutes
) {
  return new Date(
    date.getTime() +
      minutes * 60 * 1000
  );
}

function getMinutesBetween(
  start,
  end
) {
  if (!start || !end) {
    return 0;
  }

  return Math.max(
    0,
    Math.round(
      (
        end.getTime() -
        start.getTime()
      ) /
        (60 * 1000)
    )
  );
}

/* =========================================================
   Request helpers
   ========================================================= */

function getRequestBody(
  request
) {
  if (
    request.body &&
    typeof request.body ===
      "object"
  ) {
    return request.body;
  }

  if (
    typeof request.body ===
    "string"
  ) {
    try {
      return JSON.parse(
        request.body
      );
    } catch {
      throw new Error(
        "The request body is not valid JSON."
      );
    }
  }

  return {};
}

function requireText(
  value,
  fieldName
) {
  const normalized =
    String(value || "")
      .trim();

  if (!normalized) {
    throw new Error(
      `${fieldName} is required.`
    );
  }

  return normalized;
}

function requireAllowedNumber(
  value,
  allowed,
  fieldName
) {
  const number =
    Number(value);

  if (
    !Number.isFinite(number) ||
    !allowed.includes(number)
  ) {
    throw new Error(
      `${fieldName} must be one of: ${allowed.join(", ")}.`
    );
  }

  return number;
}

/* =========================================================
   Notion property readers
   ========================================================= */

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
      TASK_PROPERTY_NAMES.status
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

/* =========================================================
   Dynamic task status options
   ========================================================= */

async function getTaskStatusOptions() {
  try {
    const dataSource =
      await retrieveNotionDataSource(
        TASKS_DATA_SOURCE_ID
      );

    const statusProperty =
      dataSource.properties?.[
        TASK_PROPERTY_NAMES.status
      ];

    const options =
      statusProperty?.status?.options ||
      [];

    const optionNames =
      options
        .map(
          (option) =>
            option?.name
        )
        .filter(Boolean);

    return optionNames.length > 0
      ? optionNames
      : FALLBACK_TASK_STATUS_OPTIONS;
  } catch (error) {
    console.error(
      "Could not load live Task status options:",
      error
    );

    return FALLBACK_TASK_STATUS_OPTIONS;
  }
}

/* =========================================================
   Normalization
   ========================================================= */

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

  const actualEnd =
    getDateValue(
      properties[
        PROPERTY_NAMES.actualEnd
      ]
    );

  const actualDuration =
    getNumberValue(
      properties[
        PROPERTY_NAMES.actualDuration
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

    order:
      getNumberValue(
        properties[
          PROPERTY_NAMES.order
        ]
      ),

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

    pinned:
      getCheckboxValue(
        properties[
          PROPERTY_NAMES.pinned
        ]
      ),

    actualEnd,
    actualDuration,

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

function compareBlocks(
  first,
  second
) {
  if (
    typeof first.order ===
      "number" &&
    typeof second.order ===
      "number" &&
    first.order !==
      second.order
  ) {
    return (
      first.order -
      second.order
    );
  }

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

/* =========================================================
   Schedule loading
   ========================================================= */

async function loadBlocksForDate(
  date
) {
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

  return (
    await Promise.all(
      pages.map(
        normalizeTimeBlock
      )
    )
  ).sort(
    compareBlocks
  );
}

function findBlockIndex(
  blocks,
  blockId
) {
  return blocks.findIndex(
    (block) =>
      block.id === blockId
  );
}

/* =========================================================
   Notion write helpers
   ========================================================= */

async function updateBlock(
  blockId,
  properties
) {
  return updateNotionPage(
    blockId,
    properties
  );
}

async function updateBlockStart(
  blockId,
  start
) {
  return updateBlock(
    blockId,
    {
      [PROPERTY_NAMES.start]: {
        date: {
          start:
            start.toISOString()
        }
      }
    }
  );
}

async function updateTaskStatus(
  taskId,
  status
) {
  const taskStatusOptions =
    await getTaskStatusOptions();

  if (
    !taskStatusOptions.includes(
      status
    )
  ) {
    throw new Error(
      `Task status must be one of: ${taskStatusOptions.join(", ")}.`
    );
  }

  await updateNotionPage(
    taskId,
    {
      [TASK_PROPERTY_NAMES.status]: {
        status: {
          name: status
        }
      }
    }
  );

  const updatedPage =
    await retrieveNotionPage(
      taskId
    );

  return {
    id:
      updatedPage.id,

    title:
      getPageTitle(
        updatedPage
      ),

    status:
      getPageStatus(
        updatedPage
      ),

    url:
      updatedPage.url ||
      null
  };
}

/* =========================================================
   Flexible shifting
   ========================================================= */

function buildShiftPlan({
  blocks,
  firstIndex,
  deltaMinutes
}) {
  const plan = [];

  if (
    !Number.isFinite(
      deltaMinutes
    ) ||
    deltaMinutes === 0
  ) {
    return plan;
  }

  let previousProjectedEnd =
    null;

  for (
    let index = firstIndex;
    index < blocks.length;
    index += 1
  ) {
    const block =
      blocks[index];

    const start =
      parseDate(
        block.start
      );

    const end =
      parseDate(
        block.end
      );

    if (!start || !end) {
      continue;
    }

    if (block.pinned) {
      if (
        previousProjectedEnd &&
        previousProjectedEnd >
          start
      ) {
        const overlapMinutes =
          Math.ceil(
            (
              previousProjectedEnd
                .getTime() -
              start.getTime()
            ) /
              (60 * 1000)
          );

        throw new Error(
          `That change would overlap the pinned block “${block.title}” by ${overlapMinutes} minute${overlapMinutes === 1 ? "" : "s"}.`
        );
      }

      break;
    }

    if (!block.flex) {
      break;
    }

    const shiftedStart =
      addMinutes(
        start,
        deltaMinutes
      );

    const shiftedEnd =
      addMinutes(
        end,
        deltaMinutes
      );

    plan.push({
      block,
      shiftedStart,
      shiftedEnd
    });

    previousProjectedEnd =
      shiftedEnd;
  }

  return plan;
}

async function applyShiftPlan(
  plan
) {
  for (const item of plan) {
    await updateBlockStart(
      item.block.id,
      item.shiftedStart
    );
  }
}

/* =========================================================
   Actions
   ========================================================= */

async function handleCompleteBlock({
  blockId,
  date
}) {
  const blocks =
    await loadBlocksForDate(
      date
    );

  const index =
    findBlockIndex(
      blocks,
      blockId
    );

  if (index < 0) {
    throw new Error(
      "The selected time block could not be found."
    );
  }

  const block =
    blocks[index];

  const start =
    parseDate(
      block.start
    );

  const now =
    new Date();

  const actualDuration =
    start
      ? getMinutesBetween(
          start,
          now
        )
      : null;

  const properties = {
    [PROPERTY_NAMES.status]: {
      status: {
        name:
          BLOCK_COMPLETE_STATUS
      }
    },

    [PROPERTY_NAMES.actualEnd]: {
      date: {
        start:
          now.toISOString()
      }
    }
  };

  if (
    actualDuration !== null
  ) {
    properties[
      PROPERTY_NAMES.actualDuration
    ] = {
      number:
        actualDuration
    };
  }
  await updateBlock(
    blockId,
    properties
  );

  return {
    action:
      "complete-block",

    blockId,

    actualEnd:
      now.toISOString(),

    actualDuration
  };
}

async function handleEndEarly({
  blockId,
  date
}) {
  const blocks =
    await loadBlocksForDate(
      date
    );

  const index =
    findBlockIndex(
      blocks,
      blockId
    );

  if (index < 0) {
    throw new Error(
      "The selected time block could not be found."
    );
  }

  const block =
    blocks[index];

  const start =
    parseDate(
      block.start
    );

  if (!start) {
    throw new Error(
      "This time block does not have a valid start time."
    );
  }

  const now =
    new Date();

  const actualDuration =
    getMinutesBetween(
      start,
      now
    );

  await updateBlock(
    blockId,
    {
      [PROPERTY_NAMES.duration]: {
        number:
          actualDuration
      },

      [PROPERTY_NAMES.status]: {
        status: {
          name:
            BLOCK_COMPLETE_STATUS
        }
      },

      [PROPERTY_NAMES.actualEnd]: {
        date: {
          start:
            now.toISOString()
        }
      },

      [PROPERTY_NAMES.actualDuration]: {
        number:
          actualDuration
      }
    }
  );

  const nextIndex =
    index + 1;

  const nextBlock =
    blocks[nextIndex];

  let shiftedBlocks = [];

  if (
    nextBlock &&
    nextBlock.flex &&
    !nextBlock.pinned
  ) {
    const nextStart =
      parseDate(
        nextBlock.start
      );

    if (nextStart) {
      const deltaMinutes =
        Math.round(
          (
            now.getTime() -
            nextStart.getTime()
          ) /
            (60 * 1000)
        );

      const plan =
        buildShiftPlan({
          blocks,
          firstIndex:
            nextIndex,
          deltaMinutes
        });

      await applyShiftPlan(
        plan
      );

      shiftedBlocks =
        plan.map(
          (item) => ({
            id:
              item.block.id,

            title:
              item.block.title,

            start:
              item.shiftedStart
                .toISOString()
          })
        );
    }
  }

  return {
    action:
      "end-early",

    blockId,

    actualEnd:
      now.toISOString(),

    actualDuration,

    shiftedBlocks
  };
}

async function handleExtendBlock({
  blockId,
  date,
  minutes
}) {
  const extensionMinutes =
    requireAllowedNumber(
      minutes,
      [5, 10, 15],
      "minutes"
    );

  const blocks =
    await loadBlocksForDate(
      date
    );

  const index =
    findBlockIndex(
      blocks,
      blockId
    );

  if (index < 0) {
    throw new Error(
      "The selected time block could not be found."
    );
  }

  const block =
    blocks[index];

  const currentDuration =
    Number(
      block.duration
    );

  if (
    !Number.isFinite(
      currentDuration
    )
  ) {
    throw new Error(
      "This time block does not have a valid duration."
    );
  }

  const shiftPlan =
    buildShiftPlan({
      blocks,
      firstIndex:
        index + 1,
      deltaMinutes:
        extensionMinutes
    });

  await updateBlock(
    blockId,
    {
      [PROPERTY_NAMES.duration]: {
        number:
          currentDuration +
          extensionMinutes
      }
    }
  );

  await applyShiftPlan(
    shiftPlan
  );

  return {
    action:
      "extend-block",

    blockId,

    addedMinutes:
      extensionMinutes,

    duration:
      currentDuration +
      extensionMinutes,

    shiftedBlocks:
      shiftPlan.map(
        (item) => ({
          id:
            item.block.id,

          title:
            item.block.title,

          start:
            item.shiftedStart
              .toISOString()
        })
      )
  };
}

/* =========================================================
   GET
   ========================================================= */

async function handleGet(
  request,
  response
) {
  const date =
    getRequestedDate(
      request
    );

  const [
    blocks,
    taskStatusOptions
  ] =
    await Promise.all([
      loadBlocksForDate(
        date
      ),

      getTaskStatusOptions()
    ]);

  return response
    .status(200)
    .json({
      success: true,

      date,

      count:
        blocks.length,

      taskStatusOptions,

      blocks
    });
}

/* =========================================================
   PATCH
   ========================================================= */

async function handlePatch(
  request,
  response
) {
  const body =
    getRequestBody(
      request
    );

  const action =
    requireText(
      body.action,
      "action"
    );

  const date =
    /^\d{4}-\d{2}-\d{2}$/.test(
      String(
        body.date || ""
      )
    )
      ? String(body.date)
      : getTodayKey();

  let result;

  if (
    action ===
    "update-task-status"
  ) {
    const taskId =
      requireText(
        body.taskId,
        "taskId"
      );

    const status =
      requireText(
        body.status,
        "status"
      );

    result = {
      action,

      task:
        await updateTaskStatus(
          taskId,
          status
        )
    };
  } else if (
    action ===
    "complete-block"
  ) {
    const blockId =
      requireText(
        body.blockId,
        "blockId"
      );

    result =
      await handleCompleteBlock({
        blockId,
        date
      });
  } else if (
    action ===
    "end-early"
  ) {
    const blockId =
      requireText(
        body.blockId,
        "blockId"
      );

    result =
      await handleEndEarly({
        blockId,
        date
      });
  } else if (
    action ===
    "extend-block"
  ) {
    const blockId =
      requireText(
        body.blockId,
        "blockId"
      );

    result =
      await handleExtendBlock({
        blockId,
        date,
        minutes:
          body.minutes
      });
  } else {
    return response
      .status(400)
      .json({
        success: false,

        error:
          "Time Block action not found.",

        availableActions: [
          "update-task-status",
          "complete-block",
          "end-early",
          "extend-block"
        ]
      });
  }

  const [
    blocks,
    taskStatusOptions
  ] =
    await Promise.all([
      loadBlocksForDate(
        date
      ),

      getTaskStatusOptions()
    ]);

  return response
    .status(200)
    .json({
      success: true,
      date,
      result,
      count:
        blocks.length,
      taskStatusOptions,
      blocks
    });
}

/* =========================================================
   Main handler
   ========================================================= */

export default async function handler(
  request,
  response
) {
  if (
    request.method !== "GET" &&
    request.method !== "PATCH"
  ) {
    response.setHeader(
      "Allow",
      "GET, PATCH"
    );

    return response
      .status(405)
      .json({
        success: false,
        error:
          "Method not allowed"
      });
  }

  try {
    if (
      request.method ===
      "PATCH"
    ) {
      return await handlePatch(
        request,
        response
      );
    }

    return await handleGet(
      request,
      response
    );
  } catch (error) {
    console.error(
      "Time Blocks API error:",
      error
    );

    return response
      .status(500)
      .json({
        success: false,

        error:
          error?.message ||
          "Time Block data could not be updated"
      });
  }
}
