import {
  queryFinanceDataSource
} from "../notion-finance.js";

const PAYDAY_DAY = 15;

function getProperty(page, propertyName) {
  return page?.properties?.[propertyName] || null;
}

function getCheckbox(page, propertyName) {
  return Boolean(
    getProperty(page, propertyName)?.checkbox
  );
}

function getSelect(page, propertyName) {
  return (
    getProperty(page, propertyName)
      ?.select?.name || null
  );
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

function roundCurrency(value) {
  return Math.round(
    (Number(value) + Number.EPSILON) * 100
  ) / 100;
}

function parseAccount(page) {
  const startingBalance = getNumber(
    page,
    "Starting Balance"
  );

  const transactionBalance =
    getRollupNumber(
      page,
      "Current Balance"
    );

  return {
    id: page.id,

    name:
      getTitle(page, "Name") ||
      "Untitled Account",

    type:
      getSelect(page, "Type") ||
      "Unknown",

    active:
      getCheckbox(page, "Active"),

    startingBalance:
      roundCurrency(startingBalance),

    transactionBalance:
      roundCurrency(transactionBalance),

    currentBalance:
      roundCurrency(
        startingBalance +
          transactionBalance
      )
  };
}

function calculateAccountTotals(accounts) {
  const totals = {
    debit: 0,
    cash: 0,
    savings: 0,
    cashSavings: 0,
    credit: 0
  };

  for (const account of accounts) {
    switch (account.type) {
      case "Debit":
        totals.debit +=
          account.currentBalance;
        break;

      case "Cash":
        totals.cash +=
          account.currentBalance;
        break;

      case "Savings":
        totals.savings +=
          account.currentBalance;
        break;

      case "Cash Savings":
        totals.cashSavings +=
          account.currentBalance;
        break;

      case "Credit":
        totals.credit += Math.abs(
          account.currentBalance
        );
        break;

      default:
        break;
    }
  }

  return Object.fromEntries(
    Object.entries(totals).map(
      ([key, value]) => [
        key,
        roundCurrency(value)
      ]
    )
  );
}

function calculateAvailableToSpend(totals) {
  /*
   * Available to Spend currently means:
   *
   * Debit accounts
   * + spendable cash
   * - outstanding credit balances
   *
   * Savings and Cash Savings are deliberately
   * excluded because they are not everyday
   * spending money.
   */

  return roundCurrency(
    totals.debit +
      totals.cash -
      totals.credit
  );
}

function getNextPayday(today = new Date()) {
  const year = today.getFullYear();
  const month = today.getMonth();

  if (today.getDate() <= PAYDAY_DAY) {
    return new Date(
      year,
      month,
      PAYDAY_DAY
    );
  }

  return new Date(
    year,
    month + 1,
    PAYDAY_DAY
  );
}

function getDaysUntilPayday(
  today,
  payday
) {
  const start = Date.UTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  const end = Date.UTC(
    payday.getFullYear(),
    payday.getMonth(),
    payday.getDate()
  );

  const millisecondsPerDay =
    24 * 60 * 60 * 1000;

  return Math.max(
    0,
    Math.round(
      (end - start) /
        millisecondsPerDay
    )
  );
}

export async function getFinanceHeader() {
  const accountPages =
    await queryFinanceDataSource(
      "accounts"
    );

  const accounts = accountPages
    .map(parseAccount)
    .filter(
      (account) => account.active
    );

  const accountTotals =
    calculateAccountTotals(accounts);

  const availableToSpend =
    calculateAvailableToSpend(
      accountTotals
    );

  const today = new Date();
  const nextPayday =
    getNextPayday(today);

  const daysRemaining =
    getDaysUntilPayday(
      today,
      nextPayday
    );

  return {
    success: true,

    header: {
      availableToSpend,

      payday: {
        daysRemaining,

        nextDate:
          nextPayday.toLocaleDateString(
            "en-US",
            {
              month: "long",
              day: "numeric"
            }
          )
      },

      quote:
        "Keep working, Michaela."
    },

    accounts: {
      totals: accountTotals,
      activeCount: accounts.length,
      items: accounts
    }
  };
}
