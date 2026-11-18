/* Uređivač stranice – vizualno uređivanje stvarne stranice i objava preko GitHuba */
(function () {
  "use strict";
  var C = window.CMS_CONFIG, GH = window.GH;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var frame = $("#frame"), panel = $("#panel");
  var BASE = new URL("./", location.href).href;

  /* ---------------- stanje ---------------- */
  var S = {
    demo: false, head: null, page: null, src: "", sha: null, scripts: [], doctype: "<!doctype html>",
    sel: null, editing: null, dirty: false, undo: [], redo: [], images: {}, shared: {}, stopWatch: null, busy: false
  };
  var doc = function () { return frame.contentDocument; };

  /* ---------------- pomoćne ---------------- */
  function toast(t, err) { var el = $("#toast"); el.textContent = t; el.className = "toast show" + (err ? " err" : ""); clearTimeout(el._t); el._t = setTimeout(function () { el.className = "toast"; }, 3200); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function ask(title, text, buttons) {
    return new Promise(function (res) {
      $("#mT").textContent = title; $("#mP").textContent = text;
      $("#mA").innerHTML = buttons.map(function (b, i) { return '<button class="b ' + (b.cls || "") + '" data-i="' + i + '">' + esc(b.t) + "</button>"; }).join("");
      $("#modal").hidden = false;
      $$("#mA button").forEach(function (b) { b.onclick = function () { $("#modal").hidden = true; res(buttons[+b.dataset.i].v); }; });
    });
  }
  var ICON = {
    copy: '<svg viewBox="0 0 24 24"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>',
    up: '<svg viewBox="0 0 24 24"><path d="M12 19V5M6 11l6-6 6 6"/></svg>',
    down: '<svg viewBox="0 0 24 24"><path d="M12 5v14M6 13l6 6 6-6"/></svg>',
    del: '<svg viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
    eye: '<svg viewBox="0 0 24 24"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
    eyeoff: '<svg viewBox="0 0 24 24"><path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3 3.9M6.6 6.6C3.9 8.4 2 12 2 12s3.5 7 10 7c1.8 0 3.4-.5 4.8-1.3"/></svg>',
    h: '<svg viewBox="0 0 24 24"><path d="M6 4v16M18 4v16M6 12h12"/></svg>',
    p: '<svg viewBox="0 0 24 24"><path d="M4 6h16M4 10h16M4 14h16M4 18h10"/></svg>',
    btn: '<svg viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="10" rx="5"/><path d="M8 12h8"/></svg>',
    img: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/></svg>',
    list: '<svg viewBox="0 0 24 24"><path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/></svg>',
    sec: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="7" rx="1.5"/><rect x="3" y="13" width="18" height="7" rx="1.5"/></svg>'
  };

  /* ---------------- nazivi elemenata ---------------- */
  var NAMES = { H1: "Glavni naslov", H2: "Naslov", H3: "Podnaslov", H4: "Mali naslov", H5: "Mali naslov", H6: "Mali naslov", P: "Odlomak", A: "Poveznica", BUTTON: "Gumb", IMG: "Slika", UL: "Popis", OL: "Popis", LI: "Stavka popisa", SECTION: "Sekcija", HEADER: "Zaglavlje", FOOTER: "Podnožje", NAV: "Izbornik", FORM: "Obrazac", LABEL: "Oznaka polja", INPUT: "Polje", SELECT: "Padajući izbornik", TEXTAREA: "Polje za poruku", SPAN: "Tekst", SMALL: "Sitni tekst", B: "Podebljano", STRONG: "Podebljano", EM: "Kurziv", SVG: "Ikona", DETAILS: "Pitanje i odgovor", SUMMARY: "Pitanje", DL: "Popis podataka", DT: "Pojam", DD: "Vrijednost", IFRAME: "Karta / ugradnja", ASIDE: "Bočni blok", MAIN: "Glavni sadržaj", LABEL2: "" };
  function isBtn(el) { return el.tagName === "A" && /\b(btn|button|cta)\b/i.test(el.className) || el.tagName === "BUTTON"; }
  function nameOf(el) {
    if (el.dataset && el.dataset.cmsDyn) return "Automatski sadržaj";
    if (el.dataset && el.dataset.cmsShared) return el.dataset.cmsShared.charAt(0).toUpperCase() + el.dataset.cmsShared.slice(1) + " (sve stranice)";
    if (isBtn(el)) return "Gumb";
    if (el.tagName === "DIV" || el.tagName === "ARTICLE") {
      if (hasBg(el)) return "Blok s pozadinom";
      return el.parentNode === doc().body ? "Sekcija" : "Blok";
    }
    return NAMES[el.tagName.toUpperCase()] || "Element";
  }
  function label(el) { // kratak opis za strukturu
    var h = el.querySelector && el.querySelector("h1,h2,h3,h4");
    var t = ((h || el).innerText || (h || el).textContent).replace(/\s+/g, " ").trim();
    return nameOf(el) + (t ? ": " + t.slice(0, 40) : "");
  }

  /* ---------------- što se smije uređivati ---------------- */
  var VOID = /^(IMG|INPUT|SELECT|TEXTAREA|IFRAME|VIDEO|HR|BR|SVG|PATH|USE|TEMPLATE|SOURCE|PICTURE)$/i;
  var TEXTTAG = /^(H[1-6]|P|LI|A|BUTTON|LABEL|SUMMARY|DT|DD|SPAN|SMALL|B|STRONG|EM|I|BLOCKQUOTE|FIGCAPTION|TD|TH|CITE|Q|DIV)$/;
  function locked(el) { return !!(el.closest && el.closest("[data-cms-dyn],[data-cms-lock]")); }
  function isText(el) {
    if (!el || locked(el) || VOID.test(el.tagName)) return false;
    var direct = false;
    for (var i = 0; i < el.childNodes.length; i++) { var n = el.childNodes[i]; if (n.nodeType === 3 && n.textContent.trim()) direct = true; }
    if (direct) return true;
    if (el.tagName !== "DIV" && TEXTTAG.test(el.tagName) && !el.querySelector("div,p,ul,ol,section,h1,h2,h3,h4,h5,h6,table,form,img,iframe,input,select,textarea")) return true;
    return false;
  }
  function hasBg(el) {
    if (!el || el.nodeType !== 1) return false;
    var bg = doc().defaultView.getComputedStyle(el).backgroundImage;
    return bg && bg.indexOf("url(") > -1 && bg.indexOf("gradient") === -1 || /url\(/.test(el.getAttribute("style") || "");
  }
  function bgTarget(el) {
    if (hasBg(el)) return el;
    var x = el.parentElement, n = 0;
    while (x && x !== doc().body && n++ < 4) {
      if (hasBg(x)) return x;
      for (var i = 0; i < x.children.length; i++) {
        var c = x.children[i], cs = doc().defaultView.getComputedStyle(c);
        if (c !== el && hasBg(c) && (cs.position === "absolute" || cs.position === "fixed")) return c;
      }
      x = x.parentElement;
    }
    return null;
  }
  function pickTarget(el) {
    if (!el || el.nodeType !== 1) return null;
    var dyn = el.closest("[data-cms-dyn]"); if (dyn) return dyn;
    if (el.ownerSVGElement || el.tagName.toLowerCase() === "svg") el = el.tagName.toLowerCase() === "svg" ? el : el.ownerSVGElement;
    // oblikovanje unutar teksta → cijeli tekstni element
    while (/^(B|STRONG|EM|I|U|BR|SUP|SUB|MARK)$/.test(el.tagName) && el.parentElement && isText(el.parentElement)) el = el.parentElement;
    if (el.tagName === "svg" && el.parentElement && /^(A|BUTTON)$/.test(el.parentElement.tagName)) el = el.parentElement;
    if (el === doc().body || el === doc().documentElement) return null;
    return el;
  }

  /* ---------------- učitavanje stranice ---------------- */
  async function loadSource(path, ref) {
    if (S.demo) { var r = await fetch(BASE + path + "?t=" + Date.now(), { cache: "no-store" }); if (!r.ok) throw new Error("Stranica " + path + " nije pronađena"); return r.text(); }
    return GH.read(path, ref);
  }
  function prepare(src) {
    var m = src.match(/^\s*<!doctype[^>]*>/i); S.doctype = m ? m[0].trim() : "<!doctype html>";
    var d = new DOMParser().parseFromString(src, "text/html");
    S.shared = {};
    $$("[data-cms-shared]", d).forEach(function (el) { S.shared[el.dataset.cmsShared] = el.outerHTML; });
    // dijelovi koje puni JavaScript (iz cms/config.js) - samo u uređivaču
    Object.keys(C.dynamic || {}).forEach(function (sel) { $$(sel, d).forEach(function (el) { el.setAttribute("data-cms-dyn", C.dynamic[sel]); }); });
    (C.locked || []).forEach(function (sel) { $$(sel, d).forEach(function (el) { el.setAttribute("data-cms-lock", ""); }); });
    $$(".cms-demo", d).forEach(function (el) { el.remove(); }); // gumb iz probne objave (demo način čita objavljenu stranicu)
    S.scripts = [];
    $$("script", d).forEach(function (s) { var t = d.createElement("template"); t.setAttribute("data-cms-s", S.scripts.length); S.scripts.push(s.outerHTML); s.replaceWith(t); });
    $$("*", d).forEach(function (el) {
      for (var i = el.attributes.length - 1; i >= 0; i--) { var a = el.attributes[i]; if (/^on/i.test(a.name)) { el.setAttribute("data-cms-on-" + a.name.slice(2), a.value); el.removeAttribute(a.name); } }
    });
    // automatski (prazni) elementi koje puni JavaScript
    $$("body [id]", d).forEach(function (el) { if (!el.childNodes.length && !VOID.test(el.tagName)) el.setAttribute("data-cms-auto", ""); });
    var base = d.createElement("base"); base.href = BASE; base.setAttribute("data-cms-ui", ""); d.head.prepend(base);
    var css = d.createElement("link"); css.rel = "stylesheet"; css.href = BASE + "cms/platno.css?v=" + (C.v || 1); css.setAttribute("data-cms-ui", ""); d.head.appendChild(css);
    if (C.canvasCss) { var st = d.createElement("style"); st.textContent = C.canvasCss; st.setAttribute("data-cms-ui", ""); d.head.appendChild(st); }
    return "<!doctype html>\n" + d.documentElement.outerHTML;
  }
  function mount(html, keepScroll) {
    return new Promise(function (res) {
      var y = keepScroll && doc() ? doc().scrollingElement.scrollTop : 0;
      frame.onload = function () { bindFrame(); if (y) doc().scrollingElement.scrollTop = y; res(); };
      frame.srcdoc = html;
    });
  }
  async function openPage(path, opts) {
    opts = opts || {};
    if (S.dirty && !opts.force) {
      var v = await ask("Nespremljene izmjene", "Na ovoj stranici imate izmjene koje nisu objavljene.", [{ t: "Odustani", v: "no" }, { t: "Odbaci izmjene", v: "drop", cls: "danger" }, { t: "Spremi i objavi", v: "save", cls: "primary" }]);
      if (v === "no") { $("#pageSel").value = S.page; return; }
      if (v === "save" && !(await save())) { $("#pageSel").value = S.page; return; }
    }
    setPill("busy", "Učitavanje…");
    try {
      var src = opts.src || await loadSource(path);
      S.page = path; S.src = src; S.sha = S.head ? S.head.files[path] : null;
      S.undo = []; S.redo = []; S.sel = null; S.editing = null; S.images = opts.keepImages ? S.images : {};
      $("#pageSel").value = path;
      await mount(prepare(src));
      setDirty(!!opts.dirty); S.restored = !!opts.dirty;
      showPage();
    } catch (e) { setPill("err", "Greška"); toast(e.message, true); }
  }

  /* ---------------- događaji u stranici ---------------- */
  function bindFrame() {
    var d = doc();
    d.addEventListener("mouseover", function (e) { var t = pickTarget(e.target); $$(".cms-hover", d).forEach(function (x) { if (x !== t) x.classList.remove("cms-hover"); }); if (t && t !== S.sel) t.classList.add("cms-hover"); });
    d.addEventListener("mouseout", function (e) { if (e.target.classList) e.target.classList.remove("cms-hover"); });
    d.addEventListener("click", function (e) {
      var t = pickTarget(e.target);
      if (t && t === S.editing) { if (e.target.closest("a")) e.preventDefault(); return; } // klik unutar teksta koji se uređuje
      e.preventDefault(); e.stopPropagation();
      select(t, true, e);
    }, true);
    d.addEventListener("submit", function (e) { e.preventDefault(); }, true);
    d.addEventListener("dragstart", function (e) { e.preventDefault(); });
    d.addEventListener("input", function () { setDirty(true); snapLater(); });
    d.addEventListener("keydown", function (e) {
      if (S.editing && e.key === "Enter") { e.preventDefault(); if (!/^(H[1-6]|A|BUTTON|SUMMARY|LABEL|DT)$/.test(S.editing.tagName)) d.execCommand("insertLineBreak"); }
      if (S.editing && e.key === "Escape") { stopEditing(); }
      keys(e);
    });
    d.addEventListener("paste", function (e) { if (!S.editing) return; e.preventDefault(); d.execCommand("insertText", false, (e.clipboardData || window.clipboardData).getData("text/plain")); });
    snap(true);
  }

  function select(el, fromClick, ev) {
    var d = doc();
    if (S.sel) S.sel.classList.remove("cms-sel");
    if (S.editing && S.editing !== el) stopEditing();
    S.sel = el;
    if (el) {
      el.classList.remove("cms-hover"); el.classList.add("cms-sel");
      if (fromClick && isText(el)) startEditing(el, ev);
      if (!fromClick) el.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
    showPanel();
  }
  function startEditing(el, ev) {
    S.editing = el; el.setAttribute("contenteditable", "true"); el.focus();
    var d = doc(), sel = d.getSelection();
    if (ev && d.caretRangeFromPoint) { var r = d.caretRangeFromPoint(ev.clientX, ev.clientY); if (r) { sel.removeAllRanges(); sel.addRange(r); } }
  }
  function stopEditing() {
    if (!S.editing) return;
    S.editing.removeAttribute("contenteditable");
    if (!S.editing.textContent.trim() && !S.editing.querySelector("img,svg")) S.editing.innerHTML = "&nbsp;";
    S.editing = null; snap();
  }

  /* ---------------- poništi / ponovi ---------------- */
  var snapT;
  function state() {
    var d = doc(), b = d.body.cloneNode(true);
    $$(".cms-sel,.cms-hover", b).forEach(function (x) { x.classList.remove("cms-sel", "cms-hover"); });
    $$("[contenteditable]", b).forEach(function (x) { x.removeAttribute("contenteditable"); });
    var desc = d.querySelector('meta[name="description"]');
    return { body: b.innerHTML, title: d.title, desc: desc ? desc.content : null };
  }
  function snap(reset) {
    clearTimeout(snapT);
    var st = state(), last = S.undo[S.undo.length - 1];
    if (reset) { S.undo = [st]; S.redo = []; }
    else if (!last || last.body !== st.body || last.title !== st.title || last.desc !== st.desc) { S.undo.push(st); if (S.undo.length > 120) S.undo.shift(); S.redo = []; }
    undoBtns();
  }
  function snapLater() { clearTimeout(snapT); snapT = setTimeout(snap, 600); }
  function restore(st) {
    var d = doc(); d.body.innerHTML = st.body; d.title = st.title;
    var m = d.querySelector('meta[name="description"]'); if (m && st.desc != null) m.content = st.desc;
    S.sel = null; S.editing = null; setDirty(true); showPanel();
  }
  function undo() { stopEditing(); if (S.undo.length < 2) return; S.redo.push(S.undo.pop()); restore(S.undo[S.undo.length - 1]); if (S.undo.length < 2 && !S.restored) setDirty(false); undoBtns(); }
  function redo() { if (!S.redo.length) return; var st = S.redo.pop(); S.undo.push(st); restore(st); undoBtns(); }
  function undoBtns() { $("#undo").disabled = S.undo.length < 2; $("#redo").disabled = !S.redo.length; }
  function keys(e) {
    var mod = e.metaKey || e.ctrlKey;
    if (mod && e.key.toLowerCase() === "z" && !S.editing) { e.preventDefault(); e.shiftKey ? redo() : undo(); }
    if (mod && e.key.toLowerCase() === "s") { e.preventDefault(); save(); }
    if ((e.key === "Delete" || e.key === "Backspace") && S.sel && !S.editing && !/INPUT|TEXTAREA|SELECT/.test((e.target.tagName || ""))) { e.preventDefault(); act("del"); }
  }
  document.addEventListener("keydown", function (e) { if (!$("#app").hidden && !/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) keys(e); });

  /* ---------------- radnje nad elementom ---------------- */
  function mutate(fn) { stopEditing(); fn(); setDirty(true); snap(); showPanel(); }
  function act(a) {
    var el = S.sel; if (!el) return;
    if (a === "del") {
      if (el.dataset.cmsShared && !confirm("Ovaj blok se nalazi na svim stranicama. Obrisati ga posvuda?")) return;
      var next = el.nextElementSibling || el.previousElementSibling || el.parentElement;
      mutate(function () { el.remove(); S.sel = null; });
      if (next && next !== doc().body) select(next);
      toast("Obrisano. Vratite ga s Poništi (Ctrl+Z).");
    }
    if (a === "dup") mutate(function () { var c = el.cloneNode(true); c.classList.remove("cms-sel"); c.removeAttribute("id"); $$("[id]", c).forEach(function (x) { x.removeAttribute("id"); }); c.removeAttribute("data-cms-shared"); el.after(c); select(c); });
    if (a === "up") { var p = el.previousElementSibling; while (p && /TEMPLATE|SCRIPT/.test(p.tagName)) p = p.previousElementSibling; if (p) mutate(function () { p.before(el); }); }
    if (a === "down") { var n = el.nextElementSibling; while (n && /TEMPLATE|SCRIPT/.test(n.tagName)) n = n.nextElementSibling; if (n) mutate(function () { n.after(el); }); }
    if (a === "hide") mutate(function () { if (el.hasAttribute("data-cms-hidden")) { el.removeAttribute("hidden"); el.removeAttribute("data-cms-hidden"); } else { el.setAttribute("hidden", ""); el.setAttribute("data-cms-hidden", ""); } });
    if (S.sel && (a === "up" || a === "down")) S.sel.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
  function add(kind) {
    var d = doc(), ref = S.sel, n;
    var btnCls = C.buttonClass || "btn";
    if (kind === "sec") {
      ref = ref ? topBlock(ref) : null;
      n = d.createElement("section"); n.innerHTML = C.sectionTemplate || '<div class="wrap"><h2>Novi naslov sekcije</h2><p>Kliknite ovdje i upišite tekst.</p></div>';
    } else {
      if (!ref || ref.dataset.cmsDyn) { toast("Prvo odaberite element ispod kojeg želite dodati novi.", true); return; }
      if (ref.tagName === "LI" && kind !== "li") ref = ref.parentElement;
      if (kind === "h") { n = d.createElement(/^H[1-3]$/.test(ref.tagName) ? ref.tagName : "h3"); n.textContent = "Novi naslov"; }
      if (kind === "p") { n = d.createElement("p"); n.textContent = "Novi odlomak teksta. Kliknite i upišite svoj tekst."; }
      if (kind === "btn") { n = d.createElement("a"); n.className = btnCls; n.href = "#"; n.textContent = "Novi gumb"; }
      if (kind === "li") {
        if (ref.tagName === "LI") {
          n = ref.cloneNode(true); n.classList.remove("cms-sel"); n.removeAttribute("id");
          var tw = d.createTreeWalker(n, NodeFilter.SHOW_TEXT), tn, first = true;
          while ((tn = tw.nextNode())) { if (!tn.textContent.trim()) continue; tn.textContent = first ? "Nova stavka" : ""; first = false; }
          if (first) n.textContent = "Nova stavka";
        } else { n = d.createElement("ul"); n.innerHTML = "<li>Prva stavka</li><li>Druga stavka</li>"; }
      }
      if (kind === "img") { n = d.createElement("img"); n.alt = ""; n.style.cssText = "max-width:100%;height:auto;border-radius:12px"; n.src = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450"><rect width="100%" height="100%" fill="#e5e7eb"/><text x="50%" y="50%" fill="#6b7280" font-family="Arial" font-size="28" text-anchor="middle">Kliknite „Zamijeni sliku”</text></svg>'); }
    }
    mutate(function () { ref ? ref.after(n) : d.body.querySelector("footer") ? d.body.querySelector("footer").before(n) : d.body.appendChild(n); });
    select(n);
    if (kind === "img") pickImage(n);
    else if (isText(n)) { startEditing(n); var r = d.createRange(); r.selectNodeContents(n); var s = d.getSelection(); s.removeAllRanges(); s.addRange(r); showPanel(); }
  }
  function topBlock(el) { var b = doc().body; while (el.parentElement && el.parentElement !== b) el = el.parentElement; return el; }

  /* ---------------- slike ---------------- */
  var imgTarget = null, imgMode = "src";
  function pickImage(el, mode) { imgTarget = el; imgMode = mode || "src"; $("#file").value = ""; $("#file").click(); }
  $("#file").addEventListener("change", async function () {
    var f = this.files[0]; if (!f || !imgTarget) return;
    try {
      var s = await GH.shrink(f, imgMode === "bg" ? 2400 : 1920);
      var blobUrl = URL.createObjectURL(new Blob([s.buffer], { type: s.type }));
      S.images[blobUrl] = { path: GH.uploadPath(s.ext), buffer: s.buffer };
      var el = imgTarget;
      mutate(function () {
        if (imgMode === "bg") el.style.backgroundImage = "url(" + blobUrl + ")";
        else { el.src = blobUrl; el.removeAttribute("srcset"); el.removeAttribute("sizes"); if (s.w) { el.setAttribute("width", s.w); el.setAttribute("height", s.h); } if (el.parentElement && el.parentElement.tagName === "PICTURE") $$("source", el.parentElement).forEach(function (x) { x.remove(); }); }
      });
      select(el);
      toast("Slika zamijenjena (" + Math.round(s.buffer.byteLength / 1024) + " KB).");
    } catch (e) { toast(e.message, true); }
  });

  /* ---------------- panel ---------------- */
  function showPanel() { if (!S.sel) return showPage(); panel.innerHTML = elementPanel(S.sel); bindPanel(); }
  function crumbs(el) {
    var chain = [], x = el;
    while (x && x !== doc().body && chain.length < 6) { chain.unshift(x); x = x.parentElement; }
    return '<div class="crumbs">' + chain.map(function (c, i) { return '<button data-cr="' + i + '" class="' + (c === el ? "on" : "") + '">' + esc(nameOf(c)) + "</button>"; }).join("") + "</div>";
  }
  function elementPanel(el) {
    var h = '<button class="b sm" data-go="page" style="margin-bottom:12px">← Cijela stranica</button>' + crumbs(el);
    h += '<div class="kind">' + esc(nameOf(el)) + "</div>";
    if (el.dataset.cmsDyn) h += '<p class="hint">' + esc(el.dataset.cmsDyn) + ". Ovaj dio stranica popunjava sama" + (C.vehicles ? " iz popisa vozila (kartica „Vozila”)." : ".") + " Možete ga premjestiti, sakriti ili obrisati.</p>";
    else if (el.closest("[data-cms-lock]")) h += '<p class="hint">Ovaj podatak se popunjava automatski za svako vozilo.</p>';
    else if (el.dataset.cmsShared || el.closest("[data-cms-shared]")) h += '<p class="hint">Dio zaglavlja ili podnožja. Izmjena se primjenjuje na svim stranicama.</p>';
    if (S.editing === el) {
      h += '<div class="ph">Tekst</div><p class="hint">Pišite izravno na stranici. Označite dio teksta za oblikovanje.</p>';
      h += '<div class="fmt"><button data-fmt="bold" title="Podebljano"><b>B</b></button><button data-fmt="italic" title="Kurziv"><i>I</i></button><button data-fmt="link" title="Poveznica">🔗</button><button data-fmt="removeFormat" title="Ukloni oblikovanje">⌫</button></div>';
    } else if (isText(el)) h += '<p class="hint">Kliknite tekst na stranici za izmjenu.</p>';
    var a = el.tagName === "A" ? el : el.closest("a");
    if (a && !locked(a)) {
      h += '<div class="ph">' + (isBtn(a) ? "Kamo vodi gumb" : "Kamo vodi poveznica") + "</div>";
      h += '<div class="fld"><input id="pHref" value="' + esc(a.getAttribute("href") || "") + '" placeholder="https://… ili tel:… ili #kontakt"><div class="quick">' + quickLinks() + "</div></div>";
      h += '<label class="chkl"><input type="checkbox" id="pBlank"' + (a.target === "_blank" ? " checked" : "") + "> Otvori u novoj kartici</label>";
    }
    if (el.tagName === "IMG") {
      h += '<div class="ph">Slika</div><div class="imgprev" style="background-image:url(\'' + esc(el.currentSrc || el.src) + '\')"></div>';
      h += '<button class="b primary" data-img="src" style="width:100%">' + ICON.img + "Zamijeni sliku</button>";
      h += '<div class="fld" style="margin-top:10px"><label>Opis slike (za Google i slijepe osobe)</label><input id="pAlt" value="' + esc(el.alt) + '"></div>';
    }
    var bgEl = !locked(el) && el.tagName !== "IMG" ? bgTarget(el) : null;
    if (bgEl) {
      var bg = doc().defaultView.getComputedStyle(bgEl).backgroundImage.match(/url\(["']?(.*?)["']?\)/);
      h += '<div class="ph">Pozadinska slika</div><div class="imgprev" style="background-image:url(\'' + esc(bg ? bg[1] : "") + '\')"></div><button class="b" data-img="bg" style="width:100%">' + ICON.img + "Zamijeni pozadinu</button>";
    }
    if (/^(H[1-6])$/.test(el.tagName) && !locked(el)) {
      h += '<div class="ph">Veličina naslova</div><div class="fld"><select id="pHx">' + ["H1", "H2", "H3", "H4"].map(function (x) { return "<option" + (x === el.tagName ? " selected" : "") + ' value="' + x + '">' + NAMES[x] + "</option>"; }).join("") + "</select><small>Na stranici smije biti samo jedan glavni naslov.</small></div>";
    }
    h += '<div class="ph">Radnje</div><div class="acts">' +
      '<button class="b sm" data-act="up">' + ICON.up + "Pomakni gore</button>" +
      '<button class="b sm" data-act="down">' + ICON.down + "Pomakni dolje</button>" +
      '<button class="b sm" data-act="dup">' + ICON.copy + "Dupliciraj</button>" +
      '<button class="b sm" data-act="hide">' + (el.hasAttribute("data-cms-hidden") ? ICON.eye + "Prikaži" : ICON.eyeoff + "Sakrij") + "</button>" +
      '<button class="b sm danger" data-act="del" style="grid-column:1/-1">' + ICON.del + "Obriši</button></div>";
    h += '<div class="ph">Dodaj ispod</div><div class="adds">' +
      '<button data-add="h">' + ICON.h + "Naslov</button>" + '<button data-add="p">' + ICON.p + "Odlomak</button>" + '<button data-add="btn">' + ICON.btn + "Gumb</button>" +
      '<button data-add="img">' + ICON.img + "Slika</button>" + '<button data-add="li">' + ICON.list + (el.tagName === "LI" ? "Stavka" : "Popis") + "</button>" + '<button data-add="sec">' + ICON.sec + "Sekcija</button></div>";
    return h;
  }
  function quickLinks() {
    var q = (C.pages || []).filter(function (p) { return !p.template; }).map(function (p) { return '<button data-q="' + esc(p.file) + '">' + esc(p.name) + "</button>"; });
    $$("body [id]", doc()).filter(function (x) { return /^(SECTION|FOOTER|DIV|ASIDE)$/.test(x.tagName) && !x.hasAttribute("data-cms-auto") && x.querySelector("h1,h2,h3"); }).slice(0, 8).forEach(function (x) { q.push('<button data-q="#' + esc(x.id) + '">#' + esc(x.id) + "</button>"); });
    if (C.phone) q.push('<button data-q="tel:' + esc(C.phone) + '">Telefon</button>');
    if (C.email) q.push('<button data-q="mailto:' + esc(C.email) + '">E-mail</button>');
    return q.join("");
  }
  function bindPanel() {
    var el = S.sel;
    $$("[data-cr]", panel).forEach(function (b) { b.onclick = function () { var chain = [], x = el; while (x && x !== doc().body && chain.length < 6) { chain.unshift(x); x = x.parentElement; } select(chain[+b.dataset.cr]); }; });
    $$("[data-act]", panel).forEach(function (b) { b.onclick = function () { act(b.dataset.act); }; });
    $$("[data-add]", panel).forEach(function (b) { b.onclick = function () { add(b.dataset.add); }; });
    $$("[data-img]", panel).forEach(function (b) { b.onclick = function () { pickImage(b.dataset.img === "bg" ? bgTarget(el) : el, b.dataset.img); }; });
    $$("[data-go=page]", panel).forEach(function (b) { b.onclick = function () { select(null); }; });
    $$("[data-fmt]", panel).forEach(function (b) {
      b.onmousedown = function (e) { e.preventDefault(); };
      b.onclick = function () {
        var d = doc(), f = b.dataset.fmt;
        if (f === "link") { var u = prompt("Adresa poveznice (npr. https://… ili tel:…)", "https://"); if (u) d.execCommand("createLink", false, u); }
        else d.execCommand(f);
        setDirty(true); snapLater();
      };
    });
    var a = el.tagName === "A" ? el : el.closest("a");
    var href = $("#pHref"), blank = $("#pBlank");
    if (href) {
      href.oninput = function () { a.setAttribute("href", href.value.trim()); setDirty(true); snapLater(); };
      $$("[data-q]", panel).forEach(function (b) { b.onclick = function () { href.value = b.dataset.q; href.oninput(); }; });
    }
    if (blank) blank.onchange = function () { mutate(function () { if (blank.checked) { a.target = "_blank"; a.rel = "noopener"; } else { a.removeAttribute("target"); } }); };
    var alt = $("#pAlt"); if (alt) alt.oninput = function () { el.alt = alt.value; setDirty(true); snapLater(); };
    var hx = $("#pHx"); if (hx) hx.onchange = function () {
      mutate(function () { var n = doc().createElement(hx.value); for (var i = 0; i < el.attributes.length; i++) n.setAttribute(el.attributes[i].name, el.attributes[i].value); n.innerHTML = el.innerHTML; el.replaceWith(n); S.sel = n; });
      select(S.sel);
    };
  }

  /* panel cijele stranice: SEO + struktura */
  function showPage() {
    var d = doc(); if (!d || !d.body) return;
    var desc = d.querySelector('meta[name="description"]');
    var pg = (C.pages || []).filter(function (p) { return p.file === S.page; })[0] || {};
    var h = "";
    if (pg.template) h += '<div class="tip">' + esc(pg.template) + "</div>";
    else h += '<div class="tip"><b>Kako uređivati:</b> kliknite bilo koji tekst na stranici i pišite. Kliknite sliku, gumb ili blok za više mogućnosti. Gumb <b>Spremi i objavi</b> objavljuje promjene.</div>';
    h += '<div class="ph">Google (SEO)</div>';
    h += '<div class="fld"><label>Naslov stranice u Googleu</label><input id="sTitle" maxlength="70" value="' + esc(d.title) + '"><small><span id="sTc">' + d.title.length + "</span>/60 znakova</small></div>";
    if (desc) h += '<div class="fld"><label>Opis u Googleu</label><textarea id="sDesc" maxlength="300">' + esc(desc.content) + '</textarea><small><span id="sDc">' + desc.content.length + "</span>/160 znakova</small></div>";
    h += '<div class="ph">Dijelovi stranice</div><div class="outline">';
    blocks().forEach(function (b, i) {
      var off = b.hasAttribute("data-cms-hidden");
      h += '<div class="orow' + (off ? " off" : "") + '" data-o="' + i + '"><span>' + esc(label(b)) + '</span><button class="ib" data-oa="up" title="Gore">' + ICON.up + '</button><button class="ib" data-oa="down" title="Dolje">' + ICON.down + '</button><button class="ib" data-oa="hide" title="' + (off ? "Prikaži" : "Sakrij") + '">' + (off ? ICON.eye : ICON.eyeoff) + "</button></div>";
    });
    h += '</div><button class="b sm" data-add="sec" style="margin-top:10px;width:100%">' + ICON.sec + "Dodaj novu sekciju</button>";
    panel.innerHTML = h;
    var t = $("#sTitle"), ds = $("#sDesc");
    t.oninput = function () { d.title = t.value; $("#sTc").textContent = t.value.length; var og = d.querySelector('meta[property="og:title"]'); if (og) og.content = t.value; setDirty(true); snapLater(); };
    if (ds) ds.oninput = function () { desc.content = ds.value; $("#sDc").textContent = ds.value.length; var og = d.querySelector('meta[property="og:description"]'); if (og) og.content = ds.value; setDirty(true); snapLater(); };
    var bl = blocks();
    $$(".orow", panel).forEach(function (r) {
      var b = bl[+r.dataset.o];
      r.onclick = function (e) { if (e.target.closest("[data-oa]")) return; select(b); };
      $$("[data-oa]", r).forEach(function (x) { x.onclick = function () { S.sel = b; act(x.dataset.oa); S.sel = null; if (b.classList) b.classList.remove("cms-sel"); showPage(); }; });
    });
    $$("[data-add]", panel).forEach(function (b) { b.onclick = function () { S.sel = null; add("sec"); }; });
  }
  function blocks() {
    return $$(":scope > *", doc().body).filter(function (b) {
      if (/^(TEMPLATE|SCRIPT|STYLE|LINK|NOSCRIPT)$/.test(b.tagName) || b.hasAttribute("data-cms-ui")) return false;
      if (b.tagName.toLowerCase() === "svg" && b.getAttribute("width") === "0") return false;
      if (b.id === "intro" || b.getAttribute("aria-hidden") === "true" && !b.textContent.trim()) return false;
      return b.hasAttribute("data-cms-hidden") || b.getBoundingClientRect().height > 0 || b.tagName === "FOOTER";
    });
  }

  /* ---------------- spremanje ---------------- */
  function clean(root) {
    $$("[data-cms-ui]", root).forEach(function (n) { n.remove(); });
    $$("[contenteditable]", root).forEach(function (n) { n.removeAttribute("contenteditable"); });
    $$("[data-cms-auto],[data-cms-dyn],[data-cms-lock]", root).forEach(function (n) { ["data-cms-auto", "data-cms-dyn", "data-cms-lock"].forEach(function (a) { n.removeAttribute(a); }); });
    $$(".cms-sel,.cms-hover", root).forEach(function (n) { n.classList.remove("cms-sel", "cms-hover"); if (!n.getAttribute("class")) n.removeAttribute("class"); });
    $$("*", root).forEach(function (el) {
      for (var i = el.attributes.length - 1; i >= 0; i--) { var a = el.attributes[i]; if (a.name.indexOf("data-cms-on-") === 0) { el.setAttribute("on" + a.name.slice(12), a.value); el.removeAttribute(a.name); } }
    });
  }
  function finish(html, scripts) {
    html = html.replace(/<template data-cms-s="(\d+)"><\/template>/g, function (m, i) { return scripts[+i]; });
    Object.keys(S.images).forEach(function (u) { html = html.split(u).join(S.images[u].path); });
    return html;
  }
  function serialize() {
    stopEditing();
    var root = doc().documentElement.cloneNode(true);
    clean(root);
    return finish(S.doctype + "\n" + root.outerHTML, S.scripts);
  }
  /* zajednički blokovi (zaglavlje, podnožje) → prenesi na ostale stranice */
  async function sharedUpdates() {
    var out = [], d = doc(), changed = {};
    $$("[data-cms-shared]", d).forEach(function (el) {
      var c = el.cloneNode(true), w = d.createElement("div"); w.appendChild(c); clean(w);
      var html = finish(c.outerHTML, S.scripts);
      if (html !== S.shared[el.dataset.cmsShared]) changed[el.dataset.cmsShared] = html;
    });
    var keys = Object.keys(changed); if (!keys.length) return out;
    var act = C.activeClass || "on";
    for (var i = 0; i < C.pages.length; i++) {
      var p = C.pages[i]; if (p.file === S.page) continue;
      var src = await loadSource(p.file), pd = new DOMParser().parseFromString(src, "text/html"), touched = false;
      keys.forEach(function (k) {
        var old = pd.querySelector('[data-cms-shared="' + k + '"]'); if (!old) return;
        var on = old.querySelector("a." + act), onHref = on ? on.getAttribute("href") : null;
        var tmp = pd.createElement("div"); tmp.innerHTML = changed[k]; var n = tmp.firstElementChild;
        // poveznice na sidra: "#x" s ove stranice → "ova.html#x" na drugoj, i obrnuto
        $$("a[href]", n).forEach(function (a) {
          var h = a.getAttribute("href");
          if (h.charAt(0) === "#" && h.length > 1 && !pd.getElementById(h.slice(1)) && doc().getElementById(h.slice(1))) a.setAttribute("href", S.page + h);
          else if (h.indexOf(p.file + "#") === 0) a.setAttribute("href", h.slice(p.file.length));
        });
        // id-jevi koje koristi JavaScript na toj stranici ostaju na istom mjestu
        $$("[id]", old).forEach(function (o) {
          var path = [], x = o; while (x && x !== old) { path.unshift(Array.prototype.indexOf.call(x.parentElement.children, x)); x = x.parentElement; }
          var t = n; path.forEach(function (i) { t = t && t.children[i]; });
          if (t && t.tagName === o.tagName && !t.id) t.id = o.id;
        });
        $$("a." + act, n).forEach(function (a) { a.classList.remove(act); if (!a.getAttribute("class")) a.removeAttribute("class"); });
        if (onHref) { var t = $$("a", n).filter(function (a) { var h = a.getAttribute("href"); return h === onHref || (p.file + h) === onHref || h === p.file + onHref; })[0]; if (t) t.classList.add(act); }
        old.replaceWith(n); touched = true;
      });
      if (touched) { var dt = src.match(/^\s*<!doctype[^>]*>/i); out.push({ path: p.file, text: (dt ? dt[0].trim() : "<!doctype html>") + "\n" + pd.documentElement.outerHTML, name: p.name }); }
    }
    return out;
  }
  async function save(force) {
    if (S.busy) return false;
    if (S.demo) { toast("Demo način: izmjene se ne spremaju. Za objavu se prijavite."); return false; }
    if (!S.dirty) return true;
    S.busy = true; $("#save").disabled = true; setPill("busy", "Spremanje…");
    try {
      var html = serialize(), files = [{ path: S.page, text: html }], expect = {};
      expect[S.page] = S.sha;
      var others = await sharedUpdates();
      others.forEach(function (o) { files.push({ path: o.path, text: o.text }); });
      Object.keys(S.images).forEach(function (u) { if (html.indexOf(S.images[u].path) > -1 || others.some(function (o) { return o.text.indexOf(S.images[u].path) > -1; })) files.push({ path: S.images[u].path, buffer: S.images[u].buffer }); });
      var pg = (C.pages.filter(function (p) { return p.file === S.page; })[0] || {}).name || S.page;
      var sha = await GH.commit("Uređivač: " + pg + (others.length ? " (+ " + others.map(function (o) { return o.name; }).join(", ") + ")" : ""), files, force ? null : expect);
      S.head = await GH.head(); S.sha = S.head.files[S.page]; S.src = html;
      $$("[data-cms-shared]", doc()).forEach(function (el) { var c = el.cloneNode(true), w = doc().createElement("div"); w.appendChild(c); clean(w); S.shared[el.dataset.cmsShared] = finish(c.outerHTML, S.scripts); });
      setDirty(false); track(sha); S.busy = false;
      toast("Spremljeno. Objava je u tijeku" + (others.length ? " (i na: " + others.map(function (o) { return o.name; }).join(", ") + ")" : "") + ".");
      return true;
    } catch (e) {
      S.busy = false; $("#save").disabled = false; setDirty(true);
      if (e.conflict) {
        var v = await ask("Stranica je u međuvremenu promijenjena", "Netko je u međuvremenu objavio drugu verziju ove stranice (npr. s drugog računala). Što želite?", [{ t: "Odustani", v: "no" }, { t: "Učitaj njihovu verziju", v: "load" }, { t: "Objavi moju verziju", v: "force", cls: "primary" }]);
        if (v === "force") return save(true);
        if (v === "load") { S.head = await GH.head(); await openPage(S.page, { force: true }); }
        return false;
      }
      toast("Spremanje nije uspjelo: " + e.message, true); return false;
    }
  }
  function track(sha) {
    if (S.stopWatch) S.stopWatch();
    S.stopWatch = GH.watchDeploy(sha, function (st, sec) {
      if (S.dirty) return;
      if (st === "success") setPill("ok", 'Objavljeno ✓ <a href="' + C.siteUrl + (S.page === "index.html" ? "" : S.page) + "?v=" + sha.slice(0, 7) + '" target="_blank" rel="noopener">Pogledaj</a>');
      else if (st === "failure") setPill("err", "Objava nije uspjela");
      else if (st === "cancelled") setPill("busy", "Objavljuje se novija verzija…");
      else setPill("busy", "Objavljuje se… " + sec + " s");
    });
  }

  /* ---------------- povijest ---------------- */
  async function history() {
    if (S.demo) { toast("Povijest je dostupna nakon prijave."); return; }
    select(null);
    panel.innerHTML = '<button class="b sm" data-go="page" style="margin-bottom:12px">← Natrag</button><div class="kind">Povijest izmjena</div><p class="hint">Starija verzija se otvara u uređivaču. Objavite je ako je želite vratiti.</p><div class="hist" id="hist"><div class="empty">Učitavanje…</div></div>';
    $("[data-go=page]", panel).onclick = showPage;
    try {
      var list = await GH.history(S.page, 20);
      $("#hist").innerHTML = list.map(function (c, i) {
        var dt = new Date(c.commit.author.date);
        return '<div class="hrow"><b>' + esc(c.commit.message.split("\n")[0]) + "</b><small>" + dt.toLocaleString("hr-HR") + "</small>" + (i ? '<br><button class="b sm" data-sha="' + c.sha + '">Otvori ovu verziju</button>' : "<br><small>Trenutna verzija</small>") + "</div>";
      }).join("") || '<div class="empty">Nema izmjena.</div>';
      $$("[data-sha]", panel).forEach(function (b) {
        b.onclick = async function () { var src = await GH.read(S.page, b.dataset.sha); await openPage(S.page, { src: src, force: true, dirty: true }); toast("Starija verzija je otvorena. Spremi i objavi je ako je želite vratiti."); };
      });
    } catch (e) { $("#hist").innerHTML = '<div class="empty">' + esc(e.message) + "</div>"; }
  }

  /* ---------------- traka ---------------- */
  function setPill(cls, html) { var p = $("#pill"); p.className = "pill " + cls; p.innerHTML = html; }
  function setDirty(v) {
    S.dirty = v;
    $("#save").disabled = !v || S.busy;
    if (v) setPill("dirty", "Nespremljene izmjene");
    else if (!S.stopWatch) setPill("", "Sve je objavljeno");
  }
  window.addEventListener("beforeunload", function (e) { if (S.dirty && !S.demo) { e.preventDefault(); e.returnValue = ""; } });

  function initUI() {
    $("#siteName").textContent = C.siteName;
    document.title = "Uređivač – " + C.siteName;
    $("#pageSel").innerHTML = C.pages.map(function (p) { return '<option value="' + esc(p.file) + '">' + esc(p.name) + "</option>"; }).join("");
    $("#pageSel").onchange = function () { openPage(this.value); };
    $$("[data-dev]").forEach(function (b) { b.onclick = function () { $$("[data-dev]").forEach(function (x) { x.classList.toggle("on", x === b); }); $("#fw").classList.toggle("m", b.dataset.dev === "m"); }; });
    $("#undo").onclick = undo; $("#redo").onclick = redo;
    $("#save").onclick = function () { save(); };
    $("#menuBtn").onclick = function (e) { e.stopPropagation(); $("#drop").hidden = !$("#drop").hidden; };
    document.addEventListener("click", function () { $("#drop").hidden = true; });
    $("#viewLive").href = C.siteUrl;
    $("#histBtn").onclick = history;
    $("#logout").onclick = function () { GH.logout(); location.reload(); };
    $("#logout").hidden = S.demo;
    $("#demoBar").hidden = !S.demo;
    $("#toLogin").onclick = function (e) { e.preventDefault(); S.demo = false; showLogin(); };
    // kartice
    var tabs = '<button class="on">Stranice</button>';
    if (C.vehicles) tabs += C.vehicles.url ? '<a href="' + esc(C.vehicles.url) + '">Vozila</a>' : '<button data-tab="v">Vozila</button>';
    $("#tabs").innerHTML = tabs;
    var vb = $("[data-tab=v]");
    if (vb) vb.onclick = function () { if (window.CMS_VOZILA) window.CMS_VOZILA.open(S, $("#tabs")); };
  }

  /* ---------------- prijava ---------------- */
  function showLogin() {
    $("#app").hidden = true; $("#login").hidden = false; $("#lSite").textContent = C.siteName;
    $("#lTok").focus();
  }
  $("#lForm").onsubmit = async function (e) {
    e.preventDefault(); $("#lErr").textContent = "";
    var b = this.querySelector("button"); b.disabled = true; b.textContent = "Provjera…";
    try { await GH.login($("#lTok").value); $("#lTok").value = ""; start(); }
    catch (er) { $("#lErr").textContent = er.message; }
    b.disabled = false; b.textContent = "Prijava";
  };
  $("#lDemo").onclick = function () { S.demo = true; start(); };

  async function start() {
    $("#login").hidden = true; $("#app").hidden = false;
    S.demo = S.demo || GH.isDemo();
    initUI();
    try { if (!S.demo) S.head = await GH.head(); }
    catch (e) { toast(e.message, true); if (e.status === 401) { GH.logout(); S.demo = false; return showLogin(); } }
    var want = new URLSearchParams(location.search).get("stranica");
    var first = C.pages.some(function (p) { return p.file === want; }) ? want : C.pages[0].file;
    if (new URLSearchParams(location.search).get("tab") === "vozila" && window.CMS_VOZILA) { window.CMS_VOZILA.open(S, $("#tabs")); return; }
    openPage(first, { force: true });
  }
  window.CMS = { state: S, save: save, openPage: openPage, toast: toast, ask: ask, esc: esc, serialize: serialize, sharedUpdates: sharedUpdates };

  document.addEventListener("DOMContentLoaded", function () { if (GH.token() || new URLSearchParams(location.search).has("demo")) start(); else showLogin(); });
})();
