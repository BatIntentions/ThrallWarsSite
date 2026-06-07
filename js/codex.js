const DATA_DIR = "../seasons/codex/";

let ENTRIES = [];
const CHAPTER_CACHE = {};

fetch(DATA_DIR + "index.json")
  .then(function (r) {
    if (!r.ok) throw new Error("codex/index.json returned " + r.status);
    return r.json();
  })
  .then(function (manifest) {
    var catFetches = (manifest.categories || []).map(function (cat) {
      return fetch(DATA_DIR + cat.file)
        .then(function (r) {
          if (!r.ok) {
            console.warn(cat.file + " not found (" + r.status + ") — skipping");
            return { entries: [] };          // skip missing file instead of failing
          }
          return r.json();
        })
        .then(function (data) {
          return {
            name: cat.name,
            entries: (data.entries || []).map(function (e) {
              e.category = cat.name;
              return e;
            })
          };
        })
        .catch(function () {
          return { name: cat.name, entries: [] };   // network error? still skip
        });
    });

    return Promise.all(catFetches).then(function (cats) {
      return { cats: cats, chapters: manifest.chapters || [] };
    });
  })
  .then(function (res) {
    render(res.cats, res.chapters);
  })
  .catch(function (err) {
    console.error("Codex failed:", err);
    document.getElementById("codex-body").innerHTML =
      '<p style="color:#c25a4a;font-family:Georgia,serif;text-align:center;">Could not load codex — ' +
      err.message + "</p>";
  });

// ---------- TOP-LEVEL RENDER ----------
function render(cats, chapters) {
  var body = document.getElementById("codex-body");

  cats.forEach(function (c) {
    ENTRIES = ENTRIES.concat(c.entries);
  });

  var catHtml = cats
    .map(function (cat) {
      if (!cat.entries.length) return "";
      return (
        '<section class="cx-cat">' +
        '<h2 class="cx-cat-head">' + cat.name + "</h2>" +
        '<div class="cx-grid">' + cardGrid(cat.entries) + "</div>" +
        "</section>"
      );
    })
    .join("");

  var chapterHtml = "";
  if (chapters.length) {
    var chapterCards = chapters
      .map(function (ch) {
        return (
          '<button class="cx-chapter" data-file="' + ch.file + '" data-id="' + ch.id + '">' +
          '<span class="cx-chapter-title">' + ch.title + "</span>" +
          (ch.range ? '<span class="cx-chapter-range">' + ch.range + "</span>" : "") +
          "</button>" +
          '<div class="cx-chapter-body" id="body-' + ch.id + '"></div>'
        );
      })
      .join("");

    chapterHtml =
      '<section class="cx-cat">' +
      '<h2 class="cx-cat-head">Sagas</h2>' +
      '<div class="cx-chapters">' + chapterCards + "</div>" +
      "</section>";
  }

  body.innerHTML = catHtml + chapterHtml;

  wireCards();
  wireChapters();
}

// ---------- CARD GRID HELPER ----------
function cardGrid(entries) {
  return entries
    .map(function (e) {
      return (
        '<button class="cx-card" data-id="' + e.id + '">' +
        '<div class="cx-card-img" style="background-image:url(\'' + (e.cover || "") + '\')"></div>' +
        '<div class="cx-card-text">' +
        "<h3>" + e.title + "</h3>" +
        (e.subtitle ? "<p>" + e.subtitle + "</p>" : "") +
        "</div></button>"
      );
    })
    .join("");
}

// ---------- CHAPTERS (lazy load on click) ----------
function wireChapters() {
  document.querySelectorAll(".cx-chapter").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var file = btn.dataset.file;
      var target = document.getElementById("body-" + btn.dataset.id);

      if (btn.classList.contains("open")) {
        btn.classList.remove("open");
        target.innerHTML = "";
        return;
      }
      btn.classList.add("open");

      
      function renderInto(entries) {
        if (!entries.length) {
           target.innerHTML = '<p class="cx-loading">No sagas recorded for this era yet.</p>';
           return;
        }
        ENTRIES = mergeEntries(ENTRIES, entries);
        target.innerHTML = '<div class="cx-grid">' + cardGrid(entries) + "</div>";
        wireCards();
      }


      if (CHAPTER_CACHE[file]) {
        renderInto(CHAPTER_CACHE[file]);
        return;
      }

      target.innerHTML = '<p class="cx-loading">Loading…</p>';
      fetch(DATA_DIR + file)
        .then(function (r) {
          if (!r.ok) throw new Error(file + " returned " + r.status);
          return r.json();
        })
        .then(function (data) {
          var entries = (data.entries || []).map(function (e) {
            e.category = "Sagas";
            return e;
          });
          CHAPTER_CACHE[file] = entries;
          renderInto(entries);
        })
        .catch(function (err) {
          target.innerHTML =
            '<p class="cx-loading" style="color:#c25a4a;">Could not load — ' + err.message + "</p>";
        });
    });
  });
}

function mergeEntries(base, extra) {
  var ids = {};
  base.forEach(function (e) { ids[e.id] = true; });
  return base.concat(
    extra.filter(function (e) { return !ids[e.id]; })
  );
}

// ---------- OPEN ARTICLE ----------
function wireCards() {
  document.querySelectorAll(".cx-card").forEach(function (card) {
    if (card.dataset.wired) return;
    card.dataset.wired = "1";
    card.addEventListener("click", function () {
      openEntry(card.dataset.id);
    });
  });
}

function openEntry(id) {
  var e = ENTRIES.find(function (x) { return x.id === id; });
  if (!e) return;

  var paras = (e.body || [])
    .map(function (p) { return "<p>" + p + "</p>"; })
    .join("");

  var gallery = (e.gallery || [])
    .map(function (g) {
      return (
        '<figure class="cx-figure">' +
        '<img src="' + g.src + '" alt="' + (g.caption || "") + '" loading="lazy">' +
        (g.caption ? "<figcaption>" + g.caption + "</figcaption>" : "") +
        "</figure>"
      );
    })
    .join("");

  document.getElementById("overlay-content").innerHTML =
    (e.cover ? '<div class="cx-article-cover" style="background-image:url(\'' + e.cover + '\')"></div>' : "") +
    '<span class="cx-article-cat">' + e.category + (e.season ? " · " + e.season : "") + "</span>" +
    '<h2 class="cx-article-title">' + e.title + "</h2>" +
    (e.subtitle ? '<p class="cx-article-sub">' + e.subtitle + "</p>" : "") +
    (e.attribution ? '<p class="cx-article-attribution">' + e.attribution + "</p>" : "") +
    '<div class="cx-article-body">' + paras + "</div>" +
    (gallery ? '<div class="cx-gallery">' + gallery + "</div>" : "");

  var overlay = document.getElementById("overlay");
  overlay.classList.add("open");
  document.body.style.overflow = "hidden";
}

// ---------- CLOSE ----------
function closeOverlay() {
  document.getElementById("overlay").classList.remove("open");
  document.body.style.overflow = "";
}
document.getElementById("overlay-close").addEventListener("click", closeOverlay);
document.getElementById("overlay").addEventListener("click", function (e) {
  if (e.target.id === "overlay") closeOverlay();
});
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") closeOverlay();
});