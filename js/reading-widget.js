
const currentEndpoint = "/api/reading/current";
const statsEndpoint = "/api/reading/stats";

const elements = {
    loading: document.getElementById("reading-loading"),
    error: document.getElementById("reading-error"),
    content: document.getElementById("reading-content"),
    noCurrentBook: document.getElementById(
        "no-current-book"
    ),

    cover: document.getElementById("book-cover"),
    coverPlaceholder: document.getElementById(
        "book-cover-placeholder"
    ),

    title: document.getElementById("book-title"),
    author: document.getElementById("book-author"),

    progressTrack: document.getElementById(
        "progress-track"
    ),
    progressFill: document.getElementById(
        "progress-fill"
    ),
    progressPercent: document.getElementById(
        "progress-percent"
    ),

    currentPage: document.getElementById(
        "current-page"
    ),
    totalPages: document.getElementById(
        "total-pages"
    ),

    pagesToday: document.getElementById(
        "pages-today"
    ),
    pagesThisWeek: document.getElementById(
        "pages-this-week"
    ),
    readingStreak: document.getElementById(
        "reading-streak"
    ),
    booksThisMonth: document.getElementById(
        "books-this-month"
    ),
    averageSession: document.getElementById(
        "average-session"
    ),
    minutesThisMonth: document.getElementById(
        "minutes-this-month"
    )
};

function setText(element, value, fallback = "0") {
    if (!element) {
        return;
    }

    const safeValue =
        value === null ||
        value === undefined ||
        value === ""
            ? fallback
            : value;

    element.textContent = safeValue;
}

function clampPercentage(value) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
        return 0;
    }

    return Math.max(0, Math.min(100, number));
}

function showCover(cover, title) {
    if (!cover) {
        elements.cover.hidden = true;
        elements.coverPlaceholder.hidden = false;
        return;
    }

    elements.cover.alt = `${title} book cover`;
    elements.cover.src = cover;

    elements.cover.onload = () => {
        elements.cover.hidden = false;
        elements.coverPlaceholder.hidden = true;
    };

    elements.cover.onerror = () => {
        elements.cover.hidden = true;
        elements.coverPlaceholder.hidden = false;
    };
}

function renderCurrentBook(response) {
    if (
        !response?.success ||
        !response?.hasCurrentBook ||
        !response?.book
    ) {
        elements.content.hidden = true;
        elements.noCurrentBook.hidden = false;
        return false;
    }

    const book = response.book;
    const progress = clampPercentage(
        book.progress
    );

    setText(
        elements.title,
        book.title,
        "Untitled Book"
    );

    setText(
        elements.author,
        book.author,
        "Unknown Author"
    );

    setText(elements.currentPage, book.currentPage);
    setText(elements.totalPages, book.totalPages);

    setText(
        elements.progressPercent,
        `${Math.round(progress)}%`
    );

    elements.progressFill.style.width =
        `${progress}%`;

    elements.progressTrack.setAttribute(
        "aria-valuenow",
        String(Math.round(progress))
    );

    showCover(book.cover, book.title);

    elements.noCurrentBook.hidden = true;

    return true;
}

function renderStats(response) {
    const stats = response?.stats || {};

    setText(
        elements.pagesToday,
        stats.pagesToday
    );

    setText(
        elements.pagesThisWeek,
        stats.pagesThisWeek
    );

    setText(
        elements.readingStreak,
        stats.readingStreak
    );

    setText(
        elements.booksThisMonth,
        stats.booksThisMonth
    );

    setText(
        elements.averageSession,
        stats.averageSession
    );

    setText(
        elements.minutesThisMonth,
        stats.minutesThisMonth
    );
}

async function fetchJson(url) {
    const response = await fetch(url, {
        headers: {
            Accept: "application/json"
        }
    });

    const data = await response.json();

    if (!response.ok || data?.success === false) {
        throw new Error(
            data?.error ||
            `Request failed with status ${response.status}`
        );
    }

    return data;
}

async function loadReadingWidget() {
    try {
        const [
            currentResponse,
            statsResponse
        ] = await Promise.all([
            fetchJson(currentEndpoint),
            fetchJson(statsEndpoint)
        ]);

        const hasCurrentBook =
            renderCurrentBook(currentResponse);

        renderStats(statsResponse);

        if (hasCurrentBook) {
            elements.content.hidden = false;
        }

        elements.loading.hidden = true;
        elements.error.hidden = true;
    } catch (error) {
        console.error(
            "Reading widget error:",
            error
        );

        elements.loading.hidden = true;
        elements.content.hidden = true;
        elements.noCurrentBook.hidden = true;
        elements.error.hidden = false;
    }
}

loadReadingWidget();
