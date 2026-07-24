const CONTENT_SUMMARY_ENDPOINT =
  "/api/content-summary";

const WORK_DASHBOARD_URL = "/";

const loadingElement =
  document.getElementById(
    "client-deliverables-loading"
  );

const errorElement =
  document.getElementById(
    "client-deliverables-error"
  );

const contentElement =
  document.getElementById(
    "client-deliverables-content"
  );

const emptyElement =
  document.getElementById(
    "client-empty"
  );

const clientListElement =
  document.getElementById(
    "client-list"
  );

const monthLabelElement =
  document.getElementById(
    "month-label"
  );

const linkButton =
  document.getElementById(
    "client-deliverables-link"
  );

function createElement(
  tagName,
  className,
  textContent
) {
  const element =
    document.createElement(tagName);

  if (className) {
    element.className = className;
  }

  if (textContent !== undefined) {
    element.textContent = textContent;
  }

  return element;
}

function getCountState(sent, owed) {
  if (owed <= 0) {
    return "is-empty";
  }

  if (sent >= owed) {
    return "is-complete";
  }

  if (sent > 0) {
    return "is-progress";
  }

  return "is-not-started";
}

function createCountElement(
  categoryName,
  values
) {
  const sent =
    Number(values?.sent) || 0;

  const owed =
    Number(values?.owed) || 0;

  const displayValue =
    owed > 0
      ? `${sent}/${owed}`
      : "—";

  const element = createElement(
    "span",
    `delivery-count ${getCountState(
      sent,
      owed
    )}`,
    displayValue
  );

  element.setAttribute(
    "aria-label",
    owed > 0
      ? `${categoryName}: ${sent} of ${owed} sent`
      : `${categoryName}: none owed`
  );

  element.title =
    owed > 0
      ? `${sent} of ${owed} ${categoryName.toLowerCase()} sent`
      : `No ${categoryName.toLowerCase()} owed`;

  return element;
}

function createClientRow(client) {
  const row = createElement(
    "article",
    "client-row"
  );

  const clientName = createElement(
    "span",
    "client-name",
    client.client || "Unnamed client"
  );

  const emailCount =
    createCountElement(
      "Emails",
      client.emails
    );

  const textCount =
    createCountElement(
      "Texts",
      client.texts
    );

  row.append(
    clientName,
    emailCount,
    textCount
  );

  return row;
}

function renderClientSummary(data) {
  const clients = Array.isArray(
    data?.clients
  )
    ? data.clients
    : [];

  clientListElement.replaceChildren();

  if (data?.monthLabel) {
    monthLabelElement.textContent =
      data.monthLabel;
  } else {
    monthLabelElement.textContent =
      "This month";
  }

  if (clients.length === 0) {
    emptyElement.hidden = false;
  } else {
    emptyElement.hidden = true;

    const fragment =
      document.createDocumentFragment();

    for (const client of clients) {
      fragment.appendChild(
        createClientRow(client)
      );
    }

    clientListElement.appendChild(
      fragment
    );
  }

  loadingElement.hidden = true;
  errorElement.hidden = true;
  contentElement.hidden = false;
}

function showError(message) {
  loadingElement.hidden = true;
  contentElement.hidden = true;
  errorElement.hidden = false;

  errorElement.textContent =
    message ||
    "Client progress could not be loaded.";
}

async function loadClientSummary() {
  try {
    const response = await fetch(
      CONTENT_SUMMARY_ENDPOINT,
      {
        headers: {
          Accept: "application/json"
        }
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.error ||
          data.details ||
          "Content summary request failed."
      );
    }

    renderClientSummary(data);
  } catch (error) {
    console.error(
      "Client deliverables widget error:",
      error
    );

    showError(
      "Your client deliverables could not be loaded."
    );
  }
}

linkButton.addEventListener(
  "click",
  () => {
    if (
      !WORK_DASHBOARD_URL ||
      WORK_DASHBOARD_URL === "/"
    ) {
      return;
    }

    window.open(
      WORK_DASHBOARD_URL,
      "_blank",
      "noopener,noreferrer"
    );
  }
);

loadClientSummary();
