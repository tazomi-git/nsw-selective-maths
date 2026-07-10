# Putting the app on a student iPad

The app is now an **installable, offline Progressive Web App (PWA)**. Once it's on a
web address and added to the Home Screen, it launches full-screen like a normal app
and works with no internet after the first load.

## Files in this folder (upload all of them together)
- `app.html` — the exam app (this is the one you open)
- `workbook.html` — printable question papers + answer key (print from a computer)
- `questions.js` — the 140-question bank
- `manifest.json`, `sw.js` — app metadata + offline cache
- `icon-192.png`, `icon-512.png`, `apple-touch-icon.png` — the app icon

> ⚠️ A service worker needs **HTTPS** (or localhost). All the hosts below are HTTPS,
> so it just works. Opening the raw file from the iPad Files app will **not** work.

---

## Option A — Netlify Drop (fastest, ~2 minutes)
1. On your Mac, go to **https://app.netlify.com/drop**
2. Drag this whole `nsw-selective-maths` folder onto the page.
3. Netlify gives you a URL like `https://random-name.netlify.app`.
   (Sign in with a free account if you want the URL to stay permanent / renameable.)
4. Open that URL **+ `/app.html`** in Safari on the iPad.

## Option B — GitHub Pages (free & permanent)
1. Create a free GitHub account and a new **public** repository.
2. Upload all the files in this folder to the repo (drag-and-drop in the web UI works).
3. Repo **Settings → Pages → Build from branch → `main` / root → Save**.
4. After a minute your site is at `https://<username>.github.io/<repo>/app.html`.

## Option C — Cloudflare Pages
Similar to GitHub Pages; connect the repo or upload the folder in the Cloudflare
dashboard, then open `/app.html`.

---

## Add it to the iPad Home Screen (do this once)
1. Open the site's **`/app.html`** in **Safari** (must be Safari, not Chrome, for
   Add-to-Home-Screen on iOS).
2. Tap the **Share** button (square with an up-arrow).
3. Tap **Add to Home Screen** → **Add**.
4. A "NSW Maths" icon appears. Tapping it launches the app full-screen, offline-ready.

## Good to know
- **Progress is saved on that iPad only** (scores, per-category %, flagged questions).
  There's no cross-device sync and no teacher dashboard — that would need a server.
- Don't use Safari's "Clear History and Website Data" or it will wipe saved progress.
- **Updating questions later:** after you change `questions.js` (e.g. I add Weeks 5–8)
  or `app.html`, just **re-upload the changed files** to the same host. Installed iPads
  pick up the new content automatically the next time they open the app **while online**
  — no version bump needed. (The service worker now fetches the latest app and questions
  from the network when online, and only uses the offline copy when there's no internet.)
  - First update after this change: each iPad may need **one extra reload** (or fully
    close and reopen the Home-Screen app) to switch over to the new behaviour. After that,
    updates are automatic.
  - `sw.js` has a `const CACHE = "nsw-maths-v12"` line. You normally never touch it now;
    only bump it (…`v13`, `v14`) if you ever want to force every device to wipe its
    offline cache and re-download everything from scratch.
- **Printing the workbook:** open `workbook.html` on a computer and use
  “Print / Save as PDF”. It's cached for offline too, but printing from an iPad is fiddly.
