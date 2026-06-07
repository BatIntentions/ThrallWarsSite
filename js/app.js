// One link per half 
const DISCORD = {
  realm: "https://discord.gg/Qe9kX2R",
  forge: "https://discord.gg/asNNZsc"
};

document.querySelectorAll("[data-discord]").forEach(btn => {
  btn.addEventListener("click", () => {
    const target = DISCORD[btn.dataset.discord];
    if (target) window.open(target, "_blank");
  });
});

// lightweight toast instead of alert()
function flash(msg) {
  const t = document.createElement("div");
  t.textContent = msg;
  t.style.cssText = `
    position:fixed; bottom:30px; left:50%; transform:translateX(-50%);
    background:#1a1010; color:#d6c6a8; border:1px solid #c2a063;
    padding:10px 18px; border-radius:6px; letter-spacing:1px;
    font-family:Cinzel,serif; font-size:13px; z-index:99; opacity:0;
    transition:opacity .25s;
  `;
  document.body.appendChild(t);
  requestAnimationFrame(() => (t.style.opacity = 1));
  setTimeout(() => { t.style.opacity = 0; setTimeout(() => t.remove(), 300); }, 1600);
}

