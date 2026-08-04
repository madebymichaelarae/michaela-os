const TIME_BLOCKS_API_URL =
  "/api/timeblocks";

const REFRESH_INTERVAL_MS =
  60 * 1000;

const CLOCK_INTERVAL_MS =
  1000;

const COMPLETE_STATUSES =
  new Set([
    "done",
    "complete",
    "completed",
    "finished",
    "skipped"
  ]);

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

  emptyState:
    document.getElementById(
      "emptyState"
    ),

  emptyTitle:
    document.getElementById(
      "emptyTitle"
    ),

  emptyMessage:
    document.getElementById(
      "emptyMessage"
    ),

  focusContent:
    document.getElementById(
      "focusContent"
    ),

  refreshButton:
    document.getElementById(
      "refreshButton"
    ),

  retryButton:
    document.getElementById(
      "retryButton"
    ),

  soundButton:
    document.getElementById(
      "soundButton"
    ),

  currentLabel:
    document.getElementById(
      "currentLabel"
    ),

  currentTitle:
    document.getElementById(
      "currentTitle"
    ),

  currentTimeRange:
    document.getElementById(
      "currentTimeRange"
    ),

  countdown:
    document.getElementById(
      "countdown"
    ),

  blockStatus:
    document.getElementById(
      "blockStatus"
    ),

  progressTrack:
    document.getElementById(
      "progressTrack"
    ),

  progressFill:
    document.getElementById(
      "progressFill"
    ),

  blockMessage:
    document.getElementById(
      "blockMessage"
    ),

  focusControls:
    document.getElementById(
      "focusControls"
    ),

  completeBlockButton:
    document.getElementById(
      "completeBlockButton"
    ),

  endEarlyButton:
    document.getElementById(
      "endEarlyButton"
    ),

  extensionButtons:
    Array.from(
      document.querySelectorAll(
        "[data-extension-minutes]"
      )
    ),

  controlFeedback:
    document.getElementById(
      "controlFeedback"
    ),

  tasksSection:
    document.getElementById(
      "tasksSection"
    ),

  taskList:
    document.getElementById(
      "taskList"
    ),

  taskCount:
    document.getElementById(
      "taskCount"
    ),

  nextSection:
    document.getElementById(
      "nextSection"
    ),

  nextTitle:
    document.getElementById(
      "nextTitle"
    ),

  nextTime:
    document.getElementById(
      "nextTime"
    ),

  nextDuration:
    document.getElementById(
      "nextDuration"
    ),

  scheduleProgress:
    document.getElementById(
      "scheduleProgress"
    ),

  lastUpdated:
    document.getElementById(
      "lastUpdated"
    )
};

let blocks = [];

let taskStatusOptions = [];

let scheduleDate = null;

let currentScheduleState =
  null;

let lastLoadedAt = null;

let isLoading = false;

let isUpdating = false;

let audioContext = null;

let chimesEnabled =
  localStorage.getItem(
    "michaela-os-focus-chimes"
  ) === "true";

let activeBlockId = null;

let fiveMinuteChimePlayed =
  false;

let endingChimePlayed =
  false;

/* =========================================================
   General helpers
   ========================================================= */

function normalizeStatus(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function isCompleteStatus(
  status
) {
  return COMPLETE_STATUSES.has(
    normalizeStatus(status)
  );
}

function parseDate(value) {
  if (!value) {
    return null;
  }

  const date =
    new Date(value);

  return Number.isNaN(
    date.getTime()
  )
    ? null
    : date;
}

function formatTime(date) {
  if (!date) {
    return "Time unavailable";
  }

  return new Intl.DateTimeFormat(
    "en-US",
    {
      hour: "numeric",
      minute: "2-digit"
    }
  ).format(date);
}

function formatTimeRange(
  start,
  end
) {
  if (!start || !end) {
    return "Time unavailable";
  }

  return (
    `${formatTime(start)}–` +
    `${formatTime(end)}`
  );
}

function formatDuration(
  minutes
) {
  const safeMinutes =
    Math.max(
      0,
      Math.round(
        Number(minutes) || 0
      )
    );

  if (safeMinutes < 60) {
    return `${safeMinutes} min`;
  }

  const hours =
    Math.floor(
      safeMinutes / 60
    );

  const remainingMinutes =
    safeMinutes % 60;

  if (
    remainingMinutes === 0
  ) {
    return `${hours} hr`;
  }

  return (
    `${hours} hr ` +
    `${remainingMinutes} min`
  );
}

function formatCountdown(
  milliseconds
) {
  const totalSeconds =
    Math.max(
      0,
      Math.ceil(
        milliseconds / 1000
      )
    );

  const hours =
    Math.floor(
      totalSeconds / 3600
    );

  const minutes =
    Math.floor(
      (
        totalSeconds % 3600
      ) / 60
    );

  const seconds =
    totalSeconds % 60;

  if (hours > 0) {
    return (
      `${hours}h ` +
      `${String(minutes).padStart(2, "0")}m`
    );
  }

  if (minutes > 0) {
    return (
      `${minutes}m ` +
      `${String(seconds).padStart(2, "0")}s`
    );
  }

  return `${seconds}s`;
}

function formatUpdatedTime() {
  if (!lastLoadedAt) {
    return "Not updated";
  }

  const secondsAgo =
    Math.max(
      0,
      Math.floor(
        (
          Date.now() -
          lastLoadedAt.getTime()
        ) / 1000
      )
    );

  if (secondsAgo < 10) {
    return "Updated now";
  }

  if (secondsAgo < 60) {
    return (
      `Updated ${secondsAgo}s ago`
    );
  }

  const minutesAgo =
    Math.floor(
      secondsAgo / 60
    );

  return (
    `Updated ${minutesAgo}m ago`
  );
}

function showOnly(section) {
  elements.loadingState.hidden =
    section !== "loading";

  elements.errorState.hidden =
    section !== "error";

  elements.emptyState.hidden =
    section !== "empty";

  elements.focusContent.hidden =
    section !== "content";
}

function getBlockTimes(block) {
  return {
    start:
      parseDate(
        block?.start
      ),

    end:
      parseDate(
        block?.end
      )
  };
}

function sortBlocks(entries) {
  return [...entries].sort(
    (first, second) => {
      if (
        typeof first.order ===
          "number" &&
        typeof second.order ===
          "number" &&
        first.order !==
          second.order
      ) {
        return (
          first.order -
          second.order
        );
      }

      const firstStart =
        parseDate(
          first.start
        );

      const secondStart =
        parseDate(
          second.start
        );

      if (
        !firstStart &&
        !secondStart
      ) {
        return 0;
      }

      if (!firstStart) {
        return 1;
      }

      if (!secondStart) {
        return -1;
      }

      return (
        firstStart.getTime() -
        secondStart.getTime()
      );
    }
  );
}

function setControlFeedback(
  message,
  type = "success"
) {
  if (!message) {
    elements.controlFeedback.hidden =
      true;

    elements.controlFeedback.textContent =
      "";

    elements.controlFeedback.classList.remove(
      "is-success",
      "is-error"
    );

    return;
  }

  elements.controlFeedback.hidden =
    false;

  elements.controlFeedback.textContent =
    message;

  elements.controlFeedback.classList.toggle(
    "is-success",
    type === "success"
  );

  elements.controlFeedback.classList.toggle(
    "is-error",
    type === "error"
  );
}

function setUpdatingState(
  updating
) {
  isUpdating = updating;

  elements.completeBlockButton.disabled =
    updating;

  elements.endEarlyButton.disabled =
    updating;

  for (
    const button of
    elements.extensionButtons
  ) {
    button.disabled =
      updating;
  }

  const taskSelects =
    elements.taskList.querySelectorAll(
      "select"
    );

  for (
    const select of
    taskSelects
  ) {
    select.disabled =
      updating;
  }
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

function applyApiData(data) {
  blocks =
    sortBlocks(
      Array.isArray(
        data.blocks
      )
        ? data.blocks
        : []
    );

  taskStatusOptions =
    Array.isArray(
      data.taskStatusOptions
    )
      ? data.taskStatusOptions
      : [];

  scheduleDate =
    data.date || null;

  lastLoadedAt =
    new Date();
}

async function sendTimeBlockAction(
  payload
) {
  const response =
    await fetch(
      TIME_BLOCKS_API_URL,
      {
        method: "PATCH",

        headers: {
          "Content-Type":
            "application/json"
        },

        cache: "no-store",

        body:
          JSON.stringify({
            ...payload,

            date:
              scheduleDate
          })
      }
    );

  return parseApiResponse(
    response
  );
}

/* =========================================================
   Audio and chimes
   ========================================================= */

function getAudioContext() {
  if (!audioContext) {
    const AudioContextClass =
      window.AudioContext ||
      window.webkitAudioContext;

    if (!AudioContextClass) {
      return null;
    }

    audioContext =
      new AudioContextClass();
  }

  return audioContext;
}

async function unlockAudio() {
  const context =
    getAudioContext();

  if (!context) {
    return false;
  }

  if (
    context.state ===
    "suspended"
  ) {
    await context.resume();
  }

  return (
    context.state ===
    "running"
  );
}

function playTone({
  frequency,
  startDelay = 0,
  duration = 0.25,
  volume = 0.12
}) {
  if (!chimesEnabled) {
    return;
  }

  const context =
    getAudioContext();

  if (
    !context ||
    context.state !==
      "running"
  ) {
    return;
  }

  const oscillator =
    context.createOscillator();

  const gain =
    context.createGain();

  const startTime =
    context.currentTime +
    startDelay;

  const endTime =
    startTime +
    duration;

  oscillator.type =
    "sine";

  oscillator.frequency
    .setValueAtTime(
      frequency,
      startTime
    );

  gain.gain.setValueAtTime(
    0.0001,
    startTime
  );

  gain.gain
    .exponentialRampToValueAtTime(
      volume,
      startTime + 0.025
    );

  gain.gain
    .exponentialRampToValueAtTime(
      0.0001,
      endTime
    );

  oscillator.connect(gain);

  gain.connect(
    context.destination
  );

  oscillator.start(
    startTime
  );

  oscillator.stop(
    endTime + 0.03
  );
}

function playFiveMinuteChime() {
  playTone({
    frequency: 659.25,
    duration: 0.24,
    volume: 0.1
  });

  playTone({
    frequency: 783.99,
    startDelay: 0.18,
    duration: 0.32,
    volume: 0.11
  });
}

function playEndingChime() {
  playTone({
    frequency: 523.25,
    duration: 0.25,
    volume: 0.12
  });

  playTone({
    frequency: 659.25,
    startDelay: 0.2,
    duration: 0.25,
    volume: 0.12
  });

  playTone({
    frequency: 783.99,
    startDelay: 0.4,
    duration: 0.46,
    volume: 0.13
  });
}

function updateSoundButton() {
  elements.soundButton.textContent =
    chimesEnabled
      ? "🔔 Chimes"
      : "🔕 Chimes";

  elements.soundButton.classList.toggle(
    "is-enabled",
    chimesEnabled
  );

  elements.soundButton.setAttribute(
    "aria-pressed",
    String(chimesEnabled)
  );
}

async function toggleChimes() {
  if (!chimesEnabled) {
    const unlocked =
      await unlockAudio();

    if (!unlocked) {
      window.alert(
        "This browser could not enable audio."
      );

      return;
    }

    chimesEnabled = true;

    localStorage.setItem(
      "michaela-os-focus-chimes",
      "true"
    );

    updateSoundButton();

    playTone({
      frequency: 659.25,
      duration: 0.15,
      volume: 0.08
    });

    return;
  }

  chimesEnabled = false;

  localStorage.setItem(
    "michaela-os-focus-chimes",
    "false"
  );

  updateSoundButton();
}

function resetBlockChimes(
  blockId
) {
  activeBlockId =
    blockId || null;

  fiveMinuteChimePlayed =
    false;

  endingChimePlayed =
    false;
}

function checkBlockChimes(
  block,
  now
) {
  if (
    !block ||
    !chimesEnabled
  ) {
    return;
  }

  const {
    start,
    end
  } =
    getBlockTimes(block);

  if (!start || !end) {
    return;
  }

  if (
    activeBlockId !==
    block.id
  ) {
    resetBlockChimes(
      block.id
    );
  }

  const remainingMs =
    end.getTime() -
    now.getTime();

  const fiveMinutesMs =
    5 * 60 * 1000;

  if (
    remainingMs > 0 &&
    remainingMs <=
      fiveMinutesMs &&
    !fiveMinuteChimePlayed
  ) {
    fiveMinuteChimePlayed =
      true;

    playFiveMinuteChime();
  }

  if (
    remainingMs <= 0 &&
    !endingChimePlayed
  ) {
    endingChimePlayed =
      true;

    playEndingChime();
  }
}

/* =========================================================
   Schedule state
   ========================================================= */

function getActiveBlocks() {
  return blocks.filter(
    (block) =>
      !isCompleteStatus(
        block.status
      )
  );
}

function findScheduleState(now) {
  const activeBlocks =
    getActiveBlocks();

  const currentIndex =
    activeBlocks.findIndex(
      (block) => {
        const {
          start,
          end
        } =
          getBlockTimes(block);

        return (
          start &&
          end &&
          now >= start &&
          now < end
        );
      }
    );

  if (currentIndex >= 0) {
    return {
      mode: "current",

      current:
        activeBlocks[
          currentIndex
        ],

      next:
        activeBlocks[
          currentIndex + 1
        ] || null
    };
  }

  const nextIndex =
    activeBlocks.findIndex(
      (block) => {
        const { start } =
          getBlockTimes(block);

        return (
          start &&
          start > now
        );
      }
    );

  if (nextIndex >= 0) {
    const earlierActiveBlocks =
      activeBlocks.slice(
        0,
        nextIndex
      );

    return {
      mode:
        earlierActiveBlocks.length > 0
          ? "gap"
          : "before",

      current:
        activeBlocks[
          nextIndex
        ],

      next:
        activeBlocks[
          nextIndex + 1
        ] || null
    };
  }

  if (
    activeBlocks.length > 0
  ) {
    return {
      mode: "overdue",

      current:
        activeBlocks[0],

      next:
        activeBlocks[1] ||
        null
    };
  }

  return {
    mode: "finished",
    current: null,
    next: null
  };
}

/* =========================================================
   Task rendering and updates
   ========================================================= */

function createTaskStatusSelect(
  task
) {
  const select =
    document.createElement(
      "select"
    );

  select.className =
    "task-status-select";

  select.setAttribute(
    "aria-label",
    `Status for ${task.title || "task"}`
  );

  const options =
    [...taskStatusOptions];

  if (
    task.status &&
    !options.includes(
      task.status
    )
  ) {
    options.unshift(
      task.status
    );
  }

  for (
    const statusName of
    options
  ) {
    const option =
      document.createElement(
        "option"
      );

    option.value =
      statusName;

    option.textContent =
      statusName.trim();

    option.selected =
      statusName ===
      task.status;

    select.append(
      option
    );
  }

  select.disabled =
    isUpdating ||
    task.unavailable;

  select.addEventListener(
    "change",
    async () => {
      const previousStatus =
        task.status;

      const nextStatus =
        select.value;

      select.disabled =
        true;

      setControlFeedback(
        "Updating task…",
        "success"
      );

      try {
        const data =
          await sendTimeBlockAction({
            action:
              "update-task-status",

            taskId:
              task.id,

            status:
              nextStatus
          });

        applyApiData(
          data
        );

        setControlFeedback(
          `Task moved to ${nextStatus.trim()}.`,
          "success"
        );

        renderSchedule();
      } catch (error) {
        select.value =
          previousStatus || "";

        setControlFeedback(
          error instanceof Error
            ? error.message
            : String(error),
          "error"
        );
      } finally {
        select.disabled =
          false;
      }
    }
  );

  return select;
}

function renderTasks(block) {
  const tasks =
    Array.isArray(
      block?.tasks
    )
      ? block.tasks
      : [];

  elements.taskList.replaceChildren();

  if (tasks.length === 0) {
    elements.tasksSection.hidden =
      true;

    return;
  }

  elements.tasksSection.hidden =
    false;

  const completeCount =
    tasks.filter(
      (task) =>
        isCompleteStatus(
          task.status
        )
    ).length;

  elements.taskCount.textContent =
    `${completeCount} of ${tasks.length}`;

  const sortedTasks =
    [...tasks].sort(
      (first, second) => {
        const firstComplete =
          isCompleteStatus(
            first.status
          );

        const secondComplete =
          isCompleteStatus(
            second.status
          );

        return (
          Number(firstComplete) -
          Number(secondComplete)
        );
      }
    );

  for (
    const task of
    sortedTasks
  ) {
    const complete =
      isCompleteStatus(
        task.status
      );

    const item =
      document.createElement(
        "li"
      );

    item.className =
      complete
        ? "task-item is-complete"
        : "task-item";

    const marker =
      document.createElement(
        "span"
      );

    marker.className =
      "task-marker";

    marker.textContent =
      complete ? "✓" : "";

    const content =
      document.createElement(
        "div"
      );

    content.className =
      "task-content";

    const title =
      task.url
        ? document.createElement(
            "a"
          )
        : document.createElement(
            "span"
          );

    title.className =
      "task-title";

    title.textContent =
      task.title ||
      "Untitled task";

    if (task.url) {
      title.href =
        task.url;

      title.target =
        "_blank";

      title.rel =
        "noopener noreferrer";
    }

    const select =
      createTaskStatusSelect(
        task
      );

    content.append(
      title,
      select
    );

    item.append(
      marker,
      content
    );

    elements.taskList.append(
      item
    );
  }
}

/* =========================================================
   Block actions
   ========================================================= */

function getCurrentActionBlock() {
  if (
    currentScheduleState?.mode ===
      "current" ||
    currentScheduleState?.mode ===
      "overdue"
  ) {
    return (
      currentScheduleState.current ||
      null
    );
  }

  return null;
}

async function runBlockAction({
  action,
  minutes = null
}) {
  const block =
    getCurrentActionBlock();

  if (!block) {
    setControlFeedback(
      "There is no active block to update.",
      "error"
    );

    return;
  }

  setUpdatingState(
    true
  );

  setControlFeedback(
    "Saving changes…",
    "success"
  );

  try {
    const payload = {
      action,
      blockId:
        block.id
    };

    if (
      minutes !== null
    ) {
      payload.minutes =
        minutes;
    }

    const data =
      await sendTimeBlockAction(
        payload
      );

    applyApiData(
      data
    );

    const feedbackMessages = {
      "complete-block":
        "Block marked complete.",

      "end-early":
        "Block ended early. Moving forward.",

      "extend-block":
        `Added ${minutes} minutes.`
    };

    setControlFeedback(
      feedbackMessages[action] ||
      "Schedule updated.",
      "success"
    );

    renderSchedule();
  } catch (error) {
    setControlFeedback(
      error instanceof Error
        ? error.message
        : String(error),
      "error"
    );
  } finally {
    setUpdatingState(
      false
    );
  }
}

/* =========================================================
   Rendering
   ========================================================= */

function getCompletedBlockCount() {
  return blocks.filter(
    (block) =>
      isCompleteStatus(
        block.status
      )
  ).length;
}

function renderNextBlock(block) {
  if (!block) {
    elements.nextSection.hidden =
      true;

    return;
  }

  elements.nextSection.hidden =
    false;

  const {
    start,
    end
  } =
    getBlockTimes(block);

  elements.nextTitle.textContent =
    block.title ||
    "Untitled block";

  elements.nextTime.textContent =
    formatTimeRange(
      start,
      end
    );

  elements.nextDuration.textContent =
    formatDuration(
      block.duration
    );
}

function renderCurrentMode(
  state,
  now
) {
  const block =
    state.current;

  const {
    start,
    end
  } =
    getBlockTimes(block);

  const durationMs =
    end.getTime() -
    start.getTime();

  const elapsedMs =
    now.getTime() -
    start.getTime();

  const progress =
    Math.min(
      100,
      Math.max(
        0,
        (
          elapsedMs /
          durationMs
        ) * 100
      )
    );

  elements.currentLabel.textContent =
    "Current block";

  elements.currentTitle.textContent =
    block.title ||
    "Untitled block";

  elements.currentTimeRange.textContent =
    formatTimeRange(
      start,
      end
    );

  elements.countdown.textContent =
    `${formatCountdown(
      end.getTime() -
      now.getTime()
    )} left`;

  elements.blockStatus.textContent =
    block.status ||
    "In progress";

  elements.progressFill.style.width =
    `${progress}%`;

  elements.progressTrack.setAttribute(
    "aria-valuenow",
    String(
      Math.round(progress)
    )
  );

  elements.blockMessage.hidden =
    true;

  elements.focusControls.hidden =
    false;

  renderTasks(
    block
  );

  renderNextBlock(
    state.next
  );

  checkBlockChimes(
    block,
    now
  );
}

function renderUpcomingMode(
  state,
  now
) {
  const block =
    state.current;

  const {
    start,
    end
  } =
    getBlockTimes(block);

  resetBlockChimes(
    null
  );

  elements.currentLabel.textContent =
    state.mode === "before"
      ? "First block"
      : "Next block";

  elements.currentTitle.textContent =
    block.title ||
    "Untitled block";

  elements.currentTimeRange.textContent =
    formatTimeRange(
      start,
      end
    );

  elements.countdown.textContent =
    `Starts in ${formatCountdown(
      start.getTime() -
      now.getTime()
    )}`;

  elements.blockStatus.textContent =
    state.mode === "before"
      ? "Not started"
      : "Between blocks";

  elements.progressFill.style.width =
    "0%";

  elements.progressTrack.setAttribute(
    "aria-valuenow",
    "0"
  );

  elements.blockMessage.hidden =
    false;

  elements.blockMessage.textContent =
    state.mode === "before"
      ? "Your day has not started yet."
      : "You have a little breathing room before the next block.";

  elements.focusControls.hidden =
    true;

  renderTasks(
    block
  );

  renderNextBlock(
    state.next
  );
}

function renderOverdueMode(
  state,
  now
) {
  const block =
    state.current;

  const {
    start,
    end
  } =
    getBlockTimes(block);

  resetBlockChimes(
    null
  );

  elements.currentLabel.textContent =
    "Needs attention";

  elements.currentTitle.textContent =
    block.title ||
    "Untitled block";

  elements.currentTimeRange.textContent =
    formatTimeRange(
      start,
      end
    );

  elements.countdown.textContent =
    `${formatCountdown(
      now.getTime() -
      end.getTime()
    )} overdue`;

  elements.blockStatus.textContent =
    block.status ||
    "Not finished";

  elements.progressFill.style.width =
    "100%";

  elements.progressTrack.setAttribute(
    "aria-valuenow",
    "100"
  );

  elements.blockMessage.hidden =
    false;

  elements.blockMessage.textContent =
    "This block passed its scheduled end but is still unfinished.";

  elements.focusControls.hidden =
    false;

  renderTasks(
    block
  );

  renderNextBlock(
    state.next
  );
}

function renderFinishedMode() {
  resetBlockChimes(
    null
  );

  elements.currentLabel.textContent =
    "Day complete";

  elements.currentTitle.textContent =
    "You made it 🎉";

  elements.currentTimeRange.textContent =
    "No unfinished blocks";

  elements.countdown.textContent =
    "Done for today";

  elements.blockStatus.textContent =
    "Complete";

  elements.progressFill.style.width =
    "100%";

  elements.progressTrack.setAttribute(
    "aria-valuenow",
    "100"
  );

  elements.blockMessage.hidden =
    false;

  elements.blockMessage.textContent =
    "Your scheduled workday is finished.";

  elements.focusControls.hidden =
    true;

  elements.tasksSection.hidden =
    true;

  elements.nextSection.hidden =
    true;
}

function renderSchedule() {
  if (blocks.length === 0) {
    currentScheduleState =
      null;

    showOnly(
      "empty"
    );

    elements.emptyTitle.textContent =
      "No blocks today";

    elements.emptyMessage.textContent =
      "Add time blocks in Notion and refresh.";

    return;
  }

  showOnly(
    "content"
  );

  const now =
    new Date();

  const state =
    findScheduleState(
      now
    );

  currentScheduleState =
    state;

  if (
    state.mode ===
    "current"
  ) {
    renderCurrentMode(
      state,
      now
    );
  } else if (
    state.mode ===
      "before" ||
    state.mode ===
      "gap"
  ) {
    renderUpcomingMode(
      state,
      now
    );
  } else if (
    state.mode ===
    "overdue"
  ) {
    renderOverdueMode(
      state,
      now
    );
  } else {
    renderFinishedMode();
  }

  const completeCount =
    getCompletedBlockCount();

  elements.scheduleProgress.textContent =
    `${completeCount} of ${blocks.length} blocks complete`;

  elements.lastUpdated.textContent =
    formatUpdatedTime();
}

/* =========================================================
   API loading
   ========================================================= */

async function loadSchedule({
  showLoading = false
} = {}) {
  if (
    isLoading ||
    isUpdating
  ) {
    return;
  }

  isLoading = true;

  elements.refreshButton.disabled =
    true;

  if (showLoading) {
    showOnly(
      "loading"
    );
  }

  try {
    const response =
      await fetch(
        TIME_BLOCKS_API_URL,
        {
          cache:
            "no-store"
        }
      );

    const data =
      await parseApiResponse(
        response
      );

    applyApiData(
      data
    );

    renderSchedule();
  } catch (error) {
    console.error(
      "Focus widget error:",
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

    elements.refreshButton.disabled =
      false;
  }
}

/* =========================================================
   Events and initialization
   ========================================================= */

elements.refreshButton.addEventListener(
  "click",
  async () => {
    await unlockAudio();

    setControlFeedback(
      ""
    );

    await loadSchedule({
      showLoading: true
    });
  }
);

elements.retryButton.addEventListener(
  "click",
  () => {
    loadSchedule({
      showLoading: true
    });
  }
);

elements.soundButton.addEventListener(
  "click",
  toggleChimes
);

elements.completeBlockButton.addEventListener(
  "click",
  () => {
    runBlockAction({
      action:
        "complete-block"
    });
  }
);

elements.endEarlyButton.addEventListener(
  "click",
  () => {
    runBlockAction({
      action:
        "end-early"
    });
  }
);

for (
  const button of
  elements.extensionButtons
) {
  button.addEventListener(
    "click",
    () => {
      const minutes =
        Number(
          button.dataset
            .extensionMinutes
        );

      runBlockAction({
        action:
          "extend-block",

        minutes
      });
    }
  );
}

updateSoundButton();

loadSchedule({
  showLoading: true
});

window.setInterval(
  () => {
    if (
      !isLoading &&
      !isUpdating
    ) {
      renderSchedule();
    }
  },
  CLOCK_INTERVAL_MS
);

window.setInterval(
  () => {
    loadSchedule();
  },
  REFRESH_INTERVAL_MS
);
