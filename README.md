# Sniffle

A mobile-first, local-only medication administration companion. Sniffle provides a calm 3–2–1 guided start, playful dose animation, confirmed-dose history, and private on-device profile storage.

## Run locally

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

All user data is stored in browser `localStorage`; no account, backend, or network API is used.

## GitHub Pages

Pushes to the `work` branch automatically deploy the static site to GitHub Pages. The workflow can also be started manually from the repository's **Actions** tab.

Before the first deployment, set **Settings → Pages → Build and deployment → Source** to **GitHub Actions**.
