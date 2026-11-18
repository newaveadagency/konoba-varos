/* Ugrađeni upravitelj vozila (za stranice bez posebnog admin panela).
   Polja se opisuju u cms/config.js → vehicles.fields */
(function () {
  "use strict";
  var C = window.CMS_CONFIG, V = C.vehicles, GH = window.GH;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  if (!V || V.url) return;
  var M = { list: [], sha: null, dirty: false, imgs: {}, q: "", root: null, S: null };
  var esc = function (s) { return window.CMS.esc(s); }, toast = function (t, e) { window.CMS.toast(t, e); };
  var nf = new Intl.NumberFormat("hr-HR");

  function slugify(s) { return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || "vozilo"; }
  function parse(src) { return JSON.parse(src.slice(src.indexOf("["), src.lastIndexOf("]") + 1)); }
  function fileText() {
    return "/* " + (V.comment || "Ponuda vozila") + " – " + M.list.length + " vozila (uređeno " + new Date().toLocaleString("hr-HR") + ") */\nwindow." + V.varName + "=" + JSON.stringify(M.list, null, 1) + ";\n";
  }
  function img(v) { var p = v[V.imageField] || ""; return M.imgs[p] ? M.imgs[p].url : p; }

  async function load() {
    var src;
    if (M.S.demo) { src = await (await fetch(V.file + "?t=" + Date.now(), { cache: "no-store" })).text(); }
    else { src = await GH.read(V.file); M.sha = M.S.head ? M.S.head.files[V.file] : null; }
    M.list = parse(src); M.dirty = false;
  }

  async function open(S, tabs) {
    M.S = S;
    if (S.dirty) { var v = await window.CMS.ask("Nespremljene izmjene", "Na stranici imate izmjene koje nisu objavljene. Objavite ih prije prelaska na vozila.", [{ t: "Ostani", v: "no" }, { t: "Spremi i objavi", v: "save", cls: "primary" }]); if (v === "no" || !(await window.CMS.save())) return; }
    $$("button,a", tabs).forEach(function (b) { b.classList.toggle("on", b.dataset.tab === "v"); });
    var first = $("button:not([data-tab])", tabs); first.onclick = function () { close(); };
    $("#pageGrp").hidden = true; $("#app").classList.add("vmode");
    $(".main").hidden = true;
    M.root = document.createElement("div"); M.root.className = "vm"; $(".main").after(M.root);
    M.root.innerHTML = '<div class="empty">Učitavanje vozila…</div>';
    try { await load(); list(); } catch (e) { M.root.innerHTML = '<div class="empty">' + esc(e.message) + "</div>"; }
  }
  async function close() {
    if (M.dirty) { var v = await window.CMS.ask("Nespremljene izmjene", "Popis vozila nije objavljen.", [{ t: "Ostani", v: "no" }, { t: "Odbaci", v: "drop", cls: "danger" }]); if (v === "no") return; }
    M.root.remove(); M.root = null; $(".main").hidden = false; $("#pageGrp").hidden = false; $("#app").classList.remove("vmode");
    $$("#tabs button,#tabs a").forEach(function (b) { b.classList.toggle("on", !b.dataset.tab); });
    var p = M.S.page || C.pages[0].file; M.S.dirty = false; window.CMS.openPage(p, { force: true });
  }

  function list() {
    var q = M.q.toLowerCase();
    var rows = M.list.map(function (v, i) { return { v: v, i: i }; }).filter(function (r) { return !q || JSON.stringify(r.v).toLowerCase().indexOf(q) > -1; });
    M.root.innerHTML = '<div class="vm-in"><div class="vm-top"><h2>Vozila (' + M.list.length + ")</h2>" +
      '<input id="vq" placeholder="Traži…" value="' + esc(M.q) + '">' +
      '<button class="b" id="vAdd">+ Dodaj vozilo</button>' +
      '<button class="b primary" id="vSave"' + (M.dirty ? "" : " disabled") + ">Spremi i objavi</button></div>" +
      (M.S.demo ? '<div class="tip">Demo način: popis možete mijenjati, ali se promjene ne spremaju.</div>' : "") +
      '<div class="vlist">' + rows.map(function (r) {
        var v = r.v;
        return '<div class="vrow"><img src="' + esc(img(v)) + '" alt="" loading="lazy"><div><b>' + esc(v[V.titleField]) + "</b><small>" + esc(V.sub(v)) + '</small></div><div class="pr">' + (v[V.priceField] ? nf.format(v[V.priceField]) + " €" : "") + '</div><div style="display:flex;gap:4px">' +
          '<button class="ib" data-up="' + r.i + '" title="Gore">↑</button><button class="ib" data-dn="' + r.i + '" title="Dolje">↓</button><button class="b sm" data-ed="' + r.i + '">Uredi</button></div></div>';
      }).join("") + (rows.length ? "" : '<div class="empty">Nema vozila.</div>') + "</div></div>";
    $("#vq").oninput = function () { M.q = this.value; var p = this.selectionStart; list(); var n = $("#vq"); n.focus(); n.setSelectionRange(p, p); };
    $("#vAdd").onclick = function () { form(-1); };
    $("#vSave").onclick = save;
    $$("[data-ed]", M.root).forEach(function (b) { b.onclick = function () { form(+b.dataset.ed); }; });
    $$("[data-up],[data-dn]", M.root).forEach(function (b) {
      b.onclick = function () { var i = +(b.dataset.up || b.dataset.dn), j = b.dataset.up ? i - 1 : i + 1; if (j < 0 || j >= M.list.length) return; var t = M.list[i]; M.list[i] = M.list[j]; M.list[j] = t; M.dirty = true; list(); };
    });
  }

  function field(f, v) {
    var val = v[f.k] == null ? "" : v[f.k], cls = f.w ? ' class="fld ' + f.w + '"' : ' class="fld"', h = "<div" + cls + "><label>" + esc(f.l) + "</label>";
    if (f.t === "select") h += '<select data-k="' + f.k + '">' + f.o.map(function (o) { return '<option value="' + esc(o) + '"' + (String(val) === o ? " selected" : "") + ">" + esc(o || "—") + "</option>"; }).join("") + "</select>";
    else if (f.t === "tags") h += '<div class="quick">' + f.o.map(function (o) { return '<label class="chkl" style="margin:0 10px 0 0"><input type="checkbox" data-tag="' + f.k + '" value="' + esc(o) + '"' + ((val || []).indexOf(o) > -1 ? " checked" : "") + ">" + esc(o) + "</label>"; }).join("") + "</div>";
    else if (f.t === "image") h += '<div class="vimgs"><div class="t" id="vImgT"' + (val ? "" : " hidden") + '><img id="vImg" src="' + esc(img(v)) + '" alt=""></div><button class="add" type="button" id="vImgB">' + (val ? "Zamijeni" : "+ Fotografija") + "</button></div>";
    else h += '<input data-k="' + f.k + '" type="' + (f.t === "number" ? "number" : f.t === "url" ? "url" : "text") + '" value="' + esc(val) + '"' + (f.req ? " required" : "") + ">";
    return h + (f.h ? "<small>" + esc(f.h) + "</small>" : "") + "</div>";
  }
  function form(i) {
    var v = i < 0 ? JSON.parse(JSON.stringify(V.empty)) : JSON.parse(JSON.stringify(M.list[i]));
    M.root.innerHTML = '<div class="vm-in"><div class="vm-top"><button class="b" id="vBack">← Natrag</button><h2>' + (i < 0 ? "Novo vozilo" : esc(v[V.titleField])) + '</h2></div><form class="vform" id="vf" novalidate><div class="vgrid">' +
      V.fields.map(function (f) { return field(f, v); }).join("") + '</div><div class="mact" style="justify-content:space-between">' +
      (i < 0 ? "<span></span>" : '<button type="button" class="b danger" id="vDel">Obriši vozilo</button>') + '<button class="b primary" type="submit">' + (i < 0 ? "Dodaj na popis" : "Spremi promjene") + "</button></div></form></div>";
    $("#vBack").onclick = list;
    var ib = $("#vImgB");
    if (ib) ib.onclick = function () {
      var inp = document.createElement("input"); inp.type = "file"; inp.accept = "image/*";
      inp.onchange = async function () {
        var s = await GH.shrink(inp.files[0], 1600), path = GH.uploadPath(s.ext), url = URL.createObjectURL(new Blob([s.buffer], { type: s.type }));
        M.imgs[path] = { buffer: s.buffer, url: url }; v[V.imageField] = path;
        $("#vImg").src = url; $("#vImgT").hidden = false; ib.textContent = "Zamijeni";
      };
      inp.click();
    };
    var del = $("#vDel");
    if (del) del.onclick = async function () {
      var ok = await window.CMS.ask("Obrisati vozilo?", v[V.titleField] + " će nestati s popisa nakon objave.", [{ t: "Odustani", v: false }, { t: "Obriši", v: true, cls: "danger" }]);
      if (ok) { M.list.splice(i, 1); M.dirty = true; list(); }
    };
    $("#vf").onsubmit = function (e) {
      e.preventDefault();
      $$("[data-k]", this).forEach(function (el) { var f = V.fields.filter(function (x) { return x.k === el.dataset.k; })[0]; v[f.k] = f.t === "number" ? (el.value === "" ? 0 : +el.value) : el.value.trim(); });
      V.fields.filter(function (f) { return f.t === "tags"; }).forEach(function (f) { v[f.k] = $$('[data-tag="' + f.k + '"]:checked', this).map(function (c) { return c.value; }); }, this);
      var miss = V.fields.filter(function (f) { return f.req && !v[f.k]; });
      if (miss.length) { toast("Obavezno: " + miss.map(function (f) { return f.l; }).join(", "), true); return; }
      if (V.prepare) V.prepare(v, M.list, slugify, i);
      if (i < 0) M.list.unshift(v); else M.list[i] = v;
      M.dirty = true; list(); toast("Spremljeno na popis. Kliknite „Spremi i objavi”.");
    };
  }

  async function save() {
    if (M.S.demo) { toast("Demo način: promjene se ne spremaju."); return; }
    var b = $("#vSave"); b.disabled = true; b.textContent = "Spremanje…";
    try {
      var files = [{ path: V.file, text: fileText() }], used = JSON.stringify(M.list), exp = {};
      Object.keys(M.imgs).forEach(function (p) { if (used.indexOf(p) > -1) files.push({ path: p, buffer: M.imgs[p].buffer }); });
      exp[V.file] = M.sha;
      var sha = await GH.commit("Vozila: ažuriran popis (" + M.list.length + ")", files, exp);
      M.S.head = await GH.head(); M.sha = M.S.head.files[V.file]; M.dirty = false;
      list(); toast("Objavljeno. Stranica se osvježava za otprilike minutu.");
      $("#app").classList.remove("vmode");
      GH.watchDeploy(sha, function (st, sec) { var p = $("#pill"); p.className = "pill " + (st === "success" ? "ok" : st === "failure" ? "err" : "busy"); p.innerHTML = st === "success" ? 'Objavljeno ✓ <a target="_blank" rel="noopener" href="' + C.siteUrl + '">Pogledaj</a>' : st === "failure" ? "Objava nije uspjela" : "Objavljuje se… " + sec + " s"; });
    } catch (e) {
      b.disabled = false; b.textContent = "Spremi i objavi";
      if (e.conflict) { toast("Popis vozila je u međuvremenu promijenjen. Učitajte ponovno (vaše izmjene nisu spremljene).", true); await load(); list(); }
      else toast("Spremanje nije uspjelo: " + e.message, true);
    }
  }
  window.addEventListener("beforeunload", function (e) { if (M.dirty) { e.preventDefault(); e.returnValue = ""; } });
  window.CMS_VOZILA = { open: open };
})();
