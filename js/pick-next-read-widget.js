/* =========================================================
   MICHAELA OS
   Pick My Next Read Widget
   ========================================================= */

const NEXT_READ_ENDPOINT =
  "/api/reading?view=next-read";

const START_READING_ENDPOINT =
  "/api/reading?view=start-reading";

const elements = {
  loading: document.getElementById(
    "next-read-loading"
  ),

  error: document.getElementById(
    "next-read-error"
  ),

  empty: document.getElementById(
    "next-read-empty"
  ),

  content: document.getElementById(
    "next-read-content"
  ),

  cover: document.getElementById(
    "next-read-cover"
  ),

  coverPlaceholder:
    document.getElementById(
      "next-read-cover-placeholder"
    ),

  title: document.getElementById(
    "next-read-book-title"
  ),

  author: document.getElementById(
    "next-read-author"
  ),

  pages: document.getElementById(
    "next-read-pages"
  ),

  notionLink:
    document.getElementById(
      "next-read-notion-link"
    ),

  reroll: document.getElementById(
    "next-read-reroll"
  ),

  start: document.getElementById(
    "next-read-start"
  ),

  status: document.getElementById(
    "next-read-status"
  )
};

let selectedBook =
  null;

let isLoading =
  false;

let isStarting =
  false;

/* =========================================================
   SMALL HELPERS
   ========================================================= */

function setText(
  element,
  value,
  fallback = ""
) {
  if (!element) {
    return;
  }

  const safeValue =
    value === null ||
    value === undefined ||
    value === ""
      ? fallback
      : value;

  element.textContent =
    safeValue;
}

function hideAllStates() {
  elements.loading.hidden =
    true;

  elements.error.hidden =
    true;

  elements.empty.hidden =
    true;

  elements.content.hidden =
    true;
}

function setStatus(
  message = ""
) {
  setText(
    elements.status,
    message
  );
}

function setButtonsDisabled(
  disabled
) {
  elements.reroll.disabled =
    disabled;

  elements.start.disabled =
    disabled;
}

/* =========================================================
   COVER
   ========================================================= */

function showCover(
  coverUrl,
  title
) {
  elements.cover.onload =
    null;

  elements.cover.onerror =
    null;

  if (!coverUrl) {
    elements.cover.hidden =
      true;

    elements.cover.removeAttribute(
      "src"
    );

    elements.coverPlaceholder.hidden =
      false;

    return;
  }

  elements.cover.alt =
    `${title || "Selected book"} cover`;

  elements.cover.onload =
    () => {
      elements.cover.hidden =
        false;

      elements.coverPlaceholder.hidden =
        true;
    };

  elements.cover.onerror =
    () => {
      elements.cover.hidden =
        true;

      elements.cover.removeAttribute(
        "src"
      );

      elements.coverPlaceholder.hidden =
        false;
    };

  elements.cover.src =
    coverUrl;
}

/* =========================================================
   API
   ========================================================= */

async function fetchJson(
  url,
  options = {}
) {
  const response =
    await fetch(
      url,
      {
        cache:
          "no-store",

        headers: {
          Accept:
            "application/json",

          "Content-Type":
            "application/json",

          ...(options.headers || {})
        },

        ...options
      }
    );

  const rawText =
    await response.text();

  let data;

  try {
    data = rawText
      ? JSON.parse(
          rawText
        )
      : {};
  } catch {
    throw new Error(
      "The API returned an unreadable response."
    );
  }

  if (
    !response.ok ||
    data?.success === false
  ) {
    throw new Error(
      data?.error ||
      `Request failed with status ${response.status}.`
    );
  }

  return data;
}

/* =========================================================
   RENDERING
   ========================================================= */

function renderBook(
  book
) {
  selectedBook =
    book;

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

  const totalPages =
    Number(
      book.totalPages
    );

  setText(
    elements.pages,
    Number.isFinite(
      totalPages
    ) &&
      totalPages > 0
      ? `${totalPages} pages`
      : "Pages unavailable"
  );

  showCover(
    book.cover,
    book.title
  );

  if (
    book.notionUrl
  ) {
    elements.notionLink.href =
      book.notionUrl;

    elements.notionLink.hidden =
      false;
  } else {
    elements.notionLink.removeAttribute(
      "href"
    );

    elements.notionLink.hidden =
      true;
  }

  hideAllStates();

  elements.content.hidden =
    false;

  setStatus("");
}

function renderEmpty() {
  selectedBook =
    null;

  hideAllStates();

  elements.empty.hidden =
    false;

  setStatus("");
}

function showError(
  message
) {
  selectedBook =
    null;

  hideAllStates();

  elements.error.hidden =
    false;

  elements.error.textContent =
    message ||
    "Your TBR could not be loaded.";
}

/* =========================================================
   RANDOM PICK
   ========================================================= */

async function loadNextRead() {
  if (isLoading) {
    return;
  }

  isLoading =
    true;

  hideAllStates();

  elements.loading.hidden =
    false;

  setButtonsDisabled(
    true
  );

  setStatus(
    "Choosing from your TBR…"
  );

  try {
    const data =
      await fetchJson(
        NEXT_READ_ENDPOINT
      );

    if (
      !data.hasBook ||
      !data.book
    ) {
      renderEmpty();

      return;
    }

    renderBook(
      data.book
    );
  } catch (
    error
  ) {
    console.error(
      "Pick My Next Read error:",
      error
    );

    showError(
      error instanceof Error
        ? error.message
        : "Your TBR could not be loaded."
    );
  } finally {
    isLoading =
      false;

    setButtonsDisabled(
      false
    );
  }
}

/* =========================================================
   START READING
   ========================================================= */

async function startSelectedBook() {
  if (
    isStarting ||
    !selectedBook?.id
  ) {
    return;
  }

  const confirmed =
    window.confirm(
      `Start reading "${selectedBook.title}"?`
    );

  if (!confirmed) {
    return;
  }

  isStarting =
    true;

  setButtonsDisabled(
    true
  );

  const originalText =
    elements.start.textContent;

  elements.start.textContent =
    "Starting…";

  setStatus(
    "Updating your Books database…"
  );

  try {
    await fetchJson(
      START_READING_ENDPOINT,
      {
        method:
          "POST",

        body:
          JSON.stringify({
            bookId:
              selectedBook.id
          })
      }
    );

    setStatus(
      `"${selectedBook.title}" is now marked Currently Reading.`
    );

    elements.start.textContent =
      "Started ✓";

    /*
     * Remove the started book from the current picker state.
     * The next roll will only choose from remaining
     * Want to Read books.
     */
    setTimeout(
      () => {
        loadNextRead();
      },
      1200
    );
  } catch (
    error
  ) {
    console.error(
      "Start Reading error:",
      error
    );

    setStatus(
      error instanceof Error
        ? error.message
        : "The selected book could not be started."
    );

    elements.start.textContent =
      originalText;
  } finally {
    isStarting =
      false;

    setButtonsDisabled(
      false
    );
  }
}

/* =========================================================
   EVENTS
   ========================================================= */

elements.reroll.addEventListener(
  "click",
  loadNextRead
);

elements.start.addEventListener(
  "click",
  startSelectedBook
);

/* =========================================================
   INITIAL LOAD
   ========================================================= */

loadNextRead();
