const NOTION_VERSION = "2026-03-11";
const DATABASE_ID = "3a6dbd801b578063b145f165330e4890";
const TEMPLATE_NAME = "Morning Focus";
const TIME_ZONE = "America/New_York";

function getTodayDate() {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: TIME_ZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).format(new Date());
}

function getPageTitle() {
    return new Intl.DateTimeFormat("en-US", {
        timeZone: TIME_ZONE,
        weekday: "long",
        month: "long",
        day: "numeric"
    }).format(new Date());
}

function getPlainText(property) {
    if (!property) {
        return "";
    }

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
    const response = await fetch(
        `https://api.notion.com/v1${path}`,
        {
            ...options,
            headers: {
                Authorization:
                    `Bearer ${process.env.NOTION_TOKEN}`,
                "Notion-Version": NOTION_VERSION,
                "Content-Type": "application/json",
                ...(options.headers || {})
            }
        }
    );

    const responseText = await response.text();

    let data = {};

    if (responseText) {
        try {
            data = JSON.parse(responseText);
        } catch {
            data = {
                message: responseText
            };
        }
    }

    if (!response.ok) {
        throw new Error(
            data.message ||
            `Notion request failed with ${response.status}`
        );
    }

    return data;
}

async function getDataSourceId() {
    const database = await notionRequest(
        `/databases/${DATABASE_ID}`
    );

    const dataSourceId = database.data_sources?.[0]?.id;

    if (!dataSourceId) {
        throw new Error(
            "No data source was found for Daily Focus."
        );
    }

    return dataSourceId;
}

async function findTodayPage(dataSourceId) {
    const today = getTodayDate();

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

    return results.results?.[0] || null;
}

function formatFocusPage(page, today) {
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
            text: getPlainText(
                properties["Priority 1"]
            ),
            done: getCheckbox(
                properties["Priority 1 Done"]
            )
        },

        priority2: {
            text: getPlainText(
                properties["Priority 2"]
            ),
            done: getCheckbox(
                properties["Priority 2 Done"]
            )
        },

        priority3: {
            text: getPlainText(
                properties["Priority 3"]
            ),
            done: getCheckbox(
                properties["Priority 3 Done"]
            )
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

async function getTodayFocus() {
    const today = getTodayDate();
    const dataSourceId = await getDataSourceId();
    const page = await findTodayPage(dataSourceId);

    return formatFocusPage(page, today);
}

async function getMorningFocusTemplate(dataSourceId) {
    const result = await notionRequest(
        `/data_sources/${dataSourceId}/templates`
    );

    const templates = result.templates || [];

    return (
        templates.find(
            (template) =>
                template.name
                    ?.trim()
                    .toLowerCase() ===
                TEMPLATE_NAME.toLowerCase()
        ) ||
        templates.find(
            (template) => template.is_default
        ) ||
        null
    );
}

async function createTodayFocus() {
    const today = getTodayDate();
    const dataSourceId = await getDataSourceId();

    /*
     * Check again before creating so repeated clicks
     * do not intentionally create another entry.
     */
    const existingPage =
        await findTodayPage(dataSourceId);

    if (existingPage) {
        return {
            created: false,
            ...formatFocusPage(
                existingPage,
                today
            )
        };
    }

    const template =
        await getMorningFocusTemplate(dataSourceId);

    const requestBody = {
        parent: {
            type: "data_source_id",
            data_source_id: dataSourceId
        },

        properties: {
            Name: {
                type: "title",
                title: [
                    {
                        type: "text",
                        text: {
                            content: getPageTitle()
                        }
                    }
                ]
            },

            Date: {
                type: "date",
                date: {
                    start: today
                }
            }
        }
    };

    if (template?.id) {
        requestBody.template = {
            type: "template_id",
            template_id: template.id,
            timezone: TIME_ZONE
        };
    }

    const page = await notionRequest(
        "/pages",
        {
            method: "POST",
            body: JSON.stringify(requestBody)
        }
    );

    return {
        created: true,
        templateApplied: Boolean(template?.id),
        ...formatFocusPage(page, today)
    };
}

async function updatePriority(requestBody) {
    const {
        pageId,
        priority,
        done
    } = requestBody || {};

    const propertyNames = {
        1: "Priority 1 Done",
        2: "Priority 2 Done",
        3: "Priority 3 Done"
    };

    const propertyName = propertyNames[priority];

    if (
        !pageId ||
        !propertyName ||
        typeof done !== "boolean"
    ) {
        throw new Error(
            "Invalid priority update."
        );
    }

    await notionRequest(
        `/pages/${pageId}`,
        {
            method: "PATCH",
            body: JSON.stringify({
                properties: {
                    [propertyName]: {
                        type: "checkbox",
                        checkbox: done
                    }
                }
            })
        }
    );

    return {
        success: true,
        priority,
        done
    };
}

export default async function handler(
    request,
    response
) {
    if (!process.env.NOTION_TOKEN) {
        return response.status(500).json({
            error:
                "NOTION_TOKEN is not configured."
        });
    }

    try {
        if (request.method === "GET") {
            const focus = await getTodayFocus();

            return response.status(200).json(focus);
        }

        if (request.method === "POST") {
            const focus =
                await createTodayFocus();

            return response.status(201).json(focus);
        }

        if (request.method === "PATCH") {
            const result =
                await updatePriority(
                    request.body
                );

            return response.status(200).json(
                result
            );
        }

        response.setHeader(
            "Allow",
            "GET, POST, PATCH"
        );

        return response.status(405).json({
            error: "Method not allowed."
        });
    } catch (error) {
        console.error(
            "Morning Focus API error:",
            error
        );

        return response.status(500).json({
            error:
                "Unable to process Morning Focus.",
            details: error.message
        });
    }
}
