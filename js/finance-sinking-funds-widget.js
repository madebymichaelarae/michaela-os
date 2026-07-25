const API_URL =
  "/api/finance?view=sinking-funds";

const DONUT_RADIUS = 42;

const DONUT_CIRCUMFERENCE =
  2 *
  Math.PI *
  DONUT_RADIUS;

const elements = {
  grid: document.querySelector(
    "#sinking-funds-grid"
  ),

  empty: document.querySelector(
    "#sinking-funds-empty"
  ),

  count: document.querySelector(
    "#sinking-funds-count"
  ),

  summary: document.querySelector(
    "#sinking-funds-summary"
  ),

  totalGoal:
    document.querySelector(
      "#sinking-funds-total-goal"
    ),

  totalSaved:
    document.querySelector(
      "#sinking-funds-total-saved"
    ),

  totalRemaining:
    document.querySelector(
      "#sinking-funds-total-remaining"
    ),

  error: document.querySelector(
    "#finance-sinking-funds-error"
  )
};

function formatCurrency(value) {
  const amount =
    Number(value);

  if (
    !Number.isFinite(amount)
  ) {
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

function formatRemaining(
  value,
  percent
) {
  const amount =
    Number(value);

  if (
    Number(percent) >= 100
  ) {
    return "Goal reached";
  }

  if (
    !Number.isFinite(amount)
  ) {
    return "—";
  }

  return `${formatCurrency(
    amount
  )} to goal`;
}

function createSvgElement(
  tagName,
  attributes = {}
) {
  const element =
    document.createElementNS(
      "http://www.w3.org/2000/svg",
      tagName
    );

  for (
    const [
      name,
      value
    ] of Object.entries(
      attributes
    )
  ) {
    element.setAttribute(
      name,
      String(value)
    );
  }

  return element;
}

function getIconPath(
  iconName
) {
  const icons = {
    "piggy-bank":
      "M19 10c1.5 0 2.5-1 3-2v6c-.5 1-1.2 1.7-2 2l-1 5h-4l-.5-3h-5L9 21H5l-1-6c-1.3-1-2-2.4-2-4 0-3.3 3.6-6 8-6h3c2.7 0 5 1 6.5 3M16 5V3h-4M7 10h.01",

    target:
      "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",

    shield:
      "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",

    car:
      "M5 17h14M6 17v2M18 17v2M5 13l1.5-5h11L19 13M4 13h16v4H4zM7 13h.01M17 13h.01",

    plane:
      "M22 2L9 15M22 2l-6 20-4-9-9-4 19-7z",

    house:
      "M3 11l9-8 9 8M5 10v11h14V10M9 21v-7h6v7",

    paw:
      "M8.5 12c-2.5 0-4.5 2.2-4.5 4.8C4 19.5 6 21 8.5 21c1.3 0 2.3-.5 3.5-.5s2.2.5 3.5.5c2.5 0 4.5-1.5 4.5-4.2 0-2.6-2-4.8-4.5-4.8-1.4 0-2.5.6-3.5 1.5-1-.9-2.1-1.5-3.5-1.5zM6 9a2 3 0 1 0 0-6 2 3 0 0 0 0 6M18 9a2 3 0 1 0 0-6 2 3 0 0 0 0 6M11 7a2 3 0 1 0 0-6 2 3 0 0 0 0 6M15 7a2 3 0 1 0 0-6 2 3 0 0 0 0 6",

    heart:
      "M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6a5.5 5.5 0 0 0 1-8.8z",

    gift:
      "M20 12v10H4V12M2 7h20v5H2V7zM12 7v15M12 7H7.5A2.5 2.5 0 1 1 10 4.5L12 7zM12 7h4.5A2.5 2.5 0 1 0 14 4.5L12 7z",

    laptop:
      "M4 4h16v12H4V4zM2 20h20M8 20l1-4h6l1 4",

    truck:
      "M3 6h11v11H3V6zM14 10h4l3 3v4h-7v-7zM7 21a2 2 0 1 0 0-4 2 2 0 0 0 0 4M18 21a2 2 0 1 0 0-4 2 2 0 0 0 0 4",

    rings:
      "M9 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM15 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12z"
  };

  return (
    icons[iconName] ||
    icons["piggy-bank"]
  );
}

function createFundIcon(
  iconName
) {
  const svg =
    createSvgElement(
      "svg",
      {
        viewBox:
          "0 0 24 24",
        fill: "none",
        "aria-hidden": "true",
        focusable: "false"
      }
    );

  svg.classList.add(
    "finance-budget__icon-svg"
  );

  const path =
    createSvgElement(
      "path",
      {
        d: getIconPath(
          iconName
        ),
        stroke:
          "currentColor",
        "stroke-width": 1.8,
        "stroke-linecap":
          "round",
        "stroke-linejoin":
          "round"
      }
    );

  svg.append(path);

  return svg;
}

function createDonut(fund) {
  const wrapper =
    document.createElement(
      "div"
    );

  wrapper.className =
    "finance-budget__donut";

  wrapper.dataset.status =
    fund.status;

  const svg =
    createSvgElement(
      "svg",
      {
        viewBox:
          "0 0 100 100",
        role: "img",
        "aria-label":
          `${fund.name}: ${fund.percent}% of goal saved`
      }
    );

  svg.classList.add(
    "finance-budget__donut-svg"
  );

  const background =
    createSvgElement(
      "circle",
      {
        cx: 50,
        cy: 50,
        r: DONUT_RADIUS
      }
    );

  background.classList.add(
    "finance-budget__donut-track"
  );

  const progress =
    createSvgElement(
      "circle",
      {
        cx: 50,
        cy: 50,
        r: DONUT_RADIUS
      }
    );

  progress.classList.add(
    "finance-budget__donut-progress"
  );

  const visiblePercent =
    Math.min(
      Math.max(
        fund.percent,
        0
      ),
      100
    );

  const dashLength =
    DONUT_CIRCUMFERENCE *
    (
      visiblePercent /
      100
    );

  progress.style.strokeDasharray =
    `${dashLength} ${DONUT_CIRCUMFERENCE}`;

  const percentage =
    createSvgElement(
      "text",
      {
        x: 50,
        y: 51,
        "text-anchor":
          "middle",
        "dominant-baseline":
          "middle"
      }
    );

  percentage.classList.add(
    "finance-budget__donut-percentage"
  );

  percentage.textContent =
    `${fund.percent}%`;

  svg.append(
    background,
    progress,
    percentage
  );

  wrapper.append(svg);

  return wrapper;
}

function createFund(fund) {
  const article =
    document.createElement(
      "article"
    );

  article.className =
    "finance-budget__category";

  article.dataset.status =
    fund.status;

  article.title =
    `${fund.name}\n` +
    `Saved: ${formatCurrency(
      fund.saved
    )}\n` +
    `Goal: ${formatCurrency(
      fund.goal
    )}\n` +
    `Remaining: ${formatCurrency(
      fund.remaining
    )}`;

  const donut =
    createDonut(fund);

  const nameRow =
    document.createElement(
      "div"
    );

  nameRow.className =
    "finance-budget__category-name-row";

  const icon =
    document.createElement(
      "span"
    );

  icon.className =
    "finance-budget__category-icon";

  icon.append(
    createFundIcon(
      fund.icon
    )
  );

  const name =
    document.createElement(
      "h2"
    );

  name.className =
    "finance-budget__category-name";

  name.textContent =
    fund.name;

  const remaining =
    document.createElement(
      "p"
    );

  remaining.className =
    "finance-budget__category-remaining";

  remaining.textContent =
    formatRemaining(
      fund.remaining,
      fund.percent
    );

  nameRow.append(
    icon,
    name
  );

  article.append(
    donut,
    nameRow,
    remaining
  );

  return article;
}

function renderCount(count) {
  elements.count.textContent =
    count === 1
      ? "1 active fund"
      : `${count} active funds`;
}

function renderSummary(summary) {
  elements.summary.textContent =
    summary?.label ||
    "Goals in progress";

  elements.summary.dataset.status =
    summary?.status ||
    "good";

  elements.totalGoal.textContent =
    formatCurrency(
      summary?.totalGoal
    );

  elements.totalSaved.textContent =
    formatCurrency(
      summary?.totalSaved
    );

  elements.totalRemaining.textContent =
    formatCurrency(
      summary?.totalRemaining
    );
}

function renderSinkingFunds(data) {
  const funds =
    Array.isArray(
      data?.funds
    )
      ? data.funds
      : [];

  elements.grid.replaceChildren();

  elements.grid.setAttribute(
    "aria-busy",
    "false"
  );

  renderCount(funds.length);

  renderSummary(
    data?.summary
  );

  if (funds.length === 0) {
    elements.grid.hidden =
      true;

    elements.empty.hidden =
      false;

    return;
  }

  elements.grid.hidden =
    false;

  elements.empty.hidden =
    true;

  const fragment =
    document.createDocumentFragment();

  for (const fund of funds) {
    fragment.append(
      createFund(fund)
    );
  }

  elements.grid.append(
    fragment
  );

  requestAnimationFrame(
    () => {
      elements.grid.classList.add(
        "is-loaded"
      );
    }
  );
}

function showError(error) {
  console.error(
    "Finance Sinking Funds Error:",
    error
  );

  elements.grid.replaceChildren();

  elements.grid.hidden =
    true;

  elements.grid.setAttribute(
    "aria-busy",
    "false"
  );

  elements.empty.hidden =
    true;

  elements.count.textContent =
    "Unable to load";

  elements.summary.textContent =
    "Sinking funds unavailable";

  elements.summary.dataset.status =
    "over";

  elements.totalGoal.textContent =
    "—";

  elements.totalSaved.textContent =
    "—";

  elements.totalRemaining.textContent =
    "—";

  if (elements.error) {
    elements.error.textContent =
      error?.message ||
      "Sinking funds could not be loaded.";

    elements.error.hidden =
      false;
  }
}

async function loadSinkingFunds() {
  if (elements.error) {
    elements.error.hidden =
      true;
  }

  try {
    const response =
      await fetch(
        API_URL,
        {
          method: "GET",

          headers: {
            Accept:
              "application/json"
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

    renderSinkingFunds(data);
  } catch (error) {
    showError(error);
  }
}

loadSinkingFunds();
