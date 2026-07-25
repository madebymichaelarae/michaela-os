const API_URL = "/api/approval-summary";

const TIME_ZONE = "America/New_York";

const elements = {
  date: document.querySelector(
    "#approval-date"
  ),

  refresh: document.querySelector(
    "#approval-refresh"
  ),

  loading: document.querySelector(
    "#approval-loading"
  ),

  sections: document.querySelector(
    "#approval-sections"
  ),

  empty: document.querySelector(
    "#approval-empty"
  ),

  error: document.querySelector(
    "#approval-error"
  ),

  errorMessage: document.querySelector(
    "#approval-error-message"
  )
};

const sectionNames = [
  "waitingOnClient",
  "internalReview",
  "revisions"
];

function normalizeClient(client) {
  return String(client || "")
    .trim()
    .toUpperCase();
}

function getDateKey(dateValue = new Date()) {
  const date =
    dateValue instanceof Date
      ? dateValue
      : new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const parts =
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone: TIME_ZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      }
    ).formatToParts(date);

  const year = parts.find(
    (part) => part.type === "year"
  )?.value;

  const month = parts.find(
    (part) => part.type === "month"
  )?.value;

  const day = parts.find(
    (part) => part.type === "day"
  )?.value;

  if (!year || !month || !day) {
    return null;
  }

  return `${year}-${month}-${day}`;
}

function shiftDateKey(dateKey, amount) {
  if (!dateKey) {
    return null;
  }

  const [year, month, day] = dateKey
    .split("-")
    .map(Number);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day)
  ) {
    return null;
  }

  const date = new Date(
    Date.UTC(
      year,
      month - 1,
      day,
      12
    )
  );

  date.setUTCDate(
    date.getUTCDate() + amount
  );

  return date
    .toISOString()
    .slice(0, 10);
}

function getDateMarker(sendDate) {
  if (!sendDate) {
    return null;
  }

  const today = getDateKey();

  if (!today) {
    return null;
  }

  if (sendDate === today) {
    return {
      key: "today",
      label: "Today"
    };
  }

  const tomorrow = shiftDateKey(
    today,
    1
  );

  if (sendDate === tomorrow) {
    return {
      key: "tomorrow",
      label: "Tomorrow"
    };
  }

  return null;
}

function createItemElement(item) {
  const hasLink = Boolean(
    item.notionUrl
  );

  const row = document.createElement(
    hasLink ? "a" : "div"
  );

  row.className = "approval-item";

  if (hasLink) {
    row.href = item.notionUrl;
    row.target = "_blank";
    row.rel = "noopener noreferrer";

    row.setAttribute(
      "aria-label",
      `Open ${item.client || "client"} ${
        item.contentType || "content"
      }: ${item.topic || "Untitled"}`
    );
  }

  const client =
    document.createElement("span");

  client.className =
    "approval-client";

  client.dataset.client =
    normalizeClient(item.client);

  client.textContent =
    item.client || "—";

  const type =
    document.createElement("span");

  type.className =
    "approval-type";

  type.textContent =
    item.contentType || "Content";

  const separator =
    document.createElement("span");

  separator.className =
    "approval-separator";

  separator.textContent = "·";

  separator.setAttribute(
    "aria-hidden",
    "true"
  );

  const topic =
    document.createElement("span");

  topic.className =
    "approval-topic";

  topic.textContent =
    item.topic || "Untitled";

  topic.title =
    item.topic || "Untitled";

  row.append(
    client,
    type,
    separator,
    topic
  );

  const marker = getDateMarker(
    item.sendDate
  );

  if (marker) {
    const markerElement =
      document.createElement("span");

    markerElement.className =
      "approval-marker";

    markerElement.dataset.marker =
      marker.key;

    markerElement.textContent =
      marker.label;

    row.append(markerElement);
  }

  return row;
}

function renderSection(
  sectionName,
  items = []
) {
  const section =
    document.querySelector(
      `[data-section="${sectionName}"]`
    );

  const list =
    document.querySelector(
      `[data-list="${sectionName}"]`
    );

  const count =
    document.querySelector(
      `[data-count="${sectionName}"]`
    );

  if (
    !section ||
    !list ||
    !count
  ) {
    return;
  }

  list.replaceChildren();

  count.textContent =
    String(items.length);

  if (!items.length) {
    section.hidden = true;
    return;
  }

  section.hidden = false;

  const fragment =
    document.createDocumentFragment();

  items.forEach((item) => {
    fragment.append(
      createItemElement(item)
    );
  });

  list.append(fragment);
}

function setLoading(isLoading) {
  elements.loading.hidden =
    !isLoading;

  elements.refresh.disabled =
    isLoading;

  elements.refresh.classList.toggle(
    "is-spinning",
    isLoading
  );
}

function hideAllStates() {
  elements.sections.hidden = true;
  elements.empty.hidden = true;
  elements.error.hidden = true;
}

function showError(message) {
  hideAllStates();

  elements.errorMessage.textContent =
    message ||
    "Please try refreshing.";

  elements.error.hidden = false;
}

function renderApprovalSummary(data) {
  elements.date.textContent =
    data.dateLabel || "Today";

  sectionNames.forEach(
    (sectionName) => {
      renderSection(
        sectionName,
        data.sections?.[
          sectionName
        ] || []
      );
    }
  );

  hideAllStates();

  if (
    (data.counts?.total || 0) === 0
  ) {
    elements.empty.hidden = false;
    return;
  }

  elements.sections.hidden = false;
}

async function loadApprovalSummary() {
  setLoading(true);
  hideAllStates();

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

    const data =
      await response.json();

    if (
      !response.ok ||
      !data.success
    ) {
      throw new Error(
        data.details ||
          data.error ||
          "Unable to load approval summary."
      );
    }

    renderApprovalSummary(data);
  } catch (error) {
    console.error(
      "Approval Summary widget error:",
      error
    );

    showError(error.message);
  } finally {
    setLoading(false);
  }
}

elements.refresh.addEventListener(
  "click",
  loadApprovalSummary
);

loadApprovalSummary();
