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
  queueState: "Queue State",
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

const QUEUE_STATES = {
  UPCOMING: "Upcoming",
  CURRENT: "Current",
  COMPLETE: "Complete"
};

const FALLBACK_TASK_STATUS_OPTIONS = [
  "Todo",
  "Doing",
  "Drafting",
  "Drafted",
  "Internal Review",
  "Client Review",
  "Approved",
  "Revisions",
  "Ready to Schedule",
  "Scheduled",
  "Scrapped",
  "Sent",
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

function getOptionalNumber(
  value
) {
  const number =
    Number(value);

  return Number.isFinite(number)
    ? number
    : null;
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

    const groups =
      statusProperty
        ?.status
        ?.groups || [];

    const options =
      groups.flatMap(
        (group) =>
          group?.option_ids || []
      );

    const rawOptions =
      statusProperty
        ?.status
        ?.options || [];

    const optionNames =
      rawOptions
        .filter(
          (option) =>
            options.length === 0 ||
            options.includes(
              option.id
            )
        )
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
   Task normalization
   ========================================================= */

function isTaskComplete(
  status
) {
  const normalized =
    String(status || "")
      .trim()
      .toLowerCase();

  return [
    "scheduled",
    "sent",
    "done",
    "scrapped",
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

/* =========================================================
   Time block normalization
   ========================================================= */

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

    queueState:
      getStatusValue(
        properties[
          PROPERTY_NAMES.queueState
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
  const firstOrder =
    Number(first.order);

  const secondOrder =
    Number(second.order);

  if (
    Number.isFinite(firstOrder) &&
    Number.isFinite(secondOrder)
  ) {
    return (
      firstOrder -
      secondOrder
    );
  }

  if (
    Number.isFinite(firstOrder)
  ) {
    return -1;
  }

  if (
    Number.isFinite(secondOrder)
  ) {
    return 1;
  }

  return first.title.localeCompare(
    second.title
  );
}

/* =========================================================
   Loading
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
            PROPERTY_NAMES.order,

          direction:
            "ascending"
        }
      ]
    });

  const normalized =
    await Promise.all(
      pages.map(
        normalizeTimeBlock
      )
    );

  return normalized.sort(
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

function getCurrentBlock(
  blocks
) {
  return (
    blocks.find(
      (block) =>
        block.queueState ===
        QUEUE_STATES.CURRENT
    ) || null
  );
}

function getUpcomingBlocks(
  blocks
) {
  return blocks.filter(
    (block) =>
      block.queueState ===
      QUEUE_STATES.UPCOMING
  );
}

function getNextUpcomingBlock(
  blocks
) {
  return (
    getUpcomingBlocks(
      blocks
    )[0] || null
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

async function updateQueueState(
  blockId,
  queueState
) {
  return updateBlock(
    blockId,
    {
      [PROPERTY_NAMES.queueState]: {
        status: {
          name:
            queueState
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
   Queue actions
   ========================================================= */

async function handleActivateBlock({
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

  const now =
    new Date();

  const currentBlocks =
    blocks.filter(
      (block) =>
        block.queueState ===
        QUEUE_STATES.CURRENT &&
        block.id !== blockId
    );

  for (
    const currentBlock of
    currentBlocks
  ) {
    await updateQueueState(
      currentBlock.id,
      QUEUE_STATES.UPCOMING
    );
  }

  await updateBlock(
    blockId,
    {
      [PROPERTY_NAMES.queueState]: {
        status: {
          name:
            QUEUE_STATES.CURRENT
        }
      },

      [PROPERTY_NAMES.start]: {
        date: {
          start:
            now.toISOString()
        }
      },

      [PROPERTY_NAMES.actualEnd]: {
        date: null
      },

      [PROPERTY_NAMES.actualDuration]: {
        number: null
      }
    }
  );

  return {
    action:
      "activate-block",

    blockId,

    actualStart:
      now.toISOString()
  };
}

async function handleCompleteBlock({
  blockId,
  date,
  actualDuration
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

  const now =
    new Date();

  const duration =
    getOptionalNumber(
      actualDuration
    );

  const properties = {
    [PROPERTY_NAMES.queueState]: {
      status: {
        name:
          QUEUE_STATES.COMPLETE
      }
    },

    [PROPERTY_NAMES.actualEnd]: {
      date: {
        start:
          now.toISOString()
      }
    }
  };

  if (duration !== null) {
    properties[
      PROPERTY_NAMES.actualDuration
    ] = {
      number:
        Math.max(
          0,
          Math.round(
            duration
          )
        )
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

    actualDuration:
      duration
  };
}

async function handleStartNextBlock({
  date
}) {
  const blocks =
    await loadBlocksForDate(
      date
    );

  const current =
    getCurrentBlock(
      blocks
    );

  const next =
    getNextUpcomingBlock(
      blocks
    );

  if (!next) {
    return {
      action:
        "start-next-block",

      currentBlockId:
        current?.id || null,

      nextBlockId:
        null,

      finished: true
    };
  }

  const now =
    new Date();

  if (current) {
    await updateQueueState(
      current.id,
      QUEUE_STATES.COMPLETE
    );
  }

  await updateBlock(
    next.id,
    {
      [PROPERTY_NAMES.queueState]: {
        status: {
          name:
            QUEUE_STATES.CURRENT
        }
      },

      [PROPERTY_NAMES.start]: {
        date: {
          start:
            now.toISOString()
        }
      },

      [PROPERTY_NAMES.actualEnd]: {
        date: null
      },

      [PROPERTY_NAMES.actualDuration]: {
        number: null
      }
    }
  );

  return {
    action:
      "start-next-block",

    currentBlockId:
      current?.id || null,

    nextBlockId:
      next.id,

    actualStart:
      now.toISOString(),

    finished: false
  };
}

async function handleResetQueue({
  date
}) {
  const blocks =
    await loadBlocksForDate(
      date
    );

  for (const block of blocks) {
    await updateBlock(
      block.id,
      {
        [PROPERTY_NAMES.queueState]: {
          status: {
            name:
              QUEUE_STATES.UPCOMING
          }
        },

        [PROPERTY_NAMES.actualEnd]: {
          date: null
        },

        [PROPERTY_NAMES.actualDuration]: {
          number: null
        }
      }
    );
  }

  return {
    action:
      "reset-queue",

    count:
      blocks.length
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

  const currentBlock =
    getCurrentBlock(
      blocks
    );

  const nextBlock =
    getNextUpcomingBlock(
      blocks
    );

  return response
    .status(200)
    .json({
      success: true,

      date,

      count:
        blocks.length,

      taskStatusOptions,

      currentBlock,

      nextBlock,

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
    "activate-block"
  ) {
    const blockId =
      requireText(
        body.blockId,
        "blockId"
      );

    result =
      await handleActivateBlock({
        blockId,
        date
      });
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
        date,
        actualDuration:
          body.actualDuration
      });
  } else if (
    action ===
    "start-next-block"
  ) {
    result =
      await handleStartNextBlock({
        date
      });
  } else if (
    action ===
    "reset-queue"
  ) {
    result =
      await handleResetQueue({
        date
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
          "activate-block",
          "complete-block",
          "start-next-block",
          "reset-queue"
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

      currentBlock:
        getCurrentBlock(
          blocks
        ),

      nextBlock:
        getNextUpcomingBlock(
          blocks
        ),

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
