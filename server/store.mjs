import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { products } from "./catalog.mjs";

const initialData = () => ({ products, orders: [] });

export function createStore(filePath) {
  let transaction = Promise.resolve();

  async function readData() {
    try {
      return JSON.parse(await readFile(filePath, "utf8"));
    } catch (error) {
      if (error.code === "ENOENT") return initialData();
      throw new Error(`Unable to read store data at ${filePath}: ${error.message}`);
    }
  }

  async function writeData(data) {
    await mkdir(path.dirname(filePath), { recursive: true });
    const temporaryPath = `${filePath}.${randomUUID()}.tmp`;
    try {
      await writeFile(temporaryPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
      await rename(temporaryPath, filePath);
    } catch (error) {
      throw new Error(`Unable to save store data at ${filePath}: ${error.message}`);
    }
  }

  async function initialize() {
    const data = await readData();
    if (!Array.isArray(data.products) || !Array.isArray(data.orders)) {
      throw new Error(`Store data at ${filePath} must contain products and orders arrays`);
    }
    if (data.products.length === 0) {
      data.products = products;
      await writeData(data);
    } else if (!(await fileExists(filePath))) {
      await writeData(data);
    }
  }

  async function fileExists(target) {
    try {
      await readFile(target);
      return true;
    } catch (error) {
      if (error.code === "ENOENT") return false;
      throw error;
    }
  }

  function update(mutator) {
    const result = transaction.then(async () => {
      const data = await readData();
      const value = await mutator(data);
      await writeData(data);
      return value;
    });
    transaction = result.catch(() => {});
    return result;
  }

  return {
    initialize,
    listProducts: async () => (await readData()).products,
    findProduct: async (id) => (await readData()).products.find((product) => product.id === id),
    createOrder: (order) => update((data) => {
      data.orders.push(order);
      return order;
    }),
    findOrder: async (id, email) => {
      const data = await readData();
      return data.orders.find((order) => order.id.toLowerCase() === id.toLowerCase()
        && order.customer.email.toLowerCase() === email.toLowerCase()) ?? null;
    },
    listOrdersByEmail: async (email) => {
      const data = await readData();
      return data.orders
        .filter((order) => order.customer.email.toLowerCase() === email.toLowerCase())
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
  };
}
