# Henry's Sopron — weboldal

Egyoldalas, statikus weboldal a Henry's Sopron kézműves burgerező és sörözőnek (Várkerület 83, Sopron).

## Tartalom

- `index.html` — az oldal teljes tartalma (magyar/angol nyelvváltóval)
- `styles.css` — stílusok (sötét, kézműves-sörözős design, fotó nélkül, SVG grafikákkal)
- `script.js` — nyelvváltó, mobil menü, étlap-tabok
- `netlify.toml` — Netlify build/deploy beállítások

## Fejlesztés helyben

Nincs build-lépés, egyszerű statikus fájlok. Helyi megtekintéshez:

```bash
python3 -m http.server 8000
```

majd nyisd meg: http://localhost:8000

## Tartalom frissítése

- **Menü és árak**: `index.html`-ben a `#menu` szekció `menu-item` blokkjai.
- **Nyitvatartás**: `index.html`-ben a `#location` szekció `hours-table`-je.
- **Fotók hozzáadása**: jelenleg fotó nélküli, grafikus design — ha vannak étel-/enteriőr-fotók, a `hero-art`, `story-figure`, `beers-art` SVG blokkok helyére valós képek tehetők (`<img>` vagy CSS háttérkép), illetve érdemes egy galéria szekciót hozzáadni.
- **Új nyelvi szöveg**: minden fordítható elem `data-hu` és `data-en` attribútumot hordoz — a `script.js` ez alapján cseréli a szöveget.

## Deploy

A repó a Netlify-hoz van kötve (automatikus deploy minden `main` branch push-ra).
