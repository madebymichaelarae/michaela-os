const API_URL =
  "/api/finance?view=budget";

const DONUT_RADIUS = 42;
const DONUT_CIRCUMFERENCE =
  2 *
  Math.PI *
  DONUT_RADIUS;

const elements = {
  grid: document.querySelector(
    "#budget-grid"
  ),

  empty: document.querySelector(
    "#budget-empty"
  ),

  count: document.querySelector(
    "#budget-count"
  ),

  summary: document.querySelector(
    "#budget-summary"
  ),

  total: document.querySelector(
    "#budget-total"
  ),

  spent: document.querySelector(
    "#budget-spent"
  ),

  remaining:
    document.querySelector(
      "#budget-remaining"
    ),

  error: document.querySelector(
    "#finance-budget-error"
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

function formatRemaining(value) {
  const amount =
    Number(value);

  if (
    !Number.isFinite(amount)
  ) {
    return "—";
  }

  if (amount < 0) {
    return `${formatCurrency(
      Math.abs(amount)
    )} over`;
  }

  if (amount === 0) {
    return "$0.00 left";
  }

  return `${formatCurrency(
    amount
  )} left`;
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
    "shopping-cart":
      "M3 3h2l1.8 9.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L20 6H6M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2M17 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2",

    car:
      "M5 17h14M6 17v2M18 17v2M5 13l1.5-5h11L19 13M4 13h16v4H4zM7 13h.01M17 13h.01",

    utensils:
      "M7 3v8M4 3v5a3 3 0 0 0 6 0V3M7 11v10M17 3v18M17 3c-2 2-3 5-3 8h3",

    "shopping-bag":
      "M6 8h12l1 13H5L6 8zM9 9V6a3 3 0 0 1 6 0v3",

    repeat:
      "M17 1l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3",

    house:
      "M3 11l9-8 9 8M5 10v11h14V10M9 21v-7h6v7",

    bolt:
      "M13 2L4 14h7l-1 8 9-12h-7l1-8z",

    wifi:
      "M5 12a11 11 0 0 1 14 0M8.5 15.5a6 6 0 0 1 7 0M12 19h.01",

    heart:
      "M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6a5.5 5.5 0 0 0 1-8.8z",

    paw:
      "M8.5 12c-2.5 0-4.5 2.2-4.5 4.8C4 19.5 6 21 8.5 21c1.3 0 2.3-.5 3.5-.5s2.2.5 3.5.5c2.5 0 4.5-1.5 4.5-4.2 0-2.6-2-4.8-4.5-4.8-1.4 0-2.5.6-3.5 1.5-1-.9-2.1-1.5-3.5-1.5zM6 9a2 3 0 1 0 0-6 2 3 0 0 0 0 6M18 9a2 3 0 1 0 0-6 2 3 0 0 0 0 6M11 7a2 3 0 1 0 0-6 2 3 0 0 0 0 6M15 7a2 3 0 1 0 0-6 2 3 0 0 0 0 6",

    plane:
      "M22 2L9 15M22 2l-6 20-4-9-9-4 19-7z",

    ticket:
      "M3 7h18v4a2 2 0 0 0 0 4v4H3v-4a2 2 0 0 0 0-4V7zM13 7v12",

    receipt:
      "M6 2l2 2 2-2 2 2 2-2 2 2 2-2v20l-2-2-2 2-2-2-2 2-2-2-2 2V2zM9 9h6M9 13h6M9 17h4",

    target:
      "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",

    "piggy-bank":
      "M19 10c1.5 0 2.5-1 3-2v6c-.5 1-1.2 1.7-2 2l-1 5h-4l-.5-3h-5L9 21H5l-1-6c-1.3-1-2-2.4-2-4 0-3.3 3.6-6 8-6h3c2.7 0 5 1 6.5 3M16 5V3h-4M7 10h.01",

    wallet:
      "M4 5h14a2 2 0 0 1 2 2v12H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12M16 12h6v4h-6a2 2 0 0 1 0-4z"
  };

  return (
    icons[iconName] ||
    icons.wallet
  );
}

function createCategoryIcon(
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

function createDonut(
  category
) {
  const wrapper =
    document.createElement(
      "div"
    );

  wrapper.className =
    "finance-budget__donut";

  wrapper.dataset.status =
    category.status;

  const svg =
    createSvgElement(
      "svg",
      {
        viewBox:
          "0 0 100 100",
        role: "img",
        "aria-label":
          `${category.name}: ${category.percent}% of budget used`
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
        category.percent,
        0
      ),
      100
    );

  const dashLength =
    DONUT_CIRCUMFERENCE *
    (visiblePercent / 100);

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
    `${category.percent}%`;

  svg.append(
    background,
    progress,
    percentage
  );

  wrapper.append(svg);

  return wrapper;
}

function createBudgetCategory(
  category
) {
  const article =
    document.createElement(
      "article"
    );

  article.className =
    "finance-budget__category";

  article.dataset.status =
    category.status;

  article.title =
    `${category.name}\n` +
    `Spent: ${formatCurrency(
      category.spent
    )}\n` +
    `Budget: ${formatCurrency(
      category.budget
    )}\n` +
    `Remaining: ${formatCurrency(
      category.remaining
    )}`;

  const donut =
    createDonut(category);

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
    createCategoryIcon(
      category.icon
    )
  );

  const name =
    document.createElement(
      "h2"
    );

  name.className =
    "finance-budget__category-name";

  name.textContent =
    category.name;

  const remaining =
    document.createElement(
      "p"
    );

  remaining.className =
    "finance-budget__category-remaining";

  remaining.textContent =
    formatRemaining(
      category.remaining
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
      ? "1 active category"
      : `${count} active categories`;
}

function renderSummary(summary) {
  elements.summary.textContent =
    summary?.label ||
    "On track";

  elements.summary.dataset.status =
    summary?.status ||
    "good";

  elements.total.textContent =
    formatCurrency(
      summary?.totalBudget
    );

  elements.spent.textContent =
    formatCurrency(
      summary?.totalSpent
    );

  elements.remaining.textContent =
    formatCurrency(
      summary?.totalRemaining
    );

  elements.remaining.dataset.status =
    Number(
      summary?.totalRemaining
    ) < 0
      ? "over"
      : "good";
}

function renderBudget(data) {
  const categories =
    Array.isArray(
      data?.categories
    )
      ? data.categories
      : [];

  elements.grid.replaceChildren();

  elements.grid.setAttribute(
    "aria-busy",
    "false"
  );

  renderCount(
    categories.length
  );

  renderSummary(
    data?.summary
  );

  if (
    categories.length === 0
  ) {
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

  for (
    const category of categories
  ) {
    fragment.append(
      createBudgetCategory(
        category
      )
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
    "Finance Budget Error:",
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
    "Budget data unavailable";

  elements.summary.dataset.status =
    "over";

  elements.total.textContent =
    "—";

  elements.spent.textContent =
    "—";

  elements.remaining.textContent =
    "—";

  if (elements.error) {
    elements.error.textContent =
      error?.message ||
      "Budget data could not be loaded.";

    elements.error.hidden =
      false;
  }
}

async function loadFinanceBudget() {
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

    renderBudget(data);
  } catch (error) {
    showError(error);
  }
}

loadFinanceBudget();
