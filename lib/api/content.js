/* =========================================================
   MICHAELA OS
   Work Content API
   Powered by Tasks
   ========================================================= */

import {
  queryTaskEntries
} from "../notion-tasks.js";

import {
  isWorkTask,
  normalizeValue,
  parseWorkTask
} from "../notion-work-parser.js";

import {
  getTodayWorkflow
} from "../notion-today-workflow.js";

import {
  getApprovalSummary
} from "../notion-approval-summary.js";

/* =========================================================
   CLIENT DELIVERABLE SETTINGS
   ========================================================= */

const CONTENT_TYPES = {
  email: "email",
  text: "text"
};

const SENT_STATUS =
  "sent";

/* =========================================================
   BASIC HELPERS
   ========================================================= */

function isExactValue(
  actualValue,
  expectedValue
) {
  return (
    normalizeValue(
      actualValue
    ) ===
    normalizeValue(
      expectedValue
    )
  );
}

function getRequestedMonth(
  request
) {
  const now =
    new Date();

  const queryYear =
    Number(
      request.query?.year
    );

  const queryMonth =
    Number(
      request.query?.month
    );

  const year =
    Number.isInteger(
      queryYear
    ) &&
    queryYear >= 2000
      ? queryYear
      : now.getFullYear();

  const month =
    Number.isInteger(
      queryMonth
    ) &&
    queryMonth >= 1 &&
    queryMonth <= 12
      ? queryMonth
      : now.getMonth() + 1;

  return {
    year,
    month
  };
}

function dateBelongsToMonth(
  dateString,
  year,
  month
) {
  if (!dateString) {
    return false;
  }

  const expectedMonth =
    String(
      month
    ).padStart(
      2,
      "0"
    );

  const expectedPrefix =
    `${year}-${expectedMonth}`;

  return String(
    dateString
  ).startsWith(
    expectedPrefix
  );
}

function createClientSummary(
  clientName
) {
  return {
    client:
      clientName,

    emails: {
      sent: 0,
      owed: 0
    },

    texts: {
      sent: 0,
      owed: 0
    }
  };
}

function sortClients(
  first,
  second
) {
  return String(
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
}

function setNoCacheHeaders(
  response
) {
  response.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate"
  );

  response.setHeader(
    "Pragma",
    "no-cache"
  );

  response.setHeader(
    "Expires",
    "0"
  );
}

/* =========================================================
   CLIENT DELIVERABLE SUMMARY
   ========================================================= */

/*
 * Preserves the existing Client Deliverables widget:
 *
 * - one row per client
 * - Email sent/owed count
 * - Text sent/owed count
 * - selected month support
 *
 * Tasks are included when:
 *
 * - Area = Work
 * - Client is filled
 * - Type = Email or Text
 * - Due belongs to the selected month
 *
 * Only Status = Sent counts as sent.
 */
async function handleContentSummary(
  request,
  response
) {
  const {
    year,
    month
  } = getRequestedMonth(
    request
  );

  const pages =
    await queryTaskEntries();

  const tasks =
    pages
      .map(
        parseWorkTask
      )
      .filter(
        isWorkTask
      );

  const clientMap =
    new Map();

  for (
    const task
    of tasks
  ) {
    const clientName =
      String(
        task.client || ""
      ).trim();

    const dueDate =
      task.sendDate ||
      task.draftDate ||
      "";

    const contentType =
      normalizeValue(
        task.contentType
      );

    const status =
      normalizeValue(
        task.status
      );

    /*
     * parseWorkTask uses "—" when Client is empty so
     * the visual widgets have a safe fallback.
     *
     * For the monthly client summary, those tasks should
     * not create a fake client row.
     */
    if (
      !clientName ||
      clientName === "—"
    ) {
      continue;
    }

    if (
      !dateBelongsToMonth(
        dueDate,
        year,
        month
      )
    ) {
      continue;
    }

    const isEmail =
      isExactValue(
        contentType,
        CONTENT_TYPES.email
      );

    const isText =
      isExactValue(
        contentType,
        CONTENT_TYPES.text
      );

    if (
      !isEmail &&
      !isText
    ) {
      continue;
    }

    if (
      !clientMap.has(
        clientName
      )
    ) {
      clientMap.set(
        clientName,
        createClientSummary(
          clientName
        )
      );
    }

    const clientSummary =
      clientMap.get(
        clientName
      );

    const deliverableSummary =
      isEmail
        ? clientSummary.emails
        : clientSummary.texts;

    deliverableSummary.owed +=
      1;

    if (
      isExactValue(
        status,
        SENT_STATUS
      )
    ) {
      deliverableSummary.sent +=
        1;
    }
  }

  const clients =
    Array.from(
      clientMap.values()
    ).sort(
      sortClients
    );

  const monthLabel =
    new Intl.DateTimeFormat(
      "en-US",
      {
        month:
          "long",

        year:
          "numeric",

        timeZone:
          "UTC"
      }
    ).format(
      new Date(
        Date.UTC(
          year,
          month - 1,
          1
        )
      )
    );

  setNoCacheHeaders(
    response
  );

  return response
    .status(200)
    .json({
      success: true,
      year,
      month,
      monthLabel,
      clients
    });
}

/* =========================================================
   TODAY’S WORKFLOW
   ========================================================= */

async function handleTodayWorkflow(
  response
) {
  const workflow =
    await getTodayWorkflow();

  setNoCacheHeaders(
    response
  );

  return response
    .status(200)
    .json(
      workflow
    );
}

/* =========================================================
   APPROVAL SUMMARY
   ========================================================= */

async function handleApprovalSummary(
  response
) {
  const approvalSummary =
    await getApprovalSummary();

  setNoCacheHeaders(
    response
  );

  return response
    .status(200)
    .json(
      approvalSummary
    );
}

/* =========================================================
   ROUTE HANDLER
   ========================================================= */

export default async function handler(
  request,
  response
) {
  if (
    request.method !==
    "GET"
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
          "Method not allowed."
      });
  }

  const route =
    String(
      request.query?.route ||
      ""
    )
      .trim()
      .toLowerCase();

  try {
    switch (
      route
    ) {
      case "content-summary":
        return await handleContentSummary(
          request,
          response
        );

      case "today-workflow":
        return await handleTodayWorkflow(
          response
        );

      case "approval-summary":
        return await handleApprovalSummary(
          response
        );

      default:
        return response
          .status(404)
          .json({
            success: false,
            error:
              "API route not found."
          });
    }
  } catch (
    error
  ) {
    console.error(
      `Content API error for route "${route}":`,
      error
    );

    const errorMessages = {
      "content-summary":
        "Content summary could not be loaded.",

      "today-workflow":
        "Unable to load today's workflow.",

      "approval-summary":
        "Unable to load the approval summary."
    };

    return response
      .status(500)
      .json({
        success: false,

        error:
          errorMessages[
            route
          ] ||
          "Unable to load work data.",

        details:
          error instanceof Error
            ? error.message
            : String(
                error
              )
      });
  }
}
