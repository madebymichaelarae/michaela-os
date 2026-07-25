import {
  queryFinanceDataSource
} from "../notion-finance.js";

const DEFAULT_TIME_ZONE =
  "America/New_York";

const UPCOMING_WINDOW_DAYS = 7;

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];

function getProperty(
  page,
  propertyName
) {
  return (
    page?.properties?.[
      propertyName
    ] || null
  );
}

function getTitle(
  page,
  propertyName
) {
  const title =
    getProperty(
      page,
      propertyName
    )?.title;

  if (!Array.isArray(title)) {
    return "";
  }

  return title
    .map(
      (item) =>
        item?.plain_text || ""
    )
    .join("")
    .trim();
}

function getRichText(
  page,
  propertyName
) {
  const richText =
    getProperty(
      page,
      propertyName
    )?.rich_text;

  if (!Array.isArray(richText)) {
    return "";
  }

  return richText
    .map(
      (item) =>
        item?.plain_text || ""
    )
    .join("")
    .trim();
}

function getNumber(
  page,
  propertyName
) {
  const value =
    getProperty(
      page,
      propertyName
    )?.number;

  return Number.isFinite(value)
    ? value
    : null;
}

function getCheckbox(
  page,
  propertyName
) {
  return Boolean(
    getProperty(
      page,
      propertyName
    )?.checkbox
  );
}

function getSelect(
  page,
  propertyName
) {
  return (
    getProperty(
      page,
      propertyName
    )?.select?.name || ""
  )
    .trim();
}

function roundCurrency(value) {
  return (
    Math.round(
      (
        value +
        Number.EPSILON
      ) * 100
    ) / 100
  );
}

function normalizeIconName(
  value
) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(
      /[_\s]+/g,
      "-"
    )
    .replace(
      /[^a-z0-9-]/g,
      ""
    );
}

function getFallbackIconName(
  billName
) {
  const name =
    String(billName || "")
      .trim()
      .toLowerCase();

  if (
    name.includes("rent") ||
    name.includes("mortgage")
  ) {
    return "house";
  }

  if (
    name.includes("electric") ||
    name.includes("power") ||
    name.includes("energy")
  ) {
    return "zap";
  }

  if (
    name.includes("water")
  ) {
    return "droplet";
  }

  if (
    name.includes("internet") ||
    name.includes("wifi")
  ) {
    return "wifi";
  }

  if (
    name.includes("phone") ||
    name.includes("mobile")
  ) {
    return "smartphone";
  }

  if (
    name.includes("car") ||
    name.includes("auto") ||
    name.includes("vehicle")
  ) {
    return "car";
  }

  if (
    name.includes("insurance")
  ) {
    return "shield";
  }

  if (
    name.includes("credit") ||
    name.includes("loan") ||
    name.includes("debt")
  ) {
    return "credit-card";
  }

  if (
    name.includes("spotify") ||
    name.includes("music")
  ) {
    return "music";
  }

  if (
    name.includes("netflix") ||
    name.includes("hulu") ||
    name.includes("stream")
  ) {
    return "tv";
  }

  if (
    name.includes("gym") ||
    name.includes("fitness")
  ) {
    return "dumbbell";
  }

  return "receipt";
}

function getDatePartsInTimeZone(
  date,
  timeZone
) {
  const formatter =
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone,
        year: "numeric",
        month: "numeric",
        day: "numeric"
      }
    );

  const parts =
    formatter.formatToParts(
      date
    );

  const values = {};

  parts.forEach((part) => {
    if (
      part.type !== "literal"
    ) {
      values[part.type] =
        Number(part.value);
    }
  });

  return {
    year: values.year,
    month: values.month,
    day: values.day
  };
}

function createDateOnly(
  year,
  monthIndex,
  requestedDay
) {
  const lastDayOfMonth =
    new Date(
      Date.UTC(
        year,
        monthIndex + 1,
        0
      )
    ).getUTCDate();

  const safeDay =
    Math.min(
      Math.max(
        1,
        requestedDay
      ),
      lastDayOfMonth
    );

  return new Date(
    Date.UTC(
      year,
      monthIndex,
      safeDay
    )
  );
}

function getTodayDateOnly() {
  const timeZone =
    process.env
      .FINANCE_TIME_ZONE ||
    DEFAULT_TIME_ZONE;

  const parts =
    getDatePartsInTimeZone(
      new Date(),
      timeZone
    );

  return createDateOnly(
    parts.year,
    parts.month - 1,
    parts.day
  );
}

function getMonthIndex(
  monthName
) {
  return MONTH_NAMES.findIndex(
    (month) =>
      month.toLowerCase() ===
      String(
        monthName || ""
      )
        .trim()
        .toLowerCase()
  );
}

function getNextMonthlyDate(
  today,
  dueDay
) {
  let year =
    today.getUTCFullYear();

  let monthIndex =
    today.getUTCMonth();

  let candidate =
    createDateOnly(
      year,
      monthIndex,
      dueDay
    );

  if (
    candidate.getTime() <
    today.getTime()
  ) {
    monthIndex += 1;

    if (monthIndex > 11) {
      monthIndex = 0;
      year += 1;
    }

    candidate =
      createDateOnly(
        year,
        monthIndex,
        dueDay
      );
  }

  return candidate;
}

function getNextYearlyDate(
  today,
  dueDay,
  dueMonth
) {
  const monthIndex =
    getMonthIndex(
      dueMonth
    );

  if (monthIndex < 0) {
    return null;
  }

  let year =
    today.getUTCFullYear();

  let candidate =
    createDateOnly(
      year,
      monthIndex,
      dueDay
    );

  if (
    candidate.getTime() <
    today.getTime()
  ) {
    year += 1;

    candidate =
      createDateOnly(
        year,
        monthIndex,
        dueDay
      );
  }

  return candidate;
}

function getDaysUntil(
  today,
  dueDate
) {
  const millisecondsPerDay =
    24 * 60 * 60 * 1000;

  return Math.round(
    (
      dueDate.getTime() -
      today.getTime()
    ) /
      millisecondsPerDay
  );
}

function formatDateISO(date) {
  return date
    .toISOString()
    .slice(0, 10);
}

function getDateBadge(
  dueDate
) {
  return String(
    dueDate.getUTCDate()
  ).padStart(2, "0");
}

function getDateLabel(
  dueDate,
  daysUntil
) {
  if (daysUntil === 0) {
    return "Today";
  }

  if (daysUntil === 1) {
    return "Tomorrow";
  }

  if (
    daysUntil >= 2 &&
    daysUntil <= 6
  ) {
    return new Intl.DateTimeFormat(
      "en-US",
      {
        weekday: "short",
        timeZone: "UTC"
      }
    ).format(dueDate);
  }

  return new Intl.DateTimeFormat(
    "en-US",
    {
      month: "short",
      timeZone: "UTC"
    }
  ).format(dueDate);
}

function getNextDueDate(
  today,
  frequency,
  dueDay,
  dueMonth
) {
  const normalizedFrequency =
    String(frequency || "")
      .trim()
      .toLowerCase();

  if (
    normalizedFrequency ===
    "monthly"
  ) {
    return getNextMonthlyDate(
      today,
      dueDay
    );
  }

  if (
    normalizedFrequency ===
    "yearly"
  ) {
    return getNextYearlyDate(
      today,
      dueDay,
      dueMonth
    );
  }

  return null;
}

function parseBill(
  page,
  today
) {
  const name =
    getTitle(
      page,
      "Bill"
    ) || "Untitled Bill";

  const amount =
    getNumber(
      page,
      "Amount"
    );

const dueDay =
  getNumber(
    page,
    "Due Date"
  );

  const frequency =
    getSelect(
      page,
      "Frequency"
    );

  const dueMonth =
    getSelect(
      page,
      "Due Month"
    );

  const active =
    getCheckbox(
      page,
      "Active"
    );

  const autoPay =
    getCheckbox(
      page,
      "Auto Pay"
    );

  const iconFromNotion =
    normalizeIconName(
      getRichText(
        page,
        "Icon"
      )
    );

  if (
    !Number.isFinite(dueDay) ||
    dueDay < 1 ||
    dueDay > 31
  ) {
    return null;
  }

  const nextDueDate =
    getNextDueDate(
      today,
      frequency,
      Math.round(dueDay),
      dueMonth
    );

  if (!nextDueDate) {
    return null;
  }

  const daysUntil =
    getDaysUntil(
      today,
      nextDueDate
    );

  return {
    id: page.id,

    name,

    icon:
      iconFromNotion ||
      getFallbackIconName(
        name
      ),

    amount:
      roundCurrency(
        Number.isFinite(amount)
          ? Math.max(0, amount)
          : 0
      ),

    frequency,

    dueMonth:
      dueMonth || null,

    dueDay:
      nextDueDate.getUTCDate(),

    dueDate:
      formatDateISO(
        nextDueDate
      ),

    dateBadge:
      getDateBadge(
        nextDueDate
      ),

    dateLabel:
      getDateLabel(
        nextDueDate,
        daysUntil
      ),

    daysUntil,

    autoPay,

    active
  };
}

function sortBills(bills) {
  return [...bills].sort(
    (a, b) => {
      if (
        a.daysUntil !==
        b.daysUntil
      ) {
        return (
          a.daysUntil -
          b.daysUntil
        );
      }

      return a.name.localeCompare(
        b.name
      );
    }
  );
}

export async function getFinanceBills() {
  const pages =
  await queryFinanceDataSource(
    "bills"
  );

return {
  success: true,
  count: pages.length,
  pages
};
    );

  const allUpcomingBills =
    sortBills(
      pages
        .map(
          (page) =>
            parseBill(
              page,
              today
            )
        )
        .filter(Boolean)
        .filter(
          (bill) =>
            bill.active
        )
    );

  const bills =
    allUpcomingBills.filter(
      (bill) =>
        bill.daysUntil >= 0 &&
        bill.daysUntil <
          UPCOMING_WINDOW_DAYS
    );

  return {
    success: true,

    generatedAt:
      formatDateISO(today),

    windowDays:
      UPCOMING_WINDOW_DAYS,

    bills,

    nextBill:
      allUpcomingBills[0] ||
      null
  };
}
