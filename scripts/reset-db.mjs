// Deletes all business data (products, orders, customers, ...) but keeps users, sessions and settings.
import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Add it to .env (see .env.example).");
  process.exit(1);
}
const sql = neon(process.env.DATABASE_URL);
await sql.query(
  `TRUNCATE order_items, orders, stock_movements, purchase_order_items, purchase_orders,
   notifications, products, categories, customers, suppliers RESTART IDENTITY CASCADE`,
);
console.log("Data cleared. Users and settings kept.");
