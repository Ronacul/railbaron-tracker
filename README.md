# Rail Baron Tracker

Two versions live in this repo:

- `rail-baron-tracker.html` (repo root): the original standalone tracker, served by GitHub Pages. Left unchanged.
- `public/` + `functions/`: the newer version with region-first picking and optional shared live games, deployed on Cloudflare Pages.

The newer version: Rail Baron tracker where everyone at the table can enter moves into the same game.
Static page plus two small Cloudflare Pages Functions backed by a D1 database.

- `public/index.html`, `public/data.js`: the app (UK board default, US alternate)
- `functions/api/games/index.js`: `POST /api/games` creates a game, returns a 6-letter code
- `functions/api/games/[id].js`: `GET` loads a game, `PUT` saves it
- `lib/state.js`: shape check shared by both functions
- `schema.sql`: the one table

## Solo by default

The page never contacts the server unless someone taps "Share live game" or opens a
link with a game code. The game is saved in the browser (localStorage) so a reload loses
nothing. Sharing turns the current game into the shared one, so whoever starts it keeps
what they had. "Leave shared game" stops syncing and keeps a local copy.

## How sync works

The whole game is stored as one JSON blob with a version number. A save only
succeeds if nobody else saved since you last loaded (compare-and-set). If someone
did, the server returns their newer state and the page shows it with a notice.
The page loads the latest game when the phone wakes or the tab is focused, when you
tap the status button, and every 45 seconds while the page is visible.
Anyone with the link can edit. Games not touched for 90 days are deleted when a new game is created.

## One-time Cloudflare setup (free plan is enough)

Use the Cloudflare account ronaculs@gmail.com (with the s).

1. **Database.** Workers & Pages > D1 > Create database, name it `railbaron-live`.
   Open its Console tab and run the contents of `schema.sql`.
2. **Project.** Workers & Pages > Create > Pages > Connect to Git > this repo.
   Framework preset: None. Build command: leave empty. Build output directory: `public`.
3. **Binding.** After the first deploy: project > Settings > Bindings > Add > D1 database.
   Variable name must be exactly `DB`, database `railbaron-live`. Add it for Production
   (and Preview if you want). Then redeploy (Deployments > Retry, or push a commit).
4. Open the site, Game setup > Share live game, and send the copied link to the other players.

## Not yet verified

The page logic was tested against a mocked server. The Functions and D1 queries
have not run against real Cloudflare yet, so the first real test game is the check.
