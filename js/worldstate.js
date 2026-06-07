const SEASON_DIR = "../seasons/";

// 1. Load the index, then load whichever season is current.
fetch(SEASON_DIR + "index.json")
  .then(res => res.json())
  .then(index => {
    const currentMeta = index.seasons.find(s => s.id === index.current);
    const pastMeta = index.seasons.filter(s => s.id !== index.current);

    // current season -> full render
    fetch(SEASON_DIR + currentMeta.file)
      .then(r => r.json())
      .then(season => renderCurrent(season));

    // past seasons -> collapsible blocks
    renderArchive(pastMeta);
  });

// ---------- CURRENT SEASON ----------
function renderCurrent(season) {
  const el = document.getElementById("current-season");

  const sections = season.sections.map(sec => `
    <article class="ws-section">
      ${sec.title ? `<h3>${sec.title}</h3>` : ""}
      ${sec.body ? `<p>${sec.body}</p>` : ""}
      ${sec.list ? `<ul>${sec.list.map(li => `<li>${li}</li>`).join("")}</ul>` : ""}
    </article>
  `).join("");

  el.innerHTML = `
    <span class="season-tag">Season ${season.number} &middot; Active</span>
    <h2 class="season-name">${season.name}</h2>
    ${season.tagline ? `<p class="season-tagline">${season.tagline}</p>` : ""}
    ${season.lore ? `<blockquote class="season-lore">${season.lore}</blockquote>` : ""}
    <div class="ws-sections">${sections}</div>
  `;
}

// ---------- ARCHIVE ----------
function renderArchive(pastMeta) {
  const list = document.getElementById("archive-list");

  pastMeta.forEach(meta => {
    const block = document.createElement("details");
    block.className = "archive-item";
    block.innerHTML = `
      <summary>Season ${meta.number} &mdash; ${meta.name}</summary>
      <div class="archive-body" data-file="${meta.file}">Loading…</div>
    `;

    // lazy-load the season only when expanded
    block.addEventListener("toggle", () => {
      if (block.open) {
        const body = block.querySelector(".archive-body");
        if (body.dataset.loaded) return;
        fetch(SEASON_DIR + body.dataset.file)
          .then(r => r.json())
          .then(season => {
            body.dataset.loaded = "1";
            body.innerHTML = season.sections.map(sec => `
              <article class="ws-section">
                ${sec.title ? `<h3>${sec.title}</h3>` : ""}
                ${sec.body ? `<p>${sec.body}</p>` : ""}
                ${sec.list ? `<ul>${sec.list.map(li => `<li>${li}</li>`).join("")}</ul>` : ""}
              </article>`).join("");
          });
      }
    });

    list.appendChild(block);
  });
}