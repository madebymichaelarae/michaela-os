const API_URL = "/api/finance?view=header";

const elements = {
  available: document.querySelector(
    "#available-to-spend"
  ),

  days: document.querySelector(
    "#payday-days"
  ),

  daysLabel: document.querySelector(
    "#payday-days-label"
  ),

  paydayDate: document.querySelector(
    "#payday-date"
  ),

  quote: document.querySelector(
    "#finance-quote"
  ),

  error: document.querySelector(
    "#finance-header-error"
  )
};

function formatCurrency(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "—";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

function renderHeader(data) {
  const header = data?.header;

  if (!header) {
    throw new Error(
      "Finance header data is missing."
    );
  }

  const daysRemaining = Number(
    header.payday?.daysRemaining
  );

  elements.available.textContent =
    formatCurrency(header.availableToSpend);

  if (Number.isFinite(daysRemaining)) {
    elements.days.textContent =
      daysRemaining === 0
        ? "Today"
        : String(daysRemaining);

    elements.daysLabel.textContent =
      daysRemaining === 0
        ? ""
        : daysRemaining === 1
          ? "day"
          : "days";
  } else {
    elements.days.textContent = "—";
    elements.daysLabel.textContent = "days";
  }

  elements.paydayDate.textContent =
    daysRemaining === 0
      ? "It’s payday!"
      : header.payday?.nextDate ||
        "Next payday";

  if (elements.quote) {
    elements.quote.textContent =
      header.quote ||
      "Keep working, Michaela.";
  }
}

function showError(error) {
  console.error(error);

  elements.available.textContent = "—";
  elements.days.textContent = "—";
  elements.daysLabel.textContent = "days";
  elements.paydayDate.textContent =
    "Unable to load";

  if (elements.error) {
    elements.error.hidden = false;
  }
}

async function loadFinanceHeader() {
  if (elements.error) {
    elements.error.hidden = true;
  }

  try {
    const response = await fetch(API_URL, {
      method: "GET",

      headers: {
        Accept: "application/json"
      },

      cache: "no-store"
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.details ||
          data.error ||
          "Unable to load finance header."
      );
    }

    renderHeader(data);
  } catch (error) {
    showError(error);
  }
}

loadFinanceHeader();
