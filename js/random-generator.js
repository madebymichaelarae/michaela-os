document.addEventListener(
  "DOMContentLoaded",
  () => {
    const categorySelect =
      document.getElementById(
        "category-select"
      );

    const generateButton =
      document.getElementById(
        "generate-button"
      );

    const generateButtonText =
      document.getElementById(
        "generate-button-text"
      );

    const resultContainer =
      document.getElementById(
        "generator-result"
      );

    const resultText =
      document.getElementById(
        "generator-result-text"
      );

    const resultCategory =
      document.getElementById(
        "generator-result-category"
      );

    const statusText =
      document.getElementById(
        "generator-status"
      );

    if (
      !categorySelect ||
      !generateButton ||
      !generateButtonText ||
      !resultContainer ||
      !resultText ||
      !resultCategory ||
      !statusText
    ) {
      console.error(
        "Random generator elements are missing."
      );

      return;
    }

    let isGenerating = false;

    function setLoading(loading) {
      isGenerating = loading;

      generateButton.disabled = loading;
      categorySelect.disabled = loading;

      generateButtonText.textContent =
        loading
          ? "Choosing..."
          : "Generate Again";

      statusText.textContent =
        loading
          ? "Choosing a random option..."
          : "";
    }

    function showResult(item) {
      resultText.textContent = item.name;

      if (item.category) {
        resultCategory.textContent =
          item.category;

        resultCategory.hidden = false;
      } else {
        resultCategory.textContent = "";
        resultCategory.hidden = true;
      }

      resultContainer.classList.remove(
        "has-error"
      );

      resultContainer.classList.remove(
        "is-revealing"
      );

      void resultContainer.offsetWidth;

      resultContainer.classList.add(
        "is-revealing"
      );

      statusText.textContent =
        "New option generated.";
    }

    function showError(message) {
      resultText.textContent =
        typeof message === "string"
          ? message
          : "Something went wrong.";

      resultCategory.textContent = "";
      resultCategory.hidden = true;

      resultContainer.classList.add(
        "has-error"
      );

      statusText.textContent =
        "The random option could not be generated.";
    }

    async function generateRandomItem() {
      if (isGenerating) {
        return;
      }

      setLoading(true);

      try {
        const category =
          categorySelect.value.trim();

        const url = new URL(
          "/api/random-generator",
          window.location.origin
        );

        if (category) {
          url.searchParams.set(
            "category",
            category
          );
        }

        const response = await fetch(
          url.toString(),
          {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
            cache: "no-store",
          }
        );

        const rawText =
          await response.text();

        let data;

        try {
          data = JSON.parse(rawText);
        } catch {
          console.error(
            "Raw API response:",
            rawText
          );

          throw new Error(
            "The API did not return valid JSON."
          );
        }

        console.log(
          "Random generator API response:",
          data
        );

        if (!response.ok) {
          throw new Error(
            typeof data.error === "string"
              ? data.error
              : "The API request failed."
          );
        }

        if (!data.success) {
          throw new Error(
            typeof data.error === "string"
              ? data.error
              : "The generator was unsuccessful."
          );
        }

        if (
          !data.item ||
          typeof data.item.name !== "string"
        ) {
          throw new Error(
            "The API did not return a valid generator item."
          );
        }

        showResult(data.item);
      } catch (error) {
        console.error(
          "Random generator error:",
          error
        );

        showError(
          error instanceof Error
            ? error.message
            : "Something went wrong."
        );
      } finally {
        setLoading(false);
      }
    }

    generateButton.addEventListener(
      "click",
      generateRandomItem
    );

    console.log(
      "Random generator JavaScript loaded."
    );
  }
);
