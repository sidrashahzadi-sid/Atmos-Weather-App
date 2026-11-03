const searchForm = document.getElementById("search-form");
const cityInput = document.getElementById("city-input");
const searchButton = document.getElementById("search-btn");
const statusMessage = document.getElementById("status-message");

const currentWeather = document.getElementById("current-weather");
const forecastList = document.getElementById("forecast-list");

searchForm.addEventListener("submit", function (event){
    event.preventDefault();
    const city = cityInput.value.trim();

    if (city === ""){
        statusMessage.textContent = "Please enter a city name.";
        return;
    }
    getWeather(city);
});

// 3. Find a city's geographical coordinates
async function getWeather(city) {
    try {
        statusMessage.textContent = "Finding your city...";
        searchButton.disabled = true;

        const geoURL =
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;

        const geoResponse = await fetch(geoURL);

        if (!geoResponse.ok) {
            throw new Error("Unable to find the city.");
        }

        const geoData = await geoResponse.json();

        // Check whether the city exists
        if (!geoData.results || geoData.results.length === 0) {
            throw new Error("City not found. Please try another name.");
        }

        // Get the first matching city
        const location = geoData.results[0];

        // Now get its weather
        await getWeatherData(location);

    } catch (error) {
        statusMessage.textContent = error.message;
        currentWeather.innerHTML =
            '<p class="welcome-message">We could not load the weather. Try another city.</p>';
        forecastList.innerHTML = "";

    } finally {
        searchButton.disabled = false;
    }
}

// 4. Fetch current weather and the 7-day forecast
async function getWeatherData(location) {
    const weatherURL =
        `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&forecast_days=7&timezone=auto`;

    const weatherResponse = await fetch(weatherURL);

    if (!weatherResponse.ok) {
        throw new Error("Unable to load weather data.");
    }

    const weatherData = await weatherResponse.json();

    displayWeather(location, weatherData);
    displayForecast(weatherData);

    statusMessage.textContent =
        `Showing weather for ${location.name}, ${location.country}.`;
}

// 5. Translate weather codes into readable descriptions
function getWeatherDescription(code) {
    const weatherTypes = {
        0: ["Clear sky", "☀️"],
        1: ["Mainly clear", "🌤️"],
        2: ["Partly cloudy", "⛅"],
        3: ["Overcast", "☁️"],
        45: ["Foggy", "🌫️"],
        48: ["Depositing rime fog", "🌫️"],
        51: ["Light drizzle", "🌦️"],
        53: ["Moderate drizzle", "🌦️"],
        55: ["Dense drizzle", "🌧️"],
        61: ["Slight rain", "🌧️"],
        63: ["Moderate rain", "🌧️"],
        65: ["Heavy rain", "🌧️"],
        71: ["Slight snowfall", "🌨️"],
        73: ["Moderate snowfall", "🌨️"],
        75: ["Heavy snowfall", "❄️"],
        80: ["Rain showers", "🌦️"],
        81: ["Moderate showers", "🌧️"],
        82: ["Heavy showers", "⛈️"],
        95: ["Thunderstorm", "⛈️"],
        96: ["Thunderstorm with hail", "⛈️"],
        99: ["Heavy thunderstorm with hail", "⛈️"]
    };

    return weatherTypes[code] || ["Unknown conditions", "🌡️"];
}

// 6. Display the current weather on the page
function displayWeather(location, data) {
    const current = data.current;

    const [description, icon] =
        getWeatherDescription(current.weather_code);

    // Update the current weather card
    currentWeather.innerHTML = `
        <p class="weather-location">
            ${location.name}, ${location.country}
        </p>

        <div class="weather-main">
            <div>
                <h1 class="weather-temperature">
                    ${Math.round(current.temperature_2m)}°C
                </h1>
                <p class="weather-description">${description}</p>
            </div>

            <span class="weather-icon">${icon}</span>
        </div>

        <div class="weather-details">
            <div class="detail-card">
                <p class="detail-label">Feels Like</p>
                <p class="detail-value">
                    ${Math.round(current.apparent_temperature)}°C
                </p>
            </div>

            <div class="detail-card">
                <p class="detail-label">Humidity</p>
                <p class="detail-value">
                    ${current.relative_humidity_2m}%
                </p>
            </div>

            <div class="detail-card">
                <p class="detail-label">Wind Speed</p>
                <p class="detail-value">
                    ${current.wind_speed_10m} km/h
                </p>
            </div>
        </div>
    `;
}

// 7. Display the 7-day forecast
function displayForecast(data) {
    const daily = data.daily;

    // Clear the previous forecast
    forecastList.innerHTML = "";

    // Loop through all seven forecast days
    daily.time.forEach((date, index) => {
        const [description, icon] =
            getWeatherDescription(daily.weather_code[index]);

        // Convert the date into a readable day name
        const dayName = new Date(date + "T12:00:00")
            .toLocaleDateString("en-US", {
                weekday: "long"
            });

        // Create one forecast row
        const forecastDay = document.createElement("div");

        forecastDay.classList.add("forecast-day");

        forecastDay.innerHTML = `
            <strong>${dayName}</strong>

            <span class="forecast-condition">
                ${icon} ${description}
            </span>

            <span class="forecast-temperatures">
                ${Math.round(daily.temperature_2m_max[index])}°
                /
                ${Math.round(daily.temperature_2m_min[index])}°
            </span>
        `;

        // Add the row to the forecast section
        forecastList.appendChild(forecastDay);
    });
}