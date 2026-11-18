/* Konoba Varoš – zajednička skripta */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* zaglavlje: prozirno na vrhu, puno pri skrolanju */
  var nav = $(".nav");
  if (nav && !nav.classList.contains("always")) {
    var onScroll = function () { nav.classList.toggle("solid", window.scrollY > 40 || $(".menu.open")); };
    window.addEventListener("scroll", onScroll, { passive: true }); onScroll();
  }
  var burger = $(".burger");
  if (burger) burger.addEventListener("click", function () {
    var m = $(".menu"); m.classList.toggle("open"); burger.setAttribute("aria-expanded", m.classList.contains("open"));
    if (nav && !nav.classList.contains("always")) nav.classList.toggle("solid", window.scrollY > 40 || m.classList.contains("open"));
  });
  $$(".menu a").forEach(function (a) { a.addEventListener("click", function () { $(".menu").classList.remove("open"); }); });

  /* otvoreno sada (svaki dan 9–24) */
  $$("[data-open]").forEach(function (el) {
    var h = new Date().getHours();
    el.textContent = h >= 9 ? "Otvoreno danas do 24 h" : "Otvaramo danas u 9 h";
  });

  /* otkrivanje pri skrolanju */
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -8% 0px" });
    $$(".rv").forEach(function (el) { io.observe(el); });
  } else $$(".rv").forEach(function (el) { el.classList.add("in"); });

  /* galerija – povećanje */
  var links = $$(".gal a");
  if (links.length) {
    var lb = document.createElement("div"); lb.className = "lb"; lb.setAttribute("role", "dialog"); lb.setAttribute("aria-label", "Galerija");
    lb.innerHTML = '<img alt=""><button class="x" aria-label="Zatvori">×</button><button class="p" aria-label="Prethodna">‹</button><button class="n" aria-label="Sljedeća">›</button><div class="c"></div>';
    document.body.appendChild(lb);
    var cur = 0;
    var show = function (i) { cur = (i + links.length) % links.length; var a = links[cur]; $("img", lb).src = a.getAttribute("href"); $("img", lb).alt = ($("img", a) || {}).alt || ""; $(".c", lb).textContent = (cur + 1) + " / " + links.length; lb.classList.add("open"); };
    links.forEach(function (a, i) { a.addEventListener("click", function (e) { e.preventDefault(); show(i); }); });
    $(".x", lb).onclick = function () { lb.classList.remove("open"); };
    $(".p", lb).onclick = function () { show(cur - 1); };
    $(".n", lb).onclick = function () { show(cur + 1); };
    lb.addEventListener("click", function (e) { if (e.target === lb) lb.classList.remove("open"); });
    document.addEventListener("keydown", function (e) { if (!lb.classList.contains("open")) return; if (e.key === "Escape") lb.classList.remove("open"); if (e.key === "ArrowLeft") show(cur - 1); if (e.key === "ArrowRight") show(cur + 1); });
  }

  /* jelovnik: aktivna kategorija + pretraga */
  var tabs = $$(".mtabs a[href^='#']");
  if (tabs.length) {
    var groups = tabs.map(function (a) { return $(a.getAttribute("href")); }).filter(Boolean);
    var spy = function () {
      var y = window.scrollY + 170, on = groups[0];
      groups.forEach(function (g) { if (!g.hidden && g.offsetTop <= y) on = g; });
      if (!on || on.hidden) on = groups.filter(function (g) { return !g.hidden; })[0]; if (!on) return;
      tabs.forEach(function (a) { var act = a.getAttribute("href") === "#" + on.id; if (act !== a.classList.contains("on")) { a.classList.toggle("on", act); if (act) a.scrollIntoView({ inline: "center", block: "nearest" }); } });
    };
    window.addEventListener("scroll", spy, { passive: true }); spy();
    var q = $("#mq");
    if (q) q.addEventListener("input", function () {
      var v = q.value.trim().toLowerCase(), any = false;
      $$(".mgroup").forEach(function (g) {
        var n = 0;
        $$(".mi", g).forEach(function (it) { var hit = !v || it.textContent.toLowerCase().indexOf(v) > -1; it.hidden = !hit; if (hit) n++; });
        g.hidden = !n; if (n) any = true;
      });
      $(".mempty").style.display = any ? "none" : "block";
      var top = $(".phead").offsetHeight - (window.innerWidth <= 700 ? 72 : 84); if (window.scrollY > top) window.scrollTo(0, top); spy();
    });
  }

  /* rezervacija: pripremljena poruka (e-mail) */
  $$("form.upit").forEach(function (fm) {
    var d = fm.querySelector("[name=datum]");
    if (d) { var t = new Date(); d.min = t.toISOString().slice(0, 10); if (!d.value) d.value = d.min; }
    fm.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!fm.checkValidity()) { fm.reportValidity(); return; }
      var f = new FormData(fm), body = [];
      [["ime", "Ime"], ["telefon", "Telefon"], ["datum", "Datum"], ["vrijeme", "Vrijeme"], ["osobe", "Broj osoba"], ["poruka", "Napomena"]].forEach(function (k) { if (f.get(k[0])) body.push(k[1] + ": " + f.get(k[0])); });
      var subj = "Rezervacija – " + (f.get("datum") || "") + " " + (f.get("vrijeme") || "") + ", " + (f.get("osobe") || "") + " os.";
      location.href = "mailto:" + fm.dataset.mail + "?subject=" + encodeURIComponent(subj) + "&body=" + encodeURIComponent(body.join("\n"));
      var ok = $(".ok", fm); if (ok) ok.style.display = "block";
    });
  });
})();
