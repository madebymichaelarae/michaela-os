/* =========================================================
   Michaela OS
   Notion Helper — Daily Wrap-Up
   ========================================================= */

const DAILY_WRAP_UP_DATABASE_ID =
  "3aadbd80-1b57-80bc-8769-000b134603ef";

const NOTION_VERSION =
  "2025-09-03";

const NOTION_API_BASE_URL =
  "https://api.notion.com/v1";

const PROPERTY_NAMES = {
  title: "Wrap-Up Day",
  wrapUpId: "Wrap-Up ID",
  date: "Wrap-Up Date",
  glad: "Glad I...",
  proud: "Proud Of...",
  favorite: "Favorite Today",
  tomorrow: "Remember Tomorrow",
  completion: "Completion",
  fixedTasks: "Fixed Tasks",
  extraTasks: "Extra Tasks",
  complete: "Complete",
  state: "State"
};

/*
  Notion rich-text objects allow a limited amount of text
  per individual object. Long values are divided into safe
  chunks before being sent.
*/

const RICH_TEXT_CHUNK_LENGTH =
  1900;

let cachedDataSourceId = null;

/* =========================================================
   TOKEN AND REQUEST HELPERS
   ========================================================= */

function getNotionToken() {
  const token =
    process.env.NOTION_TOKEN;

  if (!token) {
    throw new Error(
      "NOTION_TOKEN not found"
    );
  }

  return token;
}

async function notionRequest(
  endpoint,
  options = {}
) {
  const token =
    getNotionToken();

  const response =
    await fetch(
      `${NOTION_API_BASE_URL}${endpoint}`,
      {
        ...options,

        headers: {
          Authorization:
            `Bearer ${token}`,

          "Notion-Version":
            NOTION_VERSION,

          "Content-Type":
            "application/json",

          ...(options.headers || {})
        }
      }
    );

  let data = null;

  try {
    data =
      await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message =
      data?.message ||
      data?.error ||
      `Notion request failed with status ${response.status}.`;

    const notionError =
      new Error(message);

    notionError.status =
      response.status;

    notionError.code =
      data?.code || null;

    notionError.response =
      data;

    throw notionError;
  }

  return data;
}

/* =========================================================
   DATA SOURCE RESOLUTION
   ========================================================= */

export async function getDailyWrapUpDataSourceId() {
  if (cachedDataSourceId) {
    return cachedDataSourceId;
  }

  const database =
    await notionRequest(
      `/databases/${DAILY_WRAP_UP_DATABASE_ID}`,
      {
        method: "GET"
      }
    );

  const dataSources =
    Array.isArray(
      database?.data_sources
    )
      ? database.data_sources
      : [];

  if (dataSources.length === 0) {
    throw new Error(
      "The Daily Wrap-Ups database does not contain an accessible data source."
    );
  }

  /*
    This database should contain one table. If additional
    data sources are added later, prefer one whose name
    includes “wrap”.
  */

  const matchingDataSource =
    dataSources.find(
      (dataSource) =>
        String(
          dataSource?.name || ""
        )
          .toLowerCase()
          .includes("wrap")
    );

  const selectedDataSource =
    matchingDataSource ||
    dataSources[0];

  if (!selectedDataSource?.id) {
    throw new Error(
      "Notion returned an invalid Daily Wrap-Ups data source."
    );
  }

  cachedDataSourceId =
    selectedDataSource.id;

  return cachedDataSourceId;
}

/* =========================================================
   PROPERTY-BUILDING HELPERS
   ========================================================= */

function normalizeText(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value);
}

function splitTextIntoChunks(text) {
  const normalizedText =
    normalizeText(text);

  if (!normalizedText) {
    return [];
  }

  const chunks = [];

  for (
    let index = 0;
    index < normalizedText.length;
    index += RICH_TEXT_CHUNK_LENGTH
  ) {
    chunks.push(
      normalizedText.slice(
        index,
        index +
          RICH_TEXT_CHUNK_LENGTH
      )
    );
  }

  return chunks;
}

function buildTextObjects(value) {
  return splitTextIntoChunks(value)
    .map((content) => ({
      type: "text",

      text: {
        content,
        link: null
      }
    }));
}

function buildTitleProperty(value) {
  return {
    title:
      buildTextObjects(value)
  };
}

function buildRichTextProperty(value) {
  return {
    rich_text:
      buildTextObjects(value)
  };
}

function buildDateProperty(value) {
  const normalizedValue =
    normalizeText(value).trim();

  return {
    date:
      normalizedValue
        ? {
            start:
              normalizedValue
          }
        : null
  };
}

function buildNumberProperty(value) {
  const numericValue =
    Number(value);

  return {
    number:
      Number.isFinite(
        numericValue
      )
        ? numericValue
        : 0
  };
}

function buildCheckboxProperty(value) {
  return {
    checkbox:
      Boolean(value)
  };
}

/* =========================================================
   PROPERTY-READING HELPERS
   ========================================================= */

function readRichTextArray(items) {
  if (!Array.isArray(items)) {
    return "";
  }

  return items
    .map((item) => {
      if (
        typeof item?.plain_text ===
        "string"
      ) {
        return item.plain_text;
      }

      if (
        typeof item?.text?.content ===
        "string"
      ) {
        return item.text.content;
      }

      return "";
    })
    .join("");
}

function readTitleProperty(property) {
  return readRichTextArray(
    property?.title
  );
}

function readRichTextProperty(property) {
  return readRichTextArray(
    property?.rich_text
  );
}

function readDateProperty(property) {
  return (
    property?.date?.start ||
    ""
  );
}

function readNumberProperty(property) {
  const value =
    property?.number;

  return Number.isFinite(value)
    ? value
    : 0;
}

function readCheckboxProperty(property) {
  return Boolean(
    property?.checkbox
  );
}

/* =========================================================
   PAGE PROPERTY CONVERSION
   ========================================================= */

export function parseDailyWrapUpPage(
  page
) {
  if (!page) {
    return null;
  }

  const properties =
    page.properties || {};

  const rawState =
    readRichTextProperty(
      properties[
        PROPERTY_NAMES.state
      ]
    );

  let parsedState = null;

  try {
    parsedState =
      rawState
        ? JSON.parse(rawState)
        : null;
  } catch {
    parsedState = null;
  }

  return {
    pageId:
      page.id || "",

    url:
      page.url || "",

    createdTime:
      page.created_time || "",

    lastEditedTime:
      page.last_edited_time || "",

    wrapUpDay:
      readTitleProperty(
        properties[
          PROPERTY_NAMES.title
        ]
      ),

    wrapUpId:
      readRichTextProperty(
        properties[
          PROPERTY_NAMES.wrapUpId
        ]
      ),

    wrapUpDate:
      readDateProperty(
        properties[
          PROPERTY_NAMES.date
        ]
      ),

    gladI:
      readRichTextProperty(
        properties[
          PROPERTY_NAMES.glad
        ]
      ),

    proudOf:
      readRichTextProperty(
        properties[
          PROPERTY_NAMES.proud
        ]
      ),

    favoriteToday:
      readRichTextProperty(
        properties[
          PROPERTY_NAMES.favorite
        ]
      ),

    rememberTomorrow:
      readRichTextProperty(
        properties[
          PROPERTY_NAMES.tomorrow
        ]
      ),

    completion:
      readNumberProperty(
        properties[
          PROPERTY_NAMES.completion
        ]
      ),

    fixedTasks:
      readNumberProperty(
        properties[
          PROPERTY_NAMES.fixedTasks
        ]
      ),

    extraTasks:
      readNumberProperty(
        properties[
          PROPERTY_NAMES.extraTasks
        ]
      ),

    complete:
      readCheckboxProperty(
        properties[
          PROPERTY_NAMES.complete
        ]
      ),

    state:
      rawState,

    stateObject:
      parsedState
  };
}

function buildDailyWrapUpProperties(
  values = {},
  options = {}
) {
  const {
    includeIdentity = true
  } = options;

  const properties = {
    [PROPERTY_NAMES.glad]:
      buildRichTextProperty(
        values.gladI
      ),

    [PROPERTY_NAMES.proud]:
      buildRichTextProperty(
        values.proudOf
      ),

    [PROPERTY_NAMES.favorite]:
      buildRichTextProperty(
        values.favoriteToday
      ),

    [PROPERTY_NAMES.tomorrow]:
      buildRichTextProperty(
        values.rememberTomorrow
      ),

    [PROPERTY_NAMES.completion]:
      buildNumberProperty(
        values.completion
      ),

    [PROPERTY_NAMES.fixedTasks]:
      buildNumberProperty(
        values.fixedTasks
      ),

    [PROPERTY_NAMES.extraTasks]:
      buildNumberProperty(
        values.extraTasks
      ),

    [PROPERTY_NAMES.complete]:
      buildCheckboxProperty(
        values.complete
      ),

    [PROPERTY_NAMES.state]:
      buildRichTextProperty(
        values.state
      )
  };

  if (includeIdentity) {
    properties[
      PROPERTY_NAMES.title
    ] =
      buildTitleProperty(
        values.wrapUpDay
      );

    properties[
      PROPERTY_NAMES.wrapUpId
    ] =
      buildRichTextProperty(
        values.wrapUpId
      );

    properties[
      PROPERTY_NAMES.date
    ] =
      buildDateProperty(
        values.wrapUpDate
      );
  }

  return properties;
}

/* =========================================================
   QUERY WRAP-UP PAGE
   ========================================================= */

export async function queryDailyWrapUpById(
  wrapUpId
) {
  const normalizedId =
    normalizeText(
      wrapUpId
    ).trim();

  if (!normalizedId) {
    throw new Error(
      "A Wrap-Up ID is required to query Notion."
    );
  }

  const dataSourceId =
    await getDailyWrapUpDataSourceId();

  const data =
    await notionRequest(
      `/data_sources/${dataSourceId}/query`,
      {
        method: "POST",

        body:
          JSON.stringify({
            page_size: 2,

            filter: {
              property:
                PROPERTY_NAMES.wrapUpId,

              rich_text: {
                equals:
                  normalizedId
              }
            },

            sorts: [
              {
                timestamp:
                  "last_edited_time",

                direction:
                  "descending"
              }
            ]
          })
      }
    );

  const results =
    Array.isArray(
      data?.results
    )
      ? data.results
      : [];

  if (results.length === 0) {
    return null;
  }

  if (results.length > 1) {
    console.warn(
      `Multiple Daily Wrap-Up pages were found for "${normalizedId}". Using the most recently edited page.`
    );
  }

  return parseDailyWrapUpPage(
    results[0]
  );
}

/* =========================================================
   CREATE WRAP-UP PAGE
   ========================================================= */

export async function createDailyWrapUpPage(
  values
) {
  if (!values?.wrapUpId) {
    throw new Error(
      "A Wrap-Up ID is required to create a Daily Wrap-Up page."
    );
  }

  if (!values?.wrapUpDate) {
    throw new Error(
      "A Wrap-Up Date is required to create a Daily Wrap-Up page."
    );
  }

  const dataSourceId =
    await getDailyWrapUpDataSourceId();

  const page =
    await notionRequest(
      "/pages",
      {
        method: "POST",

        body:
          JSON.stringify({
            parent: {
              type:
                "data_source_id",

              data_source_id:
                dataSourceId
            },

            icon: {
              type: "emoji",
              emoji: "🌙"
            },

            properties:
              buildDailyWrapUpProperties(
                values,
                {
                  includeIdentity:
                    true
                }
              )
          })
      }
    );

  return parseDailyWrapUpPage(
    page
  );
}

/* =========================================================
   UPDATE WRAP-UP PAGE
   ========================================================= */

export async function updateDailyWrapUpPage(
  pageId,
  values
) {
  const normalizedPageId =
    normalizeText(
      pageId
    ).trim();

  if (!normalizedPageId) {
    throw new Error(
      "A Notion page ID is required to update a Daily Wrap-Up."
    );
  }

  const page =
    await notionRequest(
      `/pages/${normalizedPageId}`,
      {
        method: "PATCH",

        body:
          JSON.stringify({
            properties:
              buildDailyWrapUpProperties(
                values,
                {
                  includeIdentity:
                    false
                }
              )
          })
      }
    );

  return parseDailyWrapUpPage(
    page
  );
}

/* =========================================================
   OPTIONAL IDENTITY UPDATE
   ========================================================= */

/*
  The normal autosave does not alter a page’s date or
  Wrap-Up ID. This separate function exists for intentional
  repairs or migrations later.
*/

export async function updateDailyWrapUpIdentity(
  pageId,
  values
) {
  const normalizedPageId =
    normalizeText(
      pageId
    ).trim();

  if (!normalizedPageId) {
    throw new Error(
      "A Notion page ID is required to update Daily Wrap-Up identity fields."
    );
  }

  const properties = {};

  if (
    values.wrapUpDay !==
    undefined
  ) {
    properties[
      PROPERTY_NAMES.title
    ] =
      buildTitleProperty(
        values.wrapUpDay
      );
  }

  if (
    values.wrapUpId !==
    undefined
  ) {
    properties[
      PROPERTY_NAMES.wrapUpId
    ] =
      buildRichTextProperty(
        values.wrapUpId
      );
  }

  if (
    values.wrapUpDate !==
    undefined
  ) {
    properties[
      PROPERTY_NAMES.date
    ] =
      buildDateProperty(
        values.wrapUpDate
      );
  }

  if (
    Object.keys(
      properties
    ).length === 0
  ) {
    return null;
  }

  const page =
    await notionRequest(
      `/pages/${normalizedPageId}`,
      {
        method: "PATCH",

        body:
          JSON.stringify({
            properties
          })
      }
    );

  return parseDailyWrapUpPage(
    page
  );
}

/* =========================================================
   EXPORTS FOR VALIDATION AND TESTING
   ========================================================= */

export {
  DAILY_WRAP_UP_DATABASE_ID,
  NOTION_VERSION,
  PROPERTY_NAMES
};
