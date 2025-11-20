const apiKey = "8a8d4cc6518c00e17037c027ce56c5a8";

/* ---------- DOM REFERENCES ---------- */
const cityInput = document.getElementById("city-input");
const searchBtn = document.getElementById("search-btn");
const useLocationBtn = document.getElementById("use-location-btn");
const refreshBtn = document.getElementById("refresh-btn");
const unitToggle = document.getElementById("unit-toggle");
const unitLabel = document.getElementById("unit-label");

const cityNameEl = document.getElementById("city-name");
const tempEl = document.getElementById("temperature");
const descEl = document.getElementById("weather-description");
const coordsEl = document.getElementById("coords");

const addFavBtn = document.getElementById("add-fav-btn");
const removeFavBtn = document.getElementById("remove-fav-btn");

const forecastDaysEl = document.getElementById("forecast-days");
const favoritesListEl = document.getElementById("favorites-list");

/* ---------- STATE ---------- */
let isFahrenheit = false;
let currentLocation = null;
let forecastData = [];
let favoriteCities = JSON.parse(localStorage.getItem("favoriteCities")) || [];

/* ---------- UTILITIES ---------- */
function toFahrenheit(celsius) {
    return (celsius * 9/5) + 32;
}

function getWeatherIcon(condition) {
    if (condition.includes("Cloud")) return "☁️";
    if (condition.includes("Rain")) return "🌧️";
    if (condition.includes("Snow")) return "❄️";
    if (condition.includes("Sunny")) return "☀️";
    return "❓";
}

function formatDate(date) {
    return `${date.getMonth()+1}/${date.getDate()}/${date.getFullYear()}`;
}

/* ---------- REAL CURRENT WEATHER API (FREE ENDPOINT) ---------- */
async function fetchCurrentWeather(city) {
    const url =
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;

    const res = await fetch(url);

    if (!res.ok) {
        throw new Error("City not found or API error");
    }

    const data = await res.json();

    return {
        city: data.name,
        lat: data.coord.lat,
        lon: data.coord.lon,
        temp: data.main.temp,
        condition: data.weather[0].main,
        humidity: data.main.humidity
    };
}

/* ---------- 3-DAY FORECAST (SIMULATED) ---------- */
function generateForecast(lat, lon) {
    const conditions = ["Sunny", "Cloudy", "Rainy", "Snowy"];
    const forecast = [];
    const date = new Date();

    for (let i = 0; i < 3; i++) {
        const temperature = Math.random() * 25 + 5;
        const cond = conditions[Math.floor(Math.random() * conditions.length)];

        forecast.push({
            date: formatDate(new Date(date)),
            temperature,
            condition: cond,
            humidity: Math.random() * 50 + 30,
            latitude: lat,
            longitude: lon
        });

        date.setDate(date.getDate() + 1);
    }

    return forecast;
}

/* ---------- DISPLAY ---------- */
function displayForecastUI(data, city) {
    forecastDaysEl.innerHTML = "";
    cityNameEl.textContent = city;

    // today's weather
    const today = data[0];
    const displayedTemp = isFahrenheit
        ? toFahrenheit(today.temperature).toFixed(1) + "°F"
        : today.temperature.toFixed(1) + "°C";

    tempEl.textContent = displayedTemp;
    descEl.textContent = `${today.condition} ${getWeatherIcon(today.condition)}`;
    coordsEl.textContent = `(${today.latitude.toFixed(3)}, ${today.longitude.toFixed(3)})`;

    // 3-day cards
    data.forEach(day => {
        const card = document.createElement("div");
        card.className = "day-card";
        card.innerHTML = `
            <div class="day-date">${day.date}</div>
            <div class="day-icon">${getWeatherIcon(day.condition)}</div>
            <div class="day-temp">
                ${
                    isFahrenheit
                        ? toFahrenheit(day.temperature).toFixed(1) + "°F"
                        : day.temperature.toFixed(1) + "°C"
                }
            </div>
            <div class="day-desc">${day.condition}</div>
            <div class="day-hum">Humidity: ${day.humidity.toFixed(0)}%</div>
        `;
        forecastDaysEl.appendChild(card);
    });
}

/* ---------- LOAD CITY (REAL + SIMULATED) ---------- */
async function loadCity(city) {
    try {
        const current = await fetchCurrentWeather(city);

        currentLocation = {
            city: current.city,
            lat: current.lat,
            lon: current.lon
        };

        forecastData = generateForecast(current.lat, current.lon);

        displayForecastUI(forecastData, current.city);

    } catch (err) {
        alert(err.message);
        console.error(err);
    }
}

/* ---------- FAVORITES ---------- */
function saveFavorites() {
    localStorage.setItem("favoriteCities", JSON.stringify(favoriteCities));
}

function renderFavorites() {
    favoritesListEl.innerHTML = "";

    favoriteCities.forEach(city => {
        const li = document.createElement("li");
        li.innerHTML = `
            ${city.name}
            <button class="fav-btn">Open</button>
            <button class="fav-btn remove">Remove</button>
        `;

        li.querySelector(".fav-btn").onclick = () =>
            loadCity(city.name);

        li.querySelector(".remove").onclick = () => {
            favoriteCities = favoriteCities.filter(c => c.name !== city.name);
            saveFavorites();
            renderFavorites();
        };

        favoritesListEl.appendChild(li);
    });
}

addFavBtn.onclick = () => {
    if (!currentLocation) return alert("No city loaded.");

    if (!favoriteCities.some(c => c.name === currentLocation.city)) {
        favoriteCities.push({
            name: currentLocation.city,
            lat: currentLocation.lat,
            lon: currentLocation.lon
        });
        saveFavorites();
        renderFavorites();
    }
};

removeFavBtn.onclick = () => {
    if (!currentLocation) return alert("No city loaded.");

    favoriteCities = favoriteCities.filter(c => c.name !== currentLocation.city);
    saveFavorites();
    renderFavorites();
};

/* ---------- SEARCH ---------- */
searchBtn.onclick = () => {
    const city = cityInput.value.trim();
    if (!city) return alert("Enter a city name.");
    loadCity(city);
};

/* ---------- USE SIMULATED LOCATION ---------- */
useLocationBtn.onclick = () => {
    const loc = { city: "My Location", lat: 40.7128, lon: -74.0060 }; // NYC default
    currentLocation = loc;
    forecastData = generateForecast(loc.lat, loc.lon);
    displayForecastUI(forecastData, loc.city);
};

/* ---------- REFRESH ---------- */
refreshBtn.onclick = () => {
    if (!currentLocation) return alert("Nothing to refresh.");
    loadCity(currentLocation.city);
};

/* ---------- UNIT TOGGLE ---------- */
unitToggle.onchange = () => {
    isFahrenheit = unitToggle.checked;
    unitLabel.textContent = isFahrenheit ? "°F" : "°C";

    if (forecastData.length > 0)
        displayForecastUI(forecastData, currentLocation.city);
};

/* ---------- INIT ---------- */
renderFavorites();

// Load a default city
loadCity("Guwahati");
