const currentEndpoint = "/api/reading/current";
const statsEndpoint = "/api/reading/stats";

const elements = {
  loading: document.getElementById(
    "currently-reading-loading"
  ),

  error: document.getElementById(
    "currently-reading-error"
  ),

  empty: document.getElementById(
    "currently-reading-empty"
  ),

  content: document.getElementById(
    "currently-reading-content"
  ),

  cover: document.getElementById(
    "book-cover"
  ),

  coverPlaceholder: document.getElementById(
    "book-cover-placeholder"
  ),

  title: document.getElementById(
    "book-title"
  ),

  author: document.getElementById(
    "book-author"
  ),

  progressTrack: document.getElementById(
    "progress-track"
  ),

  progressFill: document.getElementById(
    "progress-fill"
  ),

  progressPercent: document.getElementById(
    "progress-percent"
  ),

  pagesToday: document.getElementById(
    "pages-today"
  ),

  pagesTodayLabel: document.getElementById(
    "pages-today-label"
  )
};

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

  element.textContent = safeValue;
}

function clampPercentage(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(100, number)
  );
}

function showCover(coverUrl, title) {
  if (!coverUrl) {
    elements.cover.hidden = true;
    elements.cover.removeAttribute("src");
    elements.coverPlaceholder.hidden = false;

    return;
  }

  elements.cover.alt =
    `${title || "Current book"} cover`;

  elements.cover.onload = () => {
    elements.cover.hidden = false;
    elements.coverPlaceholder.hidden = true;
  };

  elements.cover.onerror = () => {
    elements.cover.hidden = true;
    elements.cover.removeAttribute("src");
    elements.coverPlaceholder.hidden = false;
  };

  elements.cover.src = coverUrl;
}

function renderCurrentBook(response) {
  if (
    !response?.success ||
    !response?.hasCurrentBook ||
    !response?.book
  ) {
    elements.content.hidden = true;
    elements.empty.hidden = false;

    return false;
  }

  const book = response.book;

  const progress = clampPercentage(
    book.progress
  );

  const roundedProgress = Math.round(
    progress
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

  setText(
    elements.progressPercent,
    `${roundedProgress}%`
  );

  elements.progressFill.style.width =
    `${progress}%`;

  elements.progressTrack.setAttribute(
    "aria-valuenow",
    String(roundedProgress)
  );

  showCover(
    book.cover,
    book.title
  );

  elements.empty.hidden = true;

  return true;
}

function renderPagesToday(response) {
  const pagesToday = Number(
    response?.stats?.pagesToday
  );

  const safePages = Number.isFinite(
    pagesToday
  )
    ? Math.max(0, pagesToday)
    : 0;

  setText(
    elements.pagesToday,
    safePages,
    "0"
  );

  setText(
    elements.pagesTodayLabel,
    safePages === 1
      ? "page read today"
      : "pages read today"
  );
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json"
    }
  });

  const data = await response.json();

  if (
    !response.ok ||
    data?.success === false
  ) {
    throw new Error(
      data?.error ||
      `Request failed with status ${response.status}`
    );
  }

  return data;
}

async function loadCurrentlyReadingWidget() {
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

    renderPagesToday(statsResponse);

    elements.content.hidden =
      !hasCurrentBook;

    elements.loading.hidden = true;
    elements.error.hidden = true;
  } catch (error) {
    console.error(
      "Currently Reading widget error:",
      error
    );

    elements.loading.hidden = true;
    elements.content.hidden = true;
    elements.empty.hidden = true;
    elements.error.hidden = false;
  }
}

loadCurrentlyReadingWidget();
