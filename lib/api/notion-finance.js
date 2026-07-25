const NOTION_API_URL = "https://api.notion.com/v1";
const NOTION_VERSION = "2025-09-03";

const financeDataSources = {
  transactions:
    process.env.NOTION_TRANSACTIONS_DATA_SOURCE_ID,

  budgetCategories:
    process.env.NOTION_BUDGET_CATEGORIES_DATA_SOURCE_ID,

  accounts:
    process.env.NOTION_ACCOUNTS_DATA_SOURCE_ID,

  savingsBuckets:
    process.env.NOTION_SAVINGS_BUCKETS_DATA_SOURCE_ID,

  paychecks:
    process.env.NOTION_PAYCHECKS_DATA_SOURCE_ID,

  bills:
    process.env.NOTION_BILLS_DATA_SOURCE_ID
};

function getNotionToken() {
  const token =
    process.env.NOTION_TOKEN ||
    process.env.NOTION_API_KEY;

  if (!token) {
    throw new Error(
      "Missing NOTION_TOKEN or NOTION_API_KEY environment variable."
    );
  }

  return token;
}

function getDataSourceId(dataSourceName) {
  const dataSourceId =
    financeDataSources[dataSourceName];

  if (!dataSourceId) {
    throw new Error(
      `Missing finance data-source ID for "${dataSourceName}".`
    );
  }

  return dataSourceId;
}

async function notionRequest(path, options = {}) {
  const response = await fetch(
    `${NOTION_API_URL}${path}`,
    {
      ...options,

      headers: {
        Authorization: `Bearer ${getNotionToken()}`,
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    }
  );

  const data = await response.json();

  if (!response.ok) {
    const message =
      data?.message ||
      `Notion request failed with status ${response.status}.`;

    throw new Error(message);
  }

  return data;
}

export async function retrieveFinanceDataSource(
  dataSourceName
) {
  const dataSourceId =
    getDataSourceId(dataSourceName);

  return notionRequest(
    `/data_sources/${dataSourceId}`,
    {
      method: "GET"
    }
  );
}

export async function queryFinanceDataSource(
  dataSourceName,
  body = {}
) {
  const dataSourceId =
    getDataSourceId(dataSourceName);

  const results = [];
  let cursor;

  do {
    const response = await notionRequest(
      `/data_sources/${dataSourceId}/query`,
      {
        method: "POST",

        body: JSON.stringify({
          ...body,
          ...(cursor
            ? {
                start_cursor: cursor
              }
            : {})
        })
      }
    );

    results.push(...response.results);

    cursor = response.has_more
      ? response.next_cursor
      : null;
  } while (cursor);

  return results;
}

export function getFinanceDataSourceNames() {
  return Object.keys(financeDataSources);
}
