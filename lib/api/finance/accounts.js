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
  const number =
    getProperty(page, propertyName)
      ?.number;

  return Number.isFinite(number)
    ? number
    : 0;
}

function getRollupNumber(
  page,
  propertyName
) {
  const rollup =
    getProperty(page, propertyName)
      ?.rollup;

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
      (total, item) => {
        if (
          item?.type === "number" &&
          Number.isFinite(item.number)
        ) {
          return total + item.number;
        }

        return total;
      },
      0
    );
  }

  return 0;
}

function roundCurrency(value) {
  return (
    Math.round(
      (Number(value) +
        Number.EPSILON) *
        100
    ) / 100
  );
}

function getAccountIcon(type) {
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
  const name =
    getTitle(page, "Name") ||
    "Untitled Account";

  const type =
    getSelect(page, "Type") ||
    "Other";

  const startingBalance =
    getNumber(
      page,
      "Starting Balance"
    );

  const transactionBalance =
    getRollupNumber(
      page,
      "Current Balance"
    );

  const currentBalance =
    roundCurrency(
      startingBalance +
        transactionBalance
    );

  return {
    id: page.id,
    name,
    type,
    icon: getAccountIcon(type),

    active:
      getCheckbox(page, "Active"),

    startingBalance:
      roundCurrency(
        startingBalance
      ),

    transactionBalance:
      roundCurrency(
        transactionBalance
      ),

    currentBalance,

    displayBalance:
      type === "Credit"
        ? Math.abs(currentBalance)
        : currentBalance
  };
}

function sortAccounts(accounts) {
  return [...accounts].sort(
    (accountA, accountB) => {
      const typeA =
        ACCOUNT_TYPE_ORDER[
          accountA.type
        ] || 99;

      const typeB =
        ACCOUNT_TYPE_ORDER[
          accountB.type
        ] || 99;

      if (typeA !== typeB) {
        return typeA - typeB;
      }

      return accountA.name.localeCompare(
        accountB.name
      );
    }
  );
}

function calculateTotals(accounts) {
  const totals = {
    available: 0,
    debit: 0,
    credit: 0,
    savings: 0,
    cashSavings: 0,
    cash: 0,
    netWorth: 0
  };

  for (const account of accounts) {
    switch (account.type) {
      case "Debit":
        totals.debit +=
          account.currentBalance;
        break;

      case "Credit":
        totals.credit += Math.abs(
          account.currentBalance
        );
        break;

      case "Savings":
        totals.savings +=
          account.currentBalance;
        break;

      case "Cash Savings":
        totals.cashSavings +=
          account.currentBalance;
        break;

      case "Cash":
        totals.cash +=
          account.currentBalance;
        break;

      default:
        break;
    }
  }

  totals.available =
    totals.debit +
    totals.cash -
    totals.credit;

  totals.netWorth =
    totals.debit +
    totals.cash +
    totals.savings +
    totals.cashSavings -
    totals.credit;

  return Object.fromEntries(
    Object.entries(totals).map(
      ([key, value]) => [
        key,
        roundCurrency(value)
      ]
    )
  );
}

export async function getFinanceAccounts() {
  const pages =
    await queryFinanceDataSource(
      "accounts"
    );

  const accounts = sortAccounts(
    pages
      .map(parseAccount)
      .filter(
        (account) =>
          account.active
      )
  );

  const totals =
    calculateTotals(accounts);

  return {
    success: true,

    summary: {
      activeAccounts:
        accounts.length,

      available:
        totals.available,

      totalSaved:
        roundCurrency(
          totals.savings +
            totals.cashSavings
        ),

      creditOwed:
        totals.credit,

      netWorth:
        totals.netWorth
    },

    totals,
    accounts
  };
}
