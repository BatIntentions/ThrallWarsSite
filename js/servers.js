const DATA_DIR = "../seasons/";

fetch(DATA_DIR + "servers.json")
  .then(r => {
    if (!r.ok) throw new Error(`servers.json returned ${r.status}`);
    return r.json();
  })
  .then(data => {
    renderServers(data.servers);
    renderShared(data);
  })
  .catch(err => {
    console.error("Servers page failed:", err);
    const list = document.getElementById("server-list");
    if (list) list.innerHTML =
      `<p style="color:#c25a4a;font-family:Georgia,serif;text-align:center;">
         Could not load servers.json — ${err.message}
       </p>`;
  });

// ---------- SERVER CARDS ----------
function renderServers(servers) {
  const list = document.getElementById("server-list");

  list.innerHTML = servers.map(s => {
    const steps = (s.steps || []).map((step, i) => `
      <li class="step">
        <span class="step-no">${String(i + 1).padStart(2, "0")}</span>
        <span class="step-text">${step}</span>
      </li>`).join("");

    return `
      <article class="server-card ${s.primary ? "is-primary" : ""}">
        <div class="server-head">
          <div>
            <h2 class="server-name">${s.name}</h2>
            ${s.tagline ? `<p class="server-tagline">${s.tagline}</p>` : ""}
          </div>
          <div class="server-meta">
            ${s.map ? `<span class="tag">${s.map}</span>` : ""}
            ${s.ruleset ? `<span class="tag">${s.ruleset}</span>` : ""}
          </div>
        </div>

        <div class="ip-row">
          <span class="ip-label">Direct IP</span>
          <code class="ip" data-ip="${s.ip}">${s.ip}</code>
          <button class="copy-btn" data-ip="${s.ip}" title="Copy IP">&#10697;</button>
        </div>

        ${steps ? `<ol class="steps">${steps}</ol>` : ""}
      </article>`;
  }).join("");

  wireCopyButtons();
}

// ---------- SHARED ACTIONS ----------
// ---------- SHARED ACTIONS ----------
function renderShared(data) {
  const el = document.getElementById("shared-actions");
  if (!el || !data.discord) return;

  el.innerHTML =
    `<a class="btn btn-ghost" href="${data.discord}" target="_blank" rel="noopener">&#128172; Discord</a>`;
}

// ---------- COPY ----------
function wireCopyButtons() {
  document.querySelectorAll(".copy-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      navigator.clipboard.writeText(btn.dataset.ip)
        .then(() => flash("Server IP copied"))
        .catch(() => flash("Copy failed"));
    });
  });
}

// ---------- TOAST ----------
function flash(msg) {
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = msg;
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add("show"));
  setTimeout(() => {
    t.classList.remove("show");
    setTimeout(() => t.remove(), 300);
  }, 1600);
}