const categorySelect = document.getElementById(
  "category-select"
);

const generateButton = document.getElementById(
  "generate-button"
);

const resultContainer = document.getElementById(
  "generator-result"
);

const resultText = document.getElementById(
  "generator-result-text"
);

const resultCategory = document.getElementById(
  "generator-result-category"
);

const statusText = document.getElementById(
  "generator-status"
);

/**
 * Prevents a second request while one is already loading.
 */
let isGenerating = false;

/**
 * Updates the widget's loading state.
 */
function setLoading(isLoading) {
  isGenerating = isLoading;
  generateButton.disabled = isLoading;
  categorySelect.disabled = isLoading;

  generateButton.classList.toggle(
    "is-loading",
    isLoading
  );

  if (isLoading) {
    generateButton.innerHTML = `
      <span
        class="generator-spinner"
        aria-hidden="true"
      ></span>
      Choosing...
    `;

    statusText.textContent =
      "Choosing a random option...";
  } else {
    generateButton.innerHTML = `
      <span aria-hidden="true">🎲</span>
      Generate Again
    `;
  }
}

/**
 * Displays a successful result.
 */
function displayResult(item) {
  resultText.textContent = item.name;

  if (item.category) {
    resultCategory.textContent = item.category;
    resultCategory.hidden = false;
  } else {
    resultCategory.textContent = "";
    resultCategory.hidden = true;
  }

  resultContainer.classList.remove("has-error");

  /*
   * Restart the result animation every time.
   */
  resultContainer.classList.remove("is-revealing");

  void resultContainer.offsetWidth;

  resultContainer.classList.add("is-revealing");

  statusText.textContent = "New option generated.";
}

/**
 * Displays an error inside the widget.
 */
function displayError(message) {
  resultText.textContent =
    message || "Something went wrong.";

  resultCategory.textContent = "";
  resultCategory.hidden = true;

  resultContainer.classList.add("has-error");

  statusText.textContent =
    "The random option could not be generated.";
}

/**
 * Calls the Vercel API and requests a random item.
 */
async function generateItem() {
  if (isGenerating) {
    return;
  }

  setLoading(true);

  try {
    const selectedCategory =
      categorySelect.value.trim();

    const queryString = selectedCategory
      ? `?category=${encodeURIComponent(
          selectedCategory
        )}`
      : "";

    const response = await fetch(
      `/api/random-generator${queryString}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
      }
    );

    let data;

    try {
      data = await response.json();
    } catch {
      throw new Error(
        "The server returned an unreadable response."
      );
    }

    if (!response.ok || !data.success) {
      throw new Error(
        data.error ||
          "No matching options were found."
      );
    }

    if (!data.item || !data.item.name) {
      throw new Error(
        "The generator did not return an item."
      );
    }

    displayResult(data.item);
  } catch (error) {
    console.error(
      "Random generator widget error:",
      error
    );

    displayError(
      error instanceof Error
        ? error.message
        : "Something went wrong."
    );
  } finally {
    setLoading(false);
  }
}

/**
 * Generate when the button is clicked.
 */
generateButton.addEventListener(
  "click",
  generateItem
);

/**
 * Allow Enter or Space to generate while the result
 * area is focused, if we add tabindex later.
 */
resultContainer.addEventListener(
  "keydown",
  (event) => {
    if (
      event.key === "Enter" ||
      event.key === " "
    ) {
      event.preventDefault();
      generateItem();
    }
  }
);
