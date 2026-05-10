// Flight Notifier — polls the OpenSky Network for aircraft within a radius
// of the user's geolocation and fires a desktop notification when a new
// flight enters that radius.

const OPENSKY_URL = "https://opensky-network.org/api/states/all";
const STORAGE_KEY = "flight-notifier:settings";
const SEEN_TTL_MS = 15 * 60 * 1000; // forget a flight if not seen for 15 min

const els = {
  watch: document.getElementById("watch-btn"),
  status: document.getElementById("status"),
  radius: document.getElementById("radius"),
  interval: document.getElementById("interval"),
  minAlt: document.getElementById("min-alt"),
  maxAlt: document.getElementById("max-alt"),
  loc: document.getElementById("loc"),
  lastCheck: document.getElementById("last-check"),
  flights: document.getElementById("flights"),
};

const state = {
  watching: false,
  timerId: null,
  geoWatchId: null,
  position: null, // { lat, lon }
  seen: new Map(), // icao24 -> { lastSeen: ms, notified: boolean }
};

loadSettings();
els.watch.addEventListener("click", () => (state.watching ? stop() : start()));
[els.radius, els.interval, els.minAlt, els.maxAlt].forEach((el) =>
  el.addEventListener("change", saveSettings),
);

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const s = JSON.parse(raw);
    if (s.radius) els.radius.value = s.radius;
    if (s.interval) els.interval.value = s.interval;
    if (s.minAlt != null) els.minAlt.value = s.minAlt;
    if (s.maxAlt != null) els.maxAlt.value = s.maxAlt;
  } catch {}
}

function saveSettings() {
  const s = {
    radius: Number(els.radius.value) || 15,
    interval: Number(els.interval.value) || 30,
    minAlt: els.minAlt.value === "" ? null : Number(els.minAlt.value),
    maxAlt: els.maxAlt.value === "" ? null : Number(els.maxAlt.value),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

function setStatus(text, kind = "idle") {
  els.status.textContent = text;
  els.status.className = `status ${kind}`;
}

async function start() {
  saveSettings();

  if (!("geolocation" in navigator)) {
    setStatus("Geolocation unsupported", "error");
    return;
  }
  if (!("Notification" in window)) {
    setStatus("Notifications unsupported", "error");
    return;
  }

  if (Notification.permission === "default") {
    const perm = await Notification.requestPermission();
    if (perm !== "granted") {
      setStatus("Notifications denied", "error");
      return;
    }
  } else if (Notification.permission === "denied") {
    setStatus("Notifications blocked — enable in browser settings", "error");
    return;
  }

  setStatus("Locating…", "watching");
  try {
    await acquirePosition();
  } catch (err) {
    setStatus(`Location error: ${err.message || err}`, "error");
    return;
  }

  state.watching = true;
  els.watch.textContent = "Stop watching";
  els.watch.classList.add("stop");
  setStatus("Watching", "watching");
  tick();
  scheduleNext();
}

function stop() {
  state.watching = false;
  if (state.timerId) clearTimeout(state.timerId);
  state.timerId = null;
  if (state.geoWatchId != null) navigator.geolocation.clearWatch(state.geoWatchId);
  state.geoWatchId = null;
  els.watch.textContent = "Start watching";
  els.watch.classList.remove("stop");
  setStatus("Idle", "idle");
}

function acquirePosition() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        updatePosition(pos);
        // Keep tracking so the user's location updates as they move.
        state.geoWatchId = navigator.geolocation.watchPosition(
          updatePosition,
          () => {},
          { enableHighAccuracy: false, maximumAge: 60_000 },
        );
        resolve();
      },
      (err) => reject(err),
      { enableHighAccuracy: false, timeout: 15_000, maximumAge: 60_000 },
    );
  });
}

function updatePosition(pos) {
  state.position = { lat: pos.coords.latitude, lon: pos.coords.longitude };
  els.loc.textContent = `${state.position.lat.toFixed(4)}, ${state.position.lon.toFixed(4)}`;
}

function scheduleNext() {
  if (!state.watching) return;
  const seconds = Math.max(10, Number(els.interval.value) || 30);
  state.timerId = setTimeout(async () => {
    await tick();
    scheduleNext();
  }, seconds * 1000);
}

async function tick() {
  if (!state.position) return;
  const radiusKm = Math.max(1, Number(els.radius.value) || 15);
  const minAlt = els.minAlt.value === "" ? null : Number(els.minAlt.value);
  const maxAlt = els.maxAlt.value === "" ? null : Number(els.maxAlt.value);
  const bbox = boundingBox(state.position.lat, state.position.lon, radiusKm);

  let states;
  try {
    states = await fetchStates(bbox);
  } catch (err) {
    setStatus(`Fetch error: ${err.message || err}`, "error");
    return;
  }
  setStatus("Watching", "watching");
  els.lastCheck.textContent = new Date().toLocaleTimeString();

  const inRange = [];
  for (const s of states) {
    const flight = parseState(s);
    if (!flight.lat || !flight.lon) continue;
    if (flight.onGround) continue;
    if (minAlt != null && (flight.altitude ?? 0) < minAlt) continue;
    if (maxAlt != null && (flight.altitude ?? Infinity) > maxAlt) continue;

    const distance = haversineKm(
      state.position.lat,
      state.position.lon,
      flight.lat,
      flight.lon,
    );
    if (distance > radiusKm) continue;
    inRange.push({ ...flight, distance });
  }

  inRange.sort((a, b) => a.distance - b.distance);
  renderFlights(inRange);
  notifyNew(inRange);
  pruneSeen();
}

function parseState(s) {
  return {
    icao24: s[0],
    callsign: (s[1] || "").trim(),
    originCountry: s[2],
    lon: s[5],
    lat: s[6],
    baroAltitude: s[7],
    onGround: s[8],
    velocity: s[9], // m/s
    heading: s[10], // degrees
    geoAltitude: s[13],
    altitude: s[13] ?? s[7] ?? null,
  };
}

async function fetchStates(bbox) {
  const url = `${OPENSKY_URL}?lamin=${bbox.lamin}&lomin=${bbox.lomin}&lamax=${bbox.lamax}&lomax=${bbox.lomax}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`OpenSky HTTP ${res.status}`);
  const json = await res.json();
  return json.states || [];
}

function renderFlights(flights) {
  els.flights.innerHTML = "";
  if (!flights.length) {
    const li = document.createElement("li");
    li.className = "empty";
    li.textContent = "No flights detected yet.";
    els.flights.appendChild(li);
    return;
  }
  for (const f of flights) {
    const li = document.createElement("li");
    const left = document.createElement("div");
    left.innerHTML = `<span class="callsign">${escape(f.callsign || f.icao24)}</span> <span class="muted">${escape(f.originCountry || "")}</span>`;
    const right = document.createElement("div");
    right.className = "dist";
    right.textContent = `${f.distance.toFixed(1)} km`;
    const meta = document.createElement("div");
    meta.className = "meta-line";
    const alt = f.altitude != null ? `${Math.round(f.altitude)} m` : "—";
    const speed = f.velocity != null ? `${Math.round(f.velocity * 3.6)} km/h` : "—";
    const hdg = f.heading != null ? `${Math.round(f.heading)}°` : "—";
    meta.textContent = `alt ${alt} · ${speed} · heading ${hdg}`;
    li.appendChild(left);
    li.appendChild(right);
    li.appendChild(meta);
    els.flights.appendChild(li);
  }
}

function notifyNew(flights) {
  const now = Date.now();
  for (const f of flights) {
    const prev = state.seen.get(f.icao24);
    state.seen.set(f.icao24, { lastSeen: now, notified: prev?.notified || false });
    if (prev?.notified) continue;
    sendNotification(f);
    state.seen.get(f.icao24).notified = true;
  }
}

function sendNotification(f) {
  const title = `✈️ ${f.callsign || f.icao24} overhead`;
  const altPart = f.altitude != null ? ` · ${Math.round(f.altitude)} m` : "";
  const body = `${f.distance.toFixed(1)} km away${altPart} · ${f.originCountry || "unknown origin"}`;
  try {
    new Notification(title, { body, tag: f.icao24, renotify: false });
  } catch (e) {
    // Some browsers require notifications via a service worker. Best effort.
    console.warn("Notification failed:", e);
  }
}

function pruneSeen() {
  const cutoff = Date.now() - SEEN_TTL_MS;
  for (const [id, v] of state.seen) {
    if (v.lastSeen < cutoff) state.seen.delete(id);
  }
}

function boundingBox(lat, lon, radiusKm) {
  const latDelta = radiusKm / 111;
  const lonDelta = radiusKm / (111 * Math.max(Math.cos((lat * Math.PI) / 180), 0.01));
  return {
    lamin: lat - latDelta,
    lamax: lat + latDelta,
    lomin: lon - lonDelta,
    lomax: lon + lonDelta,
  };
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function escape(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[c]);
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
