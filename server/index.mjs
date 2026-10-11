import "dotenv/config";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { createStore } from "./store.mjs";
import { categories } from "./catalog.mjs";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.resolve(currentDirectory, "..");
const dataPath = path.resolve(projectDirectory, process.env.STORE_DATA_PATH ?? "data/store.json");
const port = Number(process.env.PORT ?? 3001);
const shippingThreshold = 75;
const shippingFee = 8.95;
const taxRate = 0.08;

const checkoutSchema = z.object({
  customer: z.object({
    name: z.string().trim().min(2).max(100),
    email: z.string().trim().email().max(254),
    address: z.string().trim().min(5).max(160),
    city: z.string().trim().min(2).max(100),
    region: z.string().trim().min(2).max(100),
    postalCode: z.string().trim().min(3).max(20),
  }),
  items: z.array(z.object({
    productId: z.string().min(1),
    quantity: z.number().int().min(1).max(20),
  })).min(1).max(50),
});

const errorHandler = (error, _request, response, _next) => {
  if (error.status === 400 || error.type === "entity.parse.failed") {
    return response.status(400).json({ error: "Request body must be valid JSON." });
  }
  console.error(error);
  return response.status(500).json({ error: "Something went wrong while handling your request." });
};

export function createApp(store) {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "32kb" }));

  app.get("/api/health", (_request, response) => response.json({ status: "ok" }));

  app.get("/api/products", async (_request, response, next) => {
    try {
      response.json({ products: await store.listProducts(), categories });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/products/:id", async (request, response, next) => {
    try {
      const product = await store.findProduct(request.params.id);
      if (!product) return response.status(404).json({ error: "Product not found." });
      return response.json({ product });
    } catch (error) {
      return next(error);
    }
  });

  app.post("/api/orders", async (request, response, next) => {
    const parsed = checkoutSchema.safeParse(request.body);
    if (!parsed.success) {
      return response.status(400).json({
        error: "Check the highlighted details and try again.",
        fields: parsed.error.flatten().fieldErrors,
      });
    }

    try {
      const products = await store.listProducts();
      const items = parsed.data.items.map(({ productId, quantity }) => {
        const product = products.find((entry) => entry.id === productId);
        if (!product) return null;
        return {
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity,
          image: product.image,
        };
      });
      if (items.some((item) => item === null)) {
        return response.status(400).json({ error: "One or more items are no longer available. Refresh your cart and try again." });
      }
      const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const shipping = subtotal >= shippingThreshold ? 0 : shippingFee;
      const tax = Math.round(subtotal * taxRate * 100) / 100;
      const createdAt = new Date().toISOString();
      const order = {
        id: `LL-${createdAt.slice(0, 10).replaceAll("-", "")}-${randomUUID().slice(0, 6).toUpperCase()}`,
        createdAt,
        customer: parsed.data.customer,
        items,
        subtotal: money(subtotal),
        shipping,
        tax,
        total: money(subtotal + shipping + tax),
        paymentStatus: "Demo order — no payment collected",
      };
      await store.createOrder(order);
      return response.status(201).json({ order });
    } catch (error) {
      return next(error);
    }
  });

  app.get("/api/orders/:id", async (request, response, next) => {
    const email = z.string().trim().email().safeParse(request.query.email);
    if (!email.success) return response.status(400).json({ error: "Enter the email address used at checkout." });
    try {
      const order = await store.findOrder(request.params.id, email.data);
      if (!order) return response.status(404).json({ error: "We couldn't find an order with that number and email." });
      return response.json({ order });
    } catch (error) {
      return next(error);
    }
  });

  app.get("/api/orders", async (request, response, next) => {
    const email = z.string().trim().email().safeParse(request.query.email);
    if (!email.success) return response.status(400).json({ error: "Enter a valid email address to look up your orders." });
    try {
      return response.json({ orders: await store.listOrdersByEmail(email.data) });
    } catch (error) {
      return next(error);
    }
  });

  app.use("/api", (_request, response) => response.status(404).json({ error: "API endpoint not found." }));

  const staticDirectory = path.join(projectDirectory, "dist");
  app.use(express.static(staticDirectory));
  app.get("*path", (_request, response, next) => {
    response.sendFile(path.join(staticDirectory, "index.html"), (error) => {
      if (error) next();
    });
  });
  app.use(errorHandler);
  return app;
}

function money(value) {
  return Math.round(value * 100) / 100;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const store = createStore(dataPath);
  await store.initialize();
  createApp(store).listen(port, () => {
    console.log(`Little Leaf Market is ready at http://localhost:${port}`);
    console.log(`Local store data: ${dataPath}`);
  });
}
