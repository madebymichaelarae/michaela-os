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
  scheduled: "Scheduled"
};

function richTextToPlainText(items = []) {
  return items
    .map((item) => item?.plain_text || item?.text?.content || "")
    .join("")
    .trim();
}

function getPropertyText(property) {
  if (!property) {
    return "";
  }

  switch (property.type) {
    case "title":
      return richTextToPlainText(property.title);

    case "rich_text":
      return richTextToPlainText(property.rich_text);

    case "select":
      return property.select?.name || "";

    case "status":
      return property.status?.name || "";

    case "formula": {
      const formula = property.formula;

      if (!formula) {
        return "";
      }

      if (formula.type === "string") {
        return formula.string || "";
      }

      if (formula.type === "number") {
        return String(formula.number ?? "");
      }

      if (formula.type === "boolean") {
        return formula.boolean ? "Yes" : "No";
      }

      return "";
    }

    default:
      return "";
  }
}

function getPropertyDate(property) {
  if (!property || property.type !== "date") {
    return null;
  }

  return property.date?.start || null;
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

function normalizeValue(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function parseContentPage(page) {
  const properties = page?.properties || {};

  return {
    id: page.id,
    client:
      getPropertyText(properties[PROPERTY_NAMES.client]) || "—",
    contentType:
      getPropertyText(properties[PROPERTY_NAMES.contentType]) ||
      "Content",
    topic:
      getPropertyText(properties[PROPERTY_NAMES.topic]) ||
      "Untitled",
    draftDate:
      getPropertyDate(properties[PROPERTY_NAMES.draftDate]),
    status:
      getPropertyText(properties[PROPERTY_NAMES.status]),
    notionUrl: page.url || ""
  };
}

function sortItems(items) {
  return [...items].sort((a, b) => {
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

    /*
     * An item belongs to only one section.
     * Scheduled takes priority, followed by Ready to Schedule.
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

    const draftDate = item.draftDate?.slice(0, 10);

    if (draftDate === today) {
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

  /*
   * We intentionally fetch through the same helper already powering
   * Client Deliverables. This keeps the API version, token handling,
   * endpoint, and pagination consistent across the Work dashboard.
   */
  const pages = await queryContentEntries({
    sorts: [
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
