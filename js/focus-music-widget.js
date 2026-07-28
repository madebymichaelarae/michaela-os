/* =========================================================
   Michaela OS
   Productivity — Focus Soundtrack
   ========================================================= */

const MUSIC_STORAGE_KEY =
  "michaela-os-focus-soundtrack";

/*
  Add future soundtracks to this array.

  Each soundtrack needs:
  - id
  - name
  - shortName
  - icon
  - theme
  - category
  - description
  - youtubeId
  - youtubeUrl
*/

const soundtracks = [
  {
    id: "late-night-lofi",
    name: "Late Night Lofi",
    shortName: "Late Night",
    icon: "🌙",
    theme: "late-night",
    category: "Cozy",

    description:
      "Quiet late-night beats for settling into focused work.",

    youtubeId:
      "b6ZQNlQJ284",

    youtubeUrl:
      "https://www.youtube.com/watch?v=b6ZQNlQJ284"
  },

  {
    id: "beachside-lofi",
    name: "Beachside Lofi",
    shortName: "Beachside",
    icon: "🌊",
    theme: "beach",

    category: "Cozy",

    description:
      "Soft coastal energy for calm, easygoing focus sessions.",

    youtubeId:
      "5Jc34fYRrtg",

    youtubeUrl:
      "https://www.youtube.com/watch?v=5Jc34fYRrtg"
  },

  {
    id: "cafe-lofi",
    name: "Cafe Lofi",
    shortName: "Cafe",
    icon: "☕",
    theme: "cafe",

    category: "Cozy",

    description:
      "Warm café ambience for writing, planning, and creative work.",

    youtubeId:
      "c18WZZa4KIA",

    youtubeUrl:
      "https://www.youtube.com/watch?v=c18WZZa4KIA"
  },

  {
    id: "nighttime-storms",
    name: "Nighttime Storms",
    shortName: "Storms",
    icon: "⛈️",
    theme: "storm",

    category: "Ambient",

    description:
      "Dark nighttime rain and thunder for blocking out distractions.",

    youtubeId:
      "mPZkdNFkNps",

    youtubeUrl:
      "https://www.youtube.com/watch?v=mPZkdNFkNps"
  },

  {
    id: "fireplace",
    name: "Fireplace",
    shortName: "Fireplace",
    icon: "🔥",
    theme: "fireplace",

    category: "Ambient",

    description:
      "A warm crackling fireplace for cozy and low-pressure work.",

    youtubeId:
      "vuyH4T2SjaU",

    youtubeUrl:
      "https://www.youtube.com/watch?v=vuyH4T2SjaU"
  },

  {
    id: "cartoon-office-space",
    name: "Cartoon Office Space",
    shortName: "Office",
    icon: "🖥️",
    theme: "office",

    category: "Spaces",

    description:
      "A playful office atmosphere for making work feel more inviting.",

    youtubeId:
      "ZFjhlnDyf74",

    youtubeUrl:
      "https://www.youtube.com/watch?v=ZFjhlnDyf74"
  },

  {
    id: "car-ride",
    name: "Car Ride",
    shortName: "Car Ride",
    icon: "🚗",
    theme: "car",

    category: "Spaces",

    description:
      "A nighttime drive atmosphere for steady, immersive focus.",

    youtubeId:
      "_2b9qMYml6I",

    youtubeUrl:
      "https://www.youtube.com/watch?v=_2b9qMYml6I"
  },

  {
    id: "good-vibes",
    name: "Good Vibes",
    shortName: "Good Vibes",
    icon: "✨",
    theme: "good-vibes",

    category: "Energy",

    description:
      "Bright, upbeat energy for task sprints and productive momentum.",

    youtubeId:
      "FcYp2AZUl1Q",

    youtubeUrl:
      "https://www.youtube.com/watch?v=FcYp2AZUl1Q"
  },

  {
    id: "emo-kid-cd",
    name: "Emo Kid CD",
    shortName: "Emo Kid",
    icon: "🖤",
    theme: "emo",

    category: "Energy",

    description:
      "Nostalgic emo energy for powering through a louder work block.",

    youtubeId:
      "Pye5o3YyWLA",

    youtubeUrl:
      "https://www.youtube.com/watch?v=Pye5o3YyWLA"
  }
];

const categoryOrder = [
  "Cozy",
  "Ambient",
  "Spaces",
  "Energy"
];

const categoryIcons = {
  Cozy: "🌙",
  Ambient: "🌧️",
  Spaces: "🚗",
  Energy: "⚡"
};

const elements = {
  card:
    document.getElementById(
      "musicCard"
    ),

  headerIcon:
    document.getElementById(
      "headerIcon"
    ),

  soundtrackGroups:
    document.getElementById(
      "soundtrackGroups"
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

  videoPlaceholder:
    document.getElementById(
      "videoPlaceholder"
    ),

  placeholderIcon:
    document.getElementById(
      "placeholderIcon"
    ),

  placeholderTitle:
    document.getElementById(
      "placeholderTitle"
    ),

  playButton:
    document.getElementById(
      "playButton"
    ),

  youtubePlayer:
    document.getElementById(
      "youtubePlayer"
    ),

  soundtrackMessage:
    document.getElementById(
      "soundtrackMessage"
    ),

  soundtrackMessageIcon:
    document.getElementById(
      "soundtrackMessageIcon"
    ),

  soundtrackMessageText:
    document.getElementById(
      "soundtrackMessageText"
    ),

  youtubeLink:
    document.getElementById(
      "youtubeLink"
    )
};

let selectedSoundtrack =
  soundtracks[0];

let isVideoLoaded = false;

/* =========================================================
   HELPERS
   ========================================================= */

function findSoundtrackById(
  soundtrackId
) {
  return soundtracks.find(
    (soundtrack) =>
      soundtrack.id === soundtrackId
  );
}

function buildEmbedUrl(
  soundtrack,
  autoplay = false
) {
  const parameters =
    new URLSearchParams({
      rel: "0",
      modestbranding: "1",
      playsinline: "1"
    });

  if (autoplay) {
    parameters.set(
      "autoplay",
      "1"
    );
  }

  return (
    "https://www.youtube.com/embed/" +
    soundtrack.youtubeId +
    "?" +
    parameters.toString()
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

    const savedSoundtrack =
      findSoundtrackById(
        savedState.selectedSoundtrackId
      );

    if (savedSoundtrack) {
      selectedSoundtrack =
        savedSoundtrack;
    }
  } catch (error) {
    console.warn(
      "Focus soundtrack settings could not be restored:",
      error
    );
  }
}

function saveState() {
  const state = {
    selectedSoundtrackId:
      selectedSoundtrack.id
  };

  localStorage.setItem(
    MUSIC_STORAGE_KEY,
    JSON.stringify(state)
  );
}

/* =========================================================
   SOUNDTRACK LIBRARY
   ========================================================= */

function buildSoundtrackGroups() {
  elements.soundtrackGroups.innerHTML =
    "";

  categoryOrder.forEach(
    (category) => {
      const categorySoundtracks =
        soundtracks.filter(
          (soundtrack) =>
            soundtrack.category ===
            category
        );

      if (
        categorySoundtracks.length === 0
      ) {
        return;
      }

      const group =
        document.createElement(
          "section"
        );

      group.className =
        "soundtrack-group";

      const heading =
        document.createElement(
          "h2"
        );

      heading.className =
        "soundtrack-group-heading";

      heading.innerHTML =
        `
          <span aria-hidden="true">
            ${categoryIcons[category] || "🎧"}
          </span>
          ${category}
        `;

      const buttonContainer =
        document.createElement(
          "div"
        );

      buttonContainer.className =
        "soundtrack-buttons";

      buttonContainer.setAttribute(
        "role",
        "list"
      );

      categorySoundtracks.forEach(
        (soundtrack) => {
          const button =
            document.createElement(
              "button"
            );

          button.type =
            "button";

          button.className =
            "soundtrack-button";

          button.dataset.soundtrackId =
            soundtrack.id;

          button.setAttribute(
            "role",
            "listitem"
          );

          button.setAttribute(
            "aria-pressed",
            "false"
          );

          button.innerHTML =
            `
              <span
                class="soundtrack-button-icon"
                aria-hidden="true"
              >
                ${soundtrack.icon}
              </span>

              <span class="soundtrack-button-name">
                ${soundtrack.shortName}
              </span>
            `;

          button.addEventListener(
            "click",
            () => {
              selectSoundtrack(
                soundtrack.id,
                {
                  autoplay: true
                }
              );
            }
          );

          buttonContainer.appendChild(
            button
          );
        }
      );

      group.appendChild(
        heading
      );

      group.appendChild(
        buttonContainer
      );

      elements.soundtrackGroups.appendChild(
        group
      );
    }
  );
}

/* =========================================================
   SOUNDTRACK SELECTION
   ========================================================= */

function selectSoundtrack(
  soundtrackId,
  options = {}
) {
  const soundtrack =
    findSoundtrackById(
      soundtrackId
    );

  if (!soundtrack) {
    return;
  }

  const {
    autoplay = false
  } = options;

  selectedSoundtrack =
    soundtrack;

  renderSelectedSoundtrack();
  saveState();

  if (autoplay) {
    loadSelectedVideo({
      autoplay: true
    });
  } else {
    showVideoPlaceholder();
  }
}

function renderSelectedSoundtrack() {
  elements.card.dataset.theme =
    selectedSoundtrack.theme;

  elements.headerIcon.textContent =
    selectedSoundtrack.icon;

  elements.stationArtwork.textContent =
    selectedSoundtrack.icon;

  elements.stationName.textContent =
    selectedSoundtrack.name;

  elements.stationDescription.textContent =
    selectedSoundtrack.description;

  elements.placeholderIcon.textContent =
    selectedSoundtrack.icon;

  elements.placeholderTitle.textContent =
    selectedSoundtrack.name;

  elements.youtubeLink.href =
    selectedSoundtrack.youtubeUrl;

  document
    .querySelectorAll(
      ".soundtrack-button"
    )
    .forEach((button) => {
      const isSelected =
        button.dataset.soundtrackId ===
        selectedSoundtrack.id;

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
   VIDEO PLAYER
   ========================================================= */

function loadSelectedVideo(
  options = {}
) {
  const {
    autoplay = true
  } = options;

  isVideoLoaded = true;

  elements.youtubePlayer.src =
    buildEmbedUrl(
      selectedSoundtrack,
      autoplay
    );

  elements.youtubePlayer.hidden =
    false;

  elements.videoPlaceholder.hidden =
    true;

  elements.card.classList.add(
    "is-playing"
  );

  elements.stationStatusLabel.textContent =
    "Now Playing";

  showMessage(
    "🎶",
    `${selectedSoundtrack.name} is ready.`
  );

  document.title =
    `Playing · ${selectedSoundtrack.name}`;
}

function showVideoPlaceholder() {
  isVideoLoaded = false;

  elements.youtubePlayer.src =
    "";

  elements.youtubePlayer.hidden =
    true;

  elements.videoPlaceholder.hidden =
    false;

  elements.card.classList.remove(
    "is-playing"
  );

  elements.stationStatusLabel.textContent =
    "Selected Soundtrack";

  showMessage(
    "🌿",
    `${selectedSoundtrack.name} is selected. Press play when you are ready.`
  );

  document.title =
    "Focus Soundtrack";
}

/* =========================================================
   STATUS MESSAGE
   ========================================================= */

function showMessage(
  icon,
  message
) {
  elements.soundtrackMessageIcon.textContent =
    icon;

  elements.soundtrackMessageText.textContent =
    message;
}

/* =========================================================
   EVENTS
   ========================================================= */

function attachEventListeners() {
  elements.playButton.addEventListener(
    "click",
    () => {
      loadSelectedVideo({
        autoplay: true
      });
    }
  );

  window.addEventListener(
    "beforeunload",
    saveState
  );
}

/* =========================================================
   INITIALIZATION
   ========================================================= */

function initializeFocusSoundtrack() {
  loadSavedState();

  buildSoundtrackGroups();
  renderSelectedSoundtrack();
  showVideoPlaceholder();
  attachEventListeners();
}

initializeFocusSoundtrack();
