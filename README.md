# Currency Converter

<img width="764" alt="currency converter" src="https://github.com/user-attachments/assets/c7e8dfb4-3bf6-4b09-ab09-f3475429aa8a" />

A simple currency converter built with React + Vite + Tailwind.

## Run locally

- Install: `npm install`
- Dev server: `npm run dev`
- Build: `npm run build`

Rates are fetched from the Frankfurter API (https://api.frankfurter.dev).

## Deploy on Render

This app calls `/frankfurter/*` endpoints from the browser. A simple static deployment will hit CORS issues when calling the Frankfurter API directly, so this repo includes a tiny Node server ([server.mjs](server.mjs)) that:

- Serves the built Vite app from `dist/`
- Proxies `/frankfurter/currencies` and `/frankfurter/latest` to `https://api.frankfurter.dev/v1/*`

### Steps (Render Web Service)

1. Push this repo to GitHub.
2. In Render: **New** → **Web Service** → select your repo.
3. Environment: **Node**
4. Build command:
	- `npm ci && npm run build`
5. Start command:
	- `npm start`

Render sets `PORT` automatically; the server reads it.
