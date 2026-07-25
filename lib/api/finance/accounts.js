import {
  queryFinanceDataSource
} from "../notion-finance.js";

const ACCOUNT_TYPE_ORDER = {
  Debit: 1,
  Credit: 2,
  Savings: 3,
  "Cash Savings": 4,
  Cash: 5
};

function getProperty(page, propertyName) {
  return page?.properties?.[propertyName] || null;
}

function getTitle(page, propertyName) {
  const title =
    getProperty(page, propertyName)?.title;

  if (!Array.isArray(title)) {
    return "";
  }

  return title
    .map((item) => item?.plain_text || "")
    .join("")
    .trim();
}

function getSelect(page, propertyName) {
  return (
    getProperty(page, propertyName)
      ?.select?.name || null
  );
}

function getCheckbox(page, propertyName) {
  return Boolean(
    getProperty(page, propertyName)
      ?.checkbox
  );
}

function getNumber(page, propertyName) {
  const value =
    getProperty(page, propertyName)?.number;

  return Number.isFinite(value)
    ? value
    : 0;
}

function getRollupNumber(page, propertyName) {
  const rollup =
    getProperty(page, propertyName)?.rollup;

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
          Number.isFinite(item.number)
        ) {
          return sum + item.number;
        }

        return sum;
      },
      0
    );
  }

  return 0;
}

function round(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function getIcon(type) {
  switch (type) {
    case "Debit":
      return "💳";
    case "Credit":
      return "💸";
    case "Savings":
      return "🏦";
    case "Cash Savings":
      return "💰";
    case "Cash":
      return "💵";
    default:
      return "◉";
  }
}

function parseAccount(page) {
  const type =
    getSelect(page, "Type") ||
    "Other";

  const balance =
    getNumber(page, "Starting Balance") +
    getRollupNumber(page, "Current Balance");

  return {
    id: page.id,
    name:
      getTitle(page, "Name") ||
      "Untitled",

    type,

    icon: getIcon(type),

    active:
      getCheckbox(page, "Active"),

    balance: round(balance),

    displayBalance:
      type === "Credit"
        ? Math.abs(round(balance))
        : round(balance)
  };
}

function sortAccounts(accounts) {
  return [...accounts].sort((a, b) => {
    const orderA =
      ACCOUNT_TYPE_ORDER[a.type] || 99;

    const orderB =
      ACCOUNT_TYPE_ORDER[b.type] || 99;

    if (orderA !== orderB) {
      return orderA - orderB;
    }

    return a.name.localeCompare(b.name);
  });
}

export async function getFinanceAccounts() {
  const pages =
    await queryFinanceDataSource(
      "accounts"
    );

  const accounts = sortAccounts(
    pages
      .map(parseAccount)
      .filter((a) => a.active)
  );

  let netWorth = 0;

  for (const account of accounts) {
    if (account.type === "Credit") {
      netWorth -= account.displayBalance;
    } else {
      netWorth += account.balance;
    }
  }

  return {
    success: true,

    accounts,

    footer: {
      label: "Net Worth",
      value: round(netWorth)
    }
  };
}
