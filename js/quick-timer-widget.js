const TIMER_STORAGE_KEY = "michaela-os-quick-timer";
const ADJUSTMENT_SECONDS = 5 * 60;
const DEFAULT_SECONDS = 30 * 60;
const MINIMUM_SECONDS = 60;
const MAXIMUM_SECONDS = 24 * 60 * 60;

const elements = {
  card: document.getElementById("timerCard"),
  timerName: document.getElementById("timerName"),
  decreaseButton: document.getElementById("decreaseButton"),
  increaseButton: document.getElementById("increaseButton"),
  timerValue: document.getElementById("timerValue"),
  timerUnit: document.getElementById("timerUnit"),
  primaryButton: document.getElementById("primaryButton"),
  primaryButtonIcon: document.getElementById("primaryButtonIcon"),
  primaryButtonText: document.getElementById("primaryButtonText"),
  resetButton: document.getElementById("resetButton"),
  timerMessage: document.getElementById("timerMessage")
};

let initialSeconds = DEFAULT_SECONDS;
let remainingSeconds = DEFAULT_SECONDS;
let endTimestamp = null;
let timerInterval = null;
let timerState = "idle";
let audioContext = null;
let alarmInterval = null;
let notificationPermissionRequested = false;

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

function formatTime(totalSeconds) {
  const safeSeconds = Math.max(0, Math.ceil(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;
  if (hours > 0) return [String(hours), String(minutes).padStart(2,"0"), String(seconds).padStart(2,"0")].join(":");
  return [String(minutes).padStart(2,"0"), String(seconds).padStart(2,"0")].join(":");
}

function getTimerLabel() {
  return elements.timerName.value.trim() || "Your timer";
}

function loadSavedState() {
  try {
    const savedState = JSON.parse(localStorage.getItem(TIMER_STORAGE_KEY));
    if (!savedState) return;
    if (typeof savedState.name === "string") elements.timerName.value = savedState.name;
    const savedInitialSeconds = Number(savedState.initialSeconds);
    if (Number.isFinite(savedInitialSeconds)) {
      initialSeconds = clamp(savedInitialSeconds, MINIMUM_SECONDS, MAXIMUM_SECONDS);
      remainingSeconds = initialSeconds;
    }
    if (savedState.state === "running" && Number.isFinite(Number(savedState.endTimestamp))) {
      const secondsLeft = Math.ceil((Number(savedState.endTimestamp) - Date.now()) / 1000);
      if (secondsLeft > 0) {
        remainingSeconds = secondsLeft;
        endTimestamp = Number(savedState.endTimestamp);
        timerState = "running";
      } else {
        remainingSeconds = 0;
        timerState = "finished";
      }
    } else if (savedState.state === "paused") {
      const savedRemaining = Number(savedState.remainingSeconds);
      if (Number.isFinite(savedRemaining)) {
        remainingSeconds = clamp(savedRemaining, 0, MAXIMUM_SECONDS);
        timerState = "paused";
      }
    }
  } catch (error) {
    console.warn("Quick timer state could not be restored:", error);
  }
}

function saveState() {
  localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify({
    name: elements.timerName.value,
    initialSeconds,
    remainingSeconds,
    endTimestamp,
    state: timerState
  }));
}

function unlockAudio() {
  if (!audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) audioContext = new AudioContextClass();
  }
  if (audioContext && audioContext.state === "suspended") audioContext.resume();
}

function playAlarmTone() {
  unlockAudio();
  if (!audioContext) return;
  const now = audioContext.currentTime;
  [659.25, 783.99, 987.77].forEach((frequency, index) => {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, now + index * 0.16);
    gain.gain.exponentialRampToValueAtTime(0.18, now + index * 0.16 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.16 + 0.34);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(now + index * 0.16);
    oscillator.stop(now + index * 0.16 + 0.36);
  });
}

function startAlarm() {
  stopAlarm();
  playAlarmTone();
  alarmInterval = window.setInterval(playAlarmTone, 1800);
}

function stopAlarm() {
  if (!alarmInterval) return;
  window.clearInterval(alarmInterval);
  alarmInterval = null;
}

async function requestNotificationPermission() {
  if (notificationPermissionRequested || !("Notification" in window)) return;
  notificationPermissionRequested = true;
  if (Notification.permission === "default") {
    try { await Notification.requestPermission(); }
    catch (error) { console.warn("Notification permission could not be requested:", error); }
  }
}

function showBrowserNotification() {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const notification = new Notification("⏱ Timer finished", {
    body: `${getTimerLabel()} is done.`,
    tag: "michaela-os-quick-timer",
    renotify: true
  });
  notification.onclick = () => { window.focus(); notification.close(); };
}

function adjustTime(secondsToAdd) {
  stopAlarm();
  if (timerState === "finished") {
    timerState = "idle";
    remainingSeconds = initialSeconds;
  }
  if (timerState === "running") {
    const currentRemaining = Math.max(0, Math.ceil((endTimestamp - Date.now()) / 1000));
    remainingSeconds = clamp(currentRemaining + secondsToAdd, MINIMUM_SECONDS, MAXIMUM_SECONDS);
    endTimestamp = Date.now() + remainingSeconds * 1000;
    initialSeconds = remainingSeconds;
  } else {
    remainingSeconds = clamp(remainingSeconds + secondsToAdd, MINIMUM_SECONDS, MAXIMUM_SECONDS);
    initialSeconds = remainingSeconds;
  }
  render();
  saveState();
}

async function startOrPauseTimer() {
  unlockAudio();
  await requestNotificationPermission();
  if (timerState === "running") return pauseTimer();
  if (timerState === "finished") return dismissFinishedTimer();
  startTimer();
}

function startTimer() {
  stopAlarm();
  timerState = "running";
  endTimestamp = Date.now() + remainingSeconds * 1000;
  startTicking();
  render();
  saveState();
}

function pauseTimer() {
  updateRemainingTime();
  timerState = "paused";
  endTimestamp = null;
  stopTicking();
  render();
  saveState();
}

function resetTimer() {
  stopTicking();
  stopAlarm();
  timerState = "idle";
  remainingSeconds = initialSeconds;
  endTimestamp = null;
  render();
  saveState();
}

function dismissFinishedTimer() {
  stopAlarm();
  timerState = "idle";
  remainingSeconds = initialSeconds;
  endTimestamp = null;
  render();
  saveState();
}

function finishTimer() {
  stopTicking();
  timerState = "finished";
  remainingSeconds = 0;
  endTimestamp = null;
  startAlarm();
  showBrowserNotification();
  render();
  saveState();
}

function startTicking() {
  stopTicking();
  updateRemainingTime();
  timerInterval = window.setInterval(updateRemainingTime, 250);
}

function stopTicking() {
  if (!timerInterval) return;
  window.clearInterval(timerInterval);
  timerInterval = null;
}

function updateRemainingTime() {
  if (timerState !== "running" || !endTimestamp) return;
  remainingSeconds = Math.max(0, Math.ceil((endTimestamp - Date.now()) / 1000));
  if (remainingSeconds <= 0) return finishTimer();
  renderTimeOnly();
  document.title = `${formatTime(remainingSeconds)} · ${getTimerLabel()}`;
}

function renderTimeOnly() {
  elements.timerValue.textContent = formatTime(remainingSeconds);
}

function render() {
  renderTimeOnly();
  elements.card.classList.toggle("is-running", timerState === "running");
  elements.card.classList.toggle("is-paused", timerState === "paused");
  elements.card.classList.toggle("is-finished", timerState === "finished");
  elements.resetButton.disabled = timerState === "idle" && remainingSeconds === initialSeconds;
  elements.timerName.disabled = timerState === "running";

  if (timerState === "running") {
    elements.primaryButtonIcon.textContent = "⏸";
    elements.primaryButtonText.textContent = "Pause";
    elements.timerUnit.textContent = "remaining";
    elements.timerMessage.textContent = `${getTimerLabel()} is running.`;
    return;
  }
  if (timerState === "paused") {
    elements.primaryButtonIcon.textContent = "▶";
    elements.primaryButtonText.textContent = "Resume";
    elements.timerUnit.textContent = "paused";
    elements.timerMessage.textContent = `${getTimerLabel()} is paused.`;
    document.title = `Paused · ${getTimerLabel()}`;
    return;
  }
  if (timerState === "finished") {
    elements.primaryButtonIcon.textContent = "✓";
    elements.primaryButtonText.textContent = "Dismiss";
    elements.timerUnit.textContent = "done";
    elements.timerMessage.textContent = `✨ ${getTimerLabel()} is finished!`;
    document.title = `Done · ${getTimerLabel()}`;
    return;
  }

  elements.primaryButtonIcon.textContent = "▶";
  elements.primaryButtonText.textContent = "Start";
  elements.timerUnit.textContent = "minutes";
  elements.timerMessage.textContent = "Adjusts in 5-minute steps.";
  document.title = "Quick Timer";
}

function attachEventListeners() {
  elements.decreaseButton.addEventListener("click", () => adjustTime(-ADJUSTMENT_SECONDS));
  elements.increaseButton.addEventListener("click", () => adjustTime(ADJUSTMENT_SECONDS));
  elements.primaryButton.addEventListener("click", startOrPauseTimer);
  elements.resetButton.addEventListener("click", resetTimer);
  elements.timerName.addEventListener("input", saveState);
  elements.timerName.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      startOrPauseTimer();
    }
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && timerState === "running") updateRemainingTime();
  });
  window.addEventListener("beforeunload", saveState);
}

function initializeQuickTimer() {
  loadSavedState();
  attachEventListeners();
  if (timerState === "running") startTicking();
  if (timerState === "finished") startAlarm();
  render();
}

initializeQuickTimer();
