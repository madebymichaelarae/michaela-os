const HEALTH_DATA_SOURCE_ID =
  "3a5dbd80-1b57-80a2-aff5-000b486606bb";

export async function queryHealthEntries({
  filter,
  sorts = [],
  pageSize = 100
} = {}) {
  const token = process.env.NOTION_TOKEN;

  if (!token) {
    throw new Error("NOTION_TOKEN not found");
  }

  const requestBody = {
    page_size: pageSize
  };

  if (filter) {
    requestBody.filter = filter;
  }

  if (sorts.length > 0) {
    requestBody.sorts = sorts;
  }

  const response = await fetch(
    `https://api.notion.com/v1/data_sources/${HEALTH_DATA_SOURCE_ID}/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Notion-Version": "2025-09-03",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    }
  );

  export async function createHealthEntry({
  category,
  amount,
  date
}) {
  const token = process.env.NOTION_TOKEN;

  if (!token) {
    throw new Error("NOTION_TOKEN not found");
  }

  if (!category) {
    throw new Error("Health category is required");
  }

  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount)) {
    throw new Error("Health amount must be a number");
  }

  const entryDate =
    date ||
    new Date().toISOString().slice(0, 10);

  const response = await fetch(
    "https://api.notion.com/v1/pages",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Notion-Version": "2025-09-03",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        parent: {
          type: "data_source_id",
          data_source_id:
            HEALTH_DATA_SOURCE_ID
        },

        properties: {
          Category: {
            select: {
              name: category
            }
          },

          Amount: {
            number: numericAmount
          },

          Date: {
            date: {
              start: entryDate
            }
          }
        }
      })
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
      "Notion could not create the Health entry"
    );
  }

  return data;
}

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Notion could not return Health entries"
    );
  }

  return data.results;
}
