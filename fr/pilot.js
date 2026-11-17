/* ProvaCall · demande de pilote, une question à la fois.
 * Remplace le formulaire email pré-rempli. Tous les boutons [data-action="pilot"] l'ouvrent.
 * Envoi : POST JSON vers window.VOCALQA.leadEndpoint (ex. Formspree) puis merci.html.
 * Sans endpoint : ouvre un email déjà rempli avec les réponses (vers contactEmail).
 */
(function () {
  var C = window.VOCALQA || {};

  var STEPS = [
    { id: "who", q: "Que voulez-vous tester ?", hint: "Choisissez une réponse.", type: "choice", options: [
      { v: "Notre propre produit de voix IA", d: "Nous construisons un callbot ou un SaaS vocal", i: "M4 7h16M4 12h10M4 17h7" },
      { v: "Un agent que nous avons déployé", d: "Nous répondons à nos clients avec une voix IA", i: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" },
      { v: "Nous explorons", d: "Pas encore d'agent en service", i: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4" }
    ]},
    { id: "use", q: "Que gère l'agent ?", hint: "Choisissez tout ce qui s'applique.", type: "multi", options: [
      { v: "Assurance et banque" }, { v: "Santé" }, { v: "Réservations" }, { v: "Service client" }, { v: "Autre chose" }
    ]},
    { id: "lang", q: "Quelles langues ?", hint: "Choisissez tout ce qui s'applique.", type: "multi", options: [
      { v: "Français", e: "FR" }, { v: "Anglais", e: "EN" }, { v: "Allemand", e: "DE" }, { v: "Espagnol", e: "ES" }, { v: "Italien", e: "IT" }
    ]},
    { id: "company", q: "Dans quelle entreprise travaillez-vous ?", type: "text", ph: "Acme Voice", ac: "organization" },
    { id: "email", q: "Où envoyons-nous le rapport ?", hint: "Votre e-mail professionnel.", type: "email", ph: "prenom@exemple.com", ac: "email" }
  ];

  var answers = {}, i = 0, root, lastFocus;

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function icon(d) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="' + d + '"/></svg>'; }

  function build() {
    root = el("div", "pf");
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");
    root.setAttribute("aria-label", "Réserver un pilote gratuit");
    root.innerHTML =
      '<div class="pf-top"><button class="pf-back" type="button" aria-label="Retour">' + icon("M15 6l-6 6 6 6") + '</button>' +
      '<div class="pf-bar"><i></i></div><span class="pf-count"></span>' +
      '<button class="pf-close" type="button" aria-label="Fermer">' + icon("M6 6l12 12M18 6L6 18") + '</button></div>' +
      '<div class="pf-stage"></div>';
    document.body.appendChild(root);
    var hp = document.createElement("input"); hp.type = "text"; hp.name = "_honey"; hp.tabIndex = -1; hp.autocomplete = "off";
    hp.setAttribute("aria-hidden", "true"); hp.style.cssText = "position:absolute;left:-9999px;opacity:0;height:0;width:0"; hp.id = "pf-honey";
    root.appendChild(hp);
    root.querySelector(".pf-close").onclick = close;
    root.querySelector(".pf-back").onclick = function () { if (i > 0) go(i - 1, -1); };
    root.addEventListener("keydown", onKey);
  }

  function valid(s) {
    var a = answers[s.id];
    if (s.type === "multi") return a && a.length > 0;
    if (s.type === "email") return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(a || "");
    return !!(a && String(a).trim());
  }

  function render(dir) {
    var s = STEPS[i], stage = root.querySelector(".pf-stage");
    root.querySelector(".pf-bar i").style.width = (i / STEPS.length * 100) + "%";
    root.querySelector(".pf-count").textContent = (i + 1) + " / " + STEPS.length;
    root.querySelector(".pf-back").style.visibility = i ? "visible" : "hidden";

    var card = el("div", "pf-card " + (dir < 0 ? "from-left" : "from-right"));
    card.appendChild(el("p", "pf-step", "Question " + (i + 1)));
    card.appendChild(el("h2", "pf-q", esc(s.q)));
    if (s.hint) card.appendChild(el("p", "pf-hint", esc(s.hint)));

    if (s.type === "choice" || s.type === "multi") {
      var grid = el("div", "pf-opts" + (s.options[0].d ? " big" : "") + (s.type === "multi" ? " multi" : ""));
      s.options.forEach(function (o, k) {
        var sel = s.type === "multi" ? (answers[s.id] || []).indexOf(o.v) > -1 : answers[s.id] === o.v;
        var b = el("button", "pf-opt" + (sel ? " on" : ""));
        b.type = "button";
        b.setAttribute("aria-pressed", sel ? "true" : "false");
        b.innerHTML = '<span class="pf-key">' + (k + 1) + '</span>' +
          (o.i ? '<span class="pf-ic">' + icon(o.i) + '</span>' : '') +
          '<span class="pf-txt"><b>' + (o.e ? '<em class="pf-code">' + o.e + '</em>' : '') + esc(o.v) + '</b>' + (o.d ? '<small>' + esc(o.d) + '</small>' : '') + '</span>' +
          '<span class="pf-tick">' + icon("M5 12.5l4.5 4.5L19 7.5") + '</span>';
        b.onclick = function () { pick(s, o.v, b); };
        grid.appendChild(b);
      });
      card.appendChild(grid);
    } else {
      var inp = el("input", "pf-input");
      inp.type = s.type === "email" ? "email" : "text";
      inp.placeholder = s.ph || "";
      inp.autocomplete = s.ac || "on";
      inp.setAttribute("aria-label", s.q);
      inp.required = true;
      inp.value = answers[s.id] || "";
      inp.oninput = function () { answers[s.id] = inp.value; refresh(); }; // refresh() efface l'erreur dès que c'est valide
      inp.onblur = function () { // l'erreur n'apparaît qu'en quittant le champ, jamais pendant la frappe
        if (inp.value.trim() && !valid(s)) root.querySelector(".pf-err").textContent = s.type === "email" ? "Veuillez saisir un e-mail valide." : "";
      };
      card.appendChild(inp);
    }

    var foot = el("div", "pf-foot");
    var last = i === STEPS.length - 1;
    var nx = el("button", "btn btn-dark pf-next", last ? "Réserver mon pilote gratuit" : "Continuer");
    nx.type = "button";
    nx.onclick = next;
    foot.appendChild(nx);
    if (s.type !== "choice") foot.appendChild(el("span", "pf-enter", "ou appuyez sur <b>Entrée ↵</b>"));
    card.appendChild(foot);
    if (last) card.appendChild(el("p", "pf-legal", "Nous utilisons vos réponses uniquement pour vous répondre et préparer votre pilote : pas de newsletter, aucun partage. Usage professionnel. " +
      '<a href="../privacy.html" target="_blank" rel="noopener">Confidentialité</a> · <a href="../terms.html" target="_blank" rel="noopener">Conditions</a>. ' +
      "Vous pouvez nous demander de supprimer vos données à tout moment."));
    var errEl = el("p", "pf-err", ""); errEl.setAttribute("role", "alert"); card.appendChild(errEl);

    stage.innerHTML = "";
    stage.appendChild(card);
    refresh();
    requestAnimationFrame(function () {
      card.classList.add("in");
      var f = card.querySelector(".pf-input") || card.querySelector(".pf-opt.on") || card.querySelector(".pf-opt");
      if (f) f.focus({ preventScroll: true });
    });
  }

  function refresh() {
    var s = STEPS[i], nx = root.querySelector(".pf-next");
    if (nx) nx.disabled = !valid(s);
    var err = root.querySelector(".pf-err");
    if (err && valid(s)) err.textContent = "";
  }

  function pick(s, v, b) {
    if (s.type === "multi") {
      var a = answers[s.id] = answers[s.id] || [], k = a.indexOf(v);
      if (k > -1) a.splice(k, 1); else a.push(v);
      b.classList.toggle("on", k < 0);
      b.setAttribute("aria-pressed", k < 0 ? "true" : "false");
      refresh();
    } else {
      answers[s.id] = v;
      root.querySelectorAll(".pf-opt").forEach(function (x) { x.classList.remove("on"); x.setAttribute("aria-pressed", "false"); });
      b.classList.add("on");
      b.setAttribute("aria-pressed", "true");
      refresh();
      setTimeout(next, 260); // un seul choix : on avance tout seul
    }
  }

  function next() {
    var s = STEPS[i];
    if (!valid(s)) {
      root.querySelector(".pf-err").textContent = s.type === "email" ? "Veuillez saisir un e-mail valide." : "Choisissez une réponse pour continuer.";
      return;
    }
    if (i < STEPS.length - 1) go(i + 1, 1); else submit();
  }

  function go(n, dir) { i = n; render(dir); }

  function onKey(e) {
    if (e.key === "Escape") return close();
    var s = STEPS[i];
    if (e.key === "Enter" && !e.target.closest(".pf-top")) { e.preventDefault(); return next(); }
    if ((s.type === "choice" || s.type === "multi") && /^[1-9]$/.test(e.key)) {
      var btn = root.querySelectorAll(".pf-opt")[+e.key - 1];
      if (btn) { e.preventDefault(); btn.click(); }
    }
    if (e.key === "Tab") { // garder le focus dans la fenêtre
      var f = root.querySelectorAll("button:not([disabled]),input:not(#pf-honey)"), first = f[0], lastF = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); lastF.focus(); }
      else if (!e.shiftKey && document.activeElement === lastF) { e.preventDefault(); first.focus(); }
    }
  }

  function summary() {
    return STEPS.map(function (s) {
      var a = answers[s.id];
      return s.q + " " + (Array.isArray(a) ? a.join(", ") : a || "—");
    }).join("\n");
  }

  function submit() {
    var nx = root.querySelector(".pf-next");
    nx.disabled = true;
    nx.textContent = "Envoi…";
    var payload = {
      _subject: "Nouvelle demande de pilote (FR) · " + (answers.company || ""),
      company: answers.company, email: answers.email,
      testing: answers.who, use_cases: (answers.use || []).join(", "),
      languages: (answers.lang || []).join(", "),
      _template: "table", _captcha: "false", _honey: (document.getElementById("pf-honey") || {}).value || ""   // options FormSubmit ; _honey = piège à robots (doit rester vide)
    };
    if (!C.leadEndpoint) { // pas encore d'outil de réception : email pré-rempli
      location.href = "mailto:" + (C.contactEmail || "") + "?subject=" + encodeURIComponent(payload._subject) +
        "&body=" + encodeURIComponent("Bonjour,\n\nNous aimerions un pilote gratuit ProvaCall.\n\n" + summary() + "\n\nMerci !");
      setTimeout(function () { location.href = "../merci.html"; }, 800);
      return;
    }
    fetch(C.leadEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(payload)
    }).then(function (r) {
      if (!r.ok) throw new Error(r.status);
      return r.json().catch(function () { return { success: true }; });
    }).then(function (j) {
      if (j && (j.success === false || j.success === "false")) throw new Error(j.message || "rejected");
      location.href = "../merci.html";
    }).catch(function () {
      nx.disabled = false;
      nx.textContent = "Réessayer";
      root.querySelector(".pf-err").innerHTML = "Envoi impossible. Réessayez, ou <a href=\"mailto:" + esc(C.contactEmail || "") +
        "\">écrivez-nous</a>.";
    });
  }

  function open(e) {
    if (e) e.preventDefault();
    if (!root) build();
    lastFocus = document.activeElement;
    i = 0;
    root.classList.add("open");
    document.documentElement.classList.add("pf-lock");
    render(1);
  }

  function close() {
    root.classList.remove("open");
    document.documentElement.classList.remove("pf-lock");
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  }

  document.querySelectorAll('[data-action="pilot"]').forEach(function (a) {
    a.setAttribute("href", "#pilot");
    a.addEventListener("click", open);
  });
  if (location.hash === "#pilot") open();
})();
