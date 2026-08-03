/* =========================================================
   MICHAELA OS
   Tasks → Work Widget Parser
   ========================================================= */

const PROPERTY_NAMES = {
  title: "Task",
  client: "Client",
  status: "Status",
  due: "Due",
  area: "Area",
  type: "Type",
  priority: "Priority",
  url: "URL"
};

const WORK_AREA = "Work";

export const WORK_STATUSES = {
  drafting: [
    "todo",
    "doing",
    "drafting"
  ],

  internalReview:
    "internal review",

  clientReview:
    "client review",

  revisions:
    "revisions",

  approved:
    "approved",

  readyToSchedule:
    "ready to schedule",

  scheduled:
    "scheduled",

  completed: [
    "sent",
    "done"
  ]
};

/* =========================================================
   BASIC HELPERS
   ========================================================= */

export function normalizeValue(
  value
) {
  return String(
    value ?? ""
  )
    .trim()
    .toLocaleLowerCase(
      "en-US"
    );
}

function findProperty(
  properties,
  propertyName
) {
  if (
    !properties ||
    !propertyName
  ) {
    return null;
  }

  if (
    properties[propertyName]
  ) {
    return properties[
      propertyName
    ];
  }

  const normalizedTarget =
    normalizeValue(
      propertyName
    );

  const matchingKey =
    Object.keys(
      properties
    ).find(
      (key) =>
        normalizeValue(
          key
        ) ===
        normalizedTarget
    );

  return matchingKey
    ? properties[
        matchingKey
      ]
    : null;
}

function richTextToPlainText(
  items = []
) {
  if (
    !Array.isArray(items)
  ) {
    return "";
  }

  return items
    .map(
      (item) =>
        item?.plain_text ||
        item?.text?.content ||
        ""
    )
    .join("")
    .trim();
}

/* =========================================================
   PROPERTY READERS
   ========================================================= */

export function getPropertyText(
  property
) {
  if (!property) {
    return "";
  }

  if (
    property.type ===
    "title"
  ) {
    return richTextToPlainText(
      property.title
    );
  }

  if (
    property.type ===
    "rich_text"
  ) {
    return richTextToPlainText(
      property.rich_text
    );
  }

  if (
    property.type ===
    "select"
  ) {
    return (
      property.select?.name ||
      ""
    );
  }

  if (
    property.type ===
    "status"
  ) {
    return (
      property.status?.name ||
      ""
    );
  }

  if (
    property.type ===
    "multi_select"
  ) {
    return (
      property.multi_select
        ?.map(
          (option) =>
            option?.name || ""
        )
        .filter(Boolean)
        .join(", ") || ""
    );
  }

  if (
    property.type ===
    "url"
  ) {
    return (
      property.url || ""
    );
  }

  if (
    property.type ===
    "formula"
  ) {
    const formula =
      property.formula;

    if (
      formula?.type ===
      "string"
    ) {
      return (
        formula.string || ""
      );
    }

    if (
      formula?.type ===
      "number"
    ) {
      return String(
        formula.number ?? ""
      );
    }

    if (
      formula?.type ===
      "boolean"
    ) {
      return formula.boolean
        ? "Yes"
        : "No";
    }
  }

  return "";
}

export function getPropertyDate(
  property
) {
  if (!property) {
    return null;
  }

  if (
    property.type ===
      "date" &&
    property.date?.start
  ) {
    return (
      property.date.start
    );
  }

  if (
    property.type ===
      "formula" &&
    property.formula?.type ===
      "date" &&
    property.formula.date
      ?.start
  ) {
    return (
      property.formula.date
        .start
    );
  }

  return null;
}

/* =========================================================
   DATE HELPERS
   ========================================================= */

export function getEasternDateString(
  date = new Date()
) {
  const parts =
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone:
          "America/New_York",

        year:
          "numeric",

        month:
          "2-digit",

        day:
          "2-digit"
      }
    ).formatToParts(
      date
    );

  const values =
    Object.fromEntries(
      parts.map(
        (part) => [
          part.type,
          part.value
        ]
      )
    );

  return `${values.year}-${values.month}-${values.day}`;
}

export function getDisplayDate(
  date = new Date()
) {
  return new Intl.DateTimeFormat(
    "en-US",
    {
      timeZone:
        "America/New_York",

      weekday:
        "long",

      month:
        "long",

      day:
        "numeric"
    }
  ).format(date);
}

/* =========================================================
   TASK PARSER
   ========================================================= */

/*
 * Converts a Tasks database page into the exact object
 * shape already expected by the existing work widgets.
 */
export function parseWorkTask(
  page
) {
  const properties =
    page?.properties || {};

  const title =
    getPropertyText(
      findProperty(
        properties,
        PROPERTY_NAMES.title
      )
    );

  const client =
    getPropertyText(
      findProperty(
        properties,
        PROPERTY_NAMES.client
      )
    );

  const status =
    getPropertyText(
      findProperty(
        properties,
        PROPERTY_NAMES.status
      )
    );

  const due =
    getPropertyDate(
      findProperty(
        properties,
        PROPERTY_NAMES.due
      )
    );

  const area =
    getPropertyText(
      findProperty(
        properties,
        PROPERTY_NAMES.area
      )
    );

  const type =
    getPropertyText(
      findProperty(
        properties,
        PROPERTY_NAMES.type
      )
    );

  const priority =
    getPropertyText(
      findProperty(
        properties,
        PROPERTY_NAMES.priority
      )
    );

  const externalUrl =
    getPropertyText(
      findProperty(
        properties,
        PROPERTY_NAMES.url
      )
    );

  return {
    id:
      page?.id || "",

    client:
      client || "—",

    contentType:
      type || "Task",

    topic:
      title || "Untitled",

    /*
     * The old widgets expect both draftDate and sendDate.
     * Tasks only has Due, so we intentionally map Due to both.
     */
    draftDate:
      due,

    sendDate:
      due,

    status,

    area,

    priority,

    /*
     * Existing widgets open notionUrl when clicked.
     * Prefer the task's custom URL when one exists,
     * otherwise open the Notion task page.
     */
    notionUrl:
      externalUrl ||
      page?.url ||
      "",

    taskUrl:
      page?.url || "",

    externalUrl:
      externalUrl || ""
  };
}

/* =========================================================
   WORK FILTERS
   ========================================================= */

export function isWorkTask(
  item
) {
  return (
    normalizeValue(
      item?.area
    ) ===
    normalizeValue(
      WORK_AREA
    )
  );
}

export function isCompletedStatus(
  status
) {
  const normalizedStatus =
    normalizeValue(
      status
    );

  return WORK_STATUSES.completed.includes(
    normalizedStatus
  );
}

export function isDraftingStatus(
  status
) {
  const normalizedStatus =
    normalizeValue(
      status
    );

  return WORK_STATUSES.drafting.includes(
    normalizedStatus
  );
}

/* =========================================================
   SORTING
   ========================================================= */

const PRIORITY_ORDER = {
  urgent: 0,
  high: 1,
  medium: 2,
  normal: 2,
  low: 3
};

function getSortDate(
  item
) {
  return (
    item?.draftDate
      ?.slice(0, 10) ||
    item?.sendDate
      ?.slice(0, 10) ||
    "9999-12-31"
  );
}

function getPriorityRank(
  priority
) {
  const normalizedPriority =
    normalizeValue(
      priority
    );

  return (
    PRIORITY_ORDER[
      normalizedPriority
    ] ?? 99
  );
}

export function sortWorkItems(
  items = []
) {
  return [
    ...items
  ].sort(
    (
      first,
      second
    ) => {
      /*
       * Oldest overdue work appears first.
       */
      const dateComparison =
        getSortDate(
          first
        ).localeCompare(
          getSortDate(
            second
          )
        );

      if (
        dateComparison !== 0
      ) {
        return dateComparison;
      }

      /*
       * Higher-priority tasks appear first when dates match.
       */
      const priorityComparison =
        getPriorityRank(
          first.priority
        ) -
        getPriorityRank(
          second.priority
        );

      if (
        priorityComparison !==
        0
      ) {
        return priorityComparison;
      }

      const clientComparison =
        String(
          first.client
        ).localeCompare(
          String(
            second.client
          ),
          "en-US",
          {
            numeric: true,
            sensitivity:
              "base"
          }
        );

      if (
        clientComparison !==
        0
      ) {
        return clientComparison;
      }

      const typeComparison =
        String(
          first.contentType
        ).localeCompare(
          String(
            second.contentType
          ),
          "en-US",
          {
            sensitivity:
              "base"
          }
        );

      if (
        typeComparison !==
        0
      ) {
        return typeComparison;
      }

      return String(
        first.topic
      ).localeCompare(
        String(
          second.topic
        ),
        "en-US",
        {
          sensitivity:
            "base"
        }
      );
    }
  );
}
