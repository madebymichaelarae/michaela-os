const API_URL = "/api/finance?view=header";

const elements = {
  available: document.querySelector(
    "#available-to-spend"
  ),
  days: document.querySelector("#payday-days"),
  daysLabel: document.querySelector(
    "#payday-days-label"
  ),
  paydayDate: document.querySelector(
    "#payday-date"
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

function getNextPayday(now = new Date()) {
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();

  if (today <= 15) {
    return new Date(year, month, 15);
  }

  return new Date(year, month + 1, 15);
}

function getCalendarDayDifference(start, end) {
  const startDate = new Date(
    start.getFullYear(),
    start.getMonth(),
    start.getDate()
  );

  const endDate = new Date(
    end.getFullYear(),
    end.getMonth(),
    end.getDate()
  );

  const millisecondsPerDay =
    24 * 60 * 60 * 1000;

  return Math.round(
    (endDate.getTime() - startDate.getTime()) /
      millisecondsPerDay
  );
}

function renderPaydayCountdown() {
  const today = new Date();
  const payday = getNextPayday(today);
  const daysUntilPayday =
    getCalendarDayDifference(today, payday);

  elements.days.textContent =
    String(daysUntilPayday);

  elements.daysLabel.textContent =
    daysUntilPayday === 1 ? "day" : "days";

  if (daysUntilPayday === 0) {
    elements.days.textContent = "Today";
    elements.daysLabel.textContent = "";
    elements.paydayDate.textContent =
      "It’s payday!";
    return;
  }

  elements.paydayDate.textContent =
    payday.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric"
    });
}

function renderHeader(data) {
  const header = data?.header || data;

  elements.available.textContent =
    formatCurrency(header.availableToSpend);
}

function showError(message) {
  console.error(message);

  elements.available.textContent = "—";
  elements.error.hidden = false;
}

async function loadFinanceHeader() {
  elements.error.hidden = true;
  renderPaydayCountdown();

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
