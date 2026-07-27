/* =========================================================
   Michaela OS
   API Handler — Daily Wrap-Up
   ========================================================= */

import {
  createDailyWrapUpPage,
  queryDailyWrapUpById,
  updateDailyWrapUpPage
} from "./notion-daily-wrap-up.js";

/* =========================================================
   SETTINGS
   ========================================================= */

const TIME_ZONE =
  "America/New_York";

const ROLLOVER_HOUR =
  16;

const ROLLOVER_MINUTE =
  15;

const WRAP_UP_ID_PREFIX =
  "daily-wrap-up";

const MAX_EXTRA_REMINDERS =
  50;

const MAX_REFLECTION_LENGTH =
  5000;

const MAX_REMINDER_LENGTH =
  500;

/* =========================================================
   FIXED DAILY TASKS
   ========================================================= */

const FIXED_TASKS = [
  {
    id: "review-todays-tasks",
    label:
      "Review and update today’s tasks"
  },
  {
    id: "move-unfinished-work",
    label:
      "Move unfinished work to tomorrow"
  },
  {
    id: "update-team-content-tracker",
    label:
      "Update team content tracker"
  },
  {
    id: "update-client-content-trackers",
    label:
      "Update client content trackers"
  },
  {
    id: "bump-pending-reviews",
    label:
      "Bump any remaining pending reviews"
  },
  {
    id: "check-switchboard-numero",
    label:
      "Check Switchboard / Numero replies"
  },
  {
    id: "filter-messages-and-respond",
    label:
      "Filter emails + Signal and respond where needed"
  }
];

/* =========================================================
   GENERAL HELPERS
   ========================================================= */

function normalizeText(
  value,
  maximumLength = MAX_REFLECTION_LENGTH
) {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value)
    .replace(/\u0000/g, "")
    .slice(0, maximumLength);
}

function normalizeBoolean(value) {
  return value === true;
}

function clampNumber(
  value,
  minimum,
  maximum
) {
  const number =
    Number(value);

  if (!Number.isFinite(number)) {
    return minimum;
  }

  return Math.min(
    maximum,
    Math.max(minimum, number)
  );
}

function createSafeId(prefix = "item") {
  const randomPart =
    Math.random()
      .toString(36)
      .slice(2, 10);

  const timePart =
    Date.now()
      .toString(36);

  return `${prefix}-${timePart}-${randomPart}`;
}

/* =========================================================
   NEW YORK DATE AND ROLLOVER HELPERS
   ========================================================= */

/*
  Intl.DateTimeFormat gives us the current calendar date and
  clock time in America/New_York without requiring a date
  library. This automatically follows daylight-saving time.
*/

function getZonedDateTimeParts(
  date = new Date()
) {
  const formatter =
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone: TIME_ZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23"
      }
    );

  const parts =
    formatter.formatToParts(date);

  const values = {};

  for (const part of parts) {
    if (part.type !== "literal") {
      values[part.type] =
        part.value;
    }
  }

  return {
    year:
      Number(values.year),

    month:
      Number(values.month),

    day:
      Number(values.day),

    hour:
      Number(values.hour),

    minute:
      Number(values.minute),

    second:
      Number(values.second)
  };
}

function padDatePart(value) {
  return String(value)
    .padStart(2, "0");
}

function formatDateKey({
  year,
  month,
  day
}) {
  return [
    year,
    padDatePart(month),
    padDatePart(day)
  ].join("-");
}

/*
  Calendar arithmetic is performed with UTC values after the
  New York calendar date has already been determined. This
  avoids local server timezone differences.
*/

function shiftDateKey(
  dateKey,
  numberOfDays
) {
  const [
    year,
    month,
    day
  ] =
    String(dateKey)
      .split("-")
      .map(Number);

  const date =
    new Date(
      Date.UTC(
        year,
        month - 1,
        day
      )
    );

  date.setUTCDate(
    date.getUTCDate() +
      numberOfDays
  );

  return [
    date.getUTCFullYear(),
    padDatePart(
      date.getUTCMonth() + 1
    ),
    padDatePart(
      date.getUTCDate()
    )
  ].join("-");
}

function hasReachedRollover(parts) {
  if (
    parts.hour >
    ROLLOVER_HOUR
  ) {
    return true;
  }

  if (
    parts.hour <
    ROLLOVER_HOUR
  ) {
    return false;
  }

  return (
    parts.minute >=
    ROLLOVER_MINUTE
  );
}

function getActiveWrapUpPeriod(
  now = new Date()
) {
  const zonedParts =
    getZonedDateTimeParts(now);

  const currentNewYorkDate =
    formatDateKey(zonedParts);

  const rolloverReached =
    hasReachedRollover(
      zonedParts
    );

  const wrapUpDate =
    rolloverReached
      ? currentNewYorkDate
      : shiftDateKey(
          currentNewYorkDate,
          -1
        );

  const wrapUpId =
    `${WRAP_UP_ID_PREFIX}:${wrapUpDate}`;

  return {
    timeZone:
      TIME_ZONE,

    rolloverTime:
      "16:15",

    rolloverReached,

    currentNewYorkDate,

    wrapUpDate,

    wrapUpId,

    serverTime:
      now.toISOString(),

    newYorkTime: {
      ...zonedParts
    }
  };
}

function formatWrapUpTitle(
  dateKey
) {
  const [
    year,
    month,
    day
  ] =
    String(dateKey)
      .split("-")
      .map(Number);

  const date =
    new Date(
      Date.UTC(
        year,
        month - 1,
        day,
        12
      )
    );

  const formattedDate =
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone: "UTC",
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric"
      }
    ).format(date);

  return `Daily Wrap-Up — ${formattedDate}`;
}

/* =========================================================
   DEFAULT STATE
   ========================================================= */

function createDefaultFixedTasks() {
  return FIXED_TASKS.map(
    (task) => ({
      id:
        task.id,

      label:
        task.label,

      complete:
        false
    })
  );
}

function createDefaultState() {
  return {
    version: 1,

    fixedTasks:
      createDefaultFixedTasks(),

    extraReminders: [],

    reflections: {
      gladI: "",
      proudOf: "",
      favoriteToday: ""
    },

    rememberTomorrow: ""
  };
}

/* =========================================================
   STATE PARSING AND NORMALIZATION
   ========================================================= */

function safelyParseState(
  rawState
) {
  if (
    !rawState ||
    typeof rawState !== "string"
  ) {
    return null;
  }

  try {
    const parsed =
      JSON.parse(rawState);

    if (
      parsed &&
      typeof parsed === "object" &&
      !Array.isArray(parsed)
    ) {
      return parsed;
    }
  } catch (error) {
    console.warn(
      "Daily Wrap-Up state JSON could not be parsed:",
      error
    );
  }

  return null;
}

function normalizeFixedTasks(
  suppliedTasks
) {
  const suppliedTaskMap =
    new Map();

  if (Array.isArray(suppliedTasks)) {
    for (
      const suppliedTask
      of suppliedTasks
    ) {
      const id =
        normalizeText(
          suppliedTask?.id,
          100
        ).trim();

      if (id) {
        suppliedTaskMap.set(
          id,
          suppliedTask
        );
      }
    }
  }

  /*
    Labels remain controlled by the backend so a stale or
    altered browser cannot permanently rewrite the fixed
    daily checklist.
  */

  return FIXED_TASKS.map(
    (fixedTask) => {
      const suppliedTask =
        suppliedTaskMap.get(
          fixedTask.id
        );

      return {
        id:
          fixedTask.id,

        label:
          fixedTask.label,

        complete:
          normalizeBoolean(
            suppliedTask?.complete
          )
      };
    }
  );
}

function normalizeExtraReminders(
  suppliedReminders
) {
  if (
    !Array.isArray(
      suppliedReminders
    )
  ) {
    return [];
  }

  return suppliedReminders
    .slice(
      0,
      MAX_EXTRA_REMINDERS
    )
    .map((reminder) => {
      const suppliedId =
        normalizeText(
          reminder?.id,
          100
        ).trim();

      return {
        id:
          suppliedId ||
          createSafeId(
            "reminder"
          ),

        text:
          normalizeText(
            reminder?.text,
            MAX_REMINDER_LENGTH
          ),

        complete:
          normalizeBoolean(
            reminder?.complete
          )
      };
    })
    .filter(
      (reminder) =>
        reminder.text.trim() !== ""
    );
}

function normalizeState(
  suppliedState
) {
  const state =
    suppliedState &&
    typeof suppliedState ===
      "object" &&
    !Array.isArray(
      suppliedState
    )
      ? suppliedState
      : {};

  const reflections =
    state.reflections &&
    typeof state.reflections ===
      "object" &&
    !Array.isArray(
      state.reflections
    )
      ? state.reflections
      : {};

  return {
    version: 1,

    fixedTasks:
      normalizeFixedTasks(
        state.fixedTasks
      ),

    extraReminders:
      normalizeExtraReminders(
        state.extraReminders
      ),

    reflections: {
      gladI:
        normalizeText(
          reflections.gladI
        ),

      proudOf:
        normalizeText(
          reflections.proudOf
        ),

      favoriteToday:
        normalizeText(
          reflections.favoriteToday
        )
    },

    rememberTomorrow:
      normalizeText(
        state.rememberTomorrow
      )
  };
}

/* =========================================================
   METRICS
   ========================================================= */

function calculateMetrics(state) {
  const fixedTasks =
    Array.isArray(
      state.fixedTasks
    )
      ? state.fixedTasks
      : [];

  const extraReminders =
    Array.isArray(
      state.extraReminders
    )
      ? state.extraReminders
      : [];

  const fixedTasksComplete =
    fixedTasks.filter(
      (task) =>
        task.complete
    ).length;

  const extraTasksComplete =
    extraReminders.filter(
      (task) =>
        task.complete
    ).length;

  const totalTasks =
    fixedTasks.length +
    extraReminders.length;

  const completedTasks =
    fixedTasksComplete +
    extraTasksComplete;

  const completion =
    totalTasks > 0
      ? Math.round(
          (
            completedTasks /
            totalTasks
          ) * 100
        )
      : 0;

  const complete =
    totalTasks > 0 &&
    completedTasks ===
      totalTasks;

  return {
    fixedTasksComplete,

    fixedTasksTotal:
      fixedTasks.length,

    extraTasksComplete,

    extraTasksTotal:
      extraReminders.length,

    completedTasks,

    totalTasks,

    completion:
      clampNumber(
        completion,
        0,
        100
      ),

    complete
  };
}

/* =========================================================
   NOTION PAGE CONVERSION
   ========================================================= */

function buildNotionValues({
  period,
  state
}) {
  const metrics =
    calculateMetrics(state);

  return {
    wrapUpDay:
      formatWrapUpTitle(
        period.wrapUpDate
      ),

    wrapUpId:
      period.wrapUpId,

    wrapUpDate:
      period.wrapUpDate,

    gladI:
      state.reflections.gladI,

    proudOf:
      state.reflections.proudOf,

    favoriteToday:
      state.reflections
        .favoriteToday,

    rememberTomorrow:
      state.rememberTomorrow,

    completion:
      metrics.completion,

    fixedTasks:
      metrics.fixedTasksComplete,

    extraTasks:
      metrics.extraTasksComplete,

    complete:
      metrics.complete,

    state:
      JSON.stringify(state)
  };
}

function restoreStateFromPage(page) {
  const parsedState =
    safelyParseState(
      page?.state
    );

  const fallbackState = {
    ...createDefaultState(),

    reflections: {
      gladI:
        normalizeText(
          page?.gladI
        ),

      proudOf:
        normalizeText(
          page?.proudOf
        ),

      favoriteToday:
        normalizeText(
          page?.favoriteToday
        )
    },

    rememberTomorrow:
      normalizeText(
        page?.rememberTomorrow
      )
  };

  if (!parsedState) {
    return normalizeState(
      fallbackState
    );
  }

  const normalizedParsedState =
    normalizeState(
      parsedState
    );

  /*
    The individual Notion reflection properties act as a
    fallback for older pages whose state JSON did not include
    every field.
  */

  return normalizeState({
    ...normalizedParsedState,

    reflections: {
      gladI:
        normalizedParsedState
          .reflections
          .gladI ||
        fallbackState
          .reflections
          .gladI,

      proudOf:
        normalizedParsedState
          .reflections
          .proudOf ||
        fallbackState
          .reflections
          .proudOf,

      favoriteToday:
        normalizedParsedState
          .reflections
          .favoriteToday ||
        fallbackState
          .reflections
          .favoriteToday
    },

    rememberTomorrow:
      normalizedParsedState
        .rememberTomorrow ||
      fallbackState
        .rememberTomorrow
  });
}

function buildClientPayload({
  page,
  period,
  state,
  created = false,
  saved = false
}) {
  const metrics =
    calculateMetrics(state);

  return {
    success: true,

    created,

    saved,

    page: {
      pageId:
        page?.pageId || "",

      url:
        page?.url || "",

      createdTime:
        page?.createdTime || "",

      lastEditedTime:
        page?.lastEditedTime || "",

      wrapUpDay:
        page?.wrapUpDay ||
        formatWrapUpTitle(
          period.wrapUpDate
        ),

      wrapUpId:
        period.wrapUpId,

      wrapUpDate:
        period.wrapUpDate
    },

    period,

    state,

    metrics,

    display: {
      title:
        metrics.complete
          ? "Wrapped Up"
          : "Daily Wrap-Up",

      subtitle:
        metrics.complete
          ? "See you tomorrow."
          : "Close the loop on your workday."
    }
  };
}

/* =========================================================
   GET OR CREATE
   ========================================================= */

async function getOrCreateWrapUp(
  period
) {
  const existingPage =
    await queryDailyWrapUpById(
      period.wrapUpId
    );

  if (existingPage) {
    return {
      page:
        existingPage,

      state:
        restoreStateFromPage(
          existingPage
        ),

      created:
        false
    };
  }

  const state =
    createDefaultState();

  const values =
    buildNotionValues({
      period,
      state
    });

  try {
    const createdPage =
      await createDailyWrapUpPage(
        values
      );

    return {
      page:
        createdPage,

      state,

      created:
        true
    };
  } catch (error) {
    /*
      Two requests can occasionally arrive at the same time
      when the widget first opens. If another request created
      the page first, query once more before failing.
    */

    console.warn(
      "Initial Daily Wrap-Up creation failed. Checking whether another request created it:",
      error
    );

    const recoveredPage =
      await queryDailyWrapUpById(
        period.wrapUpId
      );

    if (recoveredPage) {
      return {
        page:
          recoveredPage,

        state:
          restoreStateFromPage(
            recoveredPage
          ),

        created:
          false
      };
    }

    throw error;
  }
}

/* =========================================================
   REQUEST BODY
   ========================================================= */

function parseRequestBody(request) {
  const body =
    request.body;

  if (!body) {
    return {};
  }

  if (
    typeof body === "object"
  ) {
    return body;
  }

  if (
    typeof body === "string"
  ) {
    try {
      return JSON.parse(body);
    } catch {
      throw new Error(
        "The request body is not valid JSON."
      );
    }
  }

  throw new Error(
    "The request body format is not supported."
  );
}

/* =========================================================
   RESPONSE HELPERS
   ========================================================= */

function setResponseHeaders(
  response
) {
  response.setHeader(
    "Cache-Control",
    "no-store, max-age=0"
  );

  response.setHeader(
    "Content-Type",
    "application/json; charset=utf-8"
  );
}

function sendError(
  response,
  statusCode,
  message,
  details = null,
  extra = {}
) {
  return response
    .status(statusCode)
    .json({
      success: false,

      error:
        message,

      ...(details
        ? {
            details
          }
        : {}),

      ...extra
    });
}

/* =========================================================
   GET REQUEST
   ========================================================= */

async function handleGet(
  request,
  response
) {
  const period =
    getActiveWrapUpPeriod();

  const result =
    await getOrCreateWrapUp(
      period
    );

  return response
    .status(200)
    .json(
      buildClientPayload({
        page:
          result.page,

        period,

        state:
          result.state,

        created:
          result.created,

        saved:
          false
      })
    );
}

/* =========================================================
   POST REQUEST
   ========================================================= */

async function handlePost(
  request,
  response
) {
  const period =
    getActiveWrapUpPeriod();

  let body;

  try {
    body =
      parseRequestBody(
        request
      );
  } catch (error) {
    return sendError(
      response,
      400,
      error.message
    );
  }

  const requestedWrapUpId =
    normalizeText(
      body.wrapUpId,
      150
    ).trim();

  if (!requestedWrapUpId) {
    return sendError(
      response,
      400,
      "The autosave request is missing its Wrap-Up ID.",
      null,
      {
        activeWrapUpId:
          period.wrapUpId
      }
    );
  }

  /*
    This prevents a delayed autosave from Tuesday’s open
    widget from being written after Wednesday’s 4:15 PM
    rollover. The frontend can reload the newly active page.
  */

  if (
    requestedWrapUpId !==
    period.wrapUpId
  ) {
    return sendError(
      response,
      409,
      "The active Daily Wrap-Up period has changed. Reload the widget to continue with the new day.",
      null,
      {
        code:
          "WRAP_UP_PERIOD_CHANGED",

        requestedWrapUpId,

        activeWrapUpId:
          period.wrapUpId,

        period
      }
    );
  }

  const state =
    normalizeState(
      body.state
    );

  let page =
    await queryDailyWrapUpById(
      period.wrapUpId
    );

  if (!page) {
    const created =
      await getOrCreateWrapUp(
        period
      );

    page =
      created.page;
  }

  if (!page?.pageId) {
    return sendError(
      response,
      500,
      "The Daily Wrap-Up page could not be prepared for saving."
    );
  }

  const values =
    buildNotionValues({
      period,
      state
    });

  const updatedPage =
    await updateDailyWrapUpPage(
      page.pageId,
      values
    );

  return response
    .status(200)
    .json(
      buildClientPayload({
        page:
          updatedPage,

        period,

        state,

        created:
          false,

        saved:
          true
      })
    );
}

/* =========================================================
   MAIN HANDLER
   ========================================================= */

export default async function dailyWrapUpHandler(
  request,
  response
) {
  setResponseHeaders(
    response
  );

  const method =
    String(
      request.method || "GET"
    ).toUpperCase();

  if (method === "GET") {
    try {
      return await handleGet(
        request,
        response
      );
    } catch (error) {
      console.error(
        "Daily Wrap-Up GET error:",
        error
      );

      return sendError(
        response,
        error?.status || 500,
        "The Daily Wrap-Up could not be loaded.",
        error instanceof Error
          ? error.message
          : String(error)
      );
    }
  }

  if (method === "POST") {
    try {
      return await handlePost(
        request,
        response
      );
    } catch (error) {
      console.error(
        "Daily Wrap-Up POST error:",
        error
      );

      return sendError(
        response,
        error?.status || 500,
        "The Daily Wrap-Up could not be saved.",
        error instanceof Error
          ? error.message
          : String(error)
      );
    }
  }

  response.setHeader(
    "Allow",
    "GET, POST"
  );

  return sendError(
    response,
    405,
    `Method ${method} is not allowed.`
  );
}

/* =========================================================
   TESTABLE EXPORTS
   ========================================================= */

export {
  FIXED_TASKS,
  TIME_ZONE,
  ROLLOVER_HOUR,
  ROLLOVER_MINUTE,
  calculateMetrics,
  createDefaultState,
  getActiveWrapUpPeriod,
  normalizeState
};
