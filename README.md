# BloxVault

Free browser-based 3D printing tools that share one saved printer and filament setup: fit checker, spool check, G-code reader, and print cost / pricing.

## Stack

- Static HTML, CSS, and ES modules (no bundler)
- [Bootstrap 5.3](https://getbootstrap.com/) from jsDelivr CDN
- Optional account: [Firebase Authentication](https://firebase.google.com/docs/auth) + [Cloud Firestore](https://firebase.google.com/docs/firestore)

There is no `package.json` or build step. Pages are served as static files.

## Local development

ES modules do **not** load reliably from `file://`. Serve the project folder over HTTP.

```bash
# from the project root
python -m http.server 8000
```

Then open [http://localhost:8000](http://localhost:8000) (or `http://127.0.0.1:8000`).

Any other static server works the same way (`npx serve`, VS Code Live Server, etc.).

### Clear saved setup

Tool settings are stored in the browser under the key `bv.setup.v2`. Clear this site’s local storage (or that key) to reset printer / filament / cost defaults.

## Project map

| Path | Role |
|------|------|
| `index.html` | Home and tool directory |
| `fit.html` | Will it fit? scale / bed checker |
| `spool.html` | Enough filament? spool check |
| `gcode.html` | G-code reader (file stays in the browser) |
| `cost.html` | Print cost and pricing |
| `account.html` | Optional sign-in, profile, admin |
| `about.html`, `contact.html`, `privacy.html`, `terms.html`, `disclaimer.html` | Site info and legal |
| `settings.js` | “My setup” card + `localStorage` |
| `calc.js` | Cost, fit, and spool math |
| `gcode.js` | Slicer comment parser |
| `ui.js` | Result display and number validation helpers |
| `app.js` | Firebase auth and account UI |
| `firestore.rules` | Firestore security rules |
| `style.css` | Site theme |

## Firebase configuration

Account features live only on `account.html` / `app.js`. Tools do not require sign-in.

1. Create (or reuse) a Firebase project with **Authentication** and **Firestore**.
2. Enable **Email/Password** and, if you want it, **Google** sign-in.
3. Add your hosting domain(s) under Authentication → Settings → Authorized domains (`localhost` is included by default for local testing).
4. Copy the web app config into `app.js` (`initializeApp({ ... })`). The web API key is public by design; access is enforced by `firestore.rules`.
5. Publish `firestore.rules` to the project (Firebase console or CLI). Test in the Rules Playground before production.
6. Set `ADMIN_UID` in `app.js` (and the matching UID check in `firestore.rules`) only if you use the admin user list.

Profiles store email, optional display name, provider, join date, and last login. **Printer / filament setup is not synced to Firebase**; it remains in `localStorage` on each device.

## Deployment

Deploy the folder as a static site (Firebase Hosting, GitHub Pages, Netlify, Cloudflare Pages, S3 + CDN, etc.).

Checklist:

1. Upload all HTML, JS, CSS, `robots.txt`, `sitemap.xml`, and `firestore.rules` (rules are applied in Firebase, not served as a page).
2. Replace `YOUR-DOMAIN` in `robots.txt` and `sitemap.xml` with your real origin when you have it.
3. Fill contact and legal placeholders in `contact.html` / `terms.html` before a public commercial launch.
4. Confirm Firebase authorized domains include the production host.
5. Confirm custom 404 handling if your host supports mapping `404.html`.

No build command is required: the site is the source files.

## G-code → cost handoff

The G-code reader can open the cost calculator with query parameters, for example:

`cost.html?grams=42.5&hours=1.50`

`hours` is decimal hours. The cost page splits that into hours and minutes for editing, then converts back to decimal hours for the calculation.
