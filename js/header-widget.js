
const elements = {
    widget: document.getElementById("welcome-widget"),

    greeting: document.getElementById("greeting"),
    timeIcon: document.getElementById("time-icon"),

    weatherIcon: document.getElementById("weather-icon"),
    weatherTemperature: document.getElementById(
        "weather-temperature"
    ),
    weatherCondition: document.getElementById(
        "weather-condition"
    ),
    weatherStatus: document.getElementById("weather-status"),

    calendarMonth: document.getElementById("calendar-month"),
    calendarDay: document.getElementById("calendar-day"),
    calendarWeekday: document.getElementById(
        "calendar-weekday"
    ),
    calendarTime: document.getElementById("calendar-time")
};

const TIME_ZONE = "America/New_York";

function getEasternHour(date = new Date()) {
    const hourParts = new Intl.DateTimeFormat("en-US", {
        timeZone: TIME_ZONE,
        hour: "numeric",
        hourCycle: "h23"
    }).formatToParts(date);

    const hourPart = hourParts.find(
        part => part.type === "hour"
    );

    return Number(hourPart?.value ?? date.getHours());
}

function getTimePeriod(hour) {
    if (hour >= 5 && hour < 12) {
        return {
            name: "morning",
            greeting: "Good morning",
            icon: "🌅"
        };
    }

    if (hour >= 12 && hour < 17) {
        return {
            name: "afternoon",
            greeting: "Good afternoon",
            icon: "☀️"
        };
    }

    if (hour >= 17 && hour < 21) {
        return {
            name: "evening",
            greeting: "Good evening",
            icon: "🌇"
        };
    }

    return {
        name: "night",
        greeting: "Good night",
        icon: "🌙"
    };
}

function updateGreeting(date = new Date()) {
    const hour = getEasternHour(date);
    const period = getTimePeriod(hour);

    elements.widget.dataset.period = period.name;
    elements.greeting.textContent =
        `${period.greeting}, Michaela`;

    elements.timeIcon.textContent = period.icon;
}

function updateDateAndTime(date = new Date()) {
    elements.calendarMonth.textContent =
        new Intl.DateTimeFormat("en-US", {
            timeZone: TIME_ZONE,
            month: "short"
        })
            .format(date)
            .toUpperCase();

    elements.calendarDay.textContent =
        new Intl.DateTimeFormat("en-US", {
            timeZone: TIME_ZONE,
            day: "numeric"
        }).format(date);

    elements.calendarWeekday.textContent =
        new Intl.DateTimeFormat("en-US", {
            timeZone: TIME_ZONE,
            weekday: "long"
        }).format(date);

    elements.calendarTime.textContent =
        new Intl.DateTimeFormat("en-US", {
            timeZone: TIME_ZONE,
            hour: "numeric",
            minute: "2-digit"
        }).format(date);

    elements.calendarTime.dateTime = date.toISOString();
}

function getWeatherPresentation(weatherCode, isDay) {
    const weatherMap = {
        0: {
            dayIcon: "☀️",
            nightIcon: "🌙",
            label: "Clear"
        },

        1: {
            dayIcon: "🌤️",
            nightIcon: "🌙",
            label: "Mostly clear"
        },

        2: {
            dayIcon: "⛅",
            nightIcon: "☁️",
            label: "Partly cloudy"
        },

        3: {
            dayIcon: "☁️",
            nightIcon: "☁️",
            label: "Overcast"
        },

        45: {
            dayIcon: "🌫️",
            nightIcon: "🌫️",
            label: "Foggy"
        },

        48: {
            dayIcon: "🌫️",
            nightIcon: "🌫️",
            label: "Foggy"
        },

        51: {
            dayIcon: "🌦️",
            nightIcon: "🌧️",
            label: "Light drizzle"
        },

        53: {
            dayIcon: "🌦️",
            nightIcon: "🌧️",
            label: "Drizzle"
        },

        55: {
            dayIcon: "🌧️",
            nightIcon: "🌧️",
            label: "Heavy drizzle"
        },

        56: {
            dayIcon: "🌧️",
            nightIcon: "🌧️",
            label: "Freezing drizzle"
        },

        57: {
            dayIcon: "🌧️",
            nightIcon: "🌧️",
            label: "Freezing drizzle"
        },

        61: {
            dayIcon: "🌦️",
            nightIcon: "🌧️",
            label: "Light rain"
        },

        63: {
            dayIcon: "🌧️",
            nightIcon: "🌧️",
            label: "Rain"
        },

        65: {
            dayIcon: "🌧️",
            nightIcon: "🌧️",
            label: "Heavy rain"
        },

        66: {
            dayIcon: "🌧️",
            nightIcon: "🌧️",
            label: "Freezing rain"
        },

        67: {
            dayIcon: "🌧️",
            nightIcon: "🌧️",
            label: "Freezing rain"
        },

        71: {
            dayIcon: "🌨️",
            nightIcon: "🌨️",
            label: "Light snow"
        },

        73: {
            dayIcon: "❄️",
            nightIcon: "❄️",
            label: "Snow"
        },

        75: {
            dayIcon: "❄️",
            nightIcon: "❄️",
            label: "Heavy snow"
        },

        77: {
            dayIcon: "🌨️",
            nightIcon: "🌨️",
            label: "Snow grains"
        },

        80: {
            dayIcon: "🌦️",
            nightIcon: "🌧️",
            label: "Light showers"
        },

        81: {
            dayIcon: "🌧️",
            nightIcon: "🌧️",
            label: "Rain showers"
        },

        82: {
            dayIcon: "🌧️",
            nightIcon: "🌧️",
            label: "Heavy showers"
        },

        85: {
            dayIcon: "🌨️",
            nightIcon: "🌨️",
            label: "Snow showers"
        },

        86: {
            dayIcon: "❄️",
            nightIcon: "❄️",
            label: "Heavy snow showers"
        },

        95: {
            dayIcon: "⛈️",
            nightIcon: "⛈️",
            label: "Thunderstorms"
        },

        96: {
            dayIcon: "⛈️",
            nightIcon: "⛈️",
            label: "Thunderstorms with hail"
        },

        99: {
            dayIcon: "⛈️",
            nightIcon: "⛈️",
            label: "Severe thunderstorms"
        }
    };

    const weather =
        weatherMap[weatherCode] ?? {
            dayIcon: "🌤️",
            nightIcon: "☁️",
            label: "Current conditions"
        };

    return {
        icon: isDay
            ? weather.dayIcon
            : weather.nightIcon,

        label: weather.label
    };
}

async function loadWeather() {
    elements.weatherStatus.textContent = "";

    try {
        const response = await fetch("/api/weather");

        if (!response.ok) {
            throw new Error(
                `Weather request returned ${response.status}`
            );
        }

        const data = await response.json();

        if (!data.success || !data.weather) {
            throw new Error(
                data.error ?? "Weather data was unavailable"
            );
        }

        const presentation = getWeatherPresentation(
            data.weather.weatherCode,
            data.weather.isDay
        );

        elements.weatherIcon.textContent =
            presentation.icon;

        elements.weatherTemperature.textContent =
            `${data.weather.temperature}°`;

        elements.weatherCondition.textContent =
            presentation.label;

        elements.weatherStatus.textContent =
            data.location
                ? `Current weather for ${data.location}`
                : "";
    }
    catch (error) {
        console.error("Unable to load weather:", error);

        elements.weatherIcon.textContent = "🌤️";
        elements.weatherTemperature.textContent = "--°";
        elements.weatherCondition.textContent =
            "Weather unavailable";

        elements.weatherStatus.textContent =
            "The greeting and clock are still up to date.";
    }
}

function updateLiveHeader() {
    const now = new Date();

    updateGreeting(now);
    updateDateAndTime(now);
}

function initializeHeaderWidget() {
    updateLiveHeader();
    loadWeather();

    window.setInterval(updateLiveHeader, 1000);

    /*
        Refresh the weather every 15 minutes without
        requiring the page to be reloaded.
    */
    window.setInterval(loadWeather, 15 * 60 * 1000);
}

initializeHeaderWidget();
