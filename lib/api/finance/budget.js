import {
  queryFinanceDataSource
} from "../notion-finance.js";

const TYPE_ORDER = {
  Spending: 1,
  Bills: 2,
  "Sinking Funds": 3,
  Saving: 4
};

function getProperty(page, propertyName) {
  return (
    page?.properties?.[propertyName] ||
    null
  );
}

function getTitle(page, propertyName) {
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

function getSelect(
  page,
  propertyName
) {
  return (
    getProperty(
      page,
      propertyName
    )?.select?.name || null
  );
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
    : 0;
}

function getRollupNumber(
  page,
  propertyName
) {
  const rollup =
    getProperty(
      page,
      propertyName
    )?.rollup;

  if (!rollup) {
    return 0;
  }

  if (
    rollup.type === "number" &&
    Number.isFinite(rollup.number)
  ) {
    return rollup.number;
  }

  if (
    rollup.type === "array" &&
    Array.isArray(rollup.array)
  ) {
    return rollup.array.reduce(
      (sum, item) => {
        if (
          item?.type === "number" &&
          Number.isFinite(
            item.number
          )
        ) {
          return (
            sum + item.number
          );
        }

        if (
          item?.type === "formula" &&
          item.formula?.type ===
            "number" &&
          Number.isFinite(
            item.formula.number
          )
        ) {
          return (
            sum +
            item.formula.number
          );
        }

        return sum;
      },
      0
    );
  }

  return 0;
}

function getFormulaNumber(
  page,
  propertyName
) {
  const formula =
    getProperty(
      page,
      propertyName
    )?.formula;

  if (!formula) {
    return null;
  }

  if (
    formula.type === "number" &&
    Number.isFinite(formula.number)
  ) {
    return formula.number;
  }

  return null;
}

function roundCurrency(value) {
  return (
    Math.round(
      (value +
        Number.EPSILON) *
        100
    ) / 100
  );
}

function roundPercentage(value) {
  return Math.round(value);
}

function normalizeIconName(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-")
    .replace(
      /[^a-z0-9-]/g,
      ""
    );
}

function getFallbackIconName(
  categoryName,
  type
) {
  const name =
    String(categoryName || "")
      .trim()
      .toLowerCase();

  if (
    name.includes("grocery") ||
    name.includes("food")
  ) {
    return "shopping-cart";
  }

  if (
    name.includes("gas") ||
    name.includes("fuel")
  ) {
    return "car";
  }

  if (
    name.includes("dining") ||
    name.includes("restaurant") ||
    name.includes("takeout")
  ) {
    return "utensils";
  }

  if (
    name.includes("shopping") ||
    name.includes("clothes")
  ) {
    return "shopping-bag";
  }

  if (
    name.includes("subscription")
  ) {
    return "repeat";
  }

  if (
    name.includes("rent") ||
    name.includes("home") ||
    name.includes("housing")
  ) {
    return "house";
  }

  if (
    name.includes("utility") ||
    name.includes("electric")
  ) {
    return "bolt";
  }

  if (
    name.includes("internet") ||
    name.includes("phone")
  ) {
    return "wifi";
  }

  if (
    name.includes("medical") ||
    name.includes("health")
  ) {
    return "heart";
  }

  if (
    name.includes("pet") ||
    name.includes("roman")
  ) {
    return "paw";
  }

  if (
    name.includes("travel")
  ) {
    return "plane";
  }

  if (
    name.includes("entertainment") ||
    name.includes("fun")
  ) {
    return "ticket";
  }

  switch (type) {
    case "Bills":
      return "receipt";

    case "Sinking Funds":
      return "target";

    case "Saving":
      return "piggy-bank";

    case "Spending":
    default:
      return "wallet";
  }
}

function getStatus(percent) {
  if (percent >= 100) {
    return "over";
  }

  if (percent >= 75) {
    return "warning";
  }

  return "good";
}

function parseBudgetCategory(page) {
  const name =
    getTitle(
      page,
      "Category "
    ) || "Untitled Category";

  const type =
    getSelect(
      page,
      "Type "
    ) || "Spending";

  const budget =
    Math.max(
      0,
      getNumber(
        page,
        "Monthly Budget"
      )
    );

  const spent =
    Math.max(
      0,
      getRollupNumber(
        page,
        "Spent This Month"
      )
    );

  const formulaRemaining =
    getFormulaNumber(
      page,
      "Remaining"
    );

  const remaining =
    formulaRemaining !== null
      ? formulaRemaining
      : budget - spent;

  const percent =
    budget > 0
      ? (spent / budget) * 100
      : spent > 0
        ? 100
        : 0;

  const iconFromNotion =
    normalizeIconName(
      getRichText(
        page,
        "Icon"
      )
    );

  return {
    id: page.id,

    name,

    type,

    icon:
      iconFromNotion ||
      getFallbackIconName(
        name,
        type
      ),

    active:
      getCheckbox(
        page,
        "Active "
      ),

    budget:
      roundCurrency(budget),

    spent:
      roundCurrency(spent),

    remaining:
      roundCurrency(remaining),

    percent:
      roundPercentage(percent),

    status:
      getStatus(percent)
  };
}

function sortCategories(
  categories
) {
  return [...categories].sort(
    (a, b) => {
      const typeOrderA =
        TYPE_ORDER[a.type] || 99;

      const typeOrderB =
        TYPE_ORDER[b.type] || 99;

      if (
        typeOrderA !== typeOrderB
      ) {
        return (
          typeOrderA -
          typeOrderB
        );
      }

      return a.name.localeCompare(
        b.name
      );
    }
  );
}

function createSummary(
  categories
) {
  const totalBudget =
    categories.reduce(
      (sum, category) =>
        sum + category.budget,
      0
    );

  const totalSpent =
    categories.reduce(
      (sum, category) =>
        sum + category.spent,
      0
    );

  const totalRemaining =
    totalBudget -
    totalSpent;

  const overCategories =
    categories.filter(
      (category) =>
        category.status === "over"
    ).length;

  const warningCategories =
    categories.filter(
      (category) =>
        category.status ===
        "warning"
    ).length;

  let status = "good";
  let label = "On track";

  if (overCategories > 0) {
    status = "over";

    label =
      overCategories === 1
        ? "1 category over budget"
        : `${overCategories} categories over budget`;
  } else if (
    warningCategories > 0
  ) {
    status = "warning";

    label =
      warningCategories === 1
        ? "1 category needs attention"
        : `${warningCategories} categories need attention`;
  } else if (
    categories.length === 0
  ) {
    status = "empty";
    label =
      "No active budget categories";
  }

  return {
    status,
    label,

    totalBudget:
      roundCurrency(
        totalBudget
      ),

    totalSpent:
      roundCurrency(
        totalSpent
      ),

    totalRemaining:
      roundCurrency(
        totalRemaining
      ),

    overCategories,

    warningCategories
  };
}

export async function getFinanceBudget() {
  const pages =
    await queryFinanceDataSource(
      "budgetCategories"
    );

  const categories =
    sortCategories(
      pages
        .map(
          parseBudgetCategory
        )
        .filter(
          (category) =>
            category.active &&
            category.budget > 0
        )
    );

  return {
    success: true,

    summary:
      createSummary(categories),

    categories
  };
}
