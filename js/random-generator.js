document.addEventListener("DOMContentLoaded", () => {
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

  if (
    !categorySelect ||
    !generateButton ||
    !resultContainer ||
    !resultText ||
    !resultCategory ||
    !statusText
  ) {
    console.error(
      "Random generator HTML elements were not found."
    );

    return;
  }

  let isGenerating = false;

  function getReadableMessage(value) {
    if (!value) {
      return "Something went wrong.";
    }

    if (typeof value === "string") {
      return value;
    }

    if (value instanceof Error) {
      return value.message;
    }

    if (typeof value === "object") {
      if (typeof value.message === "string") {
        return value.message;
      }

      if (typeof value.error === "string") {
        return value.error;
      }

      try {
        return JSON.stringify(value);
      } catch {
        return "Something went wrong.";
      }
    }

    return String(value);
  }

  function setLoading(isLoading) {
    isGenerating = isLoading;

    generateButton.disabled = isLoading;
    categorySelect.disabled = isLoading;

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

  function displayResult(item) {
    resultText.textContent =
      typeof item.name === "string"
        ? item.name
        : getReadableMessage(item.name);

    if (item.category) {
      resultCategory.textContent =
        typeof item.category === "string"
          ? item.category
          : getReadableMessage(item.category);

      resultCategory.hidden = false;
    } else {
      resultCategory.textContent = "";
      resultCategory.hidden = true;
    }

    resultContainer.classList.remove("has-error");
    resultContainer.classList.remove("is-revealing");

    void resultContainer.offsetWidth;

    resultContainer.classList.add("is-revealing");

    statusText.textContent = "New option generated.";
  }

  function displayError(error) {
    resultText.textContent =
      getReadableMessage(error);

    resultCategory.textContent = "";
    resultCategory.hidden = true;

    resultContainer.classList.add("has-error");

    statusText.textContent =
      "The random option could not be generated.";
  }

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

      const responseText = await response.text();

      let data;

      try {
        data = JSON.parse(responseText);
      } catch {
        console.error(
          "API returned non-JSON:",
          responseText
        );

        throw new Error(
          "The API returned an unreadable response."
        );
      }

      console.log(
        "Random generator response:",
        data
      );

      if (!response.ok) {
        throw new Error(
          getReadableMessage(
            data.error ||
            data.message ||
            data
          )
        );
      }

      if (!data.success) {
        throw new Error(
          getReadableMessage(
            data.error ||
            "The request was unsuccessful."
          )
        );
      }

      if (!data.item || !data.item.name) {
        throw new Error(
          "No matching generator option was found."
        );
      }

      displayResult(data.item);
    } catch (error) {
      console.error(
        "Random generator error:",
        error
      );

      displayError(error);
    } finally {
      setLoading(false);
    }
  }

  generateButton.addEventListener(
    "click",
    generateItem
  );

  console.log(
    "Random generator JavaScript loaded."
  );
});
