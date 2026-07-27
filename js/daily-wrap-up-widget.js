/* ==================================================
   MICHAELA OS — DAILY WRAP-UP WIDGET
   Working-first version
   ================================================== */

const API_URL = "/api/daily-wrap-up";
const SAVE_DELAY = 700;

const app = {
  page: null,
  period: null,
  state: null,
  metrics: null,
  display: null,

  saveTimer: null,
  isSaving: false,
  needsAnotherSave: false,

  elements: {}
};

/* ==================================================
   DOM
   ================================================== */

function cacheElements() {
  app.elements = {
    widget:
      document.querySelector(
        ".wrap-up-widget"
      ),

    titleIcon:
      document.getElementById(
        "titleIcon"
      ),

    titleText:
      document.getElementById(
        "titleText"
      ),

    subtitle:
      document.getElementById(
        "wrapUpSubtitle"
      ),

    saveIndicator:
      document.getElementById(
        "saveIndicator"
      ),

    saveIndicatorIcon:
      document.getElementById(
        "saveIndicatorIcon"
      ),

    saveIndicatorText:
      document.getElementById(
        "saveIndicatorText"
      ),

    fixedChecklist:
      document.getElementById(
        "fixedChecklist"
      ),

    extraReminderList:
      document.getElementById(
        "extraReminderList"
      ),

    emptyReminderMessage:
      document.getElementById(
        "emptyReminderMessage"
      ),

    addReminderButton:
      document.getElementById(
        "addReminderButton"
      ),

    progressTrack:
      document.getElementById(
        "progressTrack"
      ),

    progressFill:
      document.getElementById(
        "progressFill"
      ),

    gladI:
      document.getElementById(
        "gladI"
      ),

    proudOf:
      document.getElementById(
        "proudOf"
      ),

    favoriteToday:
      document.getElementById(
        "favoriteToday"
      ),

    rememberTomorrow:
      document.getElementById(
        "rememberTomorrow"
      ),

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
      )
  };
}

/* ==================================================
   BASIC HELPERS
   ================================================== */

function createReminderId() {
  return [
    "reminder",
    Date.now().toString(36),
    Math.random()
      .toString(36)
      .slice(2, 8)
  ].join("-");
}

function hasText(value) {
  return Boolean(
    String(value || "").trim()
  );
}

function getFixedTasks() {
  return Array.isArray(
    app.state?.fixedTasks
  )
    ? app.state.fixedTasks
    : [];
}

function getExtraReminders() {
  return Array.isArray(
    app.state?.extraReminders
  )
    ? app.state.extraReminders
    : [];
}

function getReflections() {
  if (
    !app.state.reflections ||
    typeof app.state.reflections !==
      "object"
  ) {
    app.state.reflections = {
      gladI: "",
      proudOf: "",
      favoriteToday: ""
    };
  }

  return app.state.reflections;
}

/* ==================================================
   API
   ================================================== */

async function requestJson(
  url,
  options = {}
) {
  const response =
    await fetch(url, {
      ...options,

      headers: {
        "Content-Type":
          "application/json",

        ...(options.headers || {})
      }
    });

  let data = null;

  try {
    data =
      await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const error =
      new Error(
        data?.details ||
        data?.error ||
        `Request failed: ${response.status}`
      );

    error.status =
      response.status;

    error.code =
      data?.code || "";

    throw error;
  }

  if (data?.success === false) {
    throw new Error(
      data.details ||
      data.error ||
      "The request was unsuccessful."
    );
  }

  return data;
}

function applyResponse(data) {
  app.page =
    data.page || null;

  app.period =
    data.period || null;

  app.state =
    data.state || {
      version: 1,
      fixedTasks: [],
      extraReminders: [],
      reflections: {
        gladI: "",
        proudOf: "",
        favoriteToday: ""
      },
      rememberTomorrow: ""
    };

  app.metrics =
    data.metrics || null;

  app.display =
    data.display || null;

  getReflections();
}

/* ==================================================
   LOAD
   ================================================== */

async function loadWrapUp() {
  showLoading();
  setSaveStatus("loading");

  try {
    const data =
      await requestJson(API_URL);

    applyResponse(data);

    render();
    hideMessageLayers();
    setSaveStatus("saved");
  } catch (error) {
    console.error(
      "Daily Wrap-Up load failed:",
      error
    );

    showError(
      error instanceof Error
        ? error.message
        : "The Daily Wrap-Up could not be loaded."
    );
  }
}

/* ==================================================
   LOCAL METRICS
   Used for immediate visual updates
   ================================================== */

function calculateLocalMetrics() {
  const fixedTasks =
    getFixedTasks();

  const extraReminders =
    getExtraReminders()
      .filter((reminder) =>
        hasText(reminder.text)
      );

  const fixedComplete =
    fixedTasks.filter(
      (task) => task.complete
    ).length;

  const extraComplete =
    extraReminders.filter(
      (reminder) =>
        reminder.complete
    ).length;

  const totalTasks =
    fixedTasks.length +
    extraReminders.length;

  const completedTasks =
    fixedComplete +
    extraComplete;

  const completion =
    totalTasks > 0
      ? Math.round(
          completedTasks /
          totalTasks *
          100
        )
      : 0;

  return {
    fixedTasksComplete:
      fixedComplete,

    fixedTasksTotal:
      fixedTasks.length,

    extraTasksComplete:
      extraComplete,

    extraTasksTotal:
      extraReminders.length,

    completedTasks,

    totalTasks,

    completion,

    complete:
      totalTasks > 0 &&
      completedTasks ===
        totalTasks
  };
}

function refreshLocalMetrics() {
  app.metrics =
    calculateLocalMetrics();
}

/* ==================================================
   SAVE
   ================================================== */

function scheduleSave() {
  window.clearTimeout(
    app.saveTimer
  );

  setSaveStatus("unsaved");

  app.saveTimer =
    window.setTimeout(
      saveWrapUp,
      SAVE_DELAY
    );
}

async function saveWrapUp() {
  if (
    !app.state ||
    !app.period?.wrapUpId
  ) {
    return;
  }

  if (app.isSaving) {
    app.needsAnotherSave = true;
    return;
  }

  app.isSaving = true;
  app.needsAnotherSave = false;

  setSaveStatus("saving");

  try {
    const data =
      await requestJson(
        API_URL,
        {
          method: "POST",

          body:
            JSON.stringify({
              wrapUpId:
                app.period.wrapUpId,

              state:
                app.state
            })
        }
      );

    applyResponse(data);
    render();
    setSaveStatus("saved");
  } catch (error) {
    console.error(
      "Daily Wrap-Up save failed:",
      error
    );

    if (
      error.status === 409 ||
      error.code ===
        "WRAP_UP_PERIOD_CHANGED"
    ) {
      await loadWrapUp();
      return;
    }

    setSaveStatus("error");
  } finally {
    app.isSaving = false;

    if (app.needsAnotherSave) {
      app.needsAnotherSave = false;
      scheduleSave();
    }
  }
}

/* ==================================================
   MAIN RENDER
   ================================================== */

function render() {
  if (!app.state) {
    return;
  }

  renderHeader();
  renderFixedTasks();
  renderExtraReminders();
  renderReflectionValues();
  renderProgress();
}

/* ==================================================
   HEADER
   ================================================== */

function renderHeader() {
  const complete =
    Boolean(
      app.metrics?.complete
    );

  app.elements.widget
    ?.classList.toggle(
      "is-complete",
      complete
    );

  if (app.elements.titleIcon) {
    app.elements.titleIcon
      .textContent =
        complete ? "✨" : "🌙";
  }

  if (app.elements.titleText) {
    app.elements.titleText
      .textContent =
        complete
          ? "Wrapped Up"
          : "Daily Wrap-Up";
  }

  if (app.elements.subtitle) {
    app.elements.subtitle
      .textContent =
        complete
          ? (
              app.display?.subtitle ||
              "See you tomorrow."
            )
          : (
              app.display?.subtitle ||
              "Close the loop on your workday."
            );
  }
}

/* ==================================================
   FIXED TASKS
   ================================================== */

function renderFixedTasks() {
  const container =
    app.elements.fixedChecklist;

  if (!container) {
    return;
  }

  container.replaceChildren();

  const tasks =
    getFixedTasks();

  tasks.forEach(
    (task, index) => {
      const label =
        document.createElement(
          "label"
        );

      label.className =
        "checklist-item";

      const checkbox =
        document.createElement(
          "input"
        );

      checkbox.type =
        "checkbox";

      checkbox.className =
        "checklist-checkbox";

      checkbox.checked =
        Boolean(task.complete);

      checkbox.setAttribute(
        "aria-label",
        `Mark ${task.label} complete`
      );

      checkbox.addEventListener(
        "change",
        () => {
          app.state.fixedTasks[
            index
          ].complete =
            checkbox.checked;

          updateAfterChange();
        }
      );

      const text =
        document.createElement(
          "span"
        );

      text.className =
        "checklist-label";

      text.textContent =
        task.label;

      label.append(
        checkbox,
        text
      );

      container.appendChild(
        label
      );
    }
  );
}

/* ==================================================
   EXTRA REMINDERS
   ================================================== */

function renderExtraReminders() {
  const container =
    app.elements
      .extraReminderList;

  if (!container) {
    return;
  }

  container.replaceChildren();

  const reminders =
    getExtraReminders();

  reminders.forEach(
    (reminder, index) => {
      const row =
        document.createElement(
          "div"
        );

      row.className =
        "checklist-item has-delete";

      const checkbox =
        document.createElement(
          "input"
        );

      checkbox.type =
        "checkbox";

      checkbox.className =
        "checklist-checkbox";

      checkbox.checked =
        Boolean(
          reminder.complete
        );

      checkbox.setAttribute(
        "aria-label",
        `Mark ${
          reminder.text ||
          "reminder"
        } complete`
      );

      checkbox.addEventListener(
        "change",
        () => {
          app.state
            .extraReminders[
              index
            ].complete =
              checkbox.checked;

          updateAfterChange();
        }
      );

      const input =
        document.createElement(
          "input"
        );

      input.type = "text";

      input.className =
        "reminder-text-input";

      input.value =
        reminder.text || "";

      input.placeholder =
        "Add a reminder...";

      input.maxLength = 500;

      input.setAttribute(
        "aria-label",
        "Reminder text"
      );

      input.addEventListener(
        "input",
        () => {
          app.state
            .extraReminders[
              index
            ].text =
              input.value;

          refreshLocalMetrics();
          renderProgress();
          scheduleSave();
        }
      );

      input.addEventListener(
        "blur",
        () => {
          if (
            !input.value.trim()
          ) {
            app.state
              .extraReminders
              .splice(index, 1);

            updateAfterChange(
              true
            );
          }
        }
      );

      const deleteButton =
        document.createElement(
          "button"
        );

      deleteButton.type =
        "button";

      deleteButton.className =
        "delete-reminder-button";

      deleteButton.textContent =
        "×";

      deleteButton.setAttribute(
        "aria-label",
        `Delete ${
          reminder.text ||
          "reminder"
        }`
      );

      deleteButton.addEventListener(
        "click",
        () => {
          app.state
            .extraReminders
            .splice(index, 1);

          updateAfterChange(
            true
          );
        }
      );

      row.append(
        checkbox,
        input,
        deleteButton
      );

      container.appendChild(
        row
      );
    }
  );

  app.elements
    .emptyReminderMessage
    ?.classList.toggle(
      "is-hidden",
      reminders.length > 0
    );
}

function addReminder() {
  if (!app.state) {
    return;
  }

  app.state
    .extraReminders
    .push({
      id:
        createReminderId(),

      text: "",

      complete: false
    });

  renderExtraReminders();

  const inputs =
    app.elements
      .extraReminderList
      ?.querySelectorAll(
        ".reminder-text-input"
      );

  inputs?.[
    inputs.length - 1
  ]?.focus();
}

/* ==================================================
   REFLECTIONS
   ================================================== */

function setValueUnlessFocused(
  element,
  value
) {
  if (
    !element ||
    document.activeElement ===
      element
  ) {
    return;
  }

  element.value =
    value || "";
}

function renderReflectionValues() {
  const reflections =
    getReflections();

  setValueUnlessFocused(
    app.elements.gladI,
    reflections.gladI
  );

  setValueUnlessFocused(
    app.elements.proudOf,
    reflections.proudOf
  );

  setValueUnlessFocused(
    app.elements.favoriteToday,
    reflections.favoriteToday
  );

  setValueUnlessFocused(
    app.elements.rememberTomorrow,
    app.state
      .rememberTomorrow
  );
}

function bindReflectionField(
  element,
  property
) {
  if (!element) {
    return;
  }

  element.addEventListener(
    "input",
    () => {
      getReflections()[
        property
      ] = element.value;

      scheduleSave();
    }
  );
}

function bindTomorrowField() {
  const element =
    app.elements
      .rememberTomorrow;

  if (!element) {
    return;
  }

  element.addEventListener(
    "input",
    () => {
      app.state
        .rememberTomorrow =
          element.value;

      scheduleSave();
    }
  );
}

/* ==================================================
   PROGRESS
   ================================================== */

function renderProgress() {
  const completion =
    Number(
      app.metrics?.completion || 0
    );

  if (app.elements.progressFill) {
    app.elements
      .progressFill
      .style.width =
        `${completion}%`;
  }

  if (app.elements.progressTrack) {
    app.elements
      .progressTrack
      .setAttribute(
        "aria-valuenow",
        String(completion)
      );

    app.elements
      .progressTrack
      .setAttribute(
        "aria-valuetext",
        `${completion}% complete`
      );
  }

  renderHeader();
}

function updateAfterChange(
  rerenderReminders = false
) {
  refreshLocalMetrics();

  if (rerenderReminders) {
    renderExtraReminders();
  }

  renderProgress();
  scheduleSave();
}

/* ==================================================
   SAVE STATUS
   ================================================== */

function setSaveStatus(status) {
  const indicator =
    app.elements
      .saveIndicator;

  const icon =
    app.elements
      .saveIndicatorIcon;

  const text =
    app.elements
      .saveIndicatorText;

  if (
    !indicator ||
    !icon ||
    !text
  ) {
    return;
  }

  indicator.classList.remove(
    "is-saved",
    "is-saving",
    "is-error"
  );

  if (status === "loading") {
    indicator.classList.add(
      "is-saving"
    );

    icon.textContent = "…";
    text.textContent =
      "Loading";

    return;
  }

  if (status === "unsaved") {
    indicator.classList.add(
      "is-saving"
    );

    icon.textContent = "•";
    text.textContent =
      "Unsaved";

    return;
  }

  if (status === "saving") {
    indicator.classList.add(
      "is-saving"
    );

    icon.textContent = "…";
    text.textContent =
      "Saving";

    return;
  }

  if (status === "error") {
    indicator.classList.add(
      "is-error"
    );

    icon.textContent = "!";
    text.textContent =
      "Save failed";

    return;
  }

  indicator.classList.add(
    "is-saved"
  );

  icon.textContent = "✓";
  text.textContent = "Saved";
}

/* ==================================================
   LOADING AND ERROR STATES
   ================================================== */

function showLoading() {
  app.elements
    .loadingState
    ?.classList.remove(
      "is-hidden"
    );

  app.elements
    .errorState
    ?.classList.add(
      "is-hidden"
    );
}

function showError(message) {
  app.elements
    .loadingState
    ?.classList.add(
      "is-hidden"
    );

  app.elements
    .errorState
    ?.classList.remove(
      "is-hidden"
    );

  if (
    app.elements.errorMessage
  ) {
    app.elements
      .errorMessage
      .textContent =
        message ||
        "The Daily Wrap-Up could not be loaded.";
  }
}

function hideMessageLayers() {
  app.elements
    .loadingState
    ?.classList.add(
      "is-hidden"
    );

  app.elements
    .errorState
    ?.classList.add(
      "is-hidden"
    );
}

/* ==================================================
   EVENTS
   ================================================== */

function bindEvents() {
  app.elements
    .addReminderButton
    ?.addEventListener(
      "click",
      addReminder
    );

  app.elements
    .retryButton
    ?.addEventListener(
      "click",
      loadWrapUp
    );

  bindReflectionField(
    app.elements.gladI,
    "gladI"
  );

  bindReflectionField(
    app.elements.proudOf,
    "proudOf"
  );

  bindReflectionField(
    app.elements.favoriteToday,
    "favoriteToday"
  );

  bindTomorrowField();
}

/* ==================================================
   INITIALIZATION
   ================================================== */

async function init() {
  cacheElements();
  bindEvents();
  await loadWrapUp();
}

document.addEventListener(
  "DOMContentLoaded",
  init
);
