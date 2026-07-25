import {
  queryFinanceDataSource
} from "../notion-finance.js";

const DEFAULT_TIME_ZONE =
  "America/New_York";

const MAX_VISIBLE_CATEGORIES = 4;

const TRANSACTION_DATE_PROPERTIES = [
  "Date ",
  "Date",
  "Transaction Date",
  "Purchase Date",
  "Paid Date"
];

const TRANSACTION_AMOUNT_PROPERTIES = [
  "Amount ",
  "Amount",
  "Transaction Amount",
  "Cost",
  "Total"
];

const TRANSACTION_CATEGORY_PROPERTIES = [
  "Category ",
  "Category",
  "Budget Category",
  "Spending Category"
];

const TRANSACTION_TYPE_PROPERTIES = [
  "Type ",
  "Type",
  "Transaction Type"
];
const CATEGORY_TITLE_PROPERTIES = [
  "Category ",
  "Category",
  "Name",
  "Budget Category"
];

function roundCurrency(
  value
) {
  return (
    Math.round(
      (
        Number(value || 0) +
        Number.EPSILON
      ) * 100
    ) / 100
  );
}

function roundPercent(
  value
) {
  return (
    Math.round(
      (
        Number(value || 0) +
        Number.EPSILON
      ) * 10
    ) / 10
  );
}

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

function getFirstProperty(
  page,
  propertyNames
) {
  for (
    const propertyName
    of propertyNames
  ) {
    const property =
      getProperty(
        page,
        propertyName
      );

    if (property) {
      return property;
    }
  }

  return null;
}

function joinPlainText(
  items
) {
  if (
    !Array.isArray(
      items
    )
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

function getTitleFromProperty(
  property
) {
  return joinPlainText(
    property?.title
  );
}

function getRichTextFromProperty(
  property
) {
  return joinPlainText(
    property?.rich_text
  );
}

function getSelectFromProperty(
  property
) {
  return String(
    property?.select?.name ||
    property?.status?.name ||
    ""
  ).trim();
}

function getMultiSelectFromProperty(
  property
) {
  if (
    !Array.isArray(
      property?.multi_select
    )
  ) {
    return "";
  }

  return property.multi_select
    .map(
      (option) =>
        option?.name || ""
    )
    .filter(
      Boolean
    )
    .join(", ")
    .trim();
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
    formula.type ===
    "string"
  ) {
    return formula.string;
  }

  if (
    formula.type ===
    "number"
  ) {
    return formula.number;
  }

  if (
    formula.type ===
    "boolean"
  ) {
    return formula.boolean;
  }

  if (
    formula.type ===
    "date"
  ) {
    return (
      formula.date?.start ||
      null
    );
  }

  return null;
}

function getRollupValue(
  property
) {
  const rollup =
    property?.rollup;

  if (!rollup) {
    return null;
  }

  if (
    rollup.type ===
    "number"
  ) {
    return rollup.number;
  }

  if (
    rollup.type ===
    "date"
  ) {
    return (
      rollup.date?.start ||
      null
    );
  }

  if (
    rollup.type ===
    "array" &&
    Array.isArray(
      rollup.array
    )
  ) {
    const values =
      rollup.array
        .map(
          (item) => {
            if (
              item.type ===
              "title"
            ) {
              return joinPlainText(
                item.title
              );
            }

            if (
              item.type ===
              "rich_text"
            ) {
              return joinPlainText(
                item.rich_text
              );
            }

            if (
              item.type ===
              "select"
            ) {
              return (
                item.select
                  ?.name || ""
              );
            }

            if (
              item.type ===
              "status"
            ) {
              return (
                item.status
                  ?.name || ""
              );
            }

            if (
              item.type ===
              "number"
            ) {
              return item.number;
            }

            return "";
          }
        )
        .filter(
          (value) =>
            value !== "" &&
            value !== null &&
            value !== undefined
        );

    return values;
  }

  return null;
}

function getTextValue(
  property
) {
  if (!property) {
    return "";
  }

  if (
    property.type ===
    "title"
  ) {
    return getTitleFromProperty(
      property
    );
  }

  if (
    property.type ===
    "rich_text"
  ) {
    return getRichTextFromProperty(
      property
    );
  }

  if (
    property.type ===
    "select" ||
    property.type ===
    "status"
  ) {
    return getSelectFromProperty(
      property
    );
  }

  if (
    property.type ===
    "multi_select"
  ) {
    return getMultiSelectFromProperty(
      property
    );
  }

  if (
    property.type ===
    "formula"
  ) {
    const value =
      getFormulaValue(
        property
      );

    return String(
      value ?? ""
    ).trim();
  }

  if (
    property.type ===
    "rollup"
  ) {
    const value =
      getRollupValue(
        property
      );

    if (
      Array.isArray(
        value
      )
    ) {
      return value
        .join(", ")
        .trim();
    }

    return String(
      value ?? ""
    ).trim();
  }

  return "";
}

function getNumberValue(
  property
) {
  if (!property) {
    return null;
  }

  if (
    property.type ===
    "number"
  ) {
    return Number.isFinite(
      property.number
    )
      ? property.number
      : null;
  }

  if (
    property.type ===
    "formula"
  ) {
    const value =
      getFormulaValue(
        property
      );

    return Number.isFinite(
      value
    )
      ? value
      : null;
  }

  if (
    property.type ===
    "rollup"
  ) {
    const value =
      getRollupValue(
        property
      );

    return Number.isFinite(
      value
    )
      ? value
      : null;
  }

  const textValue =
    getTextValue(
      property
    )
      .replace(
        /[$,\s]/g,
        ""
      );

  const parsed =
    Number(
      textValue
    );

  return Number.isFinite(
    parsed
  )
    ? parsed
    : null;
}

function getDateValue(
  property
) {
  if (!property) {
    return null;
  }

  if (
    property.type ===
    "date"
  ) {
    return (
      property.date?.start ||
      null
    );
  }

  if (
    property.type ===
    "formula"
  ) {
    const value =
      getFormulaValue(
        property
      );

    return typeof value ===
      "string"
      ? value
      : null;
  }

  if (
    property.type ===
    "rollup"
  ) {
    const value =
      getRollupValue(
        property
      );

    return typeof value ===
      "string"
      ? value
      : null;
  }

  return null;
}

function getRelationIds(
  property
) {
  if (
    !Array.isArray(
      property?.relation
    )
  ) {
    return [];
  }

  return property.relation
    .map(
      (relation) =>
        relation?.id
    )
    .filter(
      Boolean
    );
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

  parts.forEach(
    (part) => {
      if (
        part.type !==
        "literal"
      ) {
        values[
          part.type
        ] = Number(
          part.value
        );
      }
    }
  );

  return {
    year:
      values.year,

    month:
      values.month,

    day:
      values.day
  };
}

function createDateOnly(
  year,
  monthIndex,
  day
) {
  return new Date(
    Date.UTC(
      year,
      monthIndex,
      day
    )
  );
}

function getCurrentDateOnly() {
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

function getMonthRange(
  today,
  monthOffset = 0
) {
  const start =
    createDateOnly(
      today.getUTCFullYear(),
      today.getUTCMonth() +
        monthOffset,
      1
    );

  const end =
    createDateOnly(
      start.getUTCFullYear(),
      start.getUTCMonth() + 1,
      1
    );

  return {
    start,
    end
  };
}

function isDateInRange(
  date,
  range
) {
  return (
    date.getTime() >=
      range.start.getTime() &&
    date.getTime() <
      range.end.getTime()
  );
}

function formatMonthName(
  date
) {
  return new Intl
    .DateTimeFormat(
      "en-US",
      {
        month: "long",
        timeZone: "UTC"
      }
    )
    .format(
      date
    );
}

function formatDateISO(
  date
) {
  return date
    .toISOString()
    .slice(0, 10);
}

function normalizeCategoryName(
  value
) {
  const name =
    String(value || "")
      .trim();

  return (
    name ||
    "Uncategorized"
  );
}

function getCategoryPageName(
  page
) {
  for (
    const propertyName
    of CATEGORY_TITLE_PROPERTIES
  ) {
    const value =
      getTextValue(
        getProperty(
          page,
          propertyName
        )
      );

    if (value) {
      return value;
    }
  }

  const titleProperty =
    Object.values(
      page?.properties || {}
    ).find(
      (property) =>
        property?.type ===
        "title"
    );

  return (
    getTextValue(
      titleProperty
    ) ||
    "Uncategorized"
  );
}

function buildCategoryMap(
  categoryPages
) {
  return new Map(
    categoryPages.map(
      (page) => [
        page.id,
        getCategoryPageName(
          page
        )
      ]
    )
  );
}

function getTransactionCategory(
  page,
  categoryMap
) {
  const property =
    getFirstProperty(
      page,
      TRANSACTION_CATEGORY_PROPERTIES
    );

  const relationIds =
    getRelationIds(
      property
    );

  if (
    relationIds.length > 0
  ) {
    const relatedNames =
      relationIds
        .map(
          (id) =>
            categoryMap.get(
              id
            )
        )
        .filter(
          Boolean
        );

    if (
      relatedNames.length >
      0
    ) {
      return normalizeCategoryName(
        relatedNames.join(
          ", "
        )
      );
    }
  }

  return normalizeCategoryName(
    getTextValue(
      property
    )
  );
}

function isExpenseTransaction(
  page,
  amount
) {
  const typeValue =
    getTextValue(
      getFirstProperty(
        page,
        TRANSACTION_TYPE_PROPERTIES
      )
    )
      .trim()
      .toLowerCase();

  if (
    typeValue.includes(
      "income"
    ) ||
    typeValue.includes(
      "deposit"
    ) ||
    typeValue.includes(
      "transfer"
    ) ||
    typeValue.includes(
      "refund"
    )
  ) {
    return false;
  }

  if (
    typeValue.includes(
      "expense"
    ) ||
    typeValue.includes(
      "spending"
    ) ||
    typeValue.includes(
      "purchase"
    )
  ) {
    return true;
  }

  return amount !== 0;
}

function parseTransaction(
  page,
  categoryMap
) {
  const rawAmount =
    getNumberValue(
      getFirstProperty(
        page,
        TRANSACTION_AMOUNT_PROPERTIES
      )
    );

  if (
    !Number.isFinite(
      rawAmount
    ) ||
    rawAmount === 0
  ) {
    return null;
  }

  if (
    !isExpenseTransaction(
      page,
      rawAmount
    )
  ) {
    return null;
  }

  const dateValue =
    getDateValue(
      getFirstProperty(
        page,
        TRANSACTION_DATE_PROPERTIES
      )
    ) ||
    page.created_time;

  const date =
    new Date(
      dateValue
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  return {
    id:
      page.id,

    date,

    amount:
      roundCurrency(
        Math.abs(
          rawAmount
        )
      ),

    category:
      getTransactionCategory(
        page,
        categoryMap
      )
  };
}

function groupTransactionsByCategory(
  transactions
) {
  const totals =
    new Map();

  transactions.forEach(
    (transaction) => {
      const current =
        totals.get(
          transaction.category
        ) || 0;

      totals.set(
        transaction.category,
        roundCurrency(
          current +
            transaction.amount
        )
      );
    }
  );

  return [...totals.entries()]
    .map(
      (
        [
          name,
          amount
        ]
      ) => ({
        name,
        amount:
          roundCurrency(
            amount
          )
      })
    )
    .sort(
      (a, b) =>
        b.amount -
        a.amount
    );
}

function compactCategories(
  categories
) {
  if (
    categories.length <=
    MAX_VISIBLE_CATEGORIES +
      1
  ) {
    return categories;
  }

  const visible =
    categories.slice(
      0,
      MAX_VISIBLE_CATEGORIES
    );

  const otherAmount =
    categories
      .slice(
        MAX_VISIBLE_CATEGORIES
      )
      .reduce(
        (
          total,
          category
        ) =>
          total +
          category.amount,
        0
      );

  return [
    ...visible,
    {
      name:
        "Other",

      amount:
        roundCurrency(
          otherAmount
        )
    }
  ];
}

function addPercentages(
  categories,
  total
) {
  return categories.map(
    (category) => ({
      ...category,

      percent:
        total > 0
          ? roundPercent(
              (
                category.amount /
                total
              ) * 100
            )
          : 0
    })
  );
}

function createCategoryDifferenceMap(
  currentCategories,
  previousCategories
) {
  const categoryNames =
    new Set([
      ...currentCategories.map(
        (category) =>
          category.name
      ),

      ...previousCategories.map(
        (category) =>
          category.name
      )
    ]);

  const currentMap =
    new Map(
      currentCategories.map(
        (category) => [
          category.name,
          category.amount
        ]
      )
    );

  const previousMap =
    new Map(
      previousCategories.map(
        (category) => [
          category.name,
          category.amount
        ]
      )
    );

  return [...categoryNames]
    .map(
      (category) => {
        const current =
          currentMap.get(
            category
          ) || 0;

        const previous =
          previousMap.get(
            category
          ) || 0;

        return {
          category,

          current:
            roundCurrency(
              current
            ),

          previous:
            roundCurrency(
              previous
            ),

          difference:
            roundCurrency(
              current -
              previous
            )
        };
      }
    );
}

function getLargestIncrease(
  differences
) {
  const increases =
    differences
      .filter(
        (item) =>
          item.difference >
          0
      )
      .sort(
        (a, b) =>
          b.difference -
          a.difference
      );

  return (
    increases[0] ||
    null
  );
}

function getLargestDecrease(
  differences
) {
  const decreases =
    differences
      .filter(
        (item) =>
          item.difference <
          0
      )
      .sort(
        (a, b) =>
          a.difference -
          b.difference
      );

  return (
    decreases[0] ||
    null
  );
}

export async function getFinanceSpendingReport() {
  const [
    transactionPages,
    categoryPages
  ] =
    await Promise.all([
      queryFinanceDataSource(
        "transactions"
      ),

      queryFinanceDataSource(
        "budgetCategories"
      )
    ]);

  const categoryMap =
    buildCategoryMap(
      categoryPages
    );

  const transactions =
    transactionPages
      .map(
        (page) =>
          parseTransaction(
            page,
            categoryMap
          )
      )
      .filter(
        Boolean
      );

  const today =
    getCurrentDateOnly();

  const currentRange =
    getMonthRange(
      today,
      0
    );

  const previousRange =
    getMonthRange(
      today,
      -1
    );

  const currentTransactions =
    transactions.filter(
      (transaction) =>
        isDateInRange(
          transaction.date,
          currentRange
        )
    );

  const previousTransactions =
    transactions.filter(
      (transaction) =>
        isDateInRange(
          transaction.date,
          previousRange
        )
    );

  const currentCategoryTotals =
    groupTransactionsByCategory(
      currentTransactions
    );

  const previousCategoryTotals =
    groupTransactionsByCategory(
      previousTransactions
    );

  const currentTotal =
    roundCurrency(
      currentTransactions.reduce(
        (
          total,
          transaction
        ) =>
          total +
          transaction.amount,
        0
      )
    );

  const previousTotal =
    roundCurrency(
      previousTransactions.reduce(
        (
          total,
          transaction
        ) =>
          total +
          transaction.amount,
        0
      )
    );

  const difference =
    roundCurrency(
      currentTotal -
      previousTotal
    );

  const percentDifference =
    previousTotal > 0
      ? roundPercent(
          (
            difference /
            previousTotal
          ) * 100
        )
      : null;

  const categoryDifferences =
    createCategoryDifferenceMap(
      currentCategoryTotals,
      previousCategoryTotals
    );

  const largestIncrease =
    getLargestIncrease(
      categoryDifferences
    );

  const largestDecrease =
    getLargestDecrease(
      categoryDifferences
    );

  const categories =
    addPercentages(
      compactCategories(
        currentCategoryTotals
      ),
      currentTotal
    );

  return {
    success:
      true,

    version:
      1,

    generatedAt:
      formatDateISO(
        today
      ),

    month:
      formatMonthName(
        currentRange.start
      ),

    previousMonth:
      formatMonthName(
        previousRange.start
      ),

    totalSpent:
      currentTotal,

    categories,

    trends: {
      overall: {
        difference,

        percent:
          percentDifference
      },

      increase:
        largestIncrease
          ? {
              category:
                largestIncrease.category,

              difference:
                largestIncrease.difference
            }
          : null,

      decrease:
        largestDecrease
          ? {
              category:
                largestDecrease.category,

              difference:
                largestDecrease.difference
            }
          : null
    }
  };
}
