import {
  queryDayTemplates,
  queryGeneratedTimeBlocks,
  createTimeBlock,
  trashNotionPage
} from "../notion-day-generator.js";

const TIME_ZONE =
  "America/New_York";

const TEMPLATE_PROPERTY_NAMES = {
  title: "Name",
  template: "Template",
  order: "Order",
  duration: "Duration",
  category: "Category",
  type: "Type",
  flex: "Flex",
  pinned: "Pinned",
  active: "Active",
  routineModule:
    "Routine Module"
};

const TIME_BLOCK_PROPERTY_NAMES = {
  title: "Name",
  order: "Order",
  day: "Day",
  start: "Start",
  duration: "Duration",
  status: "Status",
  category: "Category",
  type: "Type",
  flex: "Flex",
  pinned: "Pinned",
  routineModule:
    "Routine Module"
};

const DEFAULT_BLOCK_STATUS =
  "Not started";

/* =========================================================
   Request helpers
   ========================================================= */

function getRequestBody(request) {
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

function requireDateKey(value) {
  const date =
    requireText(
      value,
      "date"
    );

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      date
    )
  ) {
    throw new Error(
      "date must use YYYY-MM-DD format."
    );
  }

  return date;
}

function requireStartTime(value) {
  const normalized =
    requireText(
      value,
      "startTime"
    );

  const date =
    new Date(normalized);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    throw new Error(
      "startTime must be a valid date and time."
    );
  }

  return date;
}

function normalizeExistingMode(value) {
  const mode =
    String(
      value || "cancel"
    )
      .trim()
      .toLowerCase();

  const allowedModes = [
    "cancel",
    "replace",
    "append"
  ];

  if (
    !allowedModes.includes(
      mode
    )
  ) {
    throw new Error(
      "existingMode must be cancel, replace, or append."
    );
  }

  return mode;
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

function getTitleValue(
  property
) {
  return getPlainText(
    property?.title || []
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

function getCheckboxValue(
  property
) {
  return Boolean(
    property?.checkbox
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

function getFormulaDateValue(
  property
) {
  const formula =
    property?.formula;

  if (
    formula?.type !==
    "date"
  ) {
    return null;
  }

  return (
    formula.date?.start ||
    null
  );
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
   Template normalization
   ========================================================= */

function normalizeTemplateRow(page) {
  const properties =
    page?.properties || {};

  return {
    id:
      page.id,

    name:
      getTitleValue(
        properties[
          TEMPLATE_PROPERTY_NAMES.title
        ]
      ) ||
      "Untitled block",

    template:
      getSelectValue(
        properties[
          TEMPLATE_PROPERTY_NAMES.template
        ]
      ),

    order:
      getNumberValue(
        properties[
          TEMPLATE_PROPERTY_NAMES.order
        ]
      ),

    duration:
      getNumberValue(
        properties[
          TEMPLATE_PROPERTY_NAMES.duration
        ]
      ),

    category:
      getSelectValue(
        properties[
          TEMPLATE_PROPERTY_NAMES.category
        ]
      ),

    type:
      getSelectValue(
        properties[
          TEMPLATE_PROPERTY_NAMES.type
        ]
      ),

    flex:
      getCheckboxValue(
        properties[
          TEMPLATE_PROPERTY_NAMES.flex
        ]
      ),

    pinned:
      getCheckboxValue(
        properties[
          TEMPLATE_PROPERTY_NAMES.pinned
        ]
      ),

    active:
      getCheckboxValue(
        properties[
          TEMPLATE_PROPERTY_NAMES.active
        ]
      ),

    routineModuleIds:
      getRelationIds(
        properties[
          TEMPLATE_PROPERTY_NAMES
            .routineModule
        ]
      )
  };
}

function compareTemplateRows(
  first,
  second
) {
  const firstOrder =
    typeof first.order ===
      "number"
      ? first.order
      : Number.MAX_SAFE_INTEGER;

  const secondOrder =
    typeof second.order ===
      "number"
      ? second.order
      : Number.MAX_SAFE_INTEGER;

  return (
    firstOrder -
    secondOrder
  );
}

/* =========================================================
   Date and schedule helpers
   ========================================================= */

function addMinutes(
  date,
  minutes
) {
  return new Date(
    date.getTime() +
      minutes * 60 * 1000
  );
}

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

function getExistingBlockEnd(page) {
  const properties =
    page?.properties || {};

  const formulaEnd =
    getFormulaDateValue(
      properties.End
    );

  if (formulaEnd) {
    return new Date(
      formulaEnd
    );
  }

  const start =
    getDateValue(
      properties[
        TIME_BLOCK_PROPERTY_NAMES.start
      ]
    );

  const duration =
    getNumberValue(
      properties[
        TIME_BLOCK_PROPERTY_NAMES.duration
      ]
    );

  if (
    !start ||
    typeof duration !==
      "number"
  ) {
    return null;
  }

  return addMinutes(
    new Date(start),
    duration
  );
}

function findLatestExistingEnd(
  pages
) {
  let latestEnd =
    null;

  for (const page of pages) {
    const end =
      getExistingBlockEnd(
        page
      );

    if (
      end &&
      (
        !latestEnd ||
        end > latestEnd
      )
    ) {
      latestEnd =
        end;
    }
  }

  return latestEnd;
}

/* =========================================================
   Notion property builders
   ========================================================= */

function buildTitleProperty(
  title
) {
  return {
    title: [
      {
        type: "text",

        text: {
          content: title
        }
      }
    ]
  };
}

function buildDateProperty(date) {
  return {
    date: {
      start:
        date.toISOString()
    }
  };
}

function buildDayProperty(
  dateKey
) {
  return {
    date: {
      start:
        dateKey
    }
  };
}

function buildNumberProperty(
  value
) {
  return {
    number:
      Number(value)
  };
}

function buildStatusProperty(
  status
) {
  return {
    status: {
      name: status
    }
  };
}

function buildSelectProperty(
  value
) {
  return {
    select:
      value
        ? {
            name: value
          }
        : null
  };
}

function buildCheckboxProperty(
  value
) {
  return {
    checkbox:
      Boolean(value)
  };
}

function buildRelationProperty(
  ids
) {
  return {
    relation:
      ids.map(
        (id) => ({
          id
        })
      )
  };
}

function buildTimeBlockProperties({
  templateRow,
  dateKey,
  start,
  order
}) {
  const properties = {
    [TIME_BLOCK_PROPERTY_NAMES.title]:
      buildTitleProperty(
        templateRow.name
      ),

    [TIME_BLOCK_PROPERTY_NAMES.order]:
      buildNumberProperty(
        order
      ),

    [TIME_BLOCK_PROPERTY_NAMES.day]:
      buildDayProperty(
        dateKey
      ),

    [TIME_BLOCK_PROPERTY_NAMES.start]:
      buildDateProperty(
        start
      ),

    [TIME_BLOCK_PROPERTY_NAMES.duration]:
      buildNumberProperty(
        templateRow.duration
      ),

    [TIME_BLOCK_PROPERTY_NAMES.status]:
      buildStatusProperty(
        DEFAULT_BLOCK_STATUS
      ),

    [TIME_BLOCK_PROPERTY_NAMES.flex]:
      buildCheckboxProperty(
        templateRow.flex
      ),

    [TIME_BLOCK_PROPERTY_NAMES.pinned]:
      buildCheckboxProperty(
        templateRow.pinned
      )
  };

  if (
    templateRow.category
  ) {
    properties[
      TIME_BLOCK_PROPERTY_NAMES.category
    ] =
      buildSelectProperty(
        templateRow.category
      );
  }

  if (
    templateRow.type
  ) {
    properties[
      TIME_BLOCK_PROPERTY_NAMES.type
    ] =
      buildSelectProperty(
        templateRow.type
      );
  }

  if (
    templateRow
      .routineModuleIds
      .length > 0
  ) {
    properties[
      TIME_BLOCK_PROPERTY_NAMES
        .routineModule
    ] =
      buildRelationProperty(
        templateRow
          .routineModuleIds
      );
  }

  return properties;
}
/* =========================================================
   Template queries
   ========================================================= */

async function loadTemplateRows(
  templateName
) {
  const pages =
    await queryDayTemplates({
      filter: {
        and: [
          {
            property:
              TEMPLATE_PROPERTY_NAMES
                .template,

            select: {
              equals:
                templateName
            }
          },

          {
            property:
              TEMPLATE_PROPERTY_NAMES
                .active,

            checkbox: {
              equals: true
            }
          }
        ]
      },

      sorts: [
        {
          property:
            TEMPLATE_PROPERTY_NAMES
              .order,

          direction:
            "ascending"
        }
      ]
    });

  return pages
    .map(
      normalizeTemplateRow
    )
    .filter(
      (row) =>
        row.active &&
        typeof row.duration ===
          "number" &&
        row.duration > 0
    )
    .sort(
      compareTemplateRows
    );
}

async function loadTemplateNames() {
  const pages =
    await queryDayTemplates({
      filter: {
        property:
          TEMPLATE_PROPERTY_NAMES.active,

        checkbox: {
          equals: true
        }
      },

      sorts: [
        {
          property:
            TEMPLATE_PROPERTY_NAMES
              .template,

          direction:
            "ascending"
        }
      ]
    });

  const names =
    pages
      .map(
        (page) =>
          getSelectValue(
            page.properties?.[
              TEMPLATE_PROPERTY_NAMES
                .template
            ]
          )
      )
      .filter(Boolean);

  return [
    ...new Set(names)
  ];
}

async function loadExistingBlocks(
  dateKey
) {
  return queryGeneratedTimeBlocks({
    filter: {
      property:
        TIME_BLOCK_PROPERTY_NAMES.day,

      date: {
        equals:
          dateKey
      }
    },

    sorts: [
      {
        property:
          TIME_BLOCK_PROPERTY_NAMES.start,

        direction:
          "ascending"
      }
    ]
  });
}

/* =========================================================
   Generation
   ========================================================= */

async function replaceExistingBlocks(
  pages
) {
  for (const page of pages) {
    await trashNotionPage(
      page.id
    );
  }
}

async function generateSchedule({
  dateKey,
  templateName,
  requestedStart,
  existingMode
}) {
  const [
    templateRows,
    existingPages
  ] =
    await Promise.all([
      loadTemplateRows(
        templateName
      ),

      loadExistingBlocks(
        dateKey
      )
    ]);

  if (
    templateRows.length === 0
  ) {
    throw new Error(
      `No active blocks were found for the “${templateName}” template.`
    );
  }

  if (
    existingPages.length > 0 &&
    existingMode === "cancel"
  ) {
    return {
      generated: false,
      conflict: true,
      existingCount:
        existingPages.length,
      message:
        `${existingPages.length} time block${existingPages.length === 1 ? "" : "s"} already exist for ${dateKey}.`
    };
  }

  let scheduleStart =
    new Date(
      requestedStart
    );

  if (
    existingPages.length > 0 &&
    existingMode === "replace"
  ) {
    await replaceExistingBlocks(
      existingPages
    );
  }

  if (
    existingPages.length > 0 &&
    existingMode === "append"
  ) {
    const latestEnd =
      findLatestExistingEnd(
        existingPages
      );

    if (
      latestEnd &&
      latestEnd >
        scheduleStart
    ) {
      scheduleStart =
        latestEnd;
    }
  }

  const createdBlocks = [];

  let nextStart =
    new Date(
      scheduleStart
    );

  let generatedOrder =
    existingMode === "append"
      ? existingPages.length + 1
      : 1;

  for (
    const templateRow of
    templateRows
  ) {
    const properties =
      buildTimeBlockProperties({
        templateRow,
        dateKey,
        start:
          nextStart,
        order:
          generatedOrder
      });

    const createdPage =
      await createTimeBlock(
        properties
      );

    const end =
      addMinutes(
        nextStart,
        templateRow.duration
      );

    createdBlocks.push({
      id:
        createdPage.id,

      title:
        templateRow.name,

      order:
        generatedOrder,

      start:
        nextStart.toISOString(),

      end:
        end.toISOString(),

      duration:
        templateRow.duration,

      category:
        templateRow.category,

      routineModuleCount:
        templateRow
          .routineModuleIds
          .length
    });

    nextStart =
      end;

    generatedOrder += 1;
  }

  return {
    generated: true,
    conflict: false,

    template:
      templateName,

    date:
      dateKey,

    createdCount:
      createdBlocks.length,

    replacedCount:
      existingMode === "replace"
        ? existingPages.length
        : 0,

    start:
      scheduleStart.toISOString(),

    end:
      nextStart.toISOString(),

    blocks:
      createdBlocks
  };
}

/* =========================================================
   GET
   ========================================================= */

async function handleGet(
  request,
  response
) {
  const templateNames =
    await loadTemplateNames();

  return response
    .status(200)
    .json({
      success: true,
      templates:
        templateNames
    });
}

/* =========================================================
   POST
   ========================================================= */

async function handlePost(
  request,
  response
) {
  const body =
    getRequestBody(
      request
    );

  const dateKey =
    requireDateKey(
      body.date
    );

  const templateName =
    requireText(
      body.template,
      "template"
    );

  const requestedStart =
    requireStartTime(
      body.startTime
    );

  const startDateKey =
    getDateKey(
      requestedStart
    );

  if (
    startDateKey !==
    dateKey
  ) {
    throw new Error(
      "startTime must fall on the selected date."
    );
  }

  const existingMode =
    normalizeExistingMode(
      body.existingMode
    );

  const result =
    await generateSchedule({
      dateKey,
      templateName,
      requestedStart,
      existingMode
    });

  return response
    .status(200)
    .json({
      success: true,
      ...result
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
    request.method !== "POST"
  ) {
    response.setHeader(
      "Allow",
      "GET, POST"
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
      "POST"
    ) {
      return await handlePost(
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
      "Day Generator API error:",
      error
    );

    return response
      .status(500)
      .json({
        success: false,

        error:
          error?.message ||
          "The schedule could not be generated."
      });
  }
}
