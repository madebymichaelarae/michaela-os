const BOOKS_DATABASE_ID =
    "3a5dbd80-1b57-8032-93ca-d553c45705e4";

const READING_LOG_DATABASE_ID =
    "3a5dbd80-1b57-8064-8369-f5e598888013";

const NOTION_VERSION = "2025-09-03";

function getToken() {
    const token = process.env.NOTION_TOKEN;

    if (!token) {
        throw new Error("NOTION_TOKEN not found");
    }

    return token;
}

function getHeaders() {
    return {
        Authorization: `Bearer ${getToken()}`,
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json"
    };
}

async function getDataSourceId(databaseId) {
    const response = await fetch(
        `https://api.notion.com/v1/databases/${databaseId}`,
        {
            method: "GET",
            headers: getHeaders()
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.message ||
            `Notion could not retrieve database ${databaseId}`
        );
    }

    const dataSourceId = data.data_sources?.[0]?.id;

    if (!dataSourceId) {
        throw new Error(
            `No data source was found for database ${databaseId}`
        );
    }

    return dataSourceId;
}

async function queryDatabase(
    databaseId,
    {
        filter,
        sorts = [],
        pageSize = 100,
        startCursor
    } = {}
) {
    const dataSourceId = await getDataSourceId(databaseId);

    const requestBody = {
        page_size: pageSize
    };

    if (filter) {
        requestBody.filter = filter;
    }

    if (sorts.length > 0) {
        requestBody.sorts = sorts;
    }

    if (startCursor) {
        requestBody.start_cursor = startCursor;
    }

    const response = await fetch(
        `https://api.notion.com/v1/data_sources/${dataSourceId}/query`,
        {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify(requestBody)
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.message ||
            `Notion could not query data source ${dataSourceId}`
        );
    }

    return data;
}

export async function queryBooks(options = {}) {
    const data = await queryDatabase(
        BOOKS_DATABASE_ID,
        options
    );

    return data.results;
}

export async function queryReadingLog(options = {}) {
    const data = await queryDatabase(
        READING_LOG_DATABASE_ID,
        options
    );

    return data.results;
}

export async function queryAllBooks(options = {}) {
    return queryAllPages(BOOKS_DATABASE_ID, options);
}

export async function queryAllReadingLog(options = {}) {
    return queryAllPages(READING_LOG_DATABASE_ID, options);
}

async function queryAllPages(databaseId, options = {}) {
    const results = [];
    let startCursor;

    do {
        const data = await queryDatabase(databaseId, {
            ...options,
            startCursor
        });

        results.push(...data.results);
        startCursor = data.has_more
            ? data.next_cursor
            : undefined;
    } while (startCursor);

    return results;
}
