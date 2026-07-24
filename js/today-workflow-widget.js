const API_URL = "/api/today-workflow";

const elements = {
  date: document.querySelector("#workflow-date"),
  refresh: document.querySelector("#workflow-refresh"),
  loading: document.querySelector("#workflow-loading"),
  sections: document.querySelector("#workflow-sections"),
  empty: document.querySelector("#workflow-empty"),
  error: document.querySelector("#workflow-error"),
  errorMessage: document.querySelector(
    "#workflow-error-message"
  )
};

const sectionNames = [
  "toDraft",
  "readyToSchedule",
  "scheduled"
];

function normalizeClient(client) {
  return String(client || "")
    .trim()
    .toUpperCase();
}

function createItemElement(item) {
  const hasLink = Boolean(item.notionUrl);
  const row = document.createElement(hasLink ? "a" : "div");

  row.className = "workflow-item";

  if (hasLink) {
    row.href = item.notionUrl;
    row.target = "_blank";
    row.rel = "noopener noreferrer";

    row.setAttribute(
      "aria-label",
      `Open ${item.client} ${item.contentType}: ${item.topic}`
    );
  }

  const client = document.createElement("span");
  client.className = "workflow-client";
  client.dataset.client = normalizeClient(item.client);
  client.textContent = item.client || "—";

  const type = document.createElement("span");
  type.className = "workflow-type";
  type.textContent = item.contentType || "Content";

  const separator = document.createElement("span");
  separator.className = "workflow-separator";
  separator.textContent = "·";
  separator.setAttribute("aria-hidden", "true");

  const topic = document.createElement("span");
  topic.className = "workflow-topic";
  topic.textContent = item.topic || "Untitled";
  topic.title = item.topic || "Untitled";

  row.append(client, type, separator, topic);

  return row;
}

function renderSection(sectionName, items = []) {
  const section = document.querySelector(
    `[data-section="${sectionName}"]`
  );

  const list = document.querySelector(
    `[data-list="${sectionName}"]`
  );

  const count = document.querySelector(
    `[data-count="${sectionName}"]`
  );

  if (!section || !list || !count) {
    return;
  }

  list.replaceChildren();
  count.textContent = String(items.length);

  if (!items.length) {
    section.hidden = true;
    return;
  }

  section.hidden = false;

  const fragment = document.createDocumentFragment();

  items.forEach((item) => {
    fragment.append(createItemElement(item));
  });

  list.append(fragment);
}

function setLoading(isLoading) {
  elements.loading.hidden = !isLoading;
  elements.refresh.disabled = isLoading;

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
    message || "Please try refreshing.";

  elements.error.hidden = false;
}

function renderWorkflow(data) {
  elements.date.textContent = data.dateLabel || "Today";

  sectionNames.forEach((sectionName) => {
    renderSection(
      sectionName,
      data.sections?.[sectionName] || []
    );
  });

  hideAllStates();

  if ((data.counts?.total || 0) === 0) {
    elements.empty.hidden = false;
    return;
  }

  elements.sections.hidden = false;
}

async function loadWorkflow() {
  setLoading(true);
  hideAllStates();

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
          "Unable to load today's workflow."
      );
    }

    renderWorkflow(data);
  } catch (error) {
    console.error("Workflow widget error:", error);
    showError(error.message);
  } finally {
    setLoading(false);
  }
}

elements.refresh.addEventListener(
  "click",
  loadWorkflow
);

loadWorkflow();
