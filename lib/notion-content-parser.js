const PROPERTY_NAMES = {
  client: "Client",
  contentType: "Content Type",
  topic: "Topic",
  draftDate: "Draft Date",
  sendDate: "Send Date",
  status: "Status"
};

export function normalizeValue(value) {
  return String(value ?? "")
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
  if (!Array.isArray(items)) {
    return "";
  }

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

  /*
   * Fallbacks for property objects returned in slightly
   * different shapes by Notion API versions.
   */
  if (typeof property.name === "string") {
    return property.name.trim();
  }

  if (typeof property.plain_text === "string") {
    return property.plain_text.trim();
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

  if (
    property.rollup?.type === "date" &&
    property.rollup.date?.start
  ) {
    return property.rollup.date.start;
  }

  return null;
}

export function getEasternDateString(date = new Date()) {
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

export function getDisplayDate(date = new Date()) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "long",
    month: "long",
    day: "numeric"
  }).format(date);
}

export function parseContentPage(page) {
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

  const sendDateProperty = findProperty(
    properties,
    PROPERTY_NAMES.sendDate
  );

  const statusProperty = findProperty(
    properties,
    PROPERTY_NAMES.status
  );

  return {
    id: page?.id || "",
    client: getPropertyText(clientProperty) || "—",
    contentType:
      getPropertyText(contentTypeProperty) || "Content",
    topic: getPropertyText(topicProperty) || "Untitled",
    draftDate: getPropertyDate(draftDateProperty),
    sendDate: getPropertyDate(sendDateProperty),
    status: getPropertyText(statusProperty),
    notionUrl: page?.url || ""
  };
}

export function sortContentItems(items = []) {
  return [...items].sort((a, b) => {
    /*
     * Oldest work appears first. Items without a date
     * appear after dated items.
     */
    const dateA =
      a.draftDate?.slice(0, 10) ||
      a.sendDate?.slice(0, 10) ||
      "9999-12-31";

    const dateB =
      b.draftDate?.slice(0, 10) ||
      b.sendDate?.slice(0, 10) ||
      "9999-12-31";

    const dateComparison = dateA.localeCompare(dateB);

    if (dateComparison !== 0) {
      return dateComparison;
    }

    const clientComparison = String(a.client).localeCompare(
      String(b.client)
    );

    if (clientComparison !== 0) {
      return clientComparison;
    }

    const typeComparison = String(
      a.contentType
    ).localeCompare(String(b.contentType));

    if (typeComparison !== 0) {
      return typeComparison;
    }

    return String(a.topic).localeCompare(String(b.topic));
  });
}
