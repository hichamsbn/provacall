/* ProvaCall · effets partagés : apparition douce au défilement. Aucun cookie, aucun stockage local, aucune requête externe. */
(function () {
  var root = document.documentElement;
  var calm = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if ("IntersectionObserver" in window && !calm) root.classList.add("js");

  /* Pages secondaires : leurs blocs apparaissent en douceur (la page d'accueil gère déjà les siens). */
  document.addEventListener("DOMContentLoaded", function () {
    if (calm || document.querySelector(".hero") || !("IntersectionObserver" in window)) return;
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
