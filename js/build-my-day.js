const DAY_GENERATOR_API_URL =
  "/api/day-generator";

const elements = {
  loadingState:
    document.getElementById(
      "loadingState"
    ),

  errorState:
    document.getElementById(
      "errorState"
    ),

  errorMessage:
    document.getElementById(
      "errorMessage"
    ),

  retryButton:
    document.getElementById(
      "retryButton"
    ),

  builderForm:
    document.getElementById(
      "builderForm"
    ),

  dateInput:
    document.getElementById(
      "dateInput"
    ),

  startTimeInput:
    document.getElementById(
      "startTimeInput"
    ),

  templateSelect:
    document.getElementById(
      "templateSelect"
    ),

  existingModeSelect:
    document.getElementById(
      "existingModeSelect"
    ),

  generateButton:
    document.getElementById(
      "generateButton"
    ),

  feedbackMessage:
    document.getElementById(
      "feedbackMessage"
    ),

  successState:
    document.getElementById(
      "successState"
    ),

  successTitle:
    document.getElementById(
      "successTitle"
    ),

  successMessage:
    document.getElementById(
      "successMessage"
    ),

  buildAnotherButton:
    document.getElementById(
      "buildAnotherButton"
    )
};

let templates = [];
let isLoading = false;
let isGenerating = false;

/* =========================================================
   Date helpers
   ========================================================= */

function getLocalDateKey(date) {
  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      "0"
    );

  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    );

  return `${year}-${month}-${day}`;
}

function getTomorrowDateKey() {
  const tomorrow =
    new Date();

  tomorrow.setDate(
    tomorrow.getDate() + 1
  );

  return getLocalDateKey(
    tomorrow
  );
}

function buildStartTimestamp(
  dateKey,
  timeValue
) {
  if (
    !dateKey ||
    !timeValue
  ) {
    throw new Error(
      "Choose a date and start time."
    );
  }

  const localDate =
    new Date(
      `${dateKey}T${timeValue}:00`
    );

  if (
    Number.isNaN(
      localDate.getTime()
    )
  ) {
    throw new Error(
      "The selected start time is invalid."
    );
  }

  return localDate.toISOString();
}

function formatTime(dateValue) {
  const date =
    new Date(dateValue);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  return new Intl.DateTimeFormat(
    "en-US",
    {
      hour: "numeric",
      minute: "2-digit"
    }
  ).format(date);
}

function formatDate(dateKey) {
  const date =
    new Date(
      `${dateKey}T12:00:00`
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return dateKey;
  }

  return new Intl.DateTimeFormat(
    "en-US",
    {
      weekday: "long",
      month: "long",
      day: "numeric"
    }
  ).format(date);
}

/* =========================================================
   UI helpers
   ========================================================= */

function showOnly(section) {
  elements.loadingState.hidden =
    section !== "loading";

  elements.errorState.hidden =
    section !== "error";

  elements.builderForm.hidden =
    section !== "form";

  elements.successState.hidden =
    section !== "success";
}

function setFeedback(
  message,
  type = "neutral"
) {
  if (!message) {
    elements.feedbackMessage.hidden =
      true;

    elements.feedbackMessage.textContent =
      "";

    elements.feedbackMessage.classList.remove(
      "is-error",
      "is-success",
      "is-warning"
    );

    return;
  }

  elements.feedbackMessage.hidden =
    false;

  elements.feedbackMessage.textContent =
    message;

  elements.feedbackMessage.classList.toggle(
    "is-error",
    type === "error"
  );

  elements.feedbackMessage.classList.toggle(
    "is-success",
    type === "success"
  );

  elements.feedbackMessage.classList.toggle(
    "is-warning",
    type === "warning"
  );
}

function setGeneratingState(
  generating
) {
  isGenerating =
    generating;

  elements.generateButton.disabled =
    generating;

  elements.dateInput.disabled =
    generating;

  elements.startTimeInput.disabled =
    generating;

  elements.templateSelect.disabled =
    generating;

  elements.existingModeSelect.disabled =
    generating;

  elements.generateButton.textContent =
    generating
      ? "Building your day…"
      : "✨ Generate Schedule";
}

function populateTemplateOptions() {
  elements.templateSelect
    .replaceChildren();

  for (
    const templateName of
    templates
  ) {
    const option =
      document.createElement(
        "option"
      );

    option.value =
      templateName;

    option.textContent =
      templateName;

    elements.templateSelect.append(
      option
    );
  }
}

function setDefaultValues() {
  elements.dateInput.value =
    getTomorrowDateKey();

  elements.startTimeInput.value =
    "07:00";

  elements.existingModeSelect.value =
    "cancel";
}

/* =========================================================
   API helpers
   ========================================================= */

async function parseApiResponse(
  response
) {
  let data;

  try {
    data =
      await response.json();
  } catch {
    throw new Error(
      "The server returned an unreadable response."
    );
  }

  if (
    !response.ok ||
    data.success === false
  ) {
    throw new Error(
      data.error ||
      "The request could not be completed."
    );
  }

  return data;
}

async function loadTemplates() {
  if (isLoading) {
    return;
  }

  isLoading = true;

  showOnly(
    "loading"
  );

  try {
    const response =
      await fetch(
        DAY_GENERATOR_API_URL,
        {
          cache:
            "no-store"
        }
      );

    const data =
      await parseApiResponse(
        response
      );

    templates =
      Array.isArray(
        data.templates
      )
        ? data.templates
        : [];

    if (
      templates.length === 0
    ) {
      throw new Error(
        "No active day templates were found."
      );
    }

    populateTemplateOptions();

    setDefaultValues();

    showOnly(
      "form"
    );
  } catch (error) {
    console.error(
      "Build My Day load error:",
      error
    );

    showOnly(
      "error"
    );

    elements.errorMessage.textContent =
      error instanceof Error
        ? error.message
        : String(error);
  } finally {
    isLoading = false;
  }
}

async function generateSchedule() {
  if (isGenerating) {
    return;
  }

  const date =
    elements.dateInput.value;

  const startTime =
    elements.startTimeInput.value;

  const template =
    elements.templateSelect.value;

  const existingMode =
    elements.existingModeSelect.value;

  let startTimestamp;

  try {
    startTimestamp =
      buildStartTimestamp(
        date,
        startTime
      );
  } catch (error) {
    setFeedback(
      error instanceof Error
        ? error.message
        : String(error),
      "error"
    );

    return;
  }

  setGeneratingState(
    true
  );

  setFeedback(
    "Creating your time blocks…",
    "neutral"
  );

  try {
    const response =
      await fetch(
        DAY_GENERATOR_API_URL,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          cache: "no-store",

          body:
            JSON.stringify({
              date,
              startTime:
                startTimestamp,
              template,
              existingMode
            })
        }
      );

    const data =
      await parseApiResponse(
        response
      );

    if (
      data.conflict === true
    ) {
      setFeedback(
        data.message ||
        "Time blocks already exist for that day.",
        "warning"
      );

      return;
    }

    showOnly(
      "success"
    );

    elements.successTitle.textContent =
      "Your day is built ✨";

    elements.successMessage.textContent =
      `${data.createdCount} blocks created for ${formatDate(
        data.date
      )}, from ${formatTime(
        data.start
      )} to ${formatTime(
        data.end
      )}.`;
  } catch (error) {
    console.error(
      "Build My Day generation error:",
      error
    );

    setFeedback(
      error instanceof Error
        ? error.message
        : String(error),
      "error"
    );
  } finally {
    setGeneratingState(
      false
    );
  }
}

/* =========================================================
   Events
   ========================================================= */

elements.builderForm.addEventListener(
  "submit",
  (event) => {
    event.preventDefault();

    generateSchedule();
  }
);

elements.retryButton.addEventListener(
  "click",
  loadTemplates
);

elements.buildAnotherButton.addEventListener(
  "click",
  () => {
    setFeedback(
      ""
    );

    setDefaultValues();

    showOnly(
      "form"
    );
  }
);

/* =========================================================
   Initialize
   ========================================================= */

loadTemplates();
