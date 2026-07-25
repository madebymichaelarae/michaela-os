const API_URL =
  "/api/finance?view=bills";

const contentElement =
  document.getElementById(
    "bills-content"
  );

function formatCurrency(
  value
) {
  const amount =
    Number(value);

  if (
    !Number.isFinite(
      amount
    )
  ) {
    return "$0";
  }

  const hasCents =
    Math.round(
      amount * 100
    ) %
      100 !==
    0;

  return new Intl.NumberFormat(
    "en-US",
    {
      style: "currency",
      currency: "USD",
      minimumFractionDigits:
        hasCents
          ? 2
          : 0,
      maximumFractionDigits:
        hasCents
          ? 2
          : 0
    }
  ).format(amount);
}

function escapeHtml(
  value
) {
  return String(
    value ?? ""
  )
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );
}

function createBillRow(
  bill
) {
  const name =
    escapeHtml(
      bill.name ||
        "Untitled Bill"
    );

  const dateBadge =
    escapeHtml(
      bill.dateBadge ||
        "--"
    );

  const dateLabel =
    escapeHtml(
      bill.dateLabel ||
        ""
    );

  const amount =
    formatCurrency(
      bill.amount
    );

  const autoPayText =
    bill.autoPay
      ? "Auto pay"
      : "Manual payment";

  return `
    <article
      class="bill-row"
      aria-label="${name}, due ${dateLabel} the ${dateBadge}, ${amount}, ${autoPayText}"
    >
      <div
        class="bill-date-badge"
        aria-hidden="true"
      >
        ${dateBadge}
      </div>

      <div class="bill-date-label">
        ${dateLabel}
      </div>

      <div class="bill-name">
        ${name}
      </div>

      <div class="bill-amount">
        ${amount}
      </div>
    </article>
  `;
}

function renderBills(
  bills
) {
  if (
    !Array.isArray(
      bills
    ) ||
    bills.length === 0
  ) {
    contentElement.innerHTML = `
      <div class="bills-empty">
        <div
          class="bills-empty-icon"
          aria-hidden="true"
        >
          ✨
        </div>

        <p class="bills-empty-title">
          No bills coming up
        </p>

        <p class="bills-empty-text">
          Nothing is due in the next seven days.
        </p>
      </div>
    `;

    return;
  }

  contentElement.innerHTML = `
    <div class="bills-list">
      ${bills
        .map(
          createBillRow
        )
        .join("")}
    </div>
  `;
}

function renderError(
  message
) {
  contentElement.innerHTML = `
    <div class="bills-error">
      <div
        class="bills-error-icon"
        aria-hidden="true"
      >
        !
      </div>

      <div>
        <p class="bills-error-title">
          Bills could not load
        </p>

        <p class="bills-error-text">
          ${escapeHtml(
            message
          )}
        </p>
      </div>
    </div>
  `;
}

async function loadBills() {
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

          cache:
            "no-store"
        }
      );

    const data =
      await response.json();

    if (
      !response.ok
    ) {
      throw new Error(
        data?.error ||
          `Request failed with status ${response.status}.`
      );
    }

    if (
      !data?.success
    ) {
      throw new Error(
        data?.error ||
          "The Bills API returned an error."
      );
    }

    renderBills(
      data.bills
    );
  } catch (error) {
    console.error(
      "Unable to load finance bills:",
      error
    );

    renderError(
      error?.message ||
        "Please refresh and try again."
    );
  }
}

loadBills();
