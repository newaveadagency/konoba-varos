/* CMS – GitHub spremište (bez servera).
   Sve izmjene idu kao commit u granu iz cms/config.js; GitHub Actions zatim gradi i objavljuje stranicu.
   Token (fine-grained, samo za ovaj repozitorij: Contents RW, Actions R, Metadata R) čuva se u ovom pregledniku. */
(function () {
  "use strict";
  var C = window.CMS_CONFIG;
  var API = "https://api.github.com";
  var KEY = "cms-token:" + C.owner + "/" + C.repo;

  function b64(str) { // UTF-8 tekst → base64
    var bytes = new TextEncoder().encode(str), bin = "";
    for (var i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(bin);
  }
  function bufB64(buf) {
    var bytes = new Uint8Array(buf), bin = "";
    for (var i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(bin);
  }

  var GH = {
    cfg: C,
    token: function () { try { return localStorage.getItem(KEY) || ""; } catch (e) { return ""; } },
    setToken: function (t) { try { t ? localStorage.setItem(KEY, t) : localStorage.removeItem(KEY); } catch (e) {} },
    logout: function () { GH.setToken(""); },

    req: async function (method, path, body, accept) {
      var r = await fetch(API + path, {
        method: method, cache: "no-store",
        headers: Object.assign({ Authorization: "Bearer " + GH.token(), "X-GitHub-Api-Version": "2022-11-28", Accept: accept || "application/vnd.github+json" }, body ? { "Content-Type": "application/json" } : {}),
        body: body ? JSON.stringify(body) : undefined
      });
      if (!r.ok) {
        var msg = r.status + "";
        try { msg = (await r.json()).message || msg; } catch (e) {}
        var err = new Error(r.status === 401 ? "Prijava je istekla ili token nije ispravan." : r.status === 403 || r.status === 404 ? "Nemate ovlasti za ovaj repozitorij (" + msg + ")." : msg);
        err.status = r.status; throw err;
      }
      return accept && accept.indexOf("raw") > -1 ? r.text() : r.status === 204 ? null : r.json();
    },

    /* provjera tokena: mora imati pravo pisanja */
    login: async function (token) {
      var old = GH.token(); GH.setToken(token.trim());
      try {
        var repo = await GH.req("GET", "/repos/" + C.owner + "/" + C.repo);
        if (!repo.permissions || !repo.permissions.push) throw new Error("Token ima samo pravo čitanja. Potrebno je „Contents: Read and write”.");
        return repo;
      } catch (e) { GH.setToken(old); throw e; }
    },

    /* trenutno stanje grane: commit + mapa putanja → blob sha */
    head: async function () {
      var ref = await GH.req("GET", "/repos/" + C.owner + "/" + C.repo + "/git/ref/heads/" + C.branch);
      var commit = await GH.req("GET", "/repos/" + C.owner + "/" + C.repo + "/git/commits/" + ref.object.sha);
      var tree = await GH.req("GET", "/repos/" + C.owner + "/" + C.repo + "/git/trees/" + commit.tree.sha + "?recursive=1");
      var files = {};
      tree.tree.forEach(function (t) { if (t.type === "blob") files[t.path] = t.sha; });
      return { sha: ref.object.sha, tree: commit.tree.sha, files: files };
    },

    read: async function (path, ref) {
      return GH.req("GET", "/repos/" + C.owner + "/" + C.repo + "/contents/" + encodeURI(path) + "?ref=" + (ref || C.branch), null, "application/vnd.github.raw+json");
    },

    /* jedan commit s više datoteka.
       files: [{path, text}|{path, buffer}|{path, delete:true}]
       expect: {path: blobSha} – ako se datoteka u međuvremenu promijenila, baca grešku CONFLICT */
    commit: async function (message, files, expect) {
      var h = await GH.head();
      if (expect) {
        var changed = Object.keys(expect).filter(function (p) { return expect[p] !== h.files[p]; });
        if (changed.length) { var e = new Error("Netko je u međuvremenu promijenio: " + changed.join(", ")); e.conflict = changed; throw e; }
      }
      var tree = [];
      for (var i = 0; i < files.length; i++) {
        var f = files[i];
        if (f.delete) { if (h.files[f.path]) tree.push({ path: f.path, mode: "100644", type: "blob", sha: null }); continue; }
        var blob = await GH.req("POST", "/repos/" + C.owner + "/" + C.repo + "/git/blobs", { content: f.buffer ? bufB64(f.buffer) : b64(f.text), encoding: "base64" });
        tree.push({ path: f.path, mode: "100644", type: "blob", sha: blob.sha });
      }
      var t = await GH.req("POST", "/repos/" + C.owner + "/" + C.repo + "/git/trees", { base_tree: h.tree, tree: tree });
      var c = await GH.req("POST", "/repos/" + C.owner + "/" + C.repo + "/git/commits", { message: message, tree: t.sha, parents: [h.sha] });
      await GH.req("PATCH", "/repos/" + C.owner + "/" + C.repo + "/git/refs/heads/" + C.branch, { sha: c.sha });
      return c.sha;
    },

    history: async function (path, n) {
      return GH.req("GET", "/repos/" + C.owner + "/" + C.repo + "/commits?sha=" + C.branch + "&per_page=" + (n || 15) + (path ? "&path=" + encodeURIComponent(path) : ""));
    },

    /* praćenje objave za commit: vraća "queued" | "in_progress" | "success" | "failure" | "unknown" */
    deployStatus: async function (sha) {
      try {
        var r = await GH.req("GET", "/repos/" + C.owner + "/" + C.repo + "/actions/runs?head_sha=" + sha + "&per_page=5");
        var run = (r.workflow_runs || []).filter(function (w) { return w.path.indexOf("objava") > -1 || w.name === "Objava"; })[0] || (r.workflow_runs || [])[0];
        if (run) return run.status !== "completed" ? run.status : run.conclusion === "success" ? "success" : run.conclusion === "cancelled" ? "cancelled" : "failure";
      } catch (e) {}
      try { // rezerva: version.json na objavljenoj stranici
        var v = await (await fetch(C.siteUrl + "version.json?t=" + Date.now(), { cache: "no-store" })).json();
        if (v.sha === sha) return "success";
      } catch (e) {}
      return "unknown";
    },

    watchDeploy: function (sha, onUpdate) {
      var t0 = Date.now(), stop = false;
      (async function loop() {
        while (!stop) {
          var s = await GH.deployStatus(sha);
          onUpdate(s, Math.round((Date.now() - t0) / 1000));
          if (s === "success" || s === "failure" || s === "cancelled" || Date.now() - t0 > 6 * 60e3) return;
          await new Promise(function (r) { setTimeout(r, 4000); });
        }
      })();
      return function () { stop = true; };
    },

    /* slika → manja webp/jpeg za brzu stranicu */
    shrink: function (file, max) {
      max = max || 1920;
      return new Promise(function (res, rej) {
        if (/svg/.test(file.type)) return file.arrayBuffer().then(function (b) { res({ buffer: b, ext: "svg", type: file.type }); });
        var img = new Image(), url = URL.createObjectURL(file);
        img.onload = function () {
          var s = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement("canvas");
          c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
          c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
          URL.revokeObjectURL(url);
          var type = c.toDataURL("image/webp").indexOf("image/webp") > -1 ? "image/webp" : "image/jpeg";
          c.toBlob(function (b) { b.arrayBuffer().then(function (buf) { res({ buffer: buf, ext: type === "image/webp" ? "webp" : "jpg", type: type, w: c.width, h: c.height }); }); }, type, 0.82);
        };
        img.onerror = function () { rej(new Error("Slika se ne može učitati")); };
        img.src = url;
      });
    },
    uploadPath: function (ext) {
      var d = new Date();
      return C.uploadDir + "/" + d.getFullYear() + "/" + String(d.getMonth() + 1).padStart(2, "0") + "/" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6) + "." + ext;
    },

    /* demo način: bez prijave, ništa se ne sprema */
    isDemo: function () { return !GH.token(); }
  };
  window.GH = GH;
})();
