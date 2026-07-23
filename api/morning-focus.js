const NOTION_VERSION = "2025-09-03";
const DATABASE_ID = "3a6dbd801b578063b145f165330e4890";
const TIME_ZONE = "America/New_York";

function getTodayDate() {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: TIME_ZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).format(new Date());
}

function getPlainText(property) {
    if (!property) return "";

    if (property.type === "rich_text") {
        return property.rich_text
            .map((item) => item.plain_text || "")
            .join("")
            .trim();
    }

    if (property.type === "title") {
        return property.title
            .map((item) => item.plain_text || "")
            .join("")
            .trim();
    }

    return "";
}

function getCheckbox(property) {
    if (!property || property.type !== "checkbox") {
        return false;
    }

    return Boolean(property.checkbox);
}

async function notionRequest(path, options = {}) {
    const response = await fetch(`https://api.notion.com/v1${path}`, {
        ...options,
        headers: {
            Authorization: `Bearer ${process.env.NOTION_TOKEN}`,
            "Notion-Version": NOTION_VERSION,
            "Content-Type": "application/json",
            ...(options.headers || {})
        }
    });

    if (!response.ok) {
        const errorText = await response.text();

        throw new Error(
            `Notion request failed: ${response.status} ${errorText}`
        );
    }

    return response.json();
}

async function getDataSourceId() {
    const database = await notionRequest(
        `/databases/${DATABASE_ID}`
    );

    const dataSourceId = database.data_sources?.[0]?.id;

    if (!dataSourceId) {
        throw new Error(
            "No Notion data source was found for the Daily Focus database."
        );
    }

    return dataSourceId;
}

async function getTodayFocus() {
    const today = getTodayDate();
    const dataSourceId = await getDataSourceId();

    const results = await notionRequest(
        `/data_sources/${dataSourceId}/query`,
        {
            method: "POST",
            body: JSON.stringify({
                filter: {
                    property: "Date",
                    date: {
                        equals: today
                    }
                },
                page_size: 1
            })
        }
    );

    const page = results.results?.[0];

    if (!page) {
        return {
            exists: false,
            date: today,
            priority1: {
                text: "",
                done: false
            },
            priority2: {
                text: "",
                done: false
            },
            priority3: {
                text: "",
                done: false
            },
            lookingForwardTo: "",
            leavingInYesterday: "",
            gratefulFor: ""
        };
    }

    const properties = page.properties || {};

    return {
        exists: true,
        date: today,
        pageId: page.id,
        pageUrl: page.url,

        priority1: {
            text: getPlainText(properties["Priority 1"]),
            done: getCheckbox(properties["Priority 1 Done"])
        },

        priority2: {
            text: getPlainText(properties["Priority 2"]),
            done: getCheckbox(properties["Priority 2 Done"])
        },

        priority3: {
            text: getPlainText(properties["Priority 3"]),
            done: getCheckbox(properties["Priority 3 Done"])
        },

        lookingForwardTo: getPlainText(
            properties["Looking Forward To"]
        ),

        leavingInYesterday: getPlainText(
            properties["Leaving in Yesterday"]
        ),

        gratefulFor: getPlainText(
            properties["Grateful For"]
        )
    };
}

export default async function handler(request, response) {
    if (request.method !== "GET") {
        return response.status(405).json({
            error: "Method not allowed"
        });
    }

    if (!process.env.NOTION_TOKEN) {
        return response.status(500).json({
            error: "NOTION_TOKEN is not configured."
        });
    }

    try {
        const focus = await getTodayFocus();

        return response.status(200).json(focus);
    } catch (error) {
        console.error("Morning Focus API error:", error);

        return response.status(500).json({
            error: "Unable to load Morning Focus.",
            details: error.message
        });
    }
}
