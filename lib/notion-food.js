const FOOD_LOG_DATA_SOURCE_ID =
  "3a6dbd80-1b57-80c7-acb2-000b6f4d58b9";

export async function queryFoodEntries({
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
    `https://api.notion.com/v1/data_sources/${FOOD_LOG_DATA_SOURCE_ID}/query`,
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

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Notion could not return Food Log entries"
    );
  }

  return data.results;
}
