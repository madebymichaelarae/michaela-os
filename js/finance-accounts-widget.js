const API_URL =
  "/api/finance?view=accounts";

const elements = {
  list: document.querySelector(
    "#accounts-list"
  ),

  empty: document.querySelector(
    "#accounts-empty"
  ),

  count: document.querySelector(
    "#account-count"
  ),

  footerLabel: document.querySelector(
    "#net-worth-label"
  ),

  footerValue: document.querySelector(
    "#net-worth-value"
  ),

  error: document.querySelector(
    "#finance-accounts-error"
  )
};

function formatCurrency(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "—";
  }

  return new Intl.NumberFormat(
    "en-US",
    {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }
  ).format(amount);
}

function getAccountDescription(type) {
  switch (type) {
    case "Debit":
      return "Available";

    case "Credit":
      return "Owed";

    case "Savings":
    case "Cash Savings":
      return "Saved";

    case "Cash":
      return "Cash";

    default:
      return type || "Account";
  }
}

function createAccountItem(account) {
  const item =
    document.createElement("li");

  item.className =
    "finance-accounts__item";

  const accountArea =
    document.createElement("div");

  accountArea.className =
    "finance-accounts__account";

  const icon =
    document.createElement("span");

  icon.className =
    "finance-accounts__account-icon";

  icon.setAttribute(
    "aria-hidden",
    "true"
  );

  icon.textContent =
    account?.icon || "◉";

  const copy =
    document.createElement("div");

  copy.className =
    "finance-accounts__account-copy";

  const name =
    document.createElement("p");

  name.className =
    "finance-accounts__account-name";

  name.textContent =
    account?.name ||
    "Untitled Account";

  const description =
    document.createElement("p");

  description.className =
    "finance-accounts__account-description";

  description.textContent =
    getAccountDescription(
      account?.type
    );

  const balance =
    document.createElement("p");

  balance.className =
    "finance-accounts__balance";

  const displayValue =
    account?.displayBalance ??
    account?.balance;

  balance.textContent =
    formatCurrency(displayValue);

  copy.append(
    name,
    description
  );

  accountArea.append(
    icon,
    copy
  );

  item.append(
    accountArea,
    balance
  );

  return item;
}

function renderAccountCount(count) {
  elements.count.textContent =
    count === 1
      ? "1 active account"
      : `${count} active accounts`;
}

function renderAccounts(data) {
  const accounts =
    Array.isArray(data?.accounts)
      ? data.accounts
      : [];

  elements.list.replaceChildren();

  elements.list.setAttribute(
    "aria-busy",
    "false"
  );

  renderAccountCount(
    accounts.length
  );

  if (accounts.length === 0) {
    elements.list.hidden = true;
    elements.empty.hidden = false;
  } else {
    elements.list.hidden = false;
    elements.empty.hidden = true;

    const fragment =
      document.createDocumentFragment();

    for (const account of accounts) {
      fragment.append(
        createAccountItem(account)
      );
    }

    elements.list.append(fragment);
  }

  elements.footerLabel.textContent =
    data?.footer?.label ||
    "Net Worth";

  elements.footerValue.textContent =
    formatCurrency(
      data?.footer?.value
    );
}

function showError(error) {
  console.error(
    "Finance Accounts Error:",
    error
  );

  elements.list.replaceChildren();
  elements.list.hidden = true;

  elements.list.setAttribute(
    "aria-busy",
    "false"
  );

  elements.empty.hidden = true;
  elements.count.textContent =
    "Unable to load";

  elements.footerValue.textContent =
    "—";

  if (elements.error) {
    elements.error.textContent =
      error?.message ||
      "Account data could not be loaded.";

    elements.error.hidden = false;
  }
}

async function loadFinanceAccounts() {
  if (elements.error) {
    elements.error.hidden = true;
  }

  try {
    const response = await fetch(
      API_URL,
      {
        method: "GET",

        headers: {
          Accept: "application/json"
        },

        cache: "no-store"
      }
    );

    if (!response.ok) {
      throw new Error(
        `Finance request failed with status ${response.status}.`
      );
    }

    const data =
      await response.json();

    if (!data?.success) {
      throw new Error(
        data?.details ||
        data?.error ||
        "The finance API returned an error."
      );
    }

    renderAccounts(data);
  } catch (error) {
    showError(error);
  }
}

loadFinanceAccounts();
