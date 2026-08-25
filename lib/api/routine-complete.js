const DAILY_HABITS_DATA_SOURCE_ID =
  "3aadbd80-1b57-8006-98ad-000bf81818ad";

const NOTION_VERSION = "2025-09-03";

function getTodayDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
}

async function notionRequest(path, options = {}) {
  const token = process.env.NOTION_TOKEN;

  if (!token) {
    throw new Error("NOTION_TOKEN not found.");
  }

  const response = await fetch(
    `https://api.notion.com/v1${path}`,
    {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        `Notion request failed with ${response.status}`
    );
  }

  return data;
}

function getHabitProperty(module) {
  const normalized = String(module || "")
    .trim()
    .toLowerCase();

  if (normalized === "morning routine") {
    return "☀️ Morning Routine";
  }

  if (normalized === "night routine") {
    return "🌙 Night Routine";
  }

  throw new Error(
    `Unknown routine module: ${module}`
  );
}

async function findTodayPage() {
  const today = getTodayDate();

  const data = await notionRequest(
    `/data_sources/${DAILY_HABITS_DATA_SOURCE_ID}/query`,
    {
      method: "POST",
      body: JSON.stringify({
        page_size: 10,
        filter: {
          property: "Created Time",
          created_time: {
            on_or_after: `${today}T00:00:00-04:00`
          }
        }
      })
    }
  );

  /*
   * Use the most recently created matching daily row.
   * We'll verify its calendar day below.
   */
  const matchingPage = data.results.find(
    page => {
      const createdTime =
        page.properties?.["Created Time"]
          ?.created_time;

      if (!createdTime) {
        return false;
      }

      const createdDate =
        new Intl.DateTimeFormat("en-CA", {
          timeZone: "America/New_York",
          year: "numeric",
          month: "2-digit",
          day: "2-digit"
        }).format(new Date(createdTime));

      return createdDate === today;
    }
  );

  return matchingPage || null;
}

export default async function routineCompleteHandler(
  request,
  response
) {
  if (request.method !== "POST") {
    return response.status(405).json({
      success: false,
      error: "Method not allowed."
    });
  }

  try {
    const module =
      request.body?.module ||
      request.query?.module;

    const property =
      getHabitProperty(module);

    const todayPage =
      await findTodayPage();

    if (!todayPage) {
      return response.status(404).json({
        success: false,
        error:
          "Today's Daily Habits row was not found."
      });
    }

    await notionRequest(
      `/pages/${todayPage.id}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          properties: {
            [property]: {
              checkbox: true
            }
          }
        })
      }
    );

    return response.status(200).json({
      success: true,
      module,
      property,
      pageId: todayPage.id,
      completed: true
    });
  } catch (error) {
    console.error(
      "Routine completion error:",
      error
    );

    return response.status(500).json({
      success: false,
      error:
        "Routine completion could not be saved.",
      details:
        error instanceof Error
          ? error.message
          : String(error)
    });
  }
}
