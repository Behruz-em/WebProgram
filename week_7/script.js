/* ==========================================================
   Web Hub - shared JavaScript for index.html and ex1-ex6
   Each page's <body id="..."> decides which part runs.
   ========================================================== */

// ---------- Shared helpers ----------

const $ = (selector) => document.querySelector(selector);

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[ch]));
}

function showStatus(type, message) {
  const box = $("#status");
  box.className = "status " + type;
  box.textContent = message;
  box.hidden = false;
}

function hideStatus() {
  $("#status").hidden = true;
}

async function fetchJSON(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Server answered ${response.status} ${response.statusText}`.trim());
  }
  return response.json();
}

// ---------- Page 1: Country Finder ----------

function initCountries() {
  const form = $("#search-form");
  const input = $("#country-input");
  const results = $("#country-list");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const name = input.value.trim();
    if (!name) {
      showStatus("error", "Type a country name first.");
      return;
    }

    results.innerHTML = "";
    showStatus("loading", `Searching for "${name}"...`);

    try {
      const fields = "name,capital,region,population,flags,languages,currencies";
      const url = `https://restcountries.com/v3.1/name/${encodeURIComponent(name)}?fields=${fields}`;
      const response = await fetch(url);

      if (response.status === 404) {
        showStatus("error", `No country found for "${name}". Try another spelling.`);
        return;
      }
      if (!response.ok) {
        throw new Error(`Server answered ${response.status}`);
      }

      const countries = await response.json();
      hideStatus();
      results.innerHTML = countries.slice(0, 6).map((country) => {
        const currencies = Object.values(country.currencies || {}).map((c) => c.name).join(", ");
        const languages = Object.values(country.languages || {}).join(", ");
        return `
          <article class="card">
            <img class="country-flag" src="${escapeHTML(country.flags.png)}"
                 alt="${escapeHTML(country.flags.alt || "Flag of " + country.name.common)}">
            <h3>${escapeHTML(country.name.common)}</h3>
            <p class="meta">Capital: ${escapeHTML((country.capital || ["none"])[0])}</p>
            <p class="meta">Region: ${escapeHTML(country.region)}</p>
            <p class="meta">Population: ${country.population.toLocaleString()}</p>
            <p class="meta">Languages: ${escapeHTML(languages || "n/a")}</p>
            <p class="meta">Currency: ${escapeHTML(currencies || "n/a")}</p>
          </article>
        `;
      }).join("");
    } catch (error) {
      showStatus("error", "Search failed. " + error.message);
    }
  });
}

// ---------- Page 2: Joke Generator ----------

function initJokes() {
  const typeSelect = $("#joke-type");
  const jokeButton = $("#joke-btn");
  const revealButton = $("#reveal-btn");
  const card = $("#joke-card");
  const setup = $("#joke-setup");
  const punchline = $("#joke-punchline");
  const historyTitle = $("#history-title");
  const history = $("#joke-history");

  let current = null;

  function pushToHistory(joke) {
    historyTitle.hidden = false;
    const item = document.createElement("li");
    item.className = "card";
    item.innerHTML = `<strong>${escapeHTML(joke.setup)}</strong><p>${escapeHTML(joke.punchline)}</p>`;
    history.prepend(item);
    while (history.children.length > 5) {
      history.lastElementChild.remove();
    }
  }

  async function loadJoke() {
    jokeButton.disabled = true;
    showStatus("loading", "Looking for a joke...");

    try {
      const type = typeSelect.value;
      const url = type === "any"
        ? "https://official-joke-api.appspot.com/random_joke"
        : `https://official-joke-api.appspot.com/jokes/${type}/random`;
      const data = await fetchJSON(url);
      const joke = Array.isArray(data) ? data[0] : data;

      if (current) pushToHistory(current);
      current = joke;

      setup.textContent = joke.setup;
      punchline.textContent = joke.punchline;
      punchline.hidden = true;
      revealButton.hidden = false;
      card.hidden = false;
      hideStatus();
    } catch (error) {
      showStatus("error", "Could not load a joke. " + error.message);
    } finally {
      jokeButton.disabled = false;
    }
  }

  revealButton.addEventListener("click", () => {
    punchline.hidden = false;
    revealButton.hidden = true;
  });
  jokeButton.addEventListener("click", loadJoke);
  loadJoke();
}

// ---------- Page 3: Photo Gallery ----------

function initPhotos() {
  const grid = $("#photo-grid");
  const moreButton = $("#more-btn");
  let page = 1;

  async function loadPhotos() {
    moreButton.disabled = true;
    showStatus("loading", "Loading photos...");

    try {
      const photos = await fetchJSON(`https://picsum.photos/v2/list?page=${page}&limit=9`);
      hideStatus();
      grid.insertAdjacentHTML("beforeend", photos.map((photo) => `
        <figure class="photo">
          <img src="https://picsum.photos/id/${photo.id}/480/320" loading="lazy"
               alt="Photo by ${escapeHTML(photo.author)}">
          <figcaption>
            <span>${escapeHTML(photo.author)}</span>
            <a href="${escapeHTML(photo.url)}" target="_blank" rel="noopener">View original</a>
          </figcaption>
        </figure>
      `).join(""));
      page++;
    } catch (error) {
      showStatus("error", "Could not load photos. " + error.message);
    } finally {
      moreButton.disabled = false;
    }
  }

  moreButton.addEventListener("click", loadPhotos);
  loadPhotos();
}

// ---------- Page 4: Weather ----------

function describeWeather(code) {
  if (code === 0) return { text: "Clear sky", icon: "☀️" };
  if (code <= 2) return { text: "Partly cloudy", icon: "⛅" };
  if (code === 3) return { text: "Overcast", icon: "☁️" };
  if (code === 45 || code === 48) return { text: "Fog", icon: "🌫️" };
  if (code >= 51 && code <= 57) return { text: "Drizzle", icon: "🌦️" };
  if (code >= 61 && code <= 67) return { text: "Rain", icon: "🌧️" };
  if (code >= 71 && code <= 77) return { text: "Snow", icon: "❄️" };
  if (code >= 80 && code <= 82) return { text: "Rain showers", icon: "🌧️" };
  if (code === 85 || code === 86) return { text: "Snow showers", icon: "🌨️" };
  if (code >= 95) return { text: "Thunderstorm", icon: "⛈️" };
  return { text: "Unknown", icon: "🌡️" };
}

function initWeather() {
  const form = $("#weather-form");
  const input = $("#city-input");
  const output = $("#weather-output");

  async function loadWeather(city) {
    output.innerHTML = "";
    showStatus("loading", `Checking the weather in ${city}...`);

    try {
      const geo = await fetchJSON(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`
      );
      if (!geo.results) {
        showStatus("error", `Could not find a city called "${city}".`);
        return;
      }

      const place = geo.results[0];
      const forecast = await fetchJSON(
        "https://api.open-meteo.com/v1/forecast" +
        `?latitude=${place.latitude}&longitude=${place.longitude}` +
        "&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code" +
        "&daily=weather_code,temperature_2m_max,temperature_2m_min" +
        "&timezone=auto&forecast_days=5"
      );

      const now = forecast.current;
      const condition = describeWeather(now.weather_code);
      const placeName = [place.name, place.admin1, place.country].filter(Boolean).join(", ");

      const days = forecast.daily.time.map((date, i) => {
        const day = describeWeather(forecast.daily.weather_code[i]);
        const label = new Date(date).toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
        return `
          <article class="card forecast-day">
            <h3>${label}</h3>
            <p class="forecast-icon">${day.icon}</p>
            <p class="meta">${Math.round(forecast.daily.temperature_2m_max[i])}° / ${Math.round(forecast.daily.temperature_2m_min[i])}°</p>
          </article>
        `;
      }).join("");

      hideStatus();
      output.innerHTML = `
        <section class="weather-now">
          <div class="weather-icon">${condition.icon}</div>
          <div class="weather-main">
            <h2>${escapeHTML(placeName)}</h2>
            <p class="temp">${Math.round(now.temperature_2m)}°C</p>
            <p>${condition.text}</p>
          </div>
          <dl class="weather-details">
            <div><dt>Feels like</dt><dd>${Math.round(now.apparent_temperature)}°C</dd></div>
            <div><dt>Humidity</dt><dd>${now.relative_humidity_2m}%</dd></div>
            <div><dt>Wind</dt><dd>${now.wind_speed_10m} km/h</dd></div>
          </dl>
        </section>
        <div class="forecast">${days}</div>
      `;
    } catch (error) {
      showStatus("error", "Could not load the weather. " + error.message);
    }
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const city = input.value.trim();
    if (city) loadWeather(city);
  });

  loadWeather(input.value.trim());
}

// ---------- Page 5: Anime Characters ----------

function initAnime() {
  const form = $("#anime-form");
  const input = $("#anime-input");
  const randomButton = $("#random-btn");
  const output = $("#anime-output");

  const API = "https://dragonball-api.com/api/characters";

  function renderCharacter(character) {
    const planet = character.originPlanet ? character.originPlanet.name : "Unknown";
    const badges = [character.race, character.gender, character.affiliation]
      .filter(Boolean)
      .map((text) => `<span class="badge">${escapeHTML(text)}</span>`)
      .join("");

    const forms = (character.transformations || []).map((form) => `
      <article class="ability">
        <img src="${escapeHTML(form.image)}" alt="${escapeHTML(form.name)}" loading="lazy">
        <h4>${escapeHTML(form.name)}</h4>
        <p class="meta">Ki: ${escapeHTML(form.ki)}</p>
      </article>
    `).join("");

    output.innerHTML = `
      <article class="card character">
        <img src="${escapeHTML(character.image)}" alt="${escapeHTML(character.name)}">
        <div>
          <h2>${escapeHTML(character.name)} <span class="muted">#${character.id}</span></h2>
          <div class="badges">${badges}</div>
          <p class="meta">Origin: ${escapeHTML(planet)}</p>
          <p class="meta">Base Ki: ${escapeHTML(character.ki)}</p>
          <p class="meta">Max Ki: ${escapeHTML(character.maxKi)}</p>
          <p class="about">${escapeHTML(character.description || "")}</p>
        </div>
      </article>
      ${forms ? `<h2 class="section-title">Transformations and abilities</h2>
      <div class="ability-grid">${forms}</div>` : ""}
    `;
    input.value = character.name;
  }

  async function loadById(id) {
    const character = await fetchJSON(`${API}/${id}`);
    hideStatus();
    renderCharacter(character);
  }

  async function searchCharacter(query) {
    output.innerHTML = "";
    showStatus("loading", `Searching for "${query}"...`);

    try {
      const response = await fetch(`${API}?name=${encodeURIComponent(query)}`);
      if (!response.ok && response.status !== 404) {
        throw new Error(`Server answered ${response.status}`);
      }

      const data = response.ok ? await response.json() : [];
      const matches = Array.isArray(data) ? data : (data.items || []);
      if (matches.length === 0) {
        showStatus("error", `No character found for "${query}".`);
        return;
      }

      await loadById(matches[0].id);
    } catch (error) {
      showStatus("error", "Could not load the character. " + error.message);
    }
  }

  async function randomCharacter() {
    output.innerHTML = "";
    randomButton.disabled = true;
    showStatus("loading", "Picking a character...");

    try {
      const data = await fetchJSON(`${API}?limit=100`);
      const pick = data.items[Math.floor(Math.random() * data.items.length)];
      await loadById(pick.id);
    } catch (error) {
      showStatus("error", "Could not load the character. " + error.message);
    } finally {
      randomButton.disabled = false;
    }
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const query = input.value.trim();
    if (query) searchCharacter(query);
  });
  randomButton.addEventListener("click", randomCharacter);

  searchCharacter(input.value.trim());
}

// ---------- Page 6: Currency Converter ----------

function initCurrency() {
  const form = $("#currency-form");
  const amountInput = $("#amount");
  const fromSelect = $("#from-currency");
  const toSelect = $("#to-currency");
  const swapButton = $("#swap-btn");
  const output = $("#currency-output");

  const money = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
  let names = null;
  try {
    names = new Intl.DisplayNames(["en"], { type: "currency" });
  } catch (error) {
    names = null;
  }

  function optionLabel(code) {
    const name = names ? names.of(code) : "";
    return name && name !== code ? `${code} - ${name}` : code;
  }

  async function loadCurrencies() {
    showStatus("loading", "Loading currencies...");
    try {
      const data = await fetchJSON("https://open.er-api.com/v6/latest/USD");
      const codes = Object.keys(data.rates).sort();
      const options = codes.map((code) => `<option value="${code}">${escapeHTML(optionLabel(code))}</option>`).join("");
      fromSelect.innerHTML = options;
      toSelect.innerHTML = options;
      fromSelect.value = "USD";
      toSelect.value = codes.includes("KRW") ? "KRW" : codes[0];
      await convert();
    } catch (error) {
      showStatus("error", "Could not load currencies. " + error.message);
    }
  }

  async function convert() {
    const amount = parseFloat(amountInput.value);
    if (!(amount >= 0)) {
      showStatus("error", "Enter a valid amount.");
      return;
    }

    const from = fromSelect.value;
    const to = toSelect.value;
    showStatus("loading", "Getting the latest rate...");

    try {
      const data = await fetchJSON(`https://open.er-api.com/v6/latest/${from}`);
      if (data.result !== "success") {
        throw new Error("Rates are not available right now.");
      }

      const rate = data.rates[to];
      hideStatus();
      output.innerHTML = `
        <article class="card converter-result">
          <p class="meta">${money.format(amount)} ${from} equals</p>
          <p class="converted">${money.format(amount * rate)} ${to}</p>
          <p class="meta">1 ${from} = ${rate.toFixed(4)} ${to}</p>
          <p class="meta">Updated: ${escapeHTML(data.time_last_update_utc)}</p>
        </article>
      `;
    } catch (error) {
      showStatus("error", "Could not convert. " + error.message);
    }
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    convert();
  });
  fromSelect.addEventListener("change", convert);
  toSelect.addEventListener("change", convert);
  swapButton.addEventListener("click", () => {
    const temp = fromSelect.value;
    fromSelect.value = toSelect.value;
    toSelect.value = temp;
    convert();
  });

  loadCurrencies();
}

// ---------- Start the right page ----------

const pageStarters = {
  ex1: initCountries,
  ex2: initJokes,
  ex3: initPhotos,
  ex4: initWeather,
  ex5: initAnime,
  ex6: initCurrency
};

const startPage = pageStarters[document.body.id];
if (startPage) {
  startPage();
}
