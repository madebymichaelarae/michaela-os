/* =========================================================
   Michaela OS
   Productivity — Focus Radio
   ========================================================= */

const MUSIC_STORAGE_KEY =
  "michaela-os-focus-radio";

/*
  The stream URLs below are direct MP3 radio streams.

  The backupStream property gives each station a second
  server to try automatically if its main server fails.
*/

const stations = [
  {
    id: "lofi",
    name: "Lo-fi Focus",
    shortName: "Lo-fi",
    icon: "🎧",
    theme: "lofi",

    providerName:
      "Groove Salad Classic",

    description:
      "Warm downtempo beats and grooves for steady focus.",

    dailyDescription:
      "Easy background music for getting into work mode.",

    stream:
      "https://ice5.somafm.com/gsclassic-128-mp3",

    backupStream:
      "https://ice2.somafm.com/gsclassic-128-mp3",

    website:
      "https://somafm.com/gsclassic/"
  },

  {
    id: "chill",
    name: "Chill Focus",
    shortName: "Chill",
    icon: "🌿",
    theme: "chill",

    providerName:
      "Groove Salad",

    description:
      "Chilled ambient and downtempo music with a gentle rhythm.",

    dailyDescription:
      "A calm soundtrack for a lighter work block.",

    stream:
      "https://ice5.somafm.com/groovesalad-128-mp3",

    backupStream:
      "https://ice6.somafm.com/groovesalad-128-mp3",

    website:
      "https://somafm.com/groovesalad/"
  },

  {
    id: "deep",
    name: "Deep Focus",
    shortName: "Deep Focus",
    icon: "🌙",
    theme: "deep",

    providerName:
      "Drone Zone",

    description:
      "Slow atmospheric textures with few beats and minimal distraction.",

    dailyDescription:
      "Spacious background sound for concentration-heavy work.",

    stream:
      "https://ice5.somafm.com/dronezone-128-mp3",

    backupStream:
      "https://ice6.somafm.com/dronezone-128-mp3",

    website:
      "https://somafm.com/dronezone/"
  },

  {
    id: "coffee",
    name: "Coffeehouse",
    shortName: "Coffeehouse",
    icon: "☕",
    theme: "coffee",

    providerName:
      "Illinois Street Lounge",

    description:
      "Retro lounge, jazz, and stylish instrumentals for café energy.",

    dailyDescription:
      "A little background energy without leaving home.",

    stream:
      "https://ice5.somafm.com/illstreet-128-mp3",

    backupStream:
      "https://ice2.somafm.com/illstreet-128-mp3",

    website:
      "https://somafm.com/illstreet/"
  },

  {
    id: "jazz",
    name: "Instrumental Jazz",
    shortName: "Jazz",
    icon: "🎷",
    theme: "jazz",

    providerName:
      "Sonic Universe",

    description:
      "Eclectic modern jazz for creative and design-focused work.",

    dailyDescription:
      "Interesting instrumentals for a creative workday.",

    stream:
      "https://ice5.somafm.com/sonicuniverse-128-mp3",

    backupStream:
      "https://ice6.somafm.com/sonicuniverse-128-mp3",

    website:
      "https://somafm.com/sonicuniverse/"
  },

  {
    id: "ambient",
    name: "Ambient",
    shortName: "Ambient",
    icon: "☁️",
    theme: "ambient",

    providerName:
      "Deep Space One",

    description:
      "Deep ambient electronic music for quiet, uninterrupted work.",

    dailyDescription:
      "A soft atmospheric layer for a crowded-brain day.",

    stream:
      "https://ice5.somafm.com/deepspaceone-128-mp3",

    backupStream:
      "https://ice2.somafm.com/deepspaceone-128-mp3",

    website:
      "https://somafm.com/deepspaceone/"
  }
];

const elements = {
  card:
    document.getElementById(
      "musicCard"
    ),

  headerIcon:
    document.getElementById(
      "headerIcon"
    ),

  stationButtons:
    document.getElementById(
      "stationButtons"
    ),

  stationArtwork:
    document.getElementById(
      "stationArtwork"
    ),

  stationStatusLabel:
    document.getElementById(
      "stationStatusLabel"
    ),

  stationName:
    document.getElementById(
      "stationName"
    ),

  stationDescription:
    document.getElementById(
      "stationDescription"
    ),

  playButton:
    document.getElementById(
      "playButton"
    ),

  playButtonIcon:
    document.getElementById(
      "playButtonIcon"
    ),

  playButtonText:
    document.getElementById(
      "playButtonText"
    ),

  stopButton:
    document.getElementById(
      "stopButton"
    ),

  volumeSlider:
    document.getElementById(
      "volumeSlider"
    ),

  volumeValue:
    document.getElementById(
      "volumeValue"
    ),

  muteButton:
    document.getElementById(
      "muteButton"
    ),

  muteIcon:
    document.getElementById(
      "muteIcon"
    ),

  dailyPickButton:
    document.getElementById(
      "dailyPickButton"
    ),

  dailyPickIcon:
    document.getElementById(
      "dailyPickIcon"
    ),

  dailyPickName:
    document.getElementById(
      "dailyPickName"
    ),

  dailyPickDescription:
    document.getElementById(
      "dailyPickDescription"
    ),

  radioMessage:
    document.getElementById(
      "radioMessage"
    ),

  radioMessageIcon:
    document.getElementById(
      "radioMessageIcon"
    ),

  radioMessageText:
    document.getElementById(
      "radioMessageText"
    ),

  stationLink:
    document.getElementById(
      "stationLink"
    ),

  player:
    document.getElementById(
      "radioPlayer"
    )
};

let selectedStation =
  stations[0];

let dailyStation =
  stations[0];

let isPlaying = false;
let isLoading = false;
let isMuted = false;
let currentStreamAttempt = 0;

let savedVolume = 0.65;

/* =========================================================
   HELPERS
   ========================================================= */

function findStationById(stationId) {
  return stations.find(
    (station) =>
      station.id === stationId
  );
}

function clamp(value, min, max) {
  return Math.min(
    Math.max(value, min),
    max
  );
}

/* =========================================================
   STORAGE
   ========================================================= */

function loadSavedState() {
  try {
    const savedState =
      JSON.parse(
        localStorage.getItem(
          MUSIC_STORAGE_KEY
        )
      );

    if (!savedState) {
      return;
    }

    const savedStation =
      findStationById(
        savedState.selectedStationId
      );

    if (savedStation) {
      selectedStation =
        savedStation;
    }

    const volume =
      Number(savedState.volume);

    if (Number.isFinite(volume)) {
      savedVolume =
        clamp(volume, 0, 1);
    }

    isMuted =
      Boolean(savedState.isMuted);
  } catch (error) {
    console.warn(
      "Focus radio settings could not be restored:",
      error
    );
  }
}

function saveState() {
  const state = {
    selectedStationId:
      selectedStation.id,

    volume:
      savedVolume,

    isMuted
  };

  localStorage.setItem(
    MUSIC_STORAGE_KEY,
    JSON.stringify(state)
  );
}

/* =========================================================
   DAILY PICK
   ========================================================= */

function getDailyStation() {
  const today = new Date();

  const seed =
    today.getFullYear() * 10000 +
    (today.getMonth() + 1) * 100 +
    today.getDate();

  return stations[
    seed % stations.length
  ];
}

function renderDailyStation() {
  dailyStation =
    getDailyStation();

  elements.dailyPickIcon.textContent =
    dailyStation.icon;

  elements.dailyPickName.textContent =
    dailyStation.name;

  elements.dailyPickDescription.textContent =
    dailyStation.dailyDescription;
}

/* =========================================================
   STATION BUTTONS
   ========================================================= */

function buildStationButtons() {
  elements.stationButtons.innerHTML =
    "";

  stations.forEach((station) => {
    const button =
      document.createElement(
        "button"
      );

    button.type = "button";

    button.className =
      "station-button";

    button.dataset.stationId =
      station.id;

    button.setAttribute(
      "role",
      "listitem"
    );

    button.setAttribute(
      "aria-pressed",
      "false"
    );

    button.textContent =
      `${station.icon} ${station.shortName}`;

    button.addEventListener(
      "click",
      () => {
        selectStation(
          station.id
        );
      }
    );

    elements.stationButtons.appendChild(
      button
    );
  });
}

/* =========================================================
   STATION SELECTION
   ========================================================= */

function selectStation(
  stationId,
  options = {}
) {
  const station =
    findStationById(stationId);

  if (!station) {
    return;
  }

  const {
    playImmediately = false
  } = options;

  const shouldContinuePlaying =
    isPlaying ||
    isLoading ||
    playImmediately;

  stopAudio({
    announce: false
  });

  selectedStation =
    station;

  currentStreamAttempt = 0;

  renderSelectedStation();
  saveState();

  if (shouldContinuePlaying) {
    playSelectedStation();
  } else {
    showMessage(
      "🌿",
      `${station.name} is ready whenever you are.`
    );
  }
}

function renderSelectedStation() {
  elements.card.dataset.theme =
    selectedStation.theme;

  elements.stationArtwork.textContent =
    selectedStation.icon;

  elements.stationName.textContent =
    selectedStation.name;

  elements.stationDescription.textContent =
    selectedStation.description;

  elements.stationLink.href =
    selectedStation.website;

  document
    .querySelectorAll(
      ".station-button"
    )
    .forEach((button) => {
      const isSelected =
        button.dataset.stationId ===
        selectedStation.id;

      button.classList.toggle(
        "active",
        isSelected
      );

      button.setAttribute(
        "aria-pressed",
        String(isSelected)
      );
    });
}

/* =========================================================
   PLAYER
   ========================================================= */

async function playSelectedStation() {
  if (isPlaying) {
    pauseAudio();
    return;
  }

  if (
    elements.player.src &&
    elements.player.paused &&
    elements.player.currentSrc
  ) {
    await resumeAudio();
    return;
  }

  currentStreamAttempt = 0;

  await loadCurrentStream();
}

async function loadCurrentStream() {
  setLoadingState(true);
  clearErrorState();

  const streamUrl =
    currentStreamAttempt === 0
      ? selectedStation.stream
      : selectedStation.backupStream;

  elements.player.src =
    streamUrl;

  elements.player.volume =
    savedVolume;

  elements.player.muted =
    isMuted;

  elements.player.load();

  showMessage(
    "⏳",
    `Connecting to ${selectedStation.name}…`
  );

  try {
    await elements.player.play();
  } catch (error) {
    /*
      Browser autoplay protection should not normally trigger
      because this function begins with a button click.
    */

    if (
      error.name ===
      "NotAllowedError"
    ) {
      setLoadingState(false);

      showError(
        "Your browser blocked playback. Press Play Station again."
      );

      return;
    }

    handleStreamFailure();
  }
}

async function resumeAudio() {
  setLoadingState(true);
  clearErrorState();

  try {
    await elements.player.play();
  } catch (error) {
    setLoadingState(false);

    showError(
      "The station could not resume. Try stopping and starting it again."
    );
  }
}

function pauseAudio() {
  elements.player.pause();

  isPlaying = false;
  isLoading = false;

  elements.card.classList.remove(
    "is-playing",
    "is-loading"
  );

  updatePlaybackButtons();

  elements.stationStatusLabel.textContent =
    "Paused";

  showMessage(
    "⏸️",
    `${selectedStation.name} is paused.`
  );

  document.title =
    "Focus Radio";
}

function stopAudio(
  options = {}
) {
  const {
    announce = true
  } = options;

  elements.player.pause();

  elements.player.removeAttribute(
    "src"
  );

  elements.player.load();

  isPlaying = false;
  isLoading = false;

  currentStreamAttempt = 0;

  elements.card.classList.remove(
    "is-playing",
    "is-loading"
  );

  updatePlaybackButtons();

  elements.stationStatusLabel.textContent =
    "Selected Station";

  document.title =
    "Focus Radio";

  if (announce) {
    showMessage(
      "🌿",
      "Focus radio stopped."
    );
  }
}

function handleStreamFailure() {
  if (
    currentStreamAttempt === 0 &&
    selectedStation.backupStream
  ) {
    currentStreamAttempt = 1;

    showMessage(
      "🔄",
      "Trying the station’s backup stream…"
    );

    window.setTimeout(
      loadCurrentStream,
      500
    );

    return;
  }

  setLoadingState(false);

  showError(
    "This station is temporarily unavailable. Try another station or visit its website."
  );
}

/* =========================================================
   AUDIO EVENTS
   ========================================================= */

function handlePlaying() {
  isPlaying = true;
  isLoading = false;

  elements.card.classList.add(
    "is-playing"
  );

  elements.card.classList.remove(
    "is-loading"
  );

  elements.stationStatusLabel.textContent =
    `Playing · ${selectedStation.providerName}`;

  updatePlaybackButtons();

  showMessage(
    "🎶",
    `${selectedStation.name} is playing.`
  );

  document.title =
    `Playing · ${selectedStation.name}`;
}

function handleWaiting() {
  if (!isPlaying) {
    setLoadingState(true);
  }

  showMessage(
    "⏳",
    `Connecting to ${selectedStation.name}…`
  );
}

function handlePaused() {
  if (
    elements.player.ended ||
    !elements.player.src
  ) {
    return;
  }

  isPlaying = false;
  isLoading = false;

  elements.card.classList.remove(
    "is-playing",
    "is-loading"
  );

  updatePlaybackButtons();
}

function handleAudioError() {
  /*
    Ignore errors caused by intentionally clearing src
    when the Stop button is used.
  */

  if (!elements.player.src) {
    return;
  }

  handleStreamFailure();
}

/* =========================================================
   PLAYBACK UI
   ========================================================= */

function setLoadingState(loading) {
  isLoading = loading;

  elements.card.classList.toggle(
    "is-loading",
    loading
  );

  elements.playButton.disabled =
    loading;

  elements.playButtonIcon.textContent =
    loading
      ? "…"
      : "▶";

  elements.playButtonText.textContent =
    loading
      ? "Connecting"
      : "Play Station";
}

function updatePlaybackButtons() {
  elements.playButton.disabled =
    isLoading;

  elements.stopButton.disabled =
    !isPlaying &&
    !isLoading &&
    !elements.player.src;

  if (isLoading) {
    elements.playButtonIcon.textContent =
      "…";

    elements.playButtonText.textContent =
      "Connecting";

    return;
  }

  if (isPlaying) {
    elements.playButtonIcon.textContent =
      "⏸";

    elements.playButtonText.textContent =
      "Pause";

    return;
  }

  if (
    elements.player.src &&
    elements.player.paused
  ) {
    elements.playButtonIcon.textContent =
      "▶";

    elements.playButtonText.textContent =
      "Resume";

    return;
  }

  elements.playButtonIcon.textContent =
    "▶";

  elements.playButtonText.textContent =
    "Play Station";
}

/* =========================================================
   VOLUME
   ========================================================= */

function initializeVolume() {
  const volumePercent =
    Math.round(
      savedVolume * 100
    );

  elements.player.volume =
    savedVolume;

  elements.player.muted =
    isMuted;

  elements.volumeSlider.value =
    String(volumePercent);

  updateVolumeDisplay();
}

function handleVolumeChange(event) {
  const volumePercent =
    clamp(
      Number(event.target.value),
      0,
      100
    );

  savedVolume =
    volumePercent / 100;

  elements.player.volume =
    savedVolume;

  if (
    savedVolume > 0 &&
    isMuted
  ) {
    isMuted = false;
    elements.player.muted = false;
  }

  updateVolumeDisplay();
  saveState();
}

function toggleMute() {
  isMuted =
    !isMuted;

  elements.player.muted =
    isMuted;

  updateVolumeDisplay();
  saveState();
}

function updateVolumeDisplay() {
  const volumePercent =
    Math.round(
      savedVolume * 100
    );

  elements.volumeValue.textContent =
    isMuted
      ? "Muted"
      : `${volumePercent}%`;

  elements.muteIcon.textContent =
    getVolumeIcon(
      volumePercent,
      isMuted
    );

  elements.muteButton.setAttribute(
    "aria-label",
    isMuted
      ? "Unmute focus radio"
      : "Mute focus radio"
  );

  elements.volumeSlider.style.setProperty(
    "--volume-progress",
    `${volumePercent}%`
  );
}

function getVolumeIcon(
  volumePercent,
  muted
) {
  if (
    muted ||
    volumePercent === 0
  ) {
    return "🔇";
  }

  if (volumePercent < 45) {
    return "🔈";
  }

  if (volumePercent < 75) {
    return "🔉";
  }

  return "🔊";
}

/* =========================================================
   STATUS MESSAGES
   ========================================================= */

function showMessage(
  icon,
  message
) {
  elements.card.classList.remove(
    "has-error"
  );

  elements.radioMessageIcon.textContent =
    icon;

  elements.radioMessageText.textContent =
    message;
}

function showError(message) {
  isPlaying = false;
  isLoading = false;

  elements.card.classList.remove(
    "is-playing",
    "is-loading"
  );

  elements.card.classList.add(
    "has-error"
  );

  elements.stationStatusLabel.textContent =
    "Station unavailable";

  updatePlaybackButtons();

  elements.radioMessageIcon.textContent =
    "⚠️";

  elements.radioMessageText.textContent =
    message;

  document.title =
    "Focus Radio";
}

function clearErrorState() {
  elements.card.classList.remove(
    "has-error"
  );
}

/* =========================================================
   EVENTS
   ========================================================= */

function attachEventListeners() {
  elements.playButton.addEventListener(
    "click",
    playSelectedStation
  );

  elements.stopButton.addEventListener(
    "click",
    () => {
      stopAudio();
    }
  );

  elements.dailyPickButton.addEventListener(
    "click",
    () => {
      selectStation(
        dailyStation.id,
        {
          playImmediately: true
        }
      );
    }
  );

  elements.volumeSlider.addEventListener(
    "input",
    handleVolumeChange
  );

  elements.muteButton.addEventListener(
    "click",
    toggleMute
  );

  elements.player.addEventListener(
    "playing",
    handlePlaying
  );

  elements.player.addEventListener(
    "waiting",
    handleWaiting
  );

  elements.player.addEventListener(
    "pause",
    handlePaused
  );

  elements.player.addEventListener(
    "error",
    handleAudioError
  );

  window.addEventListener(
    "beforeunload",
    saveState
  );
}

/* =========================================================
   INITIALIZATION
   ========================================================= */

function initializeFocusRadio() {
  loadSavedState();

  buildStationButtons();
  renderDailyStation();
  renderSelectedStation();
  initializeVolume();
  attachEventListeners();
  updatePlaybackButtons();
}

initializeFocusRadio();
