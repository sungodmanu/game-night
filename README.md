Game Night — offline browser games, car-friendly builds.

A tiny static site (GitHub Pages, `https://sungodmanu.github.io/game-night/`) with a big-card menu
and car-friendly copies of six offline browser games, tuned for the Tesla in-car browser (Chromium,
landscape ~1180×600, touch only, plays while parked).

| Path | Game |
|---|---|
| `index.html` | **Game Night** menu: six big cards, no external images or fonts |
| `flytrap/` | Venus Flytrap 3D |
| `snowball-fort/` | Snowball Fort Together (two players, one screen) |
| `hogwarts/` | Battle for Hogwarts |
| `snap-and-sip/` | Snap & Sip — the original flytrap |
| `muggle-studies/` | Muggle Studies — short daily quizzes, then off to play |
| `cheetah/` | Cheetah Cub Dash — a cheetah-cub runner for the kindergartner |

Everything is self-contained: no network requests besides same-origin navigation, and every link
and asset path is relative, so the site works from any sub-path. `.nojekyll` makes Pages serve the
files as they are.

## Car mode (always on in these copies)

- a big **← Games** button on every game, linking back to `../`
- every tap target at least 64 px, larger type
- `devicePixelRatio` and renderer pixel ratio capped at 1
- on a Tesla (or with `?q=low`): smaller shadow maps, fewer particles, no MSAA; if the frame rate
  stays under 24 fps the 3D games drop shadows and then render at 0.75× (turn off with `?adaptive=0`)
- no sound until the first tap

The car layer lives in `car/` (`prelude.js` for the WebGL renderer, `core.css`/`core.js` for the
back button, `car/games/*` per game). The original games are not edited; `build-car.js` copies them
and injects the layer.

## Rebuilding

    node build-car.js

Inputs (read only): the five game folders next to this one (`../venus-flytrap-3d`,
`../snowball-fort`, `../battle-for-hogwarts/release-v2`, `../venus-flytrap`,
`../cheetah-run/release-v1/index-public.html` (built with the code names: `node build.js --public`); override with
`FLYTRAP_SRC`, `FORT_SRC`, `HOGWARTS_SRC`, `SNAP_SRC`, `CHEETAH_SRC`), plus a private folder that is never
committed (`../car-games-private`, override with `CAR_PRIVATE`) holding the Muggle Studies source
files and `realnames.json`. The build refuses to finish if any real name, external URL or
root-absolute path survives in the output.

## Code names

The two players are shown on this public site only by code names, kept in one place:

    codenames.json   {"older": "Alpha", "younger": "Beta"}

`older` is the 4th grader (the blue thrower in Snowball Fort), `younger` the kindergartner (the red
roller). To change them, edit `codenames.json` and run `node build-car.js`. The build replaces
every name in every case form (`Name`, `NAME`, `name`, and identifiers/keys derived from it) in
whole-word positions only, and derives save keys and Muggle Studies profile ids from the code names.
Note: renaming changes the Muggle Studies profile ids, so progress saved under the old names is
left behind — pick the final names before the kids start.

## Saves

Each game keeps its own `localStorage` key: `snappy-flytrap-3d-v1`, `snowball-fort-together-v1`,
`battle-for-hogwarts-v1`, `snap-and-sip-v1`, `muggle-studies-state-v1`; Cheetah Cub Dash uses the
`cheetah-run:` prefix (one key per player: `cheetah-run:p1`, `cheetah-run:p2`, ..., plus roster/last-player/settings).

## Tests

    cd test && npm install   # or point test/node_modules at an existing Playwright install
    node run.mjs             # CHROME=/path/to/chrome to choose the browser

Serves the repo with `python3 -m http.server`, then drives headless Chrome with the Tesla user agent
at 1180×600 and 770×600: menu and every card, zero console errors, zero external requests, the back
button, ≥ 64 px tap targets, nothing covering the back button or cut off, saves surviving a reload,
Snowball Fort play, and no real names in the DOM. Screenshots go to `_screens/` (gitignored).
