const API_KEY = "b1a1b29facb149929e3ac05eb7da4729";

const toggleBtn = document.getElementById("toggleDark");
const modeIcon = document.getElementById("modeIcon");
const modeText = toggleBtn.querySelector("span");

toggleBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  const dark = document.body.classList.contains("dark");
  modeIcon.src = dark
    ? "https://img.icons8.com/ios-glyphs/30/ffffff/moon-symbol.png"
    : "https://img.icons8.com/ios/50/000000/sun--v1.png";
  modeText.textContent = dark ? "Dark Mode" : "Light Mode";
});

const input = document.getElementById("cityInput");
const getWeatherBtn = document.getElementById("getWeatherBtn");
const loadingEl = document.getElementById("loading");
const outputEl = document.getElementById("output");

// On page load, check if a city is stored and automatically fetch weather.
window.addEventListener("load", () => {
  const storedCity = localStorage.getItem("weatherCity");
  if (storedCity) {
    input.value = storedCity;
    handleWeatherFetch();
  }
});

getWeatherBtn.addEventListener("click", handleWeatherFetch);
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    handleWeatherFetch();
  }
});

async function handleWeatherFetch() {
  const city = input.value.trim();

  // Clear previous output and show the loading bar
  outputEl.innerHTML = "";
  outputEl.classList.remove("animate-output");
  loadingEl.style.display = "block";

  if (!city) {
    // If no city is entered, try using Android's geolocation interface if available.
    if (typeof AndroidGeo !== "undefined" && AndroidGeo.getLocation) {
      try {
        // AndroidGeo.getLocation() should return a JSON string with keys "latitude" and "longitude"
        const locationJSON = AndroidGeo.getLocation();
        const location = JSON.parse(locationJSON);
        const lat = location.latitude;
        const lon = location.longitude;
        fetchWeatherFromGeo(lat, lon);
      } catch (error) {
        loadingEl.style.display = "none";
        alert("Android location error: " + error.message);
      }
    } else if (navigator.geolocation) {
      // Fallback to browser geolocation.
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          fetchWeatherFromGeo(lat, lon);
        },
        (error) => {
          loadingEl.style.display = "none";
          alert("Geolocation error: " + error.message);
        }
      );
    } else {
      loadingEl.style.display = "none";
      alert("Geolocation is not supported by your browser.");
    }
  } else {
    // Save the entered city to localStorage and fetch weather by city name.
    localStorage.setItem("weatherCity", city);
    await fetchWeatherFromOWM(city);
  }
}

// Helper functions
function formatTime(date) {
  const hours = date.getHours();
  const minutes = ("0" + date.getMinutes()).slice(-2);
  return `${hours}:${minutes}`;
}

function degToCompass(num) {
  const val = Math.floor(num / 22.5 + 0.5);
  const arr = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"];
  return arr[val % 16];
}

// Updated helper to get arrow symbol based on wind degree, adjusted by 180°.
function getWindArrow(deg) {
  const rotated = (deg + 180) % 360;
  const sectors = ["↑", "↗", "→", "↘", "↓", "↙", "←", "↖"];
  const index = Math.floor((rotated + 22.5) / 45) % 8;
  return sectors[index];
}

async function fetchWeatherFromOWM(city) {
  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`
    );
    if (!res.ok) throw new Error("City not found");
    const data = await res.json();
    const current = data.list[0];
    const feelsLike = Math.round(current.main.feels_like);
    const temp = Math.round(current.main.temp);
    const desc = current.weather[0].description;
    const humidity = current.main.humidity;
    const windSpeed = current.wind.speed;
    // Get wind direction from degrees.
    const windArrow = getWindArrow(current.wind.deg);
    const icon = current.weather[0].icon;
    const iconUrl = `https://openweathermap.org/img/wn/${icon}@2x.png`;

    // Format sunrise and sunset from city's Unix timestamps.
    const sunrise = new Date(data.city.sunrise * 1000);
    const sunset = new Date(data.city.sunset * 1000);
    const formattedSunrise = formatTime(sunrise);
    const formattedSunset = formatTime(sunset);

    setTimeout(() => {
      loadingEl.style.display = "none";
      outputEl.innerHTML = `
        <div class="weather-info">
          <img src="${iconUrl}" alt="${desc}" class="weather-icon" />
          <h2 class="city-name">${data.city.name}</h2>
          <p class="weather-desc">${desc.charAt(0).toUpperCase() + desc.slice(1)}</p>
          <div class="info-grid">
            <div class="info wide">Feels like<br><strong>${feelsLike}°C</strong></div>
            <div class="info">Humidity<br><strong>${humidity}%</strong></div>
            <div class="info">Wind<br><strong>${windArrow} ${windSpeed} m/s</strong></div>
            <div class="info">Temp<br><strong>${temp}°C</strong></div>
            <div class="info">Sunrise/Sunset<br><strong>${formattedSunrise} / ${formattedSunset}</strong></div>
          </div>
        </div>
      `;
      outputEl.classList.add("animate-output");
    }, 500);
  } catch (e) {
    loadingEl.style.display = "none";
    outputEl.textContent = "Error: " + e.message;
    outputEl.classList.add("animate-output");
  }
}

async function fetchWeatherFromGeo(lat, lon) {
  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
    );
    if (!res.ok) throw new Error("Location not found");
    const data = await res.json();
    const current = data.list[0];
    const feelsLike = Math.round(current.main.feels_like);
    const temp = Math.round(current.main.temp);
    const desc = current.weather[0].description;
    const humidity = current.main.humidity;
    const windArrow = getWindArrow(current.wind.deg);
    const windSpeed = current.wind.speed;
    const icon = current.weather[0].icon;
    const iconUrl = `https://openweathermap.org/img/wn/${icon}@2x.png`;

    // Format sunrise and sunset times.
    const sunrise = new Date(data.city.sunrise * 1000);
    const sunset = new Date(data.city.sunset * 1000);
    const formattedSunrise = formatTime(sunrise);
    const formattedSunset = formatTime(sunset);

    // Use the location name provided by the API.
    const locationName = data.city.name;
    localStorage.setItem("weatherCity", locationName);
    input.value = locationName;

    setTimeout(() => {
      loadingEl.style.display = "none";
      outputEl.innerHTML = `
        <div class="weather-info">
          <img src="${iconUrl}" alt="${desc}" class="weather-icon" />
          <h2 class="city-name">${locationName}</h2>
          <p class="weather-desc">${desc.charAt(0).toUpperCase() + desc.slice(1)}</p>
          <div class="info-grid">
            <div class="info wide">Feels like<br><strong>${feelsLike}°C</strong></div>
            <div class="info">Humidity<br><strong>${humidity}%</strong></div>
            <div class="info">Wind<br><strong>${windArrow} ${windSpeed} m/s</strong></div>
            <div class="info">Temp<br><strong>${temp}°C</strong></div>
            <div class="info">Sunrise/Sunset<br><strong>${formattedSunrise} / ${formattedSunset}</strong></div>
          </div>
        </div>
      `;
      outputEl.classList.add("animate-output");
    }, 500);
  } catch (e) {
    loadingEl.style.display = "none";
    outputEl.textContent = "Error: " + e.message;
    outputEl.classList.add("animate-output");
  }
}