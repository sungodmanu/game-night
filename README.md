Game Night — offline browser games, car-friendly builds.

A static site (GitHub Pages, `https://sungodmanu.github.io/game-night/`) with a big-card menu
and car-friendly copies of offline browser games, tuned for the Tesla in-car browser (Chromium,
landscape ~1180×600, touch only, plays while parked).

| Path | Game |
|---|---|
| `index.html` | **Game Night** menu (grouped big cards) |
| `flytrap/` | Venus Flytrap 3D |
| `snowball-fort/` | Snowball Fort Together |
| `hogwarts/` | Battle for Hogwarts |
| `cheetah/` | Cheetah Cub Dash |
| `snap-and-sip/` | Snap & Sip — the original flytrap |
| `muggle-studies/` | Muggle Studies |
| `ninja-parkour/` | Ninja Parkour |
| `map-makers/` | Map Makers (one device) |
| `diwali-games/` | Diwali Games (Rangoli Studio + Diya Path) |
| `diwali-lotus/` | Diwali Lotus |
| `not-a-robot/` | Totally Not A Robot (45 levels) |
| `spooky-merge/` | Spooky Town Puzzles |
| `rocket-mail/` | Rocket Mail |
| `f1-champs/` | F1 Champs |
| `pizza-rush/` | Pizza Rush |
| `dragon-keeper/` | Dragon Keeper |
| `dino-dig/` | Dino Dig |
| `build-a-bot/` | Build-a-Bot Garage |
| `build-a-bot-mini/` | Build-a-Bot Mini |

Everything is self-contained: no network requests besides same-origin navigation, and every link
and asset path is relative, so the site works from any sub-path. `.nojekyll` makes Pages serve the
files as they are. Public copies never include kids' real names (code names Alpha / Beta, or
Player 1 / Player 2).

## Car mode (always on in these copies)

- a big **← Games** button on every game, linking back to `../`
- every tap target at least 64 px on the original six (generic back button on newer games)
- for the WebGL originals: `devicePixelRatio` capped, Tesla low-quality adaptive path
- no sound until the first tap

The car layer lives in `car/` (`prelude.js` for the WebGL renderer, `core.css`/`core.js` for the
back button, `car/games/*` per game, plus `generic.js` for newly added single-file games).
The original game folders are not edited; copies are built into this repo.

## Rebuilding the original six

    node build-car.js

Inputs (read only): `../venus-flytrap-3d`, `../snowball-fort`,
`../battle-for-hogwarts/release-v2`, `../venus-flytrap`,
`../cheetah-run/release-v1/index-public.html`, plus private `../car-games-private`
(Muggle Studies + `realnames.json`). Newer games were copied from their built `index.html`
with the generic car back button injected.

## Code names

    codenames.json   {"older": "Alpha", "younger": "Beta"}

## Tests

    cd test && npm install && npx playwright install chromium
    node run.mjs          # deep checks for the original six
    node smoke-new.mjs    # menu + every game at 1180×600 and 390×844
