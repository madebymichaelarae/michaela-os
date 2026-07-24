import { queryContentEntries } from "./notion-content.js";

const PROPERTY_NAMES = {
  client: "Client",
  contentType: "Content Type",
  topic: "Topic",
  draftDate: "Draft Date",
  status: "Status"
};

const STATUS_NAMES = {
  readyToSchedule: "Ready to Schedule",
  scheduled: "Scheduled",
  sent: "Sent"
};

function normalizeValue(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function findProperty(properties, propertyName) {
  if (!properties || !propertyName) {
    return null;
  }

  if (properties[propertyName]) {
    return properties[propertyName];
  }

  const normalizedTarget = normalizeValue(propertyName);

  const matchingKey = Object.keys(properties).find(
    (key) => normalizeValue(key) === normalizedTarget
  );

  return matchingKey ? properties[matchingKey] : null;
}

function richTextToPlainText(items = []) {
  return items
    .map((item) => {
      return (
        item?.plain_text ||
        item?.text?.content ||
        item?.mention?.page?.id ||
        ""
      );
    })
    .join("")
    .trim();
}

function getPropertyText(property) {
  if (!property) {
    return "";
  }

  if (Array.isArray(property.title)) {
    return richTextToPlainText(property.title);
  }

  if (Array.isArray(property.rich_text)) {
    return richTextToPlainText(property.rich_text);
  }

  if (property.select?.name) {
    return property.select.name.trim();
  }

  if (property.status?.name) {
    return property.status.name.trim();
  }

  if (Array.isArray(property.multi_select)) {
    return property.multi_select
      .map((option) => option?.name || "")
      .filter(Boolean)
      .join(", ")
      .trim();
  }

  if (property.formula) {
    const formula = property.formula;

    if (formula.type === "string") {
      return formula.string || "";
    }

    if (formula.type === "number") {
      return String(formula.number ?? "");
    }

    if (formula.type === "boolean") {
      return formula.boolean ? "Yes" : "No";
    }
  }

  if (property.rollup) {
    const rollup = property.rollup;

    if (rollup.type === "array") {
      return rollup.array
        .map((entry) => getPropertyText(entry))
        .filter(Boolean)
        .join(", ");
    }

    if (rollup.type === "number") {
      return String(rollup.number ?? "");
    }
  }

  return "";
}

function getPropertyDate(property) {
  if (!property) {
    return null;
  }

  if (property.date?.start) {
    return property.date.start;
  }

  if (
    property.formula?.type === "date" &&
    property.formula.date?.start
  ) {
    return property.formula.date.start;
  }

  return null;
}

function getEasternDateString(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value])
  );

  return `${values.year}-${values.month}-${values.day}`;
}

function getDisplayDate(date = new Date()) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "long",
    month: "long",
    day: "numeric"
  }).format(date);
}

function parseContentPage(page) {
  const properties = page?.properties || {};

  const clientProperty = findProperty(
    properties,
    PROPERTY_NAMES.client
  );

  const contentTypeProperty = findProperty(
    properties,
    PROPERTY_NAMES.contentType
  );

  const topicProperty = findProperty(
    properties,
    PROPERTY_NAMES.topic
  );

  const draftDateProperty = findProperty(
    properties,
    PROPERTY_NAMES.draftDate
  );

  const statusProperty = findProperty(
    properties,
    PROPERTY_NAMES.status
  );

  return {
    id: page.id,
    client: getPropertyText(clientProperty) || "—",
    contentType:
      getPropertyText(contentTypeProperty) || "Content",
    topic: getPropertyText(topicProperty) || "Untitled",
    draftDate: getPropertyDate(draftDateProperty),
    status: getPropertyText(statusProperty),
    notionUrl: page.url || ""
  };
}

function sortItems(items) {
  return [...items].sort((a, b) => {
    /*
     * Oldest unfinished work appears first so overdue items
     * cannot become buried beneath today's work.
     */
    const dateA = a.draftDate?.slice(0, 10) || "9999-12-31";
    const dateB = b.draftDate?.slice(0, 10) || "9999-12-31";

    const dateComparison = dateA.localeCompare(dateB);

    if (dateComparison !== 0) {
      return dateComparison;
    }

    const clientComparison = a.client.localeCompare(b.client);

    if (clientComparison !== 0) {
      return clientComparison;
    }

    const typeComparison = a.contentType.localeCompare(
      b.contentType
    );

    if (typeComparison !== 0) {
      return typeComparison;
    }

    return a.topic.localeCompare(b.topic);
  });
}

function groupWorkflowItems(items, today) {
  const sections = {
    toDraft: [],
    readyToSchedule: [],
    scheduled: []
  };

  items.forEach((item) => {
    const status = normalizeValue(item.status);
    const draftDate = item.draftDate?.slice(0, 10);

    /*
     * Sent content is finished and should never appear in
     * the active daily workflow.
     */
    if (status === normalizeValue(STATUS_NAMES.sent)) {
      return;
    }

    /*
     * Each item appears in only one section.
     */
    if (status === normalizeValue(STATUS_NAMES.scheduled)) {
      sections.scheduled.push(item);
      return;
    }

    if (
      status ===
      normalizeValue(STATUS_NAMES.readyToSchedule)
    ) {
      sections.readyToSchedule.push(item);
      return;
    }

    /*
     * Include both today's drafts and unfinished drafts
     * from any previous date.
     */
    if (draftDate && draftDate <= today) {
      sections.toDraft.push(item);
    }
  });

  return {
    toDraft: sortItems(sections.toDraft),
    readyToSchedule: sortItems(sections.readyToSchedule),
    scheduled: sortItems(sections.scheduled)
  };
}

export async function getTodayWorkflow() {
  const today = getEasternDateString();

  const pages = await queryContentEntries({
    sorts: [
      {
        property: PROPERTY_NAMES.draftDate,
        direction: "ascending"
      },
      {
        property: PROPERTY_NAMES.client,
        direction: "ascending"
      }
    ]
  });

  const items = pages.map(parseContentPage);
  const sections = groupWorkflowItems(items, today);

  const counts = {
    toDraft: sections.toDraft.length,
    readyToSchedule: sections.readyToSchedule.length,
    scheduled: sections.scheduled.length
  };

  counts.total =
    counts.toDraft +
    counts.readyToSchedule +
    counts.scheduled;

  return {
    success: true,
    date: today,
    dateLabel: getDisplayDate(),
    sections,
    counts
  };
}
