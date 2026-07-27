/* ==================================================
   DAILY WRAP-UP WIDGET
   Loads, renders, and autosaves the active wrap-up
   ================================================== */

const API_URL = "/api/daily-wrap-up";

const AUTOSAVE_DELAY = 750;

const DEFAULT_FIXED_TASKS = [
  {
    id: "check-calendar",
    label: "Check tomorrow’s calendar",
    complete: false
  },
  {
    id: "review-tasks",
    label: "Review unfinished tasks",
    complete: false
  },
  {
    id: "clear-workspace",
    label: "Reset workspace",
    complete: false
  }
];

const app = {
  data: null,
  elements: {},
  saveTimer: null,
  saving: false,
  hasLoaded: false,
  reminderCounter: 0
};

/* ==================================================
   DOM
   ================================================== */

function cacheElements() {
  app.elements = {
    widget: document.querySelector(
      ".wrap-up-widget"
    ),

    titleIcon:
      document.getElementById("titleIcon"),

    titleText:
      document.getElementById("titleText"),

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
      document.getElementById("gladI"),

    proudOf:
      document.getElementById("proudOf"),

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
   NORMALIZATION HELPERS
   ================================================== */

function safeString(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
}

function createTaskId(prefix = "task") {
  app.reminderCounter += 1;

  return [
    prefix,
    Date.now(),
    app.reminderCounter
  ].join("-");
}

function normalizeTask(
  task,
  index,
  prefix
) {
  if (typeof task === "string") {
    return {
      id: `${prefix}-${index}`,
      label: task,
      complete: false
    };
  }

  const source =
    task && typeof task === "object"
      ? task
      : {};

  return {
    id: safeString(
      source.id ||
      source.key ||
      source.taskId ||
      `${prefix}-${index}`
    ),

    label: safeString(
      source.label ||
      source.name ||
      source.title ||
      source.text ||
      source.task ||
      ""
    ),

    complete: Boolean(
      source.complete ??
      source.completed ??
      source.checked ??
      source.done ??
      false
    )
  };
}

function normalizeTaskList(
  tasks,
  prefix
) {
  if (!Array.isArray(tasks)) {
    return [];
  }

  return tasks
    .map((task, index) =>
      normalizeTask(
        task,
        index,
        prefix
      )
    )
    .filter((task) => task.label.trim());
}

function getResponseState(responseData) {
  if (
    responseData?.state &&
    typeof responseData.state === "object"
  ) {
    return responseData.state;
  }

  if (
    responseData?.wrapUp &&
    typeof responseData.wrapUp === "object"
  ) {
    return responseData.wrapUp;
  }

  if (
    responseData?.data &&
    typeof responseData.data === "object"
  ) {
    return responseData.data;
  }

  return responseData || {};
}

function normalizeResponse(responseData) {
  const source =
    getResponseState(responseData);

  const fixedTaskSource =
    responseData?.fixedTasks ??
    source.fixedTasks ??
    source.fixed_tasks ??
    source.tasks ??
    source["Fixed Tasks"];

  const extraTaskSource =
    responseData?.extraReminders ??
    responseData?.extraTasks ??
    source.extraReminders ??
    source.extraTasks ??
    source.extra_tasks ??
    source.reminders ??
    source["Extra Tasks"];

  const fixedTasks =
    normalizeTaskList(
      fixedTaskSource,
      "fixed"
    );

  const extraReminders =
    normalizeTaskList(
      extraTaskSource,
      "extra"
    );

  return {
    page:
      responseData?.page ||
      source.page ||
      null,

    wrapUpId:
      safeString(
        responseData?.wrapUpId ||
        responseData?.id ||
        source.wrapUpId ||
        source.id ||
        ""
      ),

    wrapUpDate:
      safeString(
        responseData?.wrapUpDate ||
        responseData?.date ||
        source.wrapUpDate ||
        source.date ||
        ""
      ),

    fixedTasks:
      fixedTasks.length
        ? fixedTasks
        : DEFAULT_FIXED_TASKS.map(
            (task) => ({ ...task })
          ),

    extraReminders,

    gladI: safeString(
      source.gladI ??
      source.glad_i ??
      source["Glad I..."] ??
      ""
    ),

    proudOf: safeString(
      source.proudOf ??
      source.proud_of ??
      source["Proud Of..."] ??
      ""
    ),

    favoriteToday: safeString(
      source.favoriteToday ??
      source.favorite_today ??
      source["Favorite Today"] ??
      ""
    ),

    rememberTomorrow: safeString(
      source.rememberTomorrow ??
      source.remember_tomorrow ??
      source["Remember Tomorrow"] ??
      ""
    ),

    complete: Boolean(
      source.complete ??
      responseData?.complete ??
      false
    ),

    completion:
      Number(
        responseData?.metrics?.completion ??
        responseData?.completion ??
        source.completion ??
        0
      ) || 0,

    state: safeString(
      source.state ||
      responseData?.display?.state ||
      ""
    )
  };
}

/* ==================================================
   API
   ================================================== */

async function requestJson(
  url,
  options = {}
) {
  const response = await fetch(
    url,
    {
      ...options,

      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    }
  );

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message =
      data?.details ||
      data?.error ||
      `Request failed with status ${response.status}.`;

    throw new Error(message);
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

async function loadWrapUp() {
  showLoading();

  try {
    const responseData =
      await requestJson(API_URL);

    app.data =
      normalizeResponse(responseData);

    app.hasLoaded = true;

    render();
    hideMessages();
    setSaveStatus("saved");
  } catch (error) {
    console.error(
      "Unable to load Daily Wrap-Up:",
      error
    );

    showError(
      error instanceof Error
        ? error.message
        : "Your Daily Wrap-Up could not be loaded."
    );
  }
}

function buildSavePayload() {
  const state = {
    fixedTasks:
      app.data.fixedTasks,

    extraTasks:
      app.data.extraReminders,

    extraReminders:
      app.data.extraReminders,

    gladI:
      app.data.gladI,

    proudOf:
      app.data.proudOf,

    favoriteToday:
      app.data.favoriteToday,

    rememberTomorrow:
      app.data.rememberTomorrow,

    completion:
      calculateCompletion(),

    complete:
      isWrapUpComplete()
  };

  return {
    state,

    ...state,

    wrapUpId:
      app.data.wrapUpId,

    wrapUpDate:
      app.data.wrapUpDate
  };
}

async function saveWrapUp() {
  if (
    !app.data ||
    app.saving
  ) {
    return;
  }

  app.saving = true;
  setSaveStatus("saving");

  try {
    const responseData =
      await requestJson(
        API_URL,
        {
          method: "POST",
          body: JSON.stringify(
            buildSavePayload()
          )
        }
      );

    const savedData =
      normalizeResponse(responseData);

    /*
     * Preserve local data when the API only
     * returns a small success response.
     */
    if (
      responseData?.state ||
      responseData?.data ||
      responseData?.wrapUp
    ) {
      app.data = {
        ...app.data,
        ...savedData
      };

      render();
    }

    setSaveStatus("saved");
  } catch (error) {
    console.error(
      "Unable to save Daily Wrap-Up:",
      error
    );

    setSaveStatus("error");
  } finally {
    app.saving = false;
  }
}

function scheduleSave() {
  if (!app.hasLoaded) {
    return;
  }

  window.clearTimeout(
    app.saveTimer
  );

  setSaveStatus("waiting");

  app.saveTimer =
    window.setTimeout(
      saveWrapUp,
      AUTOSAVE_DELAY
    );
}

/* ==================================================
   COMPLETION
   ================================================== */

function hasText(value) {
  return Boolean(
    safeString(value).trim()
  );
}

function getCompletionItems() {
  const fixedTasks =
    app.data.fixedTasks.map(
      (task) => Boolean(task.complete)
    );

  const extraTasks =
    app.data.extraReminders
      .filter((task) =>
        hasText(task.label)
      )
      .map((task) =>
        Boolean(task.complete)
      );

  return [
    ...fixedTasks,
    ...extraTasks,
    hasText(app.data.gladI),
    hasText(app.data.proudOf),
    hasText(app.data.favoriteToday),
    hasText(
      app.data.rememberTomorrow
    )
  ];
}

function calculateCompletion() {
  if (!app.data) {
    return 0;
  }

  const items =
    getCompletionItems();

  if (!items.length) {
    return 0;
  }

  const completed =
    items.filter(Boolean).length;

  return Math.round(
    completed /
    items.length *
    100
  );
}

function isWrapUpComplete() {
  return calculateCompletion() >= 100;
}

/* ==================================================
   RENDERING
   ================================================== */

function render() {
  if (!app.data) {
    return;
  }

  renderHeader();
  renderFixedChecklist();
  renderExtraReminders();
  renderReflectionFields();
  renderProgress();
}

function renderHeader() {
  const complete =
    isWrapUpComplete();

  app.elements.widget?.classList.toggle(
    "is-complete",
    complete
  );

  if (app.elements.titleIcon) {
    app.elements.titleIcon.textContent =
      complete ? "✨" : "🌙";
  }

  if (app.elements.titleText) {
    app.elements.titleText.textContent =
      complete
        ? "Wrapped Up"
        : "Daily Wrap-Up";
  }

  if (app.elements.subtitle) {
    app.elements.subtitle.textContent =
      complete
        ? "Your workday is officially closed."
        : "Close the loop on your workday.";
  }
}

function createCheckbox(
  task,
  onChange
) {
  const checkbox =
    document.createElement("input");

  checkbox.type = "checkbox";
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
      onChange(checkbox.checked);
    }
  );

  return checkbox;
}

function renderFixedChecklist() {
  const container =
    app.elements.fixedChecklist;

  if (!container) {
    return;
  }

  container.replaceChildren();

  app.data.fixedTasks.forEach(
    (task, index) => {
      const item =
        document.createElement("label");

      item.className =
        "checklist-item";

      const checkbox =
        createCheckbox(
          task,
          (checked) => {
            app.data.fixedTasks[
              index
            ].complete = checked;

            renderHeader();
            renderProgress();
            scheduleSave();
          }
        );

      const label =
        document.createElement("span");

      label.className =
        "checklist-label";

      label.textContent =
        task.label;

      item.append(
        checkbox,
        label
      );

      container.appendChild(item);
    }
  );
}

function renderExtraReminders() {
  const container =
    app.elements.extraReminderList;

  if (!container) {
    return;
  }

  container.replaceChildren();

  app.data.extraReminders.forEach(
    (task, index) => {
      const item =
        document.createElement("div");

      item.className =
        "checklist-item has-delete";

      const checkbox =
        createCheckbox(
          task,
          (checked) => {
            app.data.extraReminders[
              index
            ].complete = checked;

            renderHeader();
            renderProgress();
            scheduleSave();
          }
        );

      const input =
        document.createElement("input");

      input.type = "text";

      input.className =
        "reminder-text-input";

      input.value =
        task.label;

      input.placeholder =
        "Add a reminder...";

      input.setAttribute(
        "aria-label",
        "Reminder"
      );

      input.addEventListener(
        "input",
        () => {
          app.data.extraReminders[
            index
          ].label = input.value;

          renderProgress();
          scheduleSave();
        }
      );

      input.addEventListener(
        "blur",
        () => {
          /*
           * Remove fully blank reminder rows
           * after the user leaves the field.
           */
          if (!input.value.trim()) {
            app.data.extraReminders.splice(
              index,
              1
            );

            renderExtraReminders();
            renderProgress();
            scheduleSave();
          }
        }
      );

      const deleteButton =
        document.createElement("button");

      deleteButton.type = "button";

      deleteButton.className =
        "delete-reminder-button";

      deleteButton.textContent = "×";

      deleteButton.setAttribute(
        "aria-label",
        `Delete ${
          task.label || "reminder"
        }`
      );

      deleteButton.addEventListener(
        "click",
        () => {
          app.data.extraReminders.splice(
            index,
            1
          );

          renderExtraReminders();
          renderHeader();
          renderProgress();
          scheduleSave();
        }
      );

      item.append(
        checkbox,
        input,
        deleteButton
      );

      container.appendChild(item);
    }
  );

  if (
    app.elements.emptyReminderMessage
  ) {
    app.elements
      .emptyReminderMessage
      .classList.toggle(
        "is-hidden",
        app.data.extraReminders.length > 0
      );
  }
}

function renderReflectionFields() {
  setInputValue(
    app.elements.gladI,
    app.data.gladI
  );

  setInputValue(
    app.elements.proudOf,
    app.data.proudOf
  );

  setInputValue(
    app.elements.favoriteToday,
    app.data.favoriteToday
  );

  setInputValue(
    app.elements.rememberTomorrow,
    app.data.rememberTomorrow
  );
}

function setInputValue(
  element,
  value
) {
  if (!element) {
    return;
  }

  /*
   * Do not replace the value while the user
   * is actively typing in that field.
   */
  if (
    document.activeElement !== element
  ) {
    element.value =
      safeString(value);
  }
}

function renderProgress() {
  const completion =
    calculateCompletion();

  app.data.completion =
    completion;

  app.data.complete =
    completion >= 100;

  if (app.elements.progressFill) {
    app.elements.progressFill.style.width =
      `${completion}%`;
  }

  if (app.elements.progressTrack) {
    app.elements.progressTrack.setAttribute(
      "aria-valuenow",
      String(completion)
    );

    app.elements.progressTrack.setAttribute(
      "aria-valuetext",
      `${completion}% complete`
    );
  }

  renderHeader();
}

/* ==================================================
   SAVE INDICATOR
   ================================================== */

function setSaveStatus(status) {
  const indicator =
    app.elements.saveIndicator;

  const icon =
    app.elements.saveIndicatorIcon;

  const text =
    app.elements.saveIndicatorText;

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

  if (status === "saving") {
    indicator.classList.add(
      "is-saving"
    );

    icon.textContent = "…";
    text.textContent = "Saving";

    return;
  }

  if (status === "waiting") {
    indicator.classList.add(
      "is-saving"
    );

    icon.textContent = "•";
    text.textContent = "Unsaved";

    return;
  }

  if (status === "error") {
    indicator.classList.add(
      "is-error"
    );

    icon.textContent = "!";
    text.textContent = "Save failed";

    return;
  }

  indicator.classList.add(
    "is-saved"
  );

  icon.textContent = "✓";
  text.textContent = "Saved";
}

/* ==================================================
   EVENT HANDLERS
   ================================================== */

function handleAddReminder() {
  if (!app.data) {
    return;
  }

  app.data.extraReminders.push({
    id: createTaskId("extra"),
    label: "",
    complete: false
  });

  renderExtraReminders();
  renderProgress();

  const inputs =
    app.elements.extraReminderList
      ?.querySelectorAll(
        ".reminder-text-input"
      );

  const newestInput =
    inputs?.[
      inputs.length - 1
    ];

  newestInput?.focus();
}

function connectTextField(
  element,
  property
) {
  if (!element) {
    return;
  }

  element.addEventListener(
    "input",
    () => {
      if (!app.data) {
        return;
      }

      app.data[property] =
        element.value;

      renderProgress();
      scheduleSave();
    }
  );
}

function bindEvents() {
  app.elements
    .addReminderButton
    ?.addEventListener(
      "click",
      handleAddReminder
    );

  app.elements
    .retryButton
    ?.addEventListener(
      "click",
      loadWrapUp
    );

  connectTextField(
    app.elements.gladI,
    "gladI"
  );

  connectTextField(
    app.elements.proudOf,
    "proudOf"
  );

  connectTextField(
    app.elements.favoriteToday,
    "favoriteToday"
  );

  connectTextField(
    app.elements.rememberTomorrow,
    "rememberTomorrow"
  );

  /*
   * Attempt to save any pending edits before
   * the widget is closed or refreshed.
   */
  window.addEventListener(
    "beforeunload",
    () => {
      if (!app.data) {
        return;
      }

      window.clearTimeout(
        app.saveTimer
      );

      const payload =
        JSON.stringify(
          buildSavePayload()
        );

      navigator.sendBeacon?.(
        API_URL,
        new Blob(
          [payload],
          {
            type: "application/json"
          }
        )
      );
    }
  );
}

/* ==================================================
   MESSAGE STATES
   ================================================== */

function showLoading() {
  app.elements.loadingState
    ?.classList.remove(
      "is-hidden"
    );

  app.elements.errorState
    ?.classList.add(
      "is-hidden"
    );
}

function showError(message) {
  app.elements.loadingState
    ?.classList.add(
      "is-hidden"
    );

  app.elements.errorState
    ?.classList.remove(
      "is-hidden"
    );

  if (app.elements.errorMessage) {
    app.elements.errorMessage.textContent =
      message ||
      "Your Daily Wrap-Up could not be loaded.";
  }
}

function hideMessages() {
  app.elements.loadingState
    ?.classList.add(
      "is-hidden"
    );

  app.elements.errorState
    ?.classList.add(
      "is-hidden"
    );
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
