/* Prijevod sučelja uređivača. Uključuje se kad je u cms/config.js postavljeno lang: "en".
   Sučelje je napisano na hrvatskom; ovaj sloj prevodi tekst u DOM-u, porukama i dijalozima. */
(function () {
  "use strict";
  var C = window.CMS_CONFIG || {};
  if ((C.lang || "hr") === "hr") { window.CMS_L = function (s) { return s; }; return; }

  var EN = {
    "Uređivač stranice": "Website editor", "Uredite svoju stranicu": "Edit your website",
    "Kliknite bilo koji tekst ili sliku na stranici i promijenite ga. Kad završite, jedan klik objavljuje promjene.": "Click any text or image on your page and change it. When you’re done, one click publishes your changes.",
    "Pristupni ključ": "Access key", "Prijava": "Sign in", "Provjera…": "Checking…", "ili": "or",
    "Isprobaj bez prijave (demo)": "Try it without signing in (demo)", "Kako dobiti pristupni ključ?": "How do I get an access key?",
    "Pristupni ključ dobivate od svoje agencije. Ključ vrijedi samo za ovu stranicu i sprema se samo u ovom pregledniku. Na javnom ili tuđem računalu nakon rada kliknite": "Your agency gives you the access key. It works only for this website and is stored only in this browser. On a public or shared computer, click",
    "Odjava": "Sign out", ".": ".",
    "Stranice": "Pages", "Vozila": "Vehicles", "Učitavanje…": "Loading…", "Spremi i objavi": "Save & publish",
    "Otvori objavljenu stranicu": "Open live website", "Povijest izmjena": "Change history",
    "Demo način: izmjene možete isprobati, ali se ne spremaju.": "Demo mode: try any change, nothing is saved.",
    "Računalo": "Desktop", "Mobitel": "Mobile", "Poništi (Ctrl+Z)": "Undo (Ctrl+Z)", "Ponovi (Ctrl+Shift+Z)": "Redo (Ctrl+Shift+Z)", "Više": "More",
    "Prikaz": "View", "Stranica": "Page",
    "Sve je objavljeno": "Everything is published", "Nespremljene izmjene": "Unsaved changes", "Spremanje…": "Saving…",
    "Objava nije uspjela": "Publishing failed", "Objavljuje se novija verzija…": "Publishing a newer version…", "Greška": "Error", "Pogledaj": "View",
    "Kako uređivati:": "How to edit:",
    "kliknite bilo koji tekst na stranici i pišite. Kliknite sliku, gumb ili blok za više mogućnosti. Gumb": "click any text on the page and type. Click an image, button or block for more options. The",
    "objavljuje promjene.": "button publishes your changes.",
    "Google (SEO)": "Google (SEO)", "Naslov stranice u Googleu": "Page title in Google", "Opis u Googleu": "Description in Google",
    "Dijelovi stranice": "Page sections", "Dodaj novu sekciju": "Add a new section",
    "← Cijela stranica": "← Whole page", "← Natrag": "← Back",
    "Automatski sadržaj": "Automatic content",
    "Dio zaglavlja ili podnožja. Izmjena se primjenjuje na svim stranicama.": "Part of the header or footer. Changes apply to every page.",
    "Ovaj podatak se popunjava automatski za svako vozilo.": "This value is filled in automatically.",
    "Tekst": "Text", "Pišite izravno na stranici. Označite dio teksta za oblikovanje.": "Type directly on the page. Select text to format it.",
    "Kliknite tekst na stranici za izmjenu.": "Click the text on the page to edit it.",
    "Podebljano": "Bold", "Kurziv": "Italic", "Poveznica": "Link", "Ukloni oblikovanje": "Clear formatting",
    "Kamo vodi gumb": "Button link", "Kamo vodi poveznica": "Link destination", "Otvori u novoj kartici": "Open in a new tab",
    "https://… ili tel:… ili #kontakt": "https://… or tel:… or #contact",
    "Slika": "Image", "Zamijeni sliku": "Replace image", "Opis slike (za Google i slijepe osobe)": "Image description (for Google and screen readers)",
    "Pozadinska slika": "Background image", "Zamijeni pozadinu": "Replace background",
    "Veličina naslova": "Heading size", "Na stranici smije biti samo jedan glavni naslov.": "A page should have only one main heading.",
    "Radnje": "Actions", "Pomakni gore": "Move up", "Pomakni dolje": "Move down", "Dupliciraj": "Duplicate", "Sakrij": "Hide", "Prikaži": "Show", "Obriši": "Delete",
    "Dodaj ispod": "Add below", "Naslov": "Heading", "Odlomak": "Paragraph", "Gumb": "Button", "Popis": "List", "Stavka": "Item", "Sekcija": "Section",
    "Gore": "Up", "Dolje": "Down",
    "Glavni naslov": "Main heading", "Podnaslov": "Subheading", "Mali naslov": "Small heading", "Stavka popisa": "List item",
    "Zaglavlje": "Header", "Podnožje": "Footer", "Izbornik": "Menu", "Obrazac": "Form", "Oznaka polja": "Field label", "Polje": "Field",
    "Padajući izbornik": "Dropdown", "Polje za poruku": "Message field", "Sitni tekst": "Small text", "Ikona": "Icon",
    "Pitanje i odgovor": "Question & answer", "Pitanje": "Question", "Popis podataka": "Data list", "Pojam": "Term", "Vrijednost": "Value",
    "Karta / ugradnja": "Map / embed", "Bočni blok": "Side block", "Glavni sadržaj": "Main content", "Blok": "Block", "Blok s pozadinom": "Block with background", "Element": "Element",
    "Povijest je dostupna nakon prijave.": "History is available after signing in.",
    "Starija verzija se otvara u uređivaču. Objavite je ako je želite vratiti.": "An older version opens in the editor. Publish it to restore it.",
    "Trenutna verzija": "Current version", "Otvori ovu verziju": "Open this version", "Nema izmjena.": "No changes yet.",
    "Starija verzija je otvorena. Spremi i objavi je ako je želite vratiti.": "The older version is open. Save & publish it to restore it.",
    "Nespremljene izmjene ": "Unsaved changes",
    "Na ovoj stranici imate izmjene koje nisu objavljene.": "You have changes on this page that aren’t published yet.",
    "Odustani": "Cancel", "Odbaci izmjene": "Discard changes", "Odbaci": "Discard", "Ostani": "Stay",
    "Stranica je u međuvremenu promijenjena": "This page was changed in the meantime",
    "Netko je u međuvremenu objavio drugu verziju ove stranice (npr. s drugog računala). Što želite?": "Someone published another version of this page in the meantime (for example from another computer). What would you like to do?",
    "Učitaj njihovu verziju": "Load their version", "Objavi moju verziju": "Publish my version",
    "Demo način: izmjene se ne spremaju. Za objavu se prijavite.": "Demo mode: changes aren’t saved. Sign in to publish.",
    "Prvo odaberite element ispod kojeg želite dodati novi.": "First select the element you want to add something below.",
    "Obrisano. Vratite ga s Poništi (Ctrl+Z).": "Deleted. Bring it back with Undo (Ctrl+Z).",
    "Ovaj blok se nalazi na svim stranicama. Obrisati ga posvuda?": "This block appears on every page. Delete it everywhere?",
    "Adresa poveznice (npr. https://… ili tel:…)": "Link address (e.g. https://… or tel:…)",
    "Prijava je istekla ili token nije ispravan.": "Your sign-in expired or the access key is invalid.",
    "Token ima samo pravo čitanja. Potrebno je „Contents: Read and write”.": "This key is read-only. It needs “Contents: Read and write”.",
    "Slika se ne može učitati": "The image couldn’t be loaded",
    "Novi naslov": "New heading", "Novi odlomak teksta. Kliknite i upišite svoj tekst.": "New paragraph. Click and type your text.",
    "Novi gumb": "New button", "Prva stavka": "First item", "Druga stavka": "Second item", "Nova stavka": "New item",
    "Novi naslov sekcije": "New section heading", "Kliknite ovdje i upišite tekst.": "Click here and type your text.",
    "Kliknite „Zamijeni sliku”": "Click “Replace image”",
    "Uređivač": "Editor"
  };
  var RULES = [
    [/^Objavljuje se… (\d+) s$/, "Publishing… $1 s"],
    [/^Slika zamijenjena \((\d+) KB\)\.$/, "Image replaced ($1 KB)."],
    [/^Spremanje nije uspjelo: (.*)$/, "Saving failed: $1"],
    [/^Stranica (.*) nije pronađena$/, "Page $1 not found"],
    [/^Netko je u međuvremenu promijenio: (.*)$/, "Someone changed this in the meantime: $1"],
    [/^Nemate ovlasti za ovaj repozitorij \((.*)\)\.$/, "You don’t have access to this repository ($1)."],
    [/^Spremljeno\. Objava je u tijeku \(i na: (.*)\)\.$/, "Saved. Publishing now (also on: $1)."],
    [/^Spremljeno\. Objava je u tijeku\.$/, "Saved. Publishing now."],
    [/^\/(\d+) znakova$/, "/$1 characters"],
    [/^(.*) \(sve stranice\)$/, function (m, a) { return L(a) + " (all pages)"; }],
    [/^(.*)\. Ovaj dio stranica popunjava sama(?: iz popisa vozila \(kartica „Vozila”\))?\. Možete ga premjestiti, sakriti ili obrisati\.$/, "$1. This part fills in automatically. You can move, hide or delete it."],
    [/^Uređivač – (.*)$/, "Editor – $1"],
    [/^Uređivač: (.*)$/, "Editor: $1"],
    [/^(Automatski sadržaj|Sekcija|Blok|Naslov|Odlomak|Gumb|Slika|Popis|Poveznica|Tekst|Pitanje i odgovor|Podnožje|Zaglavlje|Izbornik|Obrazac|Blok s pozadinom|Glavni naslov|Podnaslov|Mali naslov|Stavka popisa|Glavni sadržaj|Bočni blok|Element): (.*)$/, function (m, a, b) { return L(a) + ": " + b; }]
  ];
  function L(s) {
    if (typeof s !== "string") return s;
    var t = s.trim(); if (!t) return s;
    var out = null;
    if (Object.prototype.hasOwnProperty.call(EN, t)) out = EN[t];
    else for (var i = 0; i < RULES.length; i++) { if (RULES[i][0].test(t)) { out = t.replace(RULES[i][0], RULES[i][1]); break; } }
    if (out === null) return s;
    var lead = s.match(/^\s*/)[0], trail = s.match(/\s*$/)[0];
    return lead + out + trail;
  }
  function tr(root) {
    if (!root) return;
    if (root.nodeType === 3) { var v = L(root.nodeValue); if (v !== root.nodeValue) root.nodeValue = v; return; }
    if (root.nodeType !== 1 || root.tagName === "IFRAME" || root.tagName === "SCRIPT" || root.tagName === "STYLE") return;
    ["title", "placeholder", "aria-label"].forEach(function (a) { if (root.hasAttribute(a)) { var v = L(root.getAttribute(a)); if (v !== root.getAttribute(a)) root.setAttribute(a, v); } });
    if (root.tagName === "TEXTAREA" || root.tagName === "INPUT") return;
    for (var c = root.firstChild; c; c = c.nextSibling) tr(c);
  }
  window.CMS_L = L;
  document.documentElement.lang = C.lang;
  var go = function () {
    tr(document.body);
    new MutationObserver(function (ms) {
      ms.forEach(function (m) {
        if (m.type === "characterData") tr(m.target);
        else if (m.type === "attributes") tr(m.target);
        else m.addedNodes.forEach(tr);
      });
    }).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["title", "placeholder", "aria-label"] });
  };
  if (document.body) go(); else document.addEventListener("DOMContentLoaded", go);
})();
