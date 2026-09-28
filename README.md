# Henry's Sopron — weboldal

Statikus weboldal a Henry's Burger & Beer soproni egységének (Várkerület 83).

## Fájlok

- `index.html` — az oldal (magyar/angol nyelvváltóval)
- `styles.css` — piros–fekete–fehér arculat, Anton + Barlow betűk
- `script.js` — animációk (GSAP, ScrollTrigger, Lenis), nyitvatartás-jelző, étlap-fülek, sörszűrő
- `img/` — webre optimalizált WebP képek
- `video/` — a nyitó mozgókép (hero.mp4 asztali, hero-720.mp4 mobil, hang nélkül, ismétlődő)
- `netlify.toml` — Netlify beállítások

## Frissítéskor

- Új css/js verziónál emeld a `?v=` számot az `index.html`-ben, hogy a telefonok ne a régi, tárolt fájlt mutassák.
- Az étlap és a sörlap adatai a Wolt-étlapról és a Henry's sörlapjáról származnak (2026. szeptember). Ha változnak az árak, ezeket kell átírni.

## Képek forrása

A burger- és ételfotók a Henry's saját termékfotói (Wolt-étlap). A nyitó mozgókép a Brutal Double valódi fotójából készült muapi-val (Kling, csak gőz és lassú közelítés). A hero kép, a Golden Truffle és a túrófánk hátterét, illetve a kivágott burgert muapi-val alakítottuk át az eredeti fotókból. A sörös képek a Henry's saját plakátjaiból vannak kivágva.
