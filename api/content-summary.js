import {
  queryContentEntries
} from "../lib/notion-content.js";

const PROPERTY_NAMES = {
  client: "Client",
  sendDate: "Send Date",
  contentType: "Content Type",
  status: "Status"
};

const CONTENT_TYPES = {
  email: "Email",
  text: "Text"
};

const SENT_STATUS = "Sent";

function normalize(value) {
  return String(value || "")
    .trim()
    .toLocaleLowerCase("en-US");
}

function findProperty(properties, expectedName) {
  if (!properties || !expectedName) {
    return null;
  }

  if (properties[expectedName]) {
    return properties[expectedName];
  }

  const normalizedExpected =
    normalize(expectedName);

  const matchingKey = Object.keys(
    properties
  ).find(
    (propertyName) =>
      normalize(propertyName) ===
      normalizedExpected
  );

  return matchingKey
    ? properties[matchingKey]
    : null;
}

function joinPlainText(parts) {
  if (!Array.isArray(parts)) {
    return "";
  }

  return parts
    .map((part) => {
      return (
        part?.plain_text ||
        part?.text?.content ||
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

  switch (property.type) {
    case "title":
      return joinPlainText(
        property.title
      );

    case "rich_text":
      return joinPlainText(
        property.rich_text
      );

    case "select":
      return property.select?.name || "";

    case "status":
      return property.status?.name || "";

    case "multi_select":
      return (
        property.multi_select
          ?.map((option) => option.name)
          .join(", ") || ""
      );

    case "formula":
      if (
        property.formula?.type ===
        "string"
      ) {
        return (
          property.formula.string || ""
        );
      }

      return "";

    default:
      return (
        property.title
          ? joinPlainText(property.title)
          : property.rich_text
            ? joinPlainText(
                property.rich_text
              )
            : property.select?.name ||
              property.status?.name ||
              ""
      );
  }
}

function getDateStart(property) {
  if (!property) {
    return "";
  }

  if (property.type === "date") {
    return property.date?.start || "";
  }

  if (
    property.type === "formula" &&
    property.formula?.type === "date"
  ) {
    return (
      property.formula.date?.start || ""
    );
  }

  return property.date?.start || "";
}

function getRequestedMonth(request) {
  const now = new Date();

  const queryYear = Number(
    request.query?.year
  );

  const queryMonth = Number(
    request.query?.month
  );

  const year =
    Number.isInteger(queryYear) &&
    queryYear >= 2000
      ? queryYear
      : now.getFullYear();

  const month =
    Number.isInteger(queryMonth) &&
    queryMonth >= 1 &&
    queryMonth <= 12
      ? queryMonth
      : now.getMonth() + 1;

  return {
    year,
    month
  };
}

function dateBelongsToMonth(
  dateString,
  year,
  month
) {
  if (!dateString) {
    return false;
  }

  const expectedMonth =
    String(month).padStart(2, "0");

  const expectedPrefix =
    `${year}-${expectedMonth}`;

  return String(dateString).startsWith(
    expectedPrefix
  );
}

function createClientSummary(clientName) {
  return {
    client: clientName,
    emails: {
      sent: 0,
      owed: 0
    },
    texts: {
      sent: 0,
      owed: 0
    }
  };
}

function isExactValue(
  actualValue,
  expectedValue
) {
  return (
    normalize(actualValue) ===
    normalize(expectedValue)
  );
}

function sortClients(a, b) {
  return a.client.localeCompare(
    b.client,
    "en-US",
    {
      numeric: true,
      sensitivity: "base"
    }
  );
}

export default async function handler(
  request,
  response
) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");

    return response.status(405).json({
      success: false,
      error: "Method not allowed"
    });
  }

  try {
    const {
      year,
      month
    } = getRequestedMonth(request);

    const entries =
      await queryContentEntries({
        sorts: [
          {
            property:
              PROPERTY_NAMES.sendDate,
            direction: "ascending"
          }
        ]
      });

    const clientMap = new Map();

    for (const entry of entries) {
      const properties =
        entry?.properties || {};

      const clientProperty =
        findProperty(
          properties,
          PROPERTY_NAMES.client
        );

      const sendDateProperty =
        findProperty(
          properties,
          PROPERTY_NAMES.sendDate
        );

      const contentTypeProperty =
        findProperty(
          properties,
          PROPERTY_NAMES.contentType
        );

      const statusProperty =
        findProperty(
          properties,
          PROPERTY_NAMES.status
        );

      const clientName =
        getPropertyText(
          clientProperty
        );

      const sendDate =
        getDateStart(
          sendDateProperty
        );

      const contentType =
        getPropertyText(
          contentTypeProperty
        );

      const status =
        getPropertyText(
          statusProperty
        );

      if (!clientName) {
        continue;
      }

      if (
        !dateBelongsToMonth(
          sendDate,
          year,
          month
        )
      ) {
        continue;
      }

      const isEmail =
        isExactValue(
          contentType,
          CONTENT_TYPES.email
        );

      const isText =
        isExactValue(
          contentType,
          CONTENT_TYPES.text
        );

      if (!isEmail && !isText) {
        continue;
      }

      if (!clientMap.has(clientName)) {
        clientMap.set(
          clientName,
          createClientSummary(clientName)
        );
      }

      const clientSummary =
        clientMap.get(clientName);

      const deliverableSummary =
        isEmail
          ? clientSummary.emails
          : clientSummary.texts;

      deliverableSummary.owed += 1;

      if (
        isExactValue(
          status,
          SENT_STATUS
        )
      ) {
        deliverableSummary.sent += 1;
      }
    }

    const clients = Array.from(
      clientMap.values()
    ).sort(sortClients);

    const monthLabel =
      new Intl.DateTimeFormat(
        "en-US",
        {
          month: "long",
          year: "numeric",
          timeZone: "UTC"
        }
      ).format(
        new Date(
          Date.UTC(
            year,
            month - 1,
            1
          )
        )
      );

    return response.status(200).json({
      success: true,
      year,
      month,
      monthLabel,
      clients
    });
  } catch (error) {
    console.error(
      "Content summary API error:",
      error
    );

    return response.status(500).json({
      success: false,
      error:
        "Content summary could not be loaded.",
      details:
        error instanceof Error
          ? error.message
          : String(error)
    });
  }
}
