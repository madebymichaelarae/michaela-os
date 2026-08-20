const TIME_BLOCKS_API_URL =
  "/api/timeblocks";

const TIME_ZONE =
  "America/New_York";

const CLOCK_INTERVAL_MS =
  1000;

const REFRESH_INTERVAL_MS =
  60 * 1000;

const OPENING_ADMIN_MS =
  15 * 60 * 1000;

const STORAGE_KEY =
  "michaela-os-clocked-in-v1";

const CHIMES_STORAGE_KEY =
  "michaela-os-focus-chimes";

const COMPLETE_TASK_STATUSES =
  new Set([
    "scheduled",
    "sent",
    "done",
    "scrapped",
    "complete",
    "completed",
    "finished"
  ]);

const WORKING_STATES =
  new Set([
    "opening-admin",
    "focus",
    "meeting",
    "closing-admin"
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

  currentTime:
    document.getElementById(
      "currentTime"
    ),

  currentDate:
    document.getElementById(
      "currentDate"
    ),

  totalWorked:
    document.getElementById(
      "totalWorked"
    ),

  workedStatus:
    document.getElementById(
      "workedStatus"
    ),

  clockedOutState:
    document.getElementById(
      "clockedOutState"
    ),

  openingAdminState:
    document.getElementById(
      "openingAdminState"
    ),

  openingAdminTimer:
    document.getElementById(
      "openingAdminTimer"
    ),

  focusState:
    document.getElementById(
      "focusState"
    ),

  currentLabel:
    document.getElementById(
      "currentLabel"
    ),

  blockStatus:
    document.getElementById(
      "blockStatus"
    ),

  currentTitle:
    document.getElementById(
      "currentTitle"
    ),

  plannedDuration:
    document.getElementById(
      "plannedDuration"
    ),

  focusElapsed:
    document.getElementById(
      "focusElapsed"
    ),

  countdown:
    document.getElementById(
      "countdown"
    ),

  countdownLabel:
    document.getElementById(
      "countdownLabel"
    ),

  progressTrack:
    document.getElementById(
      "progressTrack"
    ),

  progressFill:
    document.getElementById(
      "progressFill"
    ),

  controlFeedback:
    document.getElementById(
      "controlFeedback"
    ),

  breakPicker:
    document.getElementById(
      "breakPicker"
    ),

  lunchPicker:
    document.getElementById(
      "lunchPicker"
    ),

  breakState:
    document.getElementById(
      "breakState"
    ),

  breakTimer:
    document.getElementById(
      "breakTimer"
    ),

  breakTimerLabel:
    document.getElementById(
      "breakTimerLabel"
    ),

  breakPausedContext:
    document.getElementById(
      "breakPausedContext"
    ),

  lunchState:
    document.getElementById(
      "lunchState"
    ),

  lunchTimer:
    document.getElementById(
      "lunchTimer"
    ),

  lunchTimerLabel:
    document.getElementById(
      "lunchTimerLabel"
    ),

  lunchPausedContext:
    document.getElementById(
      "lunchPausedContext"
    ),

  meetingState:
    document.getElementById(
      "meetingState"
    ),

  meetingTimer:
    document.getElementById(
      "meetingTimer"
    ),

  meetingPausedContext:
    document.getElementById(
      "meetingPausedContext"
    ),

  meetingEndedState:
    document.getElementById(
      "meetingEndedState"
    ),

  meetingSummary:
    document.getElementById(
      "meetingSummary"
    ),

  meetingResumeContext:
    document.getElementById(
      "meetingResumeContext"
    ),

  awayState:
    document.getElementById(
      "awayState"
    ),

  awayTimer:
    document.getElementById(
      "awayTimer"
    ),

  awayPausedContext:
    document.getElementById(
      "awayPausedContext"
    ),

  blockCompleteState:
    document.getElementById(
      "blockCompleteState"
    ),

  blockCompleteSummary:
    document.getElementById(
      "blockCompleteSummary"
    ),

  closingAdminState:
    document.getElementById(
      "closingAdminState"
    ),

  closingAdminTimer:
    document.getElementById(
      "closingAdminTimer"
    ),

  workdayCompleteState:
    document.getElementById(
      "workdayCompleteState"
    ),

  finalTotalWorked:
    document.getElementById(
      "finalTotalWorked"
    ),

  finalFocusWorked:
    document.getElementById(
      "finalFocusWorked"
    ),

  finalMeetingWorked:
    document.getElementById(
      "finalMeetingWorked"
    ),

  finalAdminWorked:
    document.getElementById(
      "finalAdminWorked"
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

  clockOutControl:
    document.getElementById(
      "clockOutControl"
    ),

  scheduleProgress:
    document.getElementById(
      "scheduleProgress"
    ),

  lastUpdated:
    document.getElementById(
      "lastUpdated"
    ),

  clockInButton:
    document.getElementById(
      "clockInButton"
    ),

  startFocusButton:
    document.getElementById(
      "startFocusButton"
    ),

  breakButton:
    document.getElementById(
      "breakButton"
    ),

  lunchButton:
    document.getElementById(
      "lunchButton"
    ),

  meetingButton:
    document.getElementById(
      "meetingButton"
    ),

  awayButton:
    document.getElementById(
      "awayButton"
    ),

  finishBlockButton:
    document.getElementById(
      "finishBlockButton"
    ),

  cancelBreakPickerButton:
    document.getElementById(
      "cancelBreakPickerButton"
    ),

  cancelLunchPickerButton:
    document.getElementById(
      "cancelLunchPickerButton"
    ),

  returnFromBreakButton:
    document.getElementById(
      "returnFromBreakButton"
    ),

  returnFromLunchButton:
    document.getElementById(
      "returnFromLunchButton"
    ),

  endMeetingButton:
    document.getElementById(
      "endMeetingButton"
    ),

  resumeAfterMeetingButton:
    document.getElementById(
      "resumeAfterMeetingButton"
    ),

  returnFromAwayButton:
    document.getElementById(
      "returnFromAwayButton"
    ),

  startNextBlockButton:
    document.getElementById(
      "startNextBlockButton"
    ),

  clockOutButton:
    document.getElementById(
      "clockOutButton"
    ),

  finishWorkButton:
    document.getElementById(
      "finishWorkButton"
    ),

  resetWorkdayButton:
    document.getElementById(
      "resetWorkdayButton"
    ),

  extensionButtons:
    Array.from(
      document.querySelectorAll(
        "[data-extension-minutes]"
      )
    ),

  breakChoiceButtons:
    Array.from(
      document.querySelectorAll(
        "[data-break-minutes]"
      )
    ),

  lunchChoiceButtons:
    Array.from(
      document.querySelectorAll(
        "[data-lunch-minutes]"
      )
    ),

  postMeetingBreakButtons:
    Array.from(
      document.querySelectorAll(
        "[data-post-meeting-break]"
      )
    ),

  postBlockBreakButtons:
    Array.from(
      document.querySelectorAll(
        "[data-post-block-break]"
      )
    )
};

/* =========================================================
   API data
   ========================================================= */

let blocks = [];

let currentBlock = null;

let nextBlock = null;

let taskStatusOptions = [];

let scheduleDate = null;

let lastLoadedAt = null;

let isLoading = false;

let isUpdating = false;

/* =========================================================
   Workday state
   ========================================================= */

function createFreshWorkday() {
  return {
    date:
      getTodayKey(),

    state:
      "clocked-out",

    stateStartedAt:
      null,

    previousState:
      null,

    totalWorkedMs:
      0,

    focusWorkedMs:
      0,

    meetingWorkedMs:
      0,

    adminWorkedMs:
      0,

    openingAdminRemainingMs:
      OPENING_ADMIN_MS,

    currentBlockId:
      null,

    blockPlannedMs:
      0,

    blockAddedMs:
      0,

    blockFocusElapsedMs:
      0,

    breakPlannedMs:
      0,

    lunchPlannedMs:
      0,

    lastMeetingDurationMs:
      0,

    completedBlockTitle:
      null,

    completedBlockDurationMs:
      0,

    workdayCompletedAt:
      null
  };
}

let workday =
  createFreshWorkday();

/* =========================================================
   Date / time
   ========================================================= */

function getDateKey(
  date
) {
  return new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone:
        TIME_ZONE,

      year:
        "numeric",

      month:
        "2-digit",

      day:
        "2-digit"
    }
  ).format(date);
}

function getTodayKey() {
  return getDateKey(
    new Date()
  );
}

function formatClockTime(
  date
) {
  return new Intl.DateTimeFormat(
    "en-US",
    {
      timeZone:
        TIME_ZONE,

      hour:
        "numeric",

      minute:
        "2-digit"
    }
  ).format(date);
}

function formatFullDate(
  date
) {
  return new Intl.DateTimeFormat(
    "en-US",
    {
      timeZone:
        TIME_ZONE,

      weekday:
        "long",

      month:
        "long",

      day:
        "numeric"
    }
  ).format(date);
}

function formatShortDuration(
  minutes
) {
  const safe =
    Math.max(
      0,
      Math.round(
        Number(minutes) || 0
      )
    );

  if (safe < 60) {
    return `${safe} min`;
  }

  const hours =
    Math.floor(
      safe / 60
    );

  const remaining =
    safe % 60;

  if (remaining === 0) {
    return `${hours} hr`;
  }

  return (
    `${hours} hr ` +
    `${remaining} min`
  );
}

function formatTimer(
  milliseconds
) {
  const totalSeconds =
    Math.max(
      0,
      Math.floor(
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
      `${String(hours).padStart(2, "0")}:` +
      `${String(minutes).padStart(2, "0")}:` +
      `${String(seconds).padStart(2, "0")}`
    );
  }

  return (
    `${String(minutes).padStart(2, "0")}:` +
    `${String(seconds).padStart(2, "0")}`
  );
}

function formatLongTimer(
  milliseconds
) {
  const totalSeconds =
    Math.max(
      0,
      Math.floor(
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

  return (
    `${String(hours).padStart(2, "0")}:` +
    `${String(minutes).padStart(2, "0")}:` +
    `${String(seconds).padStart(2, "0")}`
  );
}

function getStateElapsedMs(
  now = Date.now()
) {
  if (
    !workday.stateStartedAt
  ) {
    return 0;
  }

  return Math.max(
    0,
    now -
      workday.stateStartedAt
  );
}

/* =========================================================
   Persistence
   ========================================================= */

function saveWorkday() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        workday
      )
    );
  } catch (error) {
    console.error(
      "Could not save workday:",
      error
    );
  }
}

function loadStoredWorkday() {
  try {
    const raw =
      localStorage.getItem(
        STORAGE_KEY
      );

    if (!raw) {
      workday =
        createFreshWorkday();

      return;
    }

    const parsed =
      JSON.parse(raw);

    if (
      parsed?.date !==
      getTodayKey()
    ) {
      workday =
        createFreshWorkday();

      saveWorkday();

      return;
    }

    workday = {
      ...createFreshWorkday(),
      ...parsed
    };
  } catch (error) {
    console.error(
      "Could not restore workday:",
      error
    );

    workday =
      createFreshWorkday();
  }
}

/* =========================================================
   Chimes
   ========================================================= */

let audioContext = null;

let chimesEnabled =
  localStorage.getItem(
    CHIMES_STORAGE_KEY
  ) === "true";

let lastChimeKey = null;

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
  volume = 0.11
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

  gain.gain
    .setValueAtTime(
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

  oscillator.connect(
    gain
  );

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

function playEndingChime() {
  playTone({
    frequency:
      523.25,

    duration:
      0.22
  });

  playTone({
    frequency:
      659.25,

    startDelay:
      0.18,

    duration:
      0.25
  });

  playTone({
    frequency:
      783.99,

    startDelay:
      0.38,

    duration:
      0.38
  });
}

function playFiveMinuteChime() {
  playTone({
    frequency:
      659.25,

    duration:
      0.2
  });

  playTone({
    frequency:
      783.99,

    startDelay:
      0.18,

    duration:
      0.28
  });
}

function updateSoundButton() {
  elements.soundButton.textContent =
    chimesEnabled
      ? "Chimes On"
      : "Chimes Off";

  elements.soundButton.setAttribute(
    "aria-pressed",
    String(
      chimesEnabled
    )
  );
}

async function toggleChimes() {
  if (!chimesEnabled) {
    const unlocked =
      await unlockAudio();

    if (!unlocked) {
      window.alert(
        "Audio could not be enabled."
      );

      return;
    }

    chimesEnabled = true;

    localStorage.setItem(
      CHIMES_STORAGE_KEY,
      "true"
    );

    updateSoundButton();

    playTone({
      frequency:
        659.25,

      duration:
        0.15,

      volume:
        0.08
    });

    return;
  }

  chimesEnabled = false;

  localStorage.setItem(
    CHIMES_STORAGE_KEY,
    "false"
  );

  updateSoundButton();
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

function applyApiData(
  data
) {
  blocks =
    Array.isArray(
      data.blocks
    )
      ? data.blocks
      : [];

  currentBlock =
    data.currentBlock ||
    null;

  nextBlock =
    data.nextBlock ||
    null;

  taskStatusOptions =
    Array.isArray(
      data.taskStatusOptions
    )
      ? data.taskStatusOptions
      : [];

  scheduleDate =
    data.date ||
    getTodayKey();

  lastLoadedAt =
    new Date();

  if (
    currentBlock &&
    !workday.currentBlockId
  ) {
    workday.currentBlockId =
      currentBlock.id;
  }

  saveWorkday();
}

async function loadSchedule() {
  if (isLoading) {
    return;
  }

  isLoading = true;

  try {
    const response =
      await fetch(
        `${TIME_BLOCKS_API_URL}?date=${getTodayKey()}`,
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

    showContent();
    render();
  } catch (error) {
    showError(
      error instanceof Error
        ? error.message
        : String(error)
    );
  } finally {
    isLoading =
      false;
  }
}

async function sendTimeBlockAction(
  payload
) {
  const response =
    await fetch(
      TIME_BLOCKS_API_URL,
      {
        method:
          "PATCH",

        headers: {
          "Content-Type":
            "application/json"
        },

        cache:
          "no-store",

        body:
          JSON.stringify({
            ...payload,

            date:
              scheduleDate ||
              getTodayKey()
          })
      }
    );

  const data =
    await parseApiResponse(
      response
    );

  applyApiData(
    data
  );

  return data;
}

/* =========================================================
   UI states
   ========================================================= */

const stateSections = [
  elements.clockedOutState,
  elements.openingAdminState,
  elements.focusState,
  elements.breakState,
  elements.lunchState,
  elements.meetingState,
  elements.meetingEndedState,
  elements.awayState,
  elements.blockCompleteState,
  elements.closingAdminState,
  elements.workdayCompleteState
];

function showOnlyState(
  target
) {
  for (
    const section of
    stateSections
  ) {
    if (!section) {
      continue;
    }

    section.hidden =
      section !== target;
  }

  elements.breakPicker.hidden =
    true;

  elements.lunchPicker.hidden =
    true;
}

function showContent() {
  elements.loadingState.hidden =
    true;

  elements.errorState.hidden =
    true;

  elements.emptyState.hidden =
    true;

  elements.focusContent.hidden =
    false;
}

function showError(
  message
) {
  elements.loadingState.hidden =
    true;

  elements.errorState.hidden =
    false;

  elements.emptyState.hidden =
    true;

  elements.focusContent.hidden =
    true;

  elements.errorMessage.textContent =
    message;
}

function setFeedback(
  message,
  type = "success"
) {
  if (!message) {
    elements.controlFeedback.hidden =
      true;

    elements.controlFeedback.textContent =
      "";

    return;
  }

  elements.controlFeedback.hidden =
    false;

  elements.controlFeedback.textContent =
    message;

  elements.controlFeedback.classList.toggle(
    "is-error",
    type === "error"
  );

  elements.controlFeedback.classList.toggle(
    "is-success",
    type === "success"
  );
}

function setUpdating(
  updating
) {
  isUpdating =
    updating;

  const controls =
    document.querySelectorAll(
      "button, select"
    );

  for (
    const control of controls
  ) {
    if (
      control ===
      elements.refreshButton
    ) {
      continue;
    }

    control.disabled =
      updating;
  }
}

/* =========================================================
   Time accounting
   ========================================================= */

function stateCountsAsWork(
  state
) {
  return WORKING_STATES.has(
    state
  );
}

function commitCurrentStateTime() {
  if (
    !workday.stateStartedAt
  ) {
    return;
  }

  const elapsed =
    getStateElapsedMs();

  if (
    elapsed <= 0
  ) {
    workday.stateStartedAt =
      Date.now();

    return;
  }

  if (
    stateCountsAsWork(
      workday.state
    )
  ) {
    workday.totalWorkedMs +=
      elapsed;
  }

  if (
    workday.state ===
    "focus"
  ) {
    workday.focusWorkedMs +=
      elapsed;

    workday.blockFocusElapsedMs +=
      elapsed;
  }

  if (
    workday.state ===
    "meeting"
  ) {
    workday.meetingWorkedMs +=
      elapsed;
  }

  if (
    workday.state ===
      "opening-admin" ||
    workday.state ===
      "closing-admin"
  ) {
    workday.adminWorkedMs +=
      elapsed;
  }

  workday.stateStartedAt =
    Date.now();

  saveWorkday();
}

function getLiveTotalWorkedMs() {
  let value =
    workday.totalWorkedMs;

  if (
    stateCountsAsWork(
      workday.state
    )
  ) {
    value +=
      getStateElapsedMs();
  }

  return value;
}

function getLiveFocusWorkedMs() {
  let value =
    workday.focusWorkedMs;

  if (
    workday.state ===
    "focus"
  ) {
    value +=
      getStateElapsedMs();
  }

  return value;
}

function getLiveMeetingWorkedMs() {
  let value =
    workday.meetingWorkedMs;

  if (
    workday.state ===
    "meeting"
  ) {
    value +=
      getStateElapsedMs();
  }

  return value;
}

function getLiveAdminWorkedMs() {
  let value =
    workday.adminWorkedMs;

  if (
    workday.state ===
      "opening-admin" ||
    workday.state ===
      "closing-admin"
  ) {
    value +=
      getStateElapsedMs();
  }

  return value;
}

function getLiveBlockElapsedMs() {
  let value =
    workday.blockFocusElapsedMs;

  if (
    workday.state ===
    "focus"
  ) {
    value +=
      getStateElapsedMs();
  }

  return value;
}

function getBlockTargetMs() {
  return (
    workday.blockPlannedMs +
    workday.blockAddedMs
  );
}

function getBlockRemainingMs() {
  return (
    getBlockTargetMs() -
    getLiveBlockElapsedMs()
  );
}

/* =========================================================
   State transitions
   ========================================================= */

function enterState(
  state
) {
  commitCurrentStateTime();

  workday.previousState =
    workday.state;

  workday.state =
    state;

  workday.stateStartedAt =
    Date.now();

  lastChimeKey =
    null;

  saveWorkday();

  render();
}

function enterPausedState(
  state
) {
  enterState(
    state
  );
}

function getResumeState() {
  if (
    workday.currentBlockId
  ) {
    return "focus";
  }

  return "opening-admin";
}

/* =========================================================
   Workday actions
   ========================================================= */

async function clockIn() {
  await unlockAudio();

  if (
    workday.state ===
    "workday-complete"
  ) {
    workday =
      createFreshWorkday();
  }

  workday.openingAdminRemainingMs =
    OPENING_ADMIN_MS;

  workday.state =
    "opening-admin";

  workday.stateStartedAt =
    Date.now();

  workday.previousState =
    "clocked-out";

  saveWorkday();

  render();
}

async function startFocus() {
  setUpdating(
    true
  );

  setFeedback("");

  try {
    let block =
      currentBlock;

    if (!block) {
      block =
        nextBlock;
    }

    if (!block) {
      throw new Error(
        "There is no upcoming work block to start."
      );
    }

    if (
      !currentBlock ||
      currentBlock.id !==
        block.id
    ) {
      const data =
        await sendTimeBlockAction({
          action:
            "activate-block",

          blockId:
            block.id
        });

      block =
        data.currentBlock ||
        block;
    }

    commitCurrentStateTime();

    workday.currentBlockId =
      block.id;

    workday.blockPlannedMs =
      Math.max(
        0,
        Number(
          block.duration || 0
        )
      ) *
      60 *
      1000;

    workday.blockAddedMs =
      0;

    workday.blockFocusElapsedMs =
      0;

    workday.state =
      "focus";

    workday.stateStartedAt =
      Date.now();

    workday.previousState =
      "opening-admin";

    saveWorkday();

    setFeedback("");

    render();
  } catch (error) {
    setFeedback(
      error instanceof Error
        ? error.message
        : String(error),
      "error"
    );
  } finally {
    setUpdating(
      false
    );
  }
}

function extendFocus(
  minutes
) {
  commitCurrentStateTime();

  workday.blockAddedMs +=
    minutes *
    60 *
    1000;

  workday.state =
    "focus";

  workday.stateStartedAt =
    Date.now();

  saveWorkday();

  setFeedback(
    `${minutes} minutes added.`
  );

  render();
}

function openBreakPicker() {
  elements.breakPicker.hidden =
    false;

  elements.lunchPicker.hidden =
    true;
}

function openLunchPicker() {
  elements.lunchPicker.hidden =
    false;

  elements.breakPicker.hidden =
    true;
}

function closePickers() {
  elements.breakPicker.hidden =
    true;

  elements.lunchPicker.hidden =
    true;
}

function beginBreak(
  minutes
) {
  closePickers();

  commitCurrentStateTime();

  workday.breakPlannedMs =
    minutes *
    60 *
    1000;

  workday.previousState =
    workday.state;

  workday.state =
    "break";

  workday.stateStartedAt =
    Date.now();

  saveWorkday();

  render();
}

function beginLunch(
  minutes
) {
  closePickers();

  commitCurrentStateTime();

  workday.lunchPlannedMs =
    minutes *
    60 *
    1000;

  workday.previousState =
    workday.state;

  workday.state =
    "lunch";

  workday.stateStartedAt =
    Date.now();

  saveWorkday();

  render();
}

function returnToFocus() {
  workday.previousState =
    workday.state;

  workday.state =
    "focus";

  workday.stateStartedAt =
    Date.now();

  saveWorkday();

  render();
}

function beginMeeting() {
  commitCurrentStateTime();

  workday.previousState =
    workday.state;

  workday.state =
    "meeting";

  workday.stateStartedAt =
    Date.now();

  saveWorkday();

  render();
}

function endMeeting() {
  const elapsed =
    getStateElapsedMs();

  commitCurrentStateTime();

  workday.lastMeetingDurationMs =
    elapsed;

  workday.previousState =
    "meeting";

  workday.state =
    "meeting-ended";

  workday.stateStartedAt =
    Date.now();

  saveWorkday();

  render();
}

function beginAway() {
  commitCurrentStateTime();

  workday.previousState =
    workday.state;

  workday.state =
    "away";

  workday.stateStartedAt =
    Date.now();

  saveWorkday();

  render();
}

async function finishBlock() {
  if (!currentBlock) {
    setFeedback(
      "There is no active block to finish.",
      "error"
    );

    return;
  }

  setUpdating(
    true
  );

  setFeedback("");

  try {
    commitCurrentStateTime();

    const blockFocusMs =
      workday.blockFocusElapsedMs;

    const actualDurationMinutes =
      Math.max(
        0,
        Math.round(
          blockFocusMs /
          60000
        )
      );

    const completedTitle =
      currentBlock.title;

    await sendTimeBlockAction({
      action:
        "complete-block",

      blockId:
        currentBlock.id,

      actualDuration:
        actualDurationMinutes
    });

    workday.completedBlockTitle =
      completedTitle;

    workday.completedBlockDurationMs =
      blockFocusMs;

    workday.currentBlockId =
      null;

    workday.blockPlannedMs =
      0;

    workday.blockAddedMs =
      0;

    workday.blockFocusElapsedMs =
      0;

    workday.previousState =
      "focus";

    workday.state =
      "block-complete";

    workday.stateStartedAt =
      Date.now();

    saveWorkday();

    render();
  } catch (error) {
    setFeedback(
      error instanceof Error
        ? error.message
        : String(error),
      "error"
    );
  } finally {
    setUpdating(
      false
    );
  }
}

async function startNextBlock() {
  setUpdating(
    true
  );

  try {
    const data =
      await sendTimeBlockAction({
        action:
          "start-next-block"
      });

    const block =
      data.currentBlock;

    if (!block) {
      throw new Error(
        "There are no remaining blocks in today's queue."
      );
    }

    workday.currentBlockId =
      block.id;

    workday.blockPlannedMs =
      Math.max(
        0,
        Number(
          block.duration || 0
        )
      ) *
      60 *
      1000;

    workday.blockAddedMs =
      0;

    workday.blockFocusElapsedMs =
      0;

    workday.state =
      "focus";

    workday.stateStartedAt =
      Date.now();

    workday.previousState =
      "block-complete";

    saveWorkday();

    render();
  } catch (error) {
    setFeedback(
      error instanceof Error
        ? error.message
        : String(error),
      "error"
    );
  } finally {
    setUpdating(
      false
    );
  }
}

function startClosingAdmin() {
  commitCurrentStateTime();

  workday.previousState =
    workday.state;

  workday.state =
    "closing-admin";

  workday.stateStartedAt =
    Date.now();

  saveWorkday();

  render();
}

function finishWorkday() {
  commitCurrentStateTime();

  workday.state =
    "workday-complete";

  workday.previousState =
    "closing-admin";

  workday.stateStartedAt =
    null;

  workday.workdayCompletedAt =
    Date.now();

  saveWorkday();

  render();
}

function resetWorkday() {
  workday =
    createFreshWorkday();

  saveWorkday();

  render();
}

/* =========================================================
   Task status controls
   ========================================================= */

function normalizeStatus(
  value
) {
  return String(
    value || ""
  )
    .trim()
    .toLowerCase();
}

function isTaskComplete(
  status
) {
  return COMPLETE_TASK_STATUSES.has(
    normalizeStatus(
      status
    )
  );
}

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
      statusName;

    option.selected =
      statusName ===
      task.status;

    select.append(
      option
    );
  }

  select.addEventListener(
    "change",
    async () => {
      const previous =
        task.status;

      const next =
        select.value;

      select.disabled =
        true;

      try {
        const data =
          await sendTimeBlockAction({
            action:
              "update-task-status",

            taskId:
              task.id,

            status:
              next
          });

        applyApiData(
          data
        );

        render();
      } catch (error) {
        select.value =
          previous || "";

        setFeedback(
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

function renderTasks() {
  const block =
    currentBlock;

  const tasks =
    Array.isArray(
      block?.tasks
    )
      ? block.tasks
      : [];

  elements.taskList.replaceChildren();

  if (
    !block ||
    tasks.length === 0 ||
    workday.state !== "focus"
  ) {
    elements.tasksSection.hidden =
      true;

    return;
  }

  elements.tasksSection.hidden =
    false;

  const completeCount =
    tasks.filter(
      (task) =>
        isTaskComplete(
          task.status
        )
    ).length;

  elements.taskCount.textContent =
    `${completeCount} of ${tasks.length}`;

  for (
    const task of tasks
  ) {
    const item =
      document.createElement(
        "li"
      );

    item.className =
      "task-item";

    if (
      isTaskComplete(
        task.status
      )
    ) {
      item.classList.add(
        "is-complete"
      );
    }

    const content =
      document.createElement(
        "div"
      );

    content.className =
      "task-content";

    const title =
      document.createElement(
        task.url
          ? "a"
          : "span"
      );

    title.className =
      "task-title";

    title.textContent =
      task.title;

    if (task.url) {
      title.href =
        task.url;

      title.target =
        "_blank";

      title.rel =
        "noopener noreferrer";
    }

    content.append(
      title
    );

    if (
      taskStatusOptions.length > 0
    ) {
      content.append(
        createTaskStatusSelect(
          task
        )
      );
    }

    item.append(
      content
    );

    elements.taskList.append(
      item
    );
  }
}

/* =========================================================
   General render helpers
   ========================================================= */

function renderCurrentClock() {
  const now =
    new Date();

  elements.currentTime.textContent =
    formatClockTime(
      now
    );

  elements.currentDate.textContent =
    formatFullDate(
      now
    );
}

function renderTotalWorked() {
  elements.totalWorked.textContent =
    formatLongTimer(
      getLiveTotalWorkedMs()
    );

  const labels = {
    "clocked-out":
      "Clocked out",

    "opening-admin":
      "Opening Admin",

    focus:
      "Focus",

    break:
      "Break",

    lunch:
      "Lunch",

    meeting:
      "Meeting",

    "meeting-ended":
      "Meeting complete",

    away:
      "Away",

    "block-complete":
      "Block complete",

    "closing-admin":
      "Closing Admin",

    "workday-complete":
      "Clocked out"
  };

  elements.workedStatus.textContent =
    labels[
      workday.state
    ] || "Clocked out";
}

function renderOpeningAdmin() {
  const elapsed =
    workday.state ===
      "opening-admin"
      ? getStateElapsedMs()
      : 0;

  const remaining =
    workday.openingAdminRemainingMs -
    elapsed;

  if (remaining > 0) {
    elements.openingAdminTimer.textContent =
      formatTimer(
        remaining
      );
  } else {
    elements.openingAdminTimer.textContent =
      `+${formatTimer(
        Math.abs(
          remaining
        )
      )}`;
  }
}

function renderFocus() {
  if (!currentBlock) {
    elements.currentTitle.textContent =
      "No active block";

    return;
  }

  const plannedMinutes =
    Number(
      currentBlock.duration || 0
    );

  elements.currentTitle.textContent =
    currentBlock.title ||
    "Focus block";

  elements.currentLabel.textContent =
    "CURRENT BLOCK";

  elements.blockStatus.textContent =
    "Focus";

  const addedMinutes =
    Math.round(
      workday.blockAddedMs /
      60000
    );

  elements.plannedDuration.textContent =
    addedMinutes > 0
      ? `${formatShortDuration(
          plannedMinutes
        )} planned · +${addedMinutes} added`
      : `${formatShortDuration(
          plannedMinutes
        )} planned`;

  const blockElapsed =
    getLiveBlockElapsedMs();

  elements.focusElapsed.textContent =
    `${formatShortDuration(
      blockElapsed /
      60000
    )} focused`;

  const remaining =
    getBlockRemainingMs();

  if (remaining >= 0) {
    elements.countdown.textContent =
      formatTimer(
        remaining
      );

    elements.countdownLabel.textContent =
      "remaining";
  } else {
    elements.countdown.textContent =
      `+${formatTimer(
        Math.abs(
          remaining
        )
      )}`;

    elements.countdownLabel.textContent =
      "over planned";
  }

  const target =
    Math.max(
      1,
      getBlockTargetMs()
    );

  const progress =
    Math.min(
      100,
      Math.max(
        0,
        (
          blockElapsed /
          target
        ) * 100
      )
    );

  elements.progressFill.style.width =
    `${progress}%`;

  elements.progressTrack.setAttribute(
    "aria-valuenow",
    String(
      Math.round(
        progress
      )
    )
  );
}

function getPausedBlockContext() {
  if (!currentBlock) {
    return (
      "No focus block is currently paused."
    );
  }

  const remaining =
    getBlockRemainingMs();

  if (remaining >= 0) {
    return (
      `${currentBlock.title} · ` +
      `${formatTimer(
        remaining
      )} remaining`
    );
  }

  return (
    `${currentBlock.title} · ` +
    `${formatTimer(
      Math.abs(
        remaining
      )
    )} over planned`
  );
}

function renderBreak() {
  const elapsed =
    getStateElapsedMs();

  const remaining =
    workday.breakPlannedMs -
    elapsed;

  if (remaining >= 0) {
    elements.breakTimer.textContent =
      formatTimer(
        remaining
      );

    elements.breakTimerLabel.textContent =
      "remaining";
  } else {
    elements.breakTimer.textContent =
      `+${formatTimer(
        Math.abs(
          remaining
        )
      )}`;

    elements.breakTimerLabel.textContent =
      "over planned";
  }

  elements.breakPausedContext.textContent =
    getPausedBlockContext();
}

function renderLunch() {
  const elapsed =
    getStateElapsedMs();

  const remaining =
    workday.lunchPlannedMs -
    elapsed;

  if (remaining >= 0) {
    elements.lunchTimer.textContent =
      formatTimer(
        remaining
      );

    elements.lunchTimerLabel.textContent =
      "remaining";
  } else {
    elements.lunchTimer.textContent =
      `+${formatTimer(
        Math.abs(
          remaining
        )
      )}`;

    elements.lunchTimerLabel.textContent =
      "over planned";
  }

  elements.lunchPausedContext.textContent =
    getPausedBlockContext();
}

function renderMeeting() {
  elements.meetingTimer.textContent =
    formatTimer(
      getStateElapsedMs()
    );

  elements.meetingPausedContext.textContent =
    getPausedBlockContext();
}

function renderMeetingEnded() {
  elements.meetingSummary.textContent =
    `Meeting complete · ${formatTimer(
      workday.lastMeetingDurationMs
    )}`;

  elements.meetingResumeContext.textContent =
    getPausedBlockContext();
}

function renderAway() {
  elements.awayTimer.textContent =
    formatTimer(
      getStateElapsedMs()
    );

  elements.awayPausedContext.textContent =
    getPausedBlockContext();
}

function renderBlockComplete() {
  const title =
    workday.completedBlockTitle ||
    "Block";

  elements.blockCompleteSummary.textContent =
    `${title} complete · ${formatTimer(
      workday.completedBlockDurationMs
    )} focused`;

  elements.startNextBlockButton.hidden =
    !nextBlock;
}

function renderClosingAdmin() {
  elements.closingAdminTimer.textContent =
    formatTimer(
      getStateElapsedMs()
    );
}

function renderWorkdayReceipt() {
  elements.finalTotalWorked.textContent =
    formatLongTimer(
      workday.totalWorkedMs
    );

  elements.finalFocusWorked.textContent =
    formatLongTimer(
      workday.focusWorkedMs
    );

  elements.finalMeetingWorked.textContent =
    formatLongTimer(
      workday.meetingWorkedMs
    );

  elements.finalAdminWorked.textContent =
    formatLongTimer(
      workday.adminWorkedMs
    );
}

function renderNextBlock() {
  if (
    !nextBlock ||
    workday.state ===
      "workday-complete"
  ) {
    elements.nextSection.hidden =
      true;

    return;
  }

  elements.nextSection.hidden =
    false;

  elements.nextTitle.textContent =
    nextBlock.title ||
    "Next block";

  elements.nextTime.textContent =
    "Upcoming";

  elements.nextDuration.textContent =
    formatShortDuration(
      nextBlock.duration
    );
}

function renderScheduleProgress() {
  const total =
    blocks.length;

  const complete =
    blocks.filter(
      (block) =>
        block.queueState ===
        "Complete"
    ).length;

  elements.scheduleProgress.textContent =
    `${complete} of ${total} blocks complete`;

  if (!lastLoadedAt) {
    elements.lastUpdated.textContent =
      "Not updated";

    return;
  }

  const seconds =
    Math.max(
      0,
      Math.floor(
        (
          Date.now() -
          lastLoadedAt.getTime()
        ) /
        1000
      )
    );

  if (seconds < 10) {
    elements.lastUpdated.textContent =
      "Updated now";
  } else if (
    seconds < 60
  ) {
    elements.lastUpdated.textContent =
      `Updated ${seconds}s ago`;
  } else {
    elements.lastUpdated.textContent =
      `Updated ${Math.floor(
        seconds / 60
      )}m ago`;
  }
}

function renderClockOutControl() {
  const shouldShow =
    [
      "opening-admin",
      "focus",
      "break",
      "lunch",
      "meeting-ended",
      "away",
      "block-complete"
    ].includes(
      workday.state
    );

  elements.clockOutControl.hidden =
    !shouldShow;
}

/* =========================================================
   Timer chime checks
   ========================================================= */

function maybePlayTimerChime() {
  if (!chimesEnabled) {
    return;
  }

  let remaining = null;
  let keyBase = null;

  if (
    workday.state ===
    "focus"
  ) {
    remaining =
      getBlockRemainingMs();

    keyBase =
      `focus-${workday.currentBlockId}`;
  } else if (
    workday.state ===
    "opening-admin"
  ) {
    remaining =
      workday.openingAdminRemainingMs -
      getStateElapsedMs();

    keyBase =
      "opening-admin";
  } else if (
    workday.state ===
    "break"
  ) {
    remaining =
      workday.breakPlannedMs -
      getStateElapsedMs();

    keyBase =
      "break";
  } else if (
    workday.state ===
    "lunch"
  ) {
    remaining =
      workday.lunchPlannedMs -
      getStateElapsedMs();

    keyBase =
      "lunch";
  }

  if (
    remaining === null
  ) {
    return;
  }

  if (
    remaining <=
      5 * 60 * 1000 &&
    remaining > 0
  ) {
    const key =
      `${keyBase}-five`;

    if (
      lastChimeKey !== key
    ) {
      lastChimeKey =
        key;

      playFiveMinuteChime();
    }

    return;
  }

  if (remaining <= 0) {
    const key =
      `${keyBase}-end`;

    if (
      lastChimeKey !== key
    ) {
      lastChimeKey =
        key;

      playEndingChime();
    }
  }
}

/* =========================================================
   Main render
   ========================================================= */

function render() {
  renderCurrentClock();
  renderTotalWorked();

  switch (
    workday.state
  ) {
    case "opening-admin":
      showOnlyState(
        elements.openingAdminState
      );

      renderOpeningAdmin();
      break;

    case "focus":
      showOnlyState(
        elements.focusState
      );

      renderFocus();
      break;

    case "break":
      showOnlyState(
        elements.breakState
      );

      renderBreak();
      break;

    case "lunch":
      showOnlyState(
        elements.lunchState
      );

      renderLunch();
      break;

    case "meeting":
      showOnlyState(
        elements.meetingState
      );

      renderMeeting();
      break;

    case "meeting-ended":
      showOnlyState(
        elements.meetingEndedState
      );

      renderMeetingEnded();
      break;

    case "away":
      showOnlyState(
        elements.awayState
      );

      renderAway();
      break;

    case "block-complete":
      showOnlyState(
        elements.blockCompleteState
      );

      renderBlockComplete();
      break;

    case "closing-admin":
      showOnlyState(
        elements.closingAdminState
      );

      renderClosingAdmin();
      break;

    case "workday-complete":
      showOnlyState(
        elements.workdayCompleteState
      );

      renderWorkdayReceipt();
      break;

    case "clocked-out":
    default:
      showOnlyState(
        elements.clockedOutState
      );
      break;
  }

  renderTasks();
  renderNextBlock();
  renderScheduleProgress();
  renderClockOutControl();
  maybePlayTimerChime();
}

/* =========================================================
   Events
   ========================================================= */

elements.refreshButton.addEventListener(
  "click",
  loadSchedule
);

elements.retryButton.addEventListener(
  "click",
  loadSchedule
);

elements.soundButton.addEventListener(
  "click",
  toggleChimes
);

elements.clockInButton.addEventListener(
  "click",
  clockIn
);

elements.startFocusButton.addEventListener(
  "click",
  startFocus
);

elements.breakButton.addEventListener(
  "click",
  openBreakPicker
);

elements.lunchButton.addEventListener(
  "click",
  openLunchPicker
);

elements.cancelBreakPickerButton.addEventListener(
  "click",
  closePickers
);

elements.cancelLunchPickerButton.addEventListener(
  "click",
  closePickers
);

for (
  const button of
  elements.breakChoiceButtons
) {
  button.addEventListener(
    "click",
    () => {
      beginBreak(
        Number(
          button.dataset
            .breakMinutes
        )
      );
    }
  );
}

for (
  const button of
  elements.lunchChoiceButtons
) {
  button.addEventListener(
    "click",
    () => {
      beginLunch(
        Number(
          button.dataset
            .lunchMinutes
        )
      );
    }
  );
}

elements.returnFromBreakButton.addEventListener(
  "click",
  returnToFocus
);

elements.returnFromLunchButton.addEventListener(
  "click",
  returnToFocus
);

elements.meetingButton.addEventListener(
  "click",
  beginMeeting
);

elements.endMeetingButton.addEventListener(
  "click",
  endMeeting
);

elements.resumeAfterMeetingButton.addEventListener(
  "click",
  returnToFocus
);

for (
  const button of
  elements.postMeetingBreakButtons
) {
  button.addEventListener(
    "click",
    () => {
      beginBreak(
        Number(
          button.dataset
            .postMeetingBreak
        )
      );
    }
  );
}

elements.awayButton.addEventListener(
  "click",
  beginAway
);

elements.returnFromAwayButton.addEventListener(
  "click",
  returnToFocus
);

elements.finishBlockButton.addEventListener(
  "click",
  finishBlock
);

for (
  const button of
  elements.extensionButtons
) {
  button.addEventListener(
    "click",
    () => {
      extendFocus(
        Number(
          button.dataset
            .extensionMinutes
        )
      );
    }
  );
}

for (
  const button of
  elements.postBlockBreakButtons
) {
  button.addEventListener(
    "click",
    () => {
      beginBreak(
        Number(
          button.dataset
            .postBlockBreak
        )
      );
    }
  );
}

elements.startNextBlockButton.addEventListener(
  "click",
  startNextBlock
);

elements.clockOutButton.addEventListener(
  "click",
  startClosingAdmin
);

elements.finishWorkButton.addEventListener(
  "click",
  finishWorkday
);

elements.resetWorkdayButton.addEventListener(
  "click",
  resetWorkday
);

/* =========================================================
   Startup
   ========================================================= */

loadStoredWorkday();

updateSoundButton();

loadSchedule();

window.setInterval(
  () => {
    render();
  },
  CLOCK_INTERVAL_MS
);

window.setInterval(
  () => {
    if (
      !isLoading &&
      !isUpdating
    ) {
      loadSchedule();
    }
  },
  REFRESH_INTERVAL_MS
);
