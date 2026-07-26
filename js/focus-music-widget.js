/* =========================================================
   Michaela OS
   Productivity — Focus Music
   ========================================================= */

const MUSIC_STORAGE_KEY =
  "michaela-os-focus-music";

/*
  Each station needs a YouTube video ID.

  For a URL like:
  https://www.youtube.com/watch?v=jfKfPfyJRdk

  The video ID is:
  jfKfPfyJRdk

  You can replace any station's videoId later without
  changing the rest of the widget.
*/

const stations = [
  {
    id: "lofi",
    name: "Lo-fi",
    shortName: "Lo-fi",
    icon: "🎧",
    theme: "lofi",
    description:
      "Warm instrumental beats for steady focus.",
    dailyDescription:
      "A gentle soundtrack for easing into work.",
    videoId: "jfKfPfyJRdk"
  },
  {
    id: "rain",
    name: "Rain",
    shortName: "Rain",
    icon: "🌧️",
    theme: "rain",
    description:
      "Steady rain sounds with no conversation or lyrics.",
    dailyDescription:
      "A quiet rainy atmosphere for deep concentration.",
    videoId: "mPZkdNFkNps"
  },
  {
    id: "brown-noise",
    name: "Brown Noise",
    shortName: "Brown Noise",
    icon: "🟤",
    theme: "brown-noise",
    description:
      "A low, even sound designed to soften distractions.",
    dailyDescription:
      "A simple sound blanket for a busy-brain day.",
    videoId: "RqzGzwTY-6w"
  },
  {
    id: "coffee",
    name: "Coffee Shop",
    shortName: "Coffee",
    icon: "☕",
    theme: "coffee",
    description:
      "Cozy café ambience for an easy workday rhythm.",
    dailyDescription:
      "A little background energy without leaving home.",
    videoId: "gaGrHUekGrc"
  },
  {
    id: "piano",
    name: "Soft Piano",
    shortName: "Piano",
    icon: "🎹",
    theme: "piano",
    description:
      "Calm instrumental piano for reading and writing.",
    dailyDescription:
      "Soft instrumentals for slower, thoughtful work.",
    videoId: "lTRiuFIWV54"
  },
  {
    id: "nature",
    name: "Forest Nature",
    shortName: "Nature",
    icon: "🌿",
    theme: "nature",
    description:
      "Birdsong and woodland ambience for grounded focus.",
    dailyDescription:
      "Bring a little outdoor calm into your workspace.",
    videoId: "xNN7iTA57jM"
  },
  {
    id: "fireplace",
    name: "Fireplace",
    shortName: "Fireplace",
    icon: "🔥",
    theme: "fireplace",
    description:
      "Warm crackling fire sounds for a cozy work session.",
    dailyDescription:
      "Cozy background sound for a quieter work block.",
    videoId: "L_LUpnjgPso"
  },
  {
    id: "ocean",
    name: "Ocean Waves",
    shortName: "Ocean",
    icon: "🌊",
    theme: "ocean",
    description:
      "Rolling waves for calm, spacious concentration.",
    dailyDescription:
      "A peaceful reset when your brain feels crowded.",
    videoId: "bn9F19Hi1Lk"
  }
];

const elements = {
  card: document.getElementById(
    "musicCard"
  ),

  headerIcon: document.getElementById(
    "headerIcon"
  ),

  stationButtons: document.getElementById(
    "stationButtons"
  ),

  stationArtwork: document.getElementById(
    "stationArtwork"
  ),

  stationName: document.getElementById(
    "stationName"
  ),

  stationDescription:
    document.getElementById(
      "stationDescription"
    ),

  playButton: document.getElementById(
    "playButton"
  ),

  playButtonText:
    document.getElementById(
      "playButtonText"
    ),

  stopButton: document.getElementById(
    "stopButton"
  ),

  playerSection:
    document.getElementById(
      "playerSection"
    ),

  musicPlayer: document.getElementById(
    "musicPlayer"
  ),

  youtubeLink: document.getElementById(
    "youtubeLink"
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

  musicStatus: document.getElementById(
    "musicStatus"
  )
};

let selectedStation =
  stations[0];

let dailyStation =
  stations[0];

let isPlaying = false;

/* =========================================================
   STORAGE
   ========================================================= */

function loadSavedMusicState() {
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
  } catch (error) {
    console.warn(
      "Focus music settings could not be restored:",
      error
    );
  }
}

function saveMusicState() {
  const state = {
    selectedStationId:
      selectedStation.id
  };

  localStorage.setItem(
    MUSIC_STORAGE_KEY,
    JSON.stringify(state)
  );
}

/* =========================================================
   DAILY RECOMMENDATION
   ========================================================= */

function getDailyStation() {
  const today = new Date();

  const dateSeed =
    today.getFullYear() * 10000 +
    (today.getMonth() + 1) * 100 +
    today.getDate();

  const index =
    dateSeed % stations.length;

  return stations[index];
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

    button.textContent =
      `${station.icon} ${station.shortName}`;

    button.addEventListener(
      "click",
      () => {
        selectStation(station.id);
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

function findStationById(stationId) {
  return stations.find(
    (station) =>
      station.id === stationId
  );
}

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

  const wasPlaying =
    isPlaying;

  selectedStation =
    station;

  saveMusicState();
  renderSelectedStation();

  if (
    playImmediately ||
    wasPlaying
  ) {
    playSelectedStation();
  } else {
    stopPlayer();
  }
}

function renderSelectedStation() {
  elements.card.dataset.theme =
    selectedStation.theme;

  elements.headerIcon.textContent =
    "🎧";

  elements.stationArtwork.textContent =
    selectedStation.icon;

  elements.stationName.textContent =
    selectedStation.name;

  elements.stationDescription.textContent =
    selectedStation.description;

  elements.youtubeLink.href =
    createYouTubeWatchUrl(
      selectedStation.videoId
    );

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

function createEmbedUrl(videoId) {
  const parameters =
    new URLSearchParams({
      autoplay: "1",
      controls: "1",
      modestbranding: "1",
      rel: "0",
      playsinline: "1"
    });

  return (
    "https://www.youtube-nocookie.com/embed/" +
    encodeURIComponent(videoId) +
    "?" +
    parameters.toString()
  );
}

function createYouTubeWatchUrl(
  videoId
) {
  return (
    "https://www.youtube.com/watch?v=" +
    encodeURIComponent(videoId)
  );
}

function playSelectedStation() {
  const embedUrl =
    createEmbedUrl(
      selectedStation.videoId
    );

  elements.musicPlayer.src =
    embedUrl;

  elements.playerSection.hidden =
    false;

  elements.stopButton.disabled =
    false;

  elements.playButtonText.textContent =
    "Restart Station";

  elements.youtubeLink.href =
    createYouTubeWatchUrl(
      selectedStation.videoId
    );

  elements.card.classList.add(
    "is-playing"
  );

  isPlaying = true;

  announceStatus(
    `Playing ${selectedStation.name}.`
  );
}

function stopPlayer() {
  elements.musicPlayer.src = "";

  elements.playerSection.hidden =
    true;

  elements.stopButton.disabled =
    true;

  elements.playButtonText.textContent =
    "Play Station";

  elements.card.classList.remove(
    "is-playing"
  );

  isPlaying = false;

  announceStatus(
    "Focus music stopped."
  );
}

function announceStatus(message) {
  elements.musicStatus.textContent =
    message;
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
    stopPlayer
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

  window.addEventListener(
    "beforeunload",
    saveMusicState
  );
}

/* =========================================================
   INITIALIZATION
   ========================================================= */

function initializeFocusMusic() {
  loadSavedMusicState();

  buildStationButtons();
  renderDailyStation();
  renderSelectedStation();
  attachEventListeners();
}

initializeFocusMusic();
