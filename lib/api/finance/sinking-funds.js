import {
  queryFinanceDataSource
} from "../notion-finance.js";

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
    Number.isFinite(
      rollup.number
    )
  ) {
    return rollup.number;
  }

  if (
    rollup.type === "array" &&
    Array.isArray(
      rollup.array
    )
  ) {
    return rollup.array.reduce(
      (sum, item) => {
        if (
          item?.type ===
            "number" &&
          Number.isFinite(
            item.number
          )
        ) {
          return (
            sum + item.number
          );
        }

        if (
          item?.type ===
            "formula" &&
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
    Number.isFinite(
      formula.number
    )
  ) {
    return formula.number;
  }

  return null;
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

function roundPercentage(value) {
  return Math.round(value);
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
  goalName
) {
  const name =
    String(goalName || "")
      .trim()
      .toLowerCase();

  if (
    name.includes("emergency")
  ) {
    return "shield";
  }

  if (
    name.includes("car") ||
    name.includes("vehicle")
  ) {
    return "car";
  }

  if (
    name.includes("travel") ||
    name.includes("vacation") ||
    name.includes("trip")
  ) {
    return "plane";
  }

  if (
    name.includes("home") ||
    name.includes("house") ||
    name.includes("apartment")
  ) {
    return "house";
  }

  if (
    name.includes("pet") ||
    name.includes("roman")
  ) {
    return "paw";
  }

  if (
    name.includes("medical") ||
    name.includes("health")
  ) {
    return "heart";
  }

  if (
    name.includes("gift") ||
    name.includes("christmas") ||
    name.includes("holiday")
  ) {
    return "gift";
  }

  if (
    name.includes("technology") ||
    name.includes("computer") ||
    name.includes("laptop") ||
    name.includes("phone")
  ) {
    return "laptop";
  }

  if (
    name.includes("moving")
  ) {
    return "truck";
  }

  if (
    name.includes("wedding")
  ) {
    return "rings";
  }

  return "piggy-bank";
}

function getStatus(
  progress
) {
  if (progress >= 100) {
    return "complete";
  }

  return "good";
}

function parseSavingsBucket(
  page
) {
  const name =
    getTitle(
      page,
      "Goal"
    ) || "Untitled Goal";

  const goalAmount =
    Math.max(
      0,
      getNumber(
        page,
        "Goal Amount"
      )
    );

  const currentBalance =
    Math.max(
      0,
      getRollupNumber(
        page,
        "Current Balance"
      )
    );

  const formulaRemaining =
    getFormulaNumber(
      page,
      "Remaining to Goal"
    );

  const remaining =
    formulaRemaining !== null
      ? Math.max(
          0,
          formulaRemaining
        )
      : Math.max(
          0,
          goalAmount -
            currentBalance
        );

  const formulaProgress =
    getFormulaNumber(
      page,
      "Progress"
    );

  let progress;

  if (
    formulaProgress !== null
  ) {
    progress =
      formulaProgress <= 1
        ? formulaProgress * 100
        : formulaProgress;
  } else {
    progress =
      goalAmount > 0
        ? (
            currentBalance /
            goalAmount
          ) * 100
        : 0;
  }

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

    icon:
      iconFromNotion ||
      getFallbackIconName(
        name
      ),

    active:
      getCheckbox(
        page,
        "Active"
      ),

    goal:
      roundCurrency(
        goalAmount
      ),

    saved:
      roundCurrency(
        currentBalance
      ),

    remaining:
      roundCurrency(
        remaining
      ),

    percent:
      roundPercentage(
        progress
      ),

    status:
      getStatus(progress)
  };
}

function sortFunds(funds) {
  return [...funds].sort(
    (a, b) => {
      if (
        a.status ===
          "complete" &&
        b.status !==
          "complete"
      ) {
        return 1;
      }

      if (
        a.status !==
          "complete" &&
        b.status ===
          "complete"
      ) {
        return -1;
      }

      return a.name.localeCompare(
        b.name
      );
    }
  );
}

function createSummary(funds) {
  const totalGoal =
    funds.reduce(
      (sum, fund) =>
        sum + fund.goal,
      0
    );

  const totalSaved =
    funds.reduce(
      (sum, fund) =>
        sum + fund.saved,
      0
    );

  const totalRemaining =
    funds.reduce(
      (sum, fund) =>
        sum + fund.remaining,
      0
    );

  const completedFunds =
    funds.filter(
      (fund) =>
        fund.status ===
        "complete"
    ).length;

  const activeFunds =
    funds.length -
    completedFunds;

  let status = "good";
  let label;

  if (funds.length === 0) {
    status = "empty";
    label =
      "No active sinking funds";
  } else if (
    completedFunds ===
    funds.length
  ) {
    status = "complete";
    label =
      completedFunds === 1
        ? "Goal reached"
        : "All goals reached";
  } else if (
    completedFunds > 0
  ) {
    label =
      completedFunds === 1
        ? "1 goal reached"
        : `${completedFunds} goals reached`;
  } else {
    label =
      activeFunds === 1
        ? "1 goal in progress"
        : `${activeFunds} goals in progress`;
  }

  return {
    status,

    label,

    totalGoal:
      roundCurrency(
        totalGoal
      ),

    totalSaved:
      roundCurrency(
        totalSaved
      ),

    totalRemaining:
      roundCurrency(
        totalRemaining
      ),

    completedFunds,

    activeFunds
  };
}

export async function getFinanceSinkingFunds() {
  const pages =
    await queryFinanceDataSource(
      "savingsBuckets"
    );

  const funds =
    sortFunds(
      pages
        .map(
          parseSavingsBucket
        )
        .filter(
          (fund) =>
            fund.active &&
            fund.goal > 0
        )
    );

  return {
    success: true,

    summary:
      createSummary(funds),

    funds
  };
}
