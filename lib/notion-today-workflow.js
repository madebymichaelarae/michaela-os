const NOTION_API_BASE = "https://api.notion.com/v1";
const NOTION_VERSION = "2026-03-11";

const CONTENT_DATA_SOURCE_ID =
  process.env.NOTION_CONTENT_DATA_SOURCE_ID ||
  "3a7dbd80-1b57-8091-85a7-000b5e096477";

const PROPERTY_NAMES = {
  client: "Client",
  contentType: "Content Type",
  topic: "Topic",
  draftDate: "Draft Date",
  status: "Status",
};

const STATUS_NAMES = {
  ready: "Ready to Schedule",
  scheduled: "Scheduled",
};

function getNotionToken() {
  const token =
    process.env.NOTION_TOKEN ||
    process.env.NOTION_API_KEY ||
    process.env.NOTION_SECRET;

  if (!token) {
    throw new Error(
      "Missing Notion token. Add NOTION_TOKEN to your environment variables."
    );
  }

  return token;
}

function richTextToPlainText(items = []) {
  return items
    .map((item) => item?.plain_text || item?.text?.content || "")
    .join("")
    .trim();
}

function getPropertyText(property) {
  if (!property) return "";

  switch (property.type) {
    case "title":
      return richTextToPlainText(property.title);

    case "rich_text":
      return richTextToPlainText(property.rich_text);

    case "select":
      return property.select?.name || "";

    case "status":
      return property.status?.name || "";

    case "formula":
      if (property.formula?.type === "string") {
        return property.formula.string || "";
      }

      if (property.formula?.type === "number") {
        return String(property.formula.number ?? "");
      }

      if (property.formula?.type === "boolean") {
        return property.formula.boolean ? "Yes" : "No";
      }

      return "";

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
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
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
    day: "numeric",
  }).format(date);
}

function normalizeValue(value) {
  return String(value || "").trim().toLowerCase();
}

function parseContentPage(page) {
  const properties = page?.properties || {};

  const client = getPropertyText(properties[PROPERTY_NAMES.client]);
  const contentType = getPropertyText(
    properties[PROPERTY_NAMES.contentType]
  );
  const topic = getPropertyText(properties[PROPERTY_NAMES.topic]);
  const status = getPropertyText(properties[PROPERTY_NAMES.status]);
  const draftDate = getPropertyDate(properties[PROPERTY_NAMES.draftDate]);

  return {
    id: page.id,
    client: client || "—",
    contentType: contentType || "Content",
    topic: topic || "Untitled",
    status,
    draftDate,
    notionUrl: page.url || "",
  };
}

async function queryAllContentPages() {
  const token = getNotionToken();

  let hasMore = true;
  let startCursor;
  const results = [];

  while (hasMore) {
    const response = await fetch(
      `${NOTION_API_BASE}/data_sources/${CONTENT_DATA_SOURCE_ID}/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "Notion-Version": NOTION_VERSION,
        },
        body: JSON.stringify({
          page_size: 100,
          ...(startCursor ? { start_cursor: startCursor } : {}),
          filter: {
            or: [
              {
                property: PROPERTY_NAMES.draftDate,
                date: {
                  equals: getEasternDateString(),
                },
              },
              {
                property: PROPERTY_NAMES.status,
                status: {
                  equals: STATUS_NAMES.ready,
                },
              },
              {
                property: PROPERTY_NAMES.status,
                status: {
                  equals: STATUS_NAMES.scheduled,
                },
              },
            ],
          },
          sorts: [
            {
              property: PROPERTY_NAMES.client,
              direction: "ascending",
            },
            {
              property: PROPERTY_NAMES.contentType,
              direction: "ascending",
            },
          ],
        }),
      }
    );

    const payload = await response.json();

    if (!response.ok) {
      const details = payload?.message || "Unknown Notion API error";
      throw new Error(`Notion request failed: ${details}`);
    }

    results.push(...(payload.results || []));

    hasMore = Boolean(payload.has_more);
    startCursor = payload.next_cursor || undefined;
  }

  return results;
}

function sortItems(items) {
  return [...items].sort((a, b) => {
    const clientComparison = a.client.localeCompare(b.client);

    if (clientComparison !== 0) {
      return clientComparison;
    }

    const typeComparison = a.contentType.localeCompare(b.contentType);

    if (typeComparison !== 0) {
      return typeComparison;
    }

    return a.topic.localeCompare(b.topic);
  });
}

function groupWorkflowItems(items, today) {
  const grouped = {
    toDraft: [],
    readyToSchedule: [],
    scheduled: [],
  };

  items.forEach((item) => {
    const normalizedStatus = normalizeValue(item.status);

    if (normalizedStatus === normalizeValue(STATUS_NAMES.scheduled)) {
      grouped.scheduled.push(item);
      return;
    }

    if (normalizedStatus === normalizeValue(STATUS_NAMES.ready)) {
      grouped.readyToSchedule.push(item);
      return;
    }

    if (item.draftDate?.slice(0, 10) === today) {
      grouped.toDraft.push(item);
    }
  });

  return {
    toDraft: sortItems(grouped.toDraft),
    readyToSchedule: sortItems(grouped.readyToSchedule),
    scheduled: sortItems(grouped.scheduled),
  };
}

export async function getTodayWorkflow() {
  const today = getEasternDateString();
  const pages = await queryAllContentPages();
  const items = pages.map(parseContentPage);
  const sections = groupWorkflowItems(items, today);

  return {
    success: true,
    date: today,
    dateLabel: getDisplayDate(),
    sections,
    counts: {
      toDraft: sections.toDraft.length,
      readyToSchedule: sections.readyToSchedule.length,
      scheduled: sections.scheduled.length,
      total:
        sections.toDraft.length +
        sections.readyToSchedule.length +
        sections.scheduled.length,
    },
  };
}
