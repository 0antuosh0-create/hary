# Hogwarts Birthday Owl Post

A small, responsive birthday surprise made with React, TypeScript, Vite and Motion. The greeting and the letter are in Persian.

## Run

```sh
npm install
npm run dev
npm run build      # produces one self-contained dist/index.html
```

## Verify

```sh
npx playwright install --with-deps chromium
npm run build
# Serves ONLY dist/index.html (everything else 404s) and runs the suites against it:
node scripts/test-single-file.mjs tests/birthday.mjs tests/accessibility.mjs
```

Screenshots are written to the git-ignored `artifacts/` folder.

## Personalize

- `src/content.ts`: Persian greeting and letter.
- `src/App.tsx`: English copy, portrait quips, spells.
- `src/components/Newspaper.tsx`: the "Daily Purrphet" front page.
- `art-src/`: raw images. After changing one, run `node scripts/prepare-art.mjs` (writes `src/assets/art.ts`).
- `scripts/fetch-fonts.mjs`: re-downloads and embeds the fonts (`src/fonts-embedded.css`).
- `src/components/Craft.tsx` + `src/craft.css`: brass plaque buttons, the photographed cake with its live flame, gold leaf, and the spell wand.
- `src/paper.css`: envelope, newspaper and letter styling. `src/index.css`: everything else.

Sound is opt-in and generated locally with Web Audio. The page respects reduced-motion preferences, pauses the portrait video offscreen, and supports keyboard navigation and modal focus management. No API keys, backend or external requests are needed.

See `ASSETS.md` for image sources and the fan-project notice.
