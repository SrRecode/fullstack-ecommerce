import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { createApp } from "../server/index.mjs";
import { createStore } from "../server/store.mjs";

let server;
let baseUrl;
let dataPath;
let temporaryDirectory;

before(async () => {
  temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), "little-leaf-market-"));
  dataPath = path.join(temporaryDirectory, "store.json");
  const store = createStore(dataPath);
  await store.initialize();
  server = createApp(store).listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  if (temporaryDirectory) await rm(temporaryDirectory, { recursive: true, force: true });
});

test("catalog returns seeded items and category filters", async () => {
  const response = await fetch(`${baseUrl}/api/products`);
  const data = await response.json();
  assert.equal(response.status, 200);
  assert.equal(data.products.length, 8);
  assert.deepEqual(data.categories, ["All finds", "At home", "On the go", "Little things"]);
});

test("checkout validates input and calculates server-owned totals", async () => {
  const invalid = await fetch(`${baseUrl}/api/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ customer: { email: "not-an-email" }, items: [] }),
  });
  assert.equal(invalid.status, 400);

  const response = await fetch(`${baseUrl}/api/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customer: {
        name: "Jamie Example",
        email: "Jamie@example.com",
        address: "123 Garden Lane",
        city: "Portland",
        region: "Oregon",
        postalCode: "97201",
      },
      items: [{ productId: "linen-market-tote", quantity: 1 }],
    }),
  });
  const { order } = await response.json();
  assert.equal(response.status, 201);
  assert.equal(order.subtotal, 28);
  assert.equal(order.shipping, 8.95);
  assert.equal(order.tax, 2.24);
  assert.equal(order.total, 39.19);
  assert.equal(order.paymentStatus, "Demo order — no payment collected");
  assert.match(order.id, /^LL-\d{8}-[A-F0-9]{6}$/);
});

test("order lookup requires both the order number and checkout email", async () => {
  const history = await fetch(`${baseUrl}/api/orders?email=jamie%40example.com`);
  const { orders } = await history.json();
  assert.equal(history.status, 200);
  assert.equal(orders.length, 1);

  const found = await fetch(`${baseUrl}/api/orders/${orders[0].id}?email=JAMIE%40EXAMPLE.COM`);
  assert.equal(found.status, 200);

  const mismatchedEmail = await fetch(`${baseUrl}/api/orders/${orders[0].id}?email=someone%40elsewhere.com`);
  assert.equal(mismatchedEmail.status, 404);
});

test("orders persist to disk and cannot be created with unavailable products", async () => {
  const unavailable = await fetch(`${baseUrl}/api/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customer: { name: "Jamie Example", email: "jamie@example.com", address: "123 Garden Lane", city: "Portland", region: "Oregon", postalCode: "97201" },
      items: [{ productId: "not-a-real-product", quantity: 1 }],
    }),
  });
  assert.equal(unavailable.status, 400);

  const reloaded = createStore(dataPath);
  await reloaded.initialize();
  const orders = await reloaded.listOrdersByEmail("jamie@example.com");
  assert.equal(orders.length, 1);
});

test("server ignores client prices and applies free shipping at the threshold", async () => {
  const response = await fetch(`${baseUrl}/api/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customer: { name: "Taylor Example", email: "taylor@example.test", address: "45 Fern Avenue", city: "Salem", region: "Oregon", postalCode: "97301" },
      items: [{ productId: "linen-market-tote", quantity: 3, price: 0 }],
    }),
  });
  const { order } = await response.json();
  assert.equal(response.status, 201);
  assert.equal(order.subtotal, 84);
  assert.equal(order.shipping, 0);
  assert.equal(order.tax, 6.72);
  assert.equal(order.total, 90.72);
  assert.equal(order.items[0].price, 28);
});

test("malformed JSON and unknown API paths return clear client errors", async () => {
  const malformed = await fetch(`${baseUrl}/api/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{",
  });
  assert.equal(malformed.status, 400);
  assert.deepEqual(await malformed.json(), { error: "Request body must be valid JSON." });

  const missing = await fetch(`${baseUrl}/api/not-a-route`);
  assert.equal(missing.status, 404);
  assert.deepEqual(await missing.json(), { error: "API endpoint not found." });
});
