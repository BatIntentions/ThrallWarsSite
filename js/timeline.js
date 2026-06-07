const DATA_DIR = "../seasons/";

Promise.all([
  fetch(DATA_DIR + "factions.json").then(r => r.json()),
  fetch(DATA_DIR + "index.json").then(r => r.json())
]).then(([factionData, index]) => {
  const factions = {};
  factionData.factions.forEach(f => { factions[f.id] = { ...f, seasons: [] }; });

  // oldest -> newest for the timeline
  const ordered = [...index.seasons].reverse();

  // tally rulerships (single source of truth: index.json rulers)
  ordered.forEach(s => {
    toArray(s.ruler).forEach(id => {
      if (factions[id]) factions[id].seasons.push(s.number);
    });
  });

  renderFactions(Object.values(factions));
  renderTimeline(ordered, factions);
});

function toArray(x) { return Array.isArray(x) ? x : [x]; }

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

// ---------- FACTION CARDS ----------
function renderFactions(list) {
  const grid = document.getElementById("faction-grid");
  list.sort((a, b) => b.seasons.length - a.seasons.length);

  grid.innerHTML = list.map(f => {
    const count = f.seasons.length;
    const chips = f.seasons
      .sort((a, b) => a - b)
      .map(n => `<span class="chip">S${n}</span>`).join("");
    return `
      <article class="faction-card" style="border-top-color:${f.color}">
        <div class="faction-head">
          <span class="faction-dot" style="background:${f.color}"></span>
          <div>
            <h3>${f.name}</h3>
            <p class="epithet">${f.epithet}</p>
          </div>
          <span class="rule-count" style="color:${f.color}">${count}&times;</span>
        </div>
        <p class="faction-desc">${f.description}</p>
        <div class="chips">Ruled: ${chips}</div>
      </article>`;
  }).join("");
}

// ---------- TIMELINE ----------
function renderTimeline(ordered, factions) {
  const track = document.getElementById("timeline-track");

  track.innerHTML = ordered.map(s => {
    const rulers = toArray(s.ruler).map(id => factions[id]).filter(Boolean);
    const primary = rulers[0] ? rulers[0].color : "#c2a063";
    const rulerLabel = rulers.map(r =>
      `<span class="ruler-tag" style="color:${r.color};border-color:${r.color}">${r.name}</span>`
    ).join("");

    const events = (s.events || []).map(e => `
      <li class="event">
        <span class="event-title">${e.title}</span>
        <span class="event-text">${e.text}</span>
      </li>`).join("");

    return `
      <div class="node" style="--ruler:${primary}">
        <span class="node-dot"></span>
        <div class="node-body">
          <div class="node-head">
            <span class="season-no">Season ${s.number}</span>
            <span class="season-date">${formatDate(s.date)}</span>
          </div>
          <h3 class="node-name">${s.name}</h3>
          <p class="node-tagline">${s.tagline || ""}</p>
          <div class="rulers">${rulerLabel}</div>
          ${events ? `<ul class="events">${events}</ul>` : ""}
        </div>
      </div>`;
  }).join("");
}