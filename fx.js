/* ProvaCall · effets partagés : couleur d'accent (aperçu), apparition au défilement sur toutes les pages. */
(function () {
  var root = document.documentElement;
  if ("IntersectionObserver" in window) root.classList.add("js");

  /* Aperçu de couleur : ajoute ?accent=2f54ff à n'importe quelle page. ?accent=reset pour revenir à la couleur par défaut. */
  try {
    var key = "pc-accent", q = new URLSearchParams(location.search).get("accent");
    if (q) { if (q === "reset") localStorage.removeItem(key); else localStorage.setItem(key, q.replace("#", "")); }
    var hex = (localStorage.getItem(key) || "").replace("#", "");
    if (/^[0-9a-f]{6}$/i.test(hex)) {
      var r = parseInt(hex.slice(0, 2), 16), g = parseInt(hex.slice(2, 4), 16), b = parseInt(hex.slice(4, 6), 16);
      var lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
      var dark = function (c) { return Math.round(c * 0.62); };
      root.style.setProperty("--accent", "#" + hex);
      root.style.setProperty("--on-accent", lum > 0.6 ? "#0b0b0c" : "#fff");
      root.style.setProperty("--accent-text", lum > 0.55 ? "rgb(" + dark(r) + "," + dark(g) + "," + dark(b) + ")" : "#" + hex);
    }
  } catch (e) {}

  /* Design system : thème actif (voir system.css). ?theme=3 pour en essayer un ; un sélecteur s'affiche en local. */
  var THEMES = [["1", "Ivory", "#faf8f3"], ["2", "Cobalt", "#2447f9"], ["3", "Oxblood", "#7a1f2b"], ["4", "Night", "#c9f24d"], ["5", "Sage", "#0e7a53"], ["6", "Mono", "#161512"]];
  var theme = "6";
  try {
    var tq = new URLSearchParams(location.search).get("theme");
    if (tq) localStorage.setItem("pc-theme2", tq);
    theme = localStorage.getItem("pc-theme2") || theme;
  } catch (e) {}
  root.setAttribute("data-theme", theme);
  var local = /^(localhost|127\.0\.0\.1|)$/.test(location.hostname) || /[?&]theme=/.test(location.search);
  if (local) document.addEventListener("DOMContentLoaded", function () {
    if (!document.querySelector('link[href$="system.css"]')) return;
    var bar = document.createElement("div");
    bar.className = "pc-themes";
    THEMES.forEach(function (t) {
      var b = document.createElement("button");
      b.innerHTML = '<i style="background:' + t[2] + '"></i><span>' + t[0] + " · " + t[1] + "</span>";
      if (t[0] === theme) b.className = "on";
      b.onclick = function () {
        root.setAttribute("data-theme", t[0]);
        ["--accent", "--on-accent", "--accent-text"].forEach(function (k) { root.style.removeProperty(k); });
        try { localStorage.setItem("pc-theme2", t[0]); localStorage.removeItem("pc-accent"); } catch (e) {}
        bar.querySelectorAll("button").forEach(function (x) { x.className = x === b ? "on" : ""; });
      };
      bar.appendChild(b);
    });
    document.body.appendChild(bar);
  });

  /* Pages secondaires : leurs blocs apparaissent en douceur (la page d'accueil gère déjà les siens). */
  document.addEventListener("DOMContentLoaded", function () {
    if (document.querySelector(".hero") || !("IntersectionObserver" in window)) return;
    var els = document.querySelectorAll("main > *, main > .wrap > *, main section.card");
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -5% 0px" });
    els.forEach(function (el, i) {
      el.classList.add("reveal");
      el.style.transitionDelay = (i % 4) * 60 + "ms";
      io.observe(el);
    });
  });
})();
