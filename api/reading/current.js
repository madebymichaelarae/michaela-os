import { queryBooks } from "../../lib/notion-reading.js";

function getTitle(property) {
    return (
        property?.title
            ?.map((item) => item.plain_text)
            .join("")
            .trim() || ""
    );
}

function getRichText(property) {
    return (
        property?.rich_text
            ?.map((item) => item.plain_text)
            .join("")
            .trim() || ""
    );
}

function getNumber(property) {
    if (!property) {
        return null;
    }

    if (typeof property.number === "number") {
        return property.number;
    }

    if (typeof property.formula?.number === "number") {
        return property.formula.number;
    }

    if (typeof property.rollup?.number === "number") {
        return property.rollup.number;
    }

    return null;
}

function getCoverUrl(page) {
    const coverProperty = page.properties?.["Cover URL"];

    if (coverProperty?.url) {
        return coverProperty.url;
    }

    if (page.cover?.type === "external") {
        return page.cover.external?.url || null;
    }

    if (page.cover?.type === "file") {
        return page.cover.file?.url || null;
    }

    return null;
}

function getStatusName(page) {
    const statusProperty = page.properties?.Status;

    return (
        statusProperty?.status?.name ||
        statusProperty?.select?.name ||
        ""
    );
}

function normalizeProgress(progress, currentPage, totalPages) {
    let percentage = progress;

    if (typeof percentage === "number") {
        /*
         * Supports either:
         * 0.47 = 47%
         * 47 = 47%
         */
        if (percentage >= 0 && percentage <= 1) {
            percentage *= 100;
        }

        return Math.max(
            0,
            Math.min(100, Math.round(percentage))
        );
    }

    if (
        typeof currentPage === "number" &&
        typeof totalPages === "number" &&
        totalPages > 0
    ) {
        return Math.max(
            0,
            Math.min(
                100,
                Math.round((currentPage / totalPages) * 100)
            )
        );
    }

    return 0;
}

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({
            success: false,
            error: "Method not allowed"
        });
    }

    try {
        const pages = await queryBooks({
            sorts: [
                {
                    property: "Date Started",
                    direction: "descending"
                }
            ]
        });

        const currentBookPage = pages.find((page) => {
            const status = getStatusName(page)
                .trim()
                .toLowerCase();

            return (
                status === "currently reading" ||
                status === "reading" ||
                status === "in progress"
            );
        });

        if (!currentBookPage) {
            return res.status(200).json({
                success: true,
                hasCurrentBook: false,
                book: null
            });
        }

        const properties = currentBookPage.properties || {};

        const title =
            getTitle(properties.Book) ||
            "Untitled Book";

        const author =
            getRichText(properties.Author) ||
            "Unknown Author";

        const currentPage =
            getNumber(properties["Current Page"]) ?? 0;

        const totalPages =
            getNumber(properties["Total Pages"]) ?? 0;

        const storedProgress =
            getNumber(properties["Progress %"]);

        const progress = normalizeProgress(
            storedProgress,
            currentPage,
            totalPages
        );

        const minutesRead =
            getNumber(properties["Minutes Read"]) ?? 0;

        const sessions =
            getNumber(
                properties["Reading Sessions Count"]
            ) ?? 0;

        return res.status(200).json({
            success: true,
            hasCurrentBook: true,
            book: {
                id: currentBookPage.id,
                title,
                author,
                cover: getCoverUrl(currentBookPage),
                currentPage,
                totalPages,
                progress,
                minutesRead,
                sessions
            }
        });
    } catch (error) {
        console.error("Current reading endpoint error:", error);

        return res.status(500).json({
            success: false,
            error:
                error.message ||
                "Current reading data could not be loaded"
        });
    }
}
