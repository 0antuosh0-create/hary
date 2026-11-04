# Visual assets

Everything is embedded as text/base64 in the source, so `dist/index.html` is one self-contained file
(no `/public` folder, no external requests). Raw sources live in `art-src/`; regenerate the embedded
versions with `node scripts/prepare-art.mjs` (art) and `node scripts/fetch-fonts.mjs` (fonts).

| Asset | Source | Notes |
| --- | --- | --- |
| Castle backdrop | `art-src/hogwarts-night.webp` | custom AI-generated matte painting |
| Envelope + wax seal | `art-src/envelope.jpg` | AI-generated photograph, cut out of its black backdrop; the seal is extracted as a separate piece for the letter |
| Newspaper paper | `art-src/newsprint.jpg` | AI-generated blank newsprint texture |
| Letter paper | `art-src/parchment.jpg` | AI-generated blank parchment texture |
| Hagrid's cake | `art-src/cake.jpg` | AI-generated photograph, cut out of its black backdrop; the candle top is detected automatically to place the CSS flame |
| Wand | `art-src/wand.jpg` | AI-generated photograph, cut out of its white backdrop; the tip position is detected automatically for the glow |
| Brass plaque | `art-src/brass.jpg` | AI-generated brushed-brass texture for the engraved buttons |
| Cat photo | `art-src/birthday-cat.png`, `art-src/enchanted-cat.mp4` | sourced from Tenor ("cat-gloomy-cat"); swap these two files and rerun `prepare-art.mjs` to use a different photo |
| Fonts | Google Fonts, embedded | Cinzel, Cormorant Garamond, Vazirmatn, Old Standard TT, UnifrakturCook, Pinyon Script |

Crest, Golden Snitch, wizard hat and cake are original SVG artwork. Music is an original music-box melody
synthesized locally with Web Audio.

This is an unofficial, personal birthday greeting inspired by the Harry Potter universe, not an official Hogwarts or Wizarding World product.
