# Konoba Varoš – redizajn (demo za ponudu)

Postojeća stranica: https://www.konobavaros.com (Ban Mladenova 9, Split)

## Što ne valja na staroj stranici
- WordPress s gotovom temom, Elementorom i Revolution Sliderom: naslovnica učitava 50 CSS/JS datoteka (oko 230 KB samo HTML-a)
- na mobitelu naslov „TRADICIONALNA” izlazi izvan ekrana, a zastavice jezika su odrezane
- prvi ekran je samo fotografija bez ijedne informacije (nema radnog vremena, adrese, poziva na rezervaciju)
- u podnožju piše „© 2014”, a dijelovi stranice su na engleskom („Seared to Perfection”, „Customers Testimonials”)
- jelovnik je dugačka stranica bez pretrage i bez brzog skoka na kategoriju

## Nova stranica
- `index.html`: hero s radnim vremenom, adresom i telefonom; o nama; specijaliteti ispod peke s cijenama; kategorije jelovnika; proslave; recenzije gostiju; galerija; rezervacija
- `jelovnik.html`: svih 163 stavke s izvorne stranice (jela i karta pića), traka kategorija koja prati skrolanje i pretraga
- `galerija.html`: 22 fotografije s povećanjem (strelice, Esc)
- obrazac za rezervaciju (datum, vrijeme, broj osoba) priprema e-mail za konobavaros@konobavaros.com
- bez vanjskih biblioteka; fontovi Playfair Display i Onest lokalno; schema.org Restaurant za Google

## Uređivanje
- `uredi.html`: vizualni uređivač (vidi `../_cms/README.md`). Spremanje se objavljuje automatski.
- Cijene i jela u jelovniku mijenjaju se klikom na tekst; nova stavka = „Dupliciraj” postojeću.
- Lokalni pregled: `python3 -m http.server 8000`, zatim http://localhost:8000 (uređivač: /uredi.html?demo)
