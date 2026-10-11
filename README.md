# Little Leaf Market

A responsive, full-stack demo shop built with React, TypeScript, Vite, Express, and a local JSON data file. Browse and search a small curated catalog, keep a persistent shopping bag, place a validated demo order, and look up order history. It runs on your computer; it is not connected to a payment processor or delivery service.

## Quick start

**Requirements:** Node.js 20 or later and npm.

```sh
npm install
npm run dev
```

Open **http://localhost:5173**. The Vite development server proxies `/api` requests to the Express server on port `3001`. The first server start creates `data/store.json` with the sample catalog and an empty order list. Your bag is saved in this browser's local storage; orders are saved on the computer running the server.

On Windows PowerShell, the same commands are `npm install` and `npm run dev`.

## Use the shop

- Browse products, search by name/description/category/color, filter by collection, and sort by price or rating.
- Open product details for descriptions and materials; add products to the bag and adjust quantities (up to 20 of each item).
- Continue through checkout to save a demo order. The server recalculates every price, shipping charge, tax estimate, and total from its catalog; it does not trust browser-supplied totals.
- Look up one order by its order number and checkout email, or view all saved orders for an email.
- Use the browser Back/Forward buttons between the shop, checkout, and order lookup. Direct links to `/checkout` and `/orders` work after a refresh; refreshing the one-time confirmation view takes you to order lookup instead.
- No user account is needed. A bag is private to the browser profile; order history is available on the same local server.

## Demo assumptions and limitations

- **No real payments:** Checkout never asks for card, bank, or wallet information. A clearly labeled demo order is created and no funds are collected.
- **Shipping:** USD $8.95 flat-rate shipping; free shipping at a $75 subtotal. The demo does not calculate shipping by address or carrier.
- **Tax:** A flat 8% estimate for demonstration. It is not a jurisdiction-specific tax calculation.
- **Currency:** All prices and totals are USD.
- **Storage:** Orders and the product catalog are plain JSON in `data/store.json`. This is intended for a personal demo or local development, not a multi-user production deployment. Order lookup by email is a convenience rather than strong authentication; do not expose this server to the public internet or store sensitive customer data in it.
- **Catalog images:** Product photographs load from Unsplash and therefore require an internet connection. The rest of the application and order API run locally.
- **No inventory, shipping labels, email notifications, accounts, or payment settlement** are implemented.

## Configuration

Copy `.env.example` to `.env` if you want to set a different port or data location:

```dotenv
PORT=3001
STORE_DATA_PATH=./data/store.json
```

`STORE_DATA_PATH` may be absolute or relative to the project directory. The folder is created on startup. Keep the generated data file private: it contains order contact and delivery details. The `.gitignore` excludes `.env` and `data/`.

## Production build

```sh
npm run build
npm start
```

Then open **http://localhost:3001**. Express serves the built Vite app and API from the same origin. `npm run dev` is the recommended local development workflow.

## Architecture and data model

- `src/App.tsx` — catalog, filters, cart, product dialog, checkout, confirmation, and order lookup UI.
- `src/styles.css` — responsive design system, keyboard focus, reduced-motion support, and layout styles.
- `server/catalog.mjs` — sample catalog seed and categories.
- `server/store.mjs` — local JSON persistence; writes are serialized and saved using a temporary file plus atomic rename.
- `server/index.mjs` — Express API, request validation, server-side totals, and built-app serving.
- `tests/orders.test.mjs` — HTTP-level coverage for catalog, checkout, totals, privacy-matched lookup, invalid products, and persistence.

The JSON store has this top-level shape:

```json
{
  "products": [{ "id": "linen-market-tote", "name": "Everyday Linen Tote", "price": 28 }],
  "orders": [{
    "id": "LL-20261011-A1B2C3",
    "createdAt": "2026-10-11T08:00:00.000Z",
    "customer": { "name": "Jamie Example", "email": "jamie@example.com" },
    "items": [{ "productId": "linen-market-tote", "name": "Everyday Linen Tote", "price": 28, "quantity": 1 }],
    "subtotal": 28,
    "shipping": 8.95,
    "tax": 2.24,
    "total": 39.19,
    "paymentStatus": "Demo order — no payment collected"
  }]
}
```

Prices and item names are snapshotted into orders so later catalog edits do not change past orders. API endpoints are `GET /api/health`, `GET /api/products`, `GET /api/products/:id`, `POST /api/orders`, `GET /api/orders?email=...`, and `GET /api/orders/:id?email=...`.

## Checks

```sh
npm test
npm run typecheck
npm run build
```

The test suite uses temporary data and never writes test orders into your local shop data.

The storefront uses native dialogs for product details and the shopping bag, keyboard focus indicators, escape/backdrop dismissal, and enlarged touch targets for common mobile controls.
