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
    // If no city is entered, use geolocation
    if (navigator.geolocation) {
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

async function fetchWeatherFromOWM(city) {
  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(
        city
      )}&appid=${API_KEY}&units=metric`
    );
    if (!res.ok) throw new Error("City not found");
    const data = await res.json();
    const current = data.list[0];
    const feelsLike = Math.round(current.main.feels_like);
    const temp = Math.round(current.main.temp);
    const desc = current.weather[0].description;
    const humidity = current.main.humidity;
    const windSpeed = current.wind.speed;
    const chanceOfRain = current.pop ? Math.round(current.pop * 100) : 0;
    const icon = current.weather[0].icon;
    const iconUrl = `https://openweathermap.org/img/wn/${icon}@2x.png`;

    setTimeout(() => {
      loadingEl.style.display = "none";
      outputEl.innerHTML = `
        <div class="weather-info">
          <img src="${iconUrl}" alt="${desc}" class="weather-icon" />
          <h2 class="city-name">${data.city.name}</h2>
          <p class="weather-desc">${desc.charAt(0).toUpperCase() + desc.slice(1)}</p>
          <div class="info-grid">
            <div class="info wide">Feels like<br><strong>${feelsLike}°C</strong></div>
            <div class="info">Rain chance<br><strong>${chanceOfRain}%</strong></div>
            <div class="info">Humidity<br><strong>${humidity}%</strong></div>
            <div class="info">Wind<br><strong>${windSpeed} m/s</strong></div>
            <div class="info">Temp<br><strong>${temp}°C</strong></div>
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
    const windSpeed = current.wind.speed;
    const chanceOfRain = current.pop ? Math.round(current.pop * 100) : 0;
    const icon = current.weather[0].icon;
    const iconUrl = `https://openweathermap.org/img/wn/${icon}@2x.png`;
    
    // Use the location name provided by the API
    const locationName = data.city.name;
    // Save the location name to localStorage and update the input.
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
            <div class="info">Rain chance<br><strong>${chanceOfRain}%</strong></div>
            <div class="info">Humidity<br><strong>${humidity}%</strong></div>
            <div class="info">Wind<br><strong>${windSpeed} m/s</strong></div>
            <div class="info">Temp<br><strong>${temp}°C</strong></div>
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