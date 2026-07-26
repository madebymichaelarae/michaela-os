/* =========================================================
   Michaela OS
   Productivity — Focus Timer
   ========================================================= */

const STORAGE_KEY =
  "michaela-os-focus-timer";

const DAILY_STATS_KEY =
  "michaela-os-focus-stats";

const DEFAULT_PRESET = {
  focusMinutes: 30,
  breakMinutes: 5
};

const focusPrompts = [
  {
    icon: "✨",
    title: "Nice work!",
    message: "You finished a full focus session."
  },
  {
    icon: "💛",
    title: "Future Michaela",
    message: "You are building the life you wanted."
  },
  {
    icon: "🌟",
    title: "Focus complete",
    message: "That work counts, even when it felt imperfect."
  },
  {
    icon: "🍅",
    title: "Session complete",
    message: "You showed up and stayed with it."
  }
];

const breakPrompts = [
  {
    icon: "💧",
    title: "Hydration check",
    message: "Take a sip of water before the next session."
  },
  {
    icon: "🌿",
    title: "Release the tension",
    message: "Drop your shoulders and unclench your jaw."
  },
  {
    icon: "☀️",
    title: "Rest your eyes",
    message: "Look at something far away for twenty seconds."
  },
  {
    icon: "🚶",
    title: "Movement break",
    message: "Stand up or walk one lap around the room."
  },
  {
    icon: "🧘",
    title: "Quick reset",
    message: "Stretch your back, hips, or wrists."
  },
  {
    icon: "☕",
    title: "Break time",
    message: "Step away from the screen without opening another app."
  }
];

const elements = {
  card: document.querySelector(
    ".focus-card"
  ),

  timer: document.getElementById(
    "timer"
  ),

  timerState: document.getElementById(
    "timer-state"
  ),

  startButton: document.getElementById(
    "startBtn"
  ),

  pauseButton: document.getElementById(
    "pauseBtn"
  ),

  resetButton: document.getElementById(
    "resetBtn"
  ),

  presetButtons: Array.from(
    document.querySelectorAll(
      ".preset"
    )
  ),

  sessions: document.getElementById(
    "sessions"
  ),

  focusTime: document.getElementById(
    "focusTime"
  ),

  breaks: document.getElementById(
    "breaks"
  ),

  longest: document.getElementById(
    "longest"
  )
};

let timerState = {
  mode: "focus",

  focusMinutes:
    DEFAULT_PRESET.focusMinutes,

  breakMinutes:
    DEFAULT_PRESET.breakMinutes,

  totalSeconds:
    DEFAULT_PRESET.focusMinutes * 60,

  remainingSeconds:
    DEFAULT_PRESET.focusMinutes * 60,

  isRunning: false,

  endTime: null
};

let dailyStats = createEmptyDailyStats();

let timerInterval = null;

/* =========================================================
   DATE AND STORAGE
   ========================================================= */

function getTodayKey() {
  return new Intl.DateTimeFormat(
    "en-CA",
    {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }
  ).format(new Date());
}

function createEmptyDailyStats() {
  return {
    date: getTodayKey(),
    sessions: 0,
    focusMinutes: 0,
    breaks: 0,
    longestSession: 0
  };
}

function loadDailyStats() {
  try {
    const savedStats =
      JSON.parse(
        localStorage.getItem(
          DAILY_STATS_KEY
        )
      );

    if (
      !savedStats ||
      savedStats.date !== getTodayKey()
    ) {
      dailyStats =
        createEmptyDailyStats();

      saveDailyStats();
      return;
    }

    dailyStats = {
      ...createEmptyDailyStats(),
      ...savedStats
    };
  } catch (error) {
    console.warn(
      "Focus statistics could not be restored:",
      error
    );

    dailyStats =
      createEmptyDailyStats();
  }
}

function saveDailyStats() {
  localStorage.setItem(
    DAILY_STATS_KEY,
    JSON.stringify(dailyStats)
  );
}

function loadTimerState() {
  try {
    const savedState =
      JSON.parse(
        localStorage.getItem(
          STORAGE_KEY
        )
      );

    if (!savedState) {
      return;
    }

    timerState = {
      ...timerState,
      ...savedState
    };

    sanitizeTimerState();

    if (
      timerState.isRunning &&
      timerState.endTime
    ) {
      syncRemainingTime();

      if (
        timerState.remainingSeconds <= 0
      ) {
        timerState.remainingSeconds = 0;
        timerState.isRunning = false;
        timerState.endTime = null;
      }
    }
  } catch (error) {
    console.warn(
      "Focus timer could not be restored:",
      error
    );
  }
}

function saveTimerState() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(timerState)
  );
}

function sanitizeTimerState() {
  const validMode =
    timerState.mode === "break"
      ? "break"
      : "focus";

  const focusMinutes =
    getSafePositiveNumber(
      timerState.focusMinutes,
      DEFAULT_PRESET.focusMinutes
    );

  const breakMinutes =
    getSafePositiveNumber(
      timerState.breakMinutes,
      DEFAULT_PRESET.breakMinutes
    );

  const expectedTotal =
    validMode === "focus"
      ? focusMinutes * 60
      : breakMinutes * 60;

  timerState.mode = validMode;
  timerState.focusMinutes =
    focusMinutes;
  timerState.breakMinutes =
    breakMinutes;

  timerState.totalSeconds =
    getSafePositiveNumber(
      timerState.totalSeconds,
      expectedTotal
    );

  timerState.remainingSeconds =
    Math.max(
      0,
      Number(
        timerState.remainingSeconds
      ) || 0
    );

  timerState.isRunning =
    Boolean(timerState.isRunning);

  timerState.endTime =
    Number(timerState.endTime) || null;
}

function getSafePositiveNumber(
  value,
  fallback
) {
  const number = Number(value);

  if (
    !Number.isFinite(number) ||
    number <= 0
  ) {
    return fallback;
  }

  return number;
}

/* =========================================================
   TIMER DISPLAY
   ========================================================= */

function formatTimer(seconds) {
  const safeSeconds =
    Math.max(
      0,
      Math.ceil(seconds)
    );

  const minutes =
    Math.floor(
      safeSeconds / 60
    );

  const remainingSeconds =
    safeSeconds % 60;

  return `${String(minutes).padStart(
    2,
    "0"
  )}:${String(
    remainingSeconds
  ).padStart(2, "0")}`;
}

function formatFocusTime(minutes) {
  const safeMinutes =
    Math.max(
      0,
      Math.round(minutes)
    );

  const hours =
    Math.floor(
      safeMinutes / 60
    );

  const remainingMinutes =
    safeMinutes % 60;

  if (hours === 0) {
    return `${remainingMinutes}m`;
  }

  return `${hours}h ${remainingMinutes}m`;
}

function renderTimer() {
  const timeText =
    formatTimer(
      timerState.remainingSeconds
    );

  elements.timer.textContent =
    timeText;

  document.title =
    timerState.isRunning
      ? `${timeText} · ${
          timerState.mode === "focus"
            ? "Focus"
            : "Break"
        }`
      : "Focus Timer";

  const progress =
    timerState.totalSeconds > 0
      ? (
          timerState.remainingSeconds /
          timerState.totalSeconds
        ) * 100
      : 0;

  elements.card.style.setProperty(
    "--timer-progress",
    `${Math.max(
      0,
      Math.min(100, progress)
    )}%`
  );

  elements.card.classList.toggle(
    "break-mode",
    timerState.mode === "break"
  );

  elements.card.classList.toggle(
    "is-running",
    timerState.isRunning
  );

  elements.timerState.textContent =
    getTimerStatusText();

  elements.startButton.disabled =
    timerState.isRunning;

  elements.pauseButton.disabled =
    !timerState.isRunning;

  elements.startButton.textContent =
    timerState.remainingSeconds <
      timerState.totalSeconds &&
    !timerState.isRunning
      ? "▶ Resume"
      : "▶ Start";

  elements.presetButtons.forEach(
    (button) => {
      const focusMinutes =
        Number(
          button.dataset.focus
        );

      const breakMinutes =
        Number(
          button.dataset.break
        );

      const isActive =
        focusMinutes ===
          timerState.focusMinutes &&
        breakMinutes ===
          timerState.breakMinutes;

      button.classList.toggle(
        "active",
        isActive
      );

      button.disabled =
        timerState.isRunning;
    }
  );
}

function getTimerStatusText() {
  if (timerState.isRunning) {
    return timerState.mode === "focus"
      ? "Focus in progress"
      : "Break in progress";
  }

  if (
    timerState.remainingSeconds === 0
  ) {
    return timerState.mode === "focus"
      ? "Focus complete"
      : "Break complete";
  }

  if (
    timerState.remainingSeconds <
    timerState.totalSeconds
  ) {
    return timerState.mode === "focus"
      ? "Focus paused"
      : "Break paused";
  }

  return timerState.mode === "focus"
    ? "Ready to focus"
    : "Ready for a break";
}

function renderStats() {
  elements.sessions.textContent =
    String(dailyStats.sessions);

  elements.focusTime.textContent =
    formatFocusTime(
      dailyStats.focusMinutes
    );

  elements.breaks.textContent =
    String(dailyStats.breaks);

  elements.longest.textContent =
    `${dailyStats.longestSession} min`;
}

/* =========================================================
   TIMER ENGINE
   ========================================================= */

function startTimer() {
  ensureCurrentStatsDate();

  if (
    timerState.remainingSeconds <= 0
  ) {
    resetCurrentPhase();
  }

  timerState.isRunning = true;

  timerState.endTime =
    Date.now() +
    timerState.remainingSeconds *
      1000;

  saveTimerState();
  renderTimer();
  startTimerInterval();
}

function pauseTimer() {
  if (!timerState.isRunning) {
    return;
  }

  syncRemainingTime();

  timerState.isRunning = false;
  timerState.endTime = null;

  clearTimerInterval();
  saveTimerState();
  renderTimer();
}

function resetTimer() {
  clearTimerInterval();

  timerState.mode = "focus";
  timerState.totalSeconds =
    timerState.focusMinutes * 60;

  timerState.remainingSeconds =
    timerState.totalSeconds;

  timerState.isRunning = false;
  timerState.endTime = null;

  saveTimerState();
  renderTimer();
}

function resetCurrentPhase() {
  timerState.totalSeconds =
    timerState.mode === "focus"
      ? timerState.focusMinutes * 60
      : timerState.breakMinutes * 60;

  timerState.remainingSeconds =
    timerState.totalSeconds;

  timerState.endTime = null;
}

function startTimerInterval() {
  clearTimerInterval();

  timerInterval =
    window.setInterval(
      tickTimer,
      250
    );
}

function clearTimerInterval() {
  if (timerInterval !== null) {
    window.clearInterval(
      timerInterval
    );

    timerInterval = null;
  }
}

function tickTimer() {
  if (!timerState.isRunning) {
    return;
  }

  syncRemainingTime();

  if (
    timerState.remainingSeconds <= 0
  ) {
    completeCurrentPhase();
    return;
  }

  renderTimer();

  if (
    Math.ceil(
      timerState.remainingSeconds
    ) % 5 ===
    0
  ) {
    saveTimerState();
  }
}

function syncRemainingTime() {
  if (
    !timerState.isRunning ||
    !timerState.endTime
  ) {
    return;
  }

  timerState.remainingSeconds =
    Math.max(
      0,
      (
        timerState.endTime -
        Date.now()
      ) / 1000
    );
}

function completeCurrentPhase() {
  const completedMode =
    timerState.mode;

  clearTimerInterval();

  timerState.remainingSeconds = 0;
  timerState.isRunning = false;
  timerState.endTime = null;

  recordCompletedPhase(
    completedMode
  );

  playCompletionSound(
    completedMode
  );

  showCompletionPrompt(
    completedMode
  );

  switchToNextPhase();

  saveTimerState();
  renderTimer();

  /*
   The next focus or break begins automatically.
   Change this to false if you later decide
   that each phase should wait for Start.
  */

  const autoStartNextPhase = true;

  if (autoStartNextPhase) {
    window.setTimeout(
      startTimer,
      800
    );
  }
}

function switchToNextPhase() {
  timerState.mode =
    timerState.mode === "focus"
      ? "break"
      : "focus";

  resetCurrentPhase();
}

function recordCompletedPhase(
  completedMode
) {
  ensureCurrentStatsDate();

  if (completedMode === "focus") {
    const completedMinutes =
      timerState.focusMinutes;

    dailyStats.sessions += 1;

    dailyStats.focusMinutes +=
      completedMinutes;

    dailyStats.longestSession =
      Math.max(
        dailyStats.longestSession,
        completedMinutes
      );
  } else {
    dailyStats.breaks += 1;
  }

  saveDailyStats();
  renderStats();
}

function ensureCurrentStatsDate() {
  if (
    dailyStats.date ===
    getTodayKey()
  ) {
    return;
  }

  dailyStats =
    createEmptyDailyStats();

  saveDailyStats();
  renderStats();
}

/* =========================================================
   PRESETS
   ========================================================= */

function selectPreset(event) {
  const button =
    event.currentTarget;

  if (timerState.isRunning) {
    return;
  }

  const focusMinutes =
    Number(
      button.dataset.focus
    );

  const breakMinutes =
    Number(
      button.dataset.break
    );

  if (
    !Number.isFinite(
      focusMinutes
    ) ||
    !Number.isFinite(
      breakMinutes
    )
  ) {
    return;
  }

  timerState.focusMinutes =
    focusMinutes;

  timerState.breakMinutes =
    breakMinutes;

  timerState.mode = "focus";
  timerState.totalSeconds =
    focusMinutes * 60;

  timerState.remainingSeconds =
    timerState.totalSeconds;

  timerState.isRunning = false;
  timerState.endTime = null;

  saveTimerState();
  renderTimer();
}

/* =========================================================
   COMPLETION SOUND
   ========================================================= */

function playCompletionSound(mode) {
  try {
    const AudioContext =
      window.AudioContext ||
      window.webkitAudioContext;

    if (!AudioContext) {
      return;
    }

    const audioContext =
      new AudioContext();

    const notes =
      mode === "focus"
        ? [523.25, 659.25, 783.99]
        : [659.25, 523.25];

    notes.forEach(
      (frequency, index) => {
        const oscillator =
          audioContext.createOscillator();

        const gain =
          audioContext.createGain();

        const startTime =
          audioContext.currentTime +
          index * 0.18;

        oscillator.type = "sine";
        oscillator.frequency.value =
          frequency;

        gain.gain.setValueAtTime(
          0,
          startTime
        );

        gain.gain.linearRampToValueAtTime(
          0.12,
          startTime + 0.025
        );

        gain.gain.exponentialRampToValueAtTime(
          0.001,
          startTime + 0.34
        );

        oscillator.connect(gain);
        gain.connect(
          audioContext.destination
        );

        oscillator.start(startTime);

        oscillator.stop(
          startTime + 0.36
        );
      }
    );

    window.setTimeout(() => {
      audioContext.close();
    }, 1500);
  } catch (error) {
    console.warn(
      "Timer sound could not play:",
      error
    );
  }
}

/* =========================================================
   COMPLETION PROMPT
   ========================================================= */

function getRandomPrompt(mode) {
  const promptList =
    mode === "focus"
      ? breakPrompts
      : focusPrompts;

  return promptList[
    Math.floor(
      Math.random() *
        promptList.length
    )
  ];
}

function showCompletionPrompt(
  completedMode
) {
  removeExistingPrompt();

  const prompt =
    getRandomPrompt(
      completedMode
    );

  const promptElement =
    document.createElement("aside");

  promptElement.className =
    "focus-completion-prompt";

  promptElement.setAttribute(
    "role",
    "status"
  );

  promptElement.innerHTML = `
    <button
      class="focus-completion-prompt__close"
      type="button"
      aria-label="Close message"
    >
      ×
    </button>

    <span
      class="focus-completion-prompt__icon"
      aria-hidden="true"
    >
      ${prompt.icon}
    </span>

    <div>
      <strong>
        ${prompt.title}
      </strong>

      <p>
        ${prompt.message}
      </p>
    </div>
  `;

  elements.card.appendChild(
    promptElement
  );

  const closeButton =
    promptElement.querySelector(
      ".focus-completion-prompt__close"
    );

  closeButton.addEventListener(
    "click",
    removeExistingPrompt
  );

  window.setTimeout(() => {
    promptElement.classList.add(
      "is-visible"
    );
  }, 20);

  window.setTimeout(() => {
    if (
      document.body.contains(
        promptElement
      )
    ) {
      removeExistingPrompt();
    }
  }, 12000);
}

function removeExistingPrompt() {
  const existingPrompt =
    document.querySelector(
      ".focus-completion-prompt"
    );

  if (!existingPrompt) {
    return;
  }

  existingPrompt.classList.remove(
    "is-visible"
  );

  window.setTimeout(() => {
    existingPrompt.remove();
  }, 180);
}

/* =========================================================
   PAGE VISIBILITY
   ========================================================= */

function handleVisibilityChange() {
  if (
    document.visibilityState ===
      "visible" &&
    timerState.isRunning
  ) {
    syncRemainingTime();

    if (
      timerState.remainingSeconds <= 0
    ) {
      completeCurrentPhase();
    } else {
      renderTimer();
    }
  }
}

/* =========================================================
   EVENTS AND INITIALIZATION
   ========================================================= */

function attachEventListeners() {
  elements.startButton.addEventListener(
    "click",
    startTimer
  );

  elements.pauseButton.addEventListener(
    "click",
    pauseTimer
  );

  elements.resetButton.addEventListener(
    "click",
    resetTimer
  );

  elements.presetButtons.forEach(
    (button) => {
      button.addEventListener(
        "click",
        selectPreset
      );
    }
  );

  document.addEventListener(
    "visibilitychange",
    handleVisibilityChange
  );

  window.addEventListener(
    "beforeunload",
    saveTimerState
  );
}

function initializeFocusTimer() {
  loadDailyStats();
  loadTimerState();

  attachEventListeners();
  renderStats();
  renderTimer();

  if (timerState.isRunning) {
    if (
      timerState.remainingSeconds <= 0
    ) {
      completeCurrentPhase();
    } else {
      startTimerInterval();
    }
  }
}

initializeFocusTimer();
