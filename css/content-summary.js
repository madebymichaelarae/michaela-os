import {
  queryContentEntries
} from "../lib/notion-content.js";

const PROPERTY_NAMES = {
  client: "Client",
  sendDate: "Send Date",
  contentType: "Content Type",
  status: "Status"
};

function getPlainText(parts = []) {
  return parts
    .map((part) => part?.plain_text || "")
    .join("")
    .trim();
}

function getTitleValue(property) {
  if (!property) {
    return "";
  }

  if (property.type === "title") {
    return getPlainText(property.title);
  }

  if (Array.isArray(property.title)) {
    return getPlainText(property.title);
  }

  return "";
}

function getNamedPropertyValue(property) {
  if (!property) {
    return "";
  }

  if (property.type === "select") {
    return property.select?.name || "";
  }

  if (property.type === "status") {
    return property.status?.name || "";
  }

  if (property.type === "multi_select") {
    return property.multi_select
      ?.map((item) => item.name)
      .join(", ") || "";
  }

  if (property.type === "rich_text") {
    return getPlainText(property.rich_text);
  }

  if (property.type === "title") {
    return getPlainText(property.title);
  }

  return (
    property.select?.name ||
    property.status?.name ||
    ""
  );
}

function getDateStart(property) {
  if (!property) {
    return "";
  }

  return property.date?.start || "";
}

function normalize(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function getRequestedMonth(request) {
  const now = new Date();

  const requestedYear = Number(
    request.query?.year
  );

  const requestedMonth = Number(
    request.query?.month
  );

  const year =
    Number.isInteger(requestedYear) &&
    requestedYear >= 2000
      ? requestedYear
      : now.getFullYear();

  const month =
    Number.isInteger(requestedMonth) &&
    requestedMonth >= 1 &&
    requestedMonth <= 12
      ? requestedMonth
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

  const expectedPrefix =
    `${year}-${String(month).padStart(2, "0")}`;

  return dateString.startsWith(
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

function sortClients(a, b) {
  return a.client.localeCompare(
    b.client,
    "en-US",
    {
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

      const clientName = getTitleValue(
        properties[PROPERTY_NAMES.client]
      );

      const sendDate = getDateStart(
        properties[
          PROPERTY_NAMES.sendDate
        ]
      );

      const contentType =
        getNamedPropertyValue(
          properties[
            PROPERTY_NAMES.contentType
          ]
        );

      const status =
        getNamedPropertyValue(
          properties[
            PROPERTY_NAMES.status
          ]
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

      const normalizedType =
        normalize(contentType);

      const normalizedStatus =
        normalize(status);

      const isEmail =
        normalizedType === "email";

      const isText =
        normalizedType === "text";

      if (!isEmail && !isText) {
        continue;
      }

      if (!clientMap.has(clientName)) {
        clientMap.set(
          clientName,
          createClientSummary(clientName)
        );
      }

      const client =
        clientMap.get(clientName);

      const category = isEmail
        ? client.emails
        : client.texts;

      category.owed += 1;

      if (normalizedStatus === "sent") {
        category.sent += 1;
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
