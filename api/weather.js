
const LOCATION = {
    name: "Concord, NC",
    latitude: 35.4088,
    longitude: -80.5795
};

export default async function handler(request, response) {
    if (request.method !== "GET") {
        return response.status(405).json({
            success: false,
            error: "Method not allowed"
        });
    }

    try {
        const params = new URLSearchParams({
            latitude: String(LOCATION.latitude),
            longitude: String(LOCATION.longitude),

            current: [
                "temperature_2m",
                "apparent_temperature",
                "weather_code",
                "is_day"
            ].join(","),

            temperature_unit: "fahrenheit",
            timezone: "America/New_York"
        });

        const weatherResponse = await fetch(
            `https://api.open-meteo.com/v1/forecast?${params.toString()}`
        );

        if (!weatherResponse.ok) {
            throw new Error(
                `Weather provider returned ${weatherResponse.status}`
            );
        }

        const weatherData = await weatherResponse.json();

        if (!weatherData.current) {
            throw new Error("Current weather data was unavailable");
        }

        return response.status(200).json({
            success: true,

            location: LOCATION.name,

            weather: {
                temperature: Math.round(
                    weatherData.current.temperature_2m
                ),

                feelsLike: Math.round(
                    weatherData.current.apparent_temperature
                ),

                weatherCode:
                    weatherData.current.weather_code,

                isDay:
                    weatherData.current.is_day === 1,

                observedAt:
                    weatherData.current.time
            }
        });
    }
    catch (error) {
        console.error("Weather API error:", error);

        return response.status(500).json({
            success: false,
            error: "Unable to load the current weather"
        });
    }
}
