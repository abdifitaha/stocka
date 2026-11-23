// Fills an empty database with demo data. Run after `pnpm db:setup`. Refuses to run if products already exist.
import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) { console.error("DATABASE_URL is not set."); process.exit(1); }
const sql = neon(process.env.DATABASE_URL);
const run = (text, params = []) => sql.query(text, params);

const [{ n }] = await run("SELECT count(*)::int AS n FROM products");
if (n > 0) { console.error("Database already has products; not seeding."); process.exit(1); }

const cats = [["Electronics", "#ea580c"], ["Clothing", "#fb923c"], ["Furniture", "#f97316"], ["Tools", "#10b981"], ["Other", "#f59e0b"]];
for (const [name, color] of cats) await run("INSERT INTO categories (name, color) VALUES ($1, $2)", [name, color]);

const products = [
  ["Laptop Pro 15", "Electronics", 1299.99, 980, 45, 10],
  ["Wireless Headphones", "Electronics", 189.99, 110, 8, 15],
  ["Office Chair Ergonomic", "Furniture", 549.0, 330, 0, 5],
  ["Running Shoes X3", "Clothing", 129.95, 70, 120, 20],
  ["Power Drill 18V", "Tools", 219.99, 140, 34, 8],
  ["Standing Desk 140cm", "Furniture", 799.0, 520, 12, 5],
  ["Mechanical Keyboard", "Electronics", 149.99, 85, 3, 10],
  ["Yoga Mat Premium", "Clothing", 79.99, 35, 67, 25],
];
for (const [name, cat, price, cost, stock, reorder] of products)
  await run("INSERT INTO products (name, category_id, price, cost, stock, reorder) VALUES ($1, (SELECT id FROM categories WHERE name = $2), $3, $4, $5, $6)", [name, cat, price, cost, stock, reorder]);

const customers = [
  ["Meridian Corp", "orders@meridiancorp.com", "+1 (555) 210-4400", "San Francisco", "Active"],
  ["Blake & Associates", "blake@bkassoc.net", "+1 (555) 388-1120", "Chicago", "Active"],
  ["Vertex Solutions", "purchasing@vertexsol.com", "+1 (555) 741-9930", "New York", "Inactive"],
  ["Nova Retail Ltd", "nova@novaretail.co", "+1 (555) 502-6750", "Austin", "Active"],
  ["Crestline Group", "crest@crestlinegroup.io", "+1 (555) 874-3310", "Seattle", "Active"],
  ["Pinnacle Trading", "trade@pinnacletrd.com", "+1 (555) 233-8870", "Miami", "Active"],
];
for (const c of customers) await run("INSERT INTO customers (name, email, phone, city, status) VALUES ($1, $2, $3, $4, $5)", c);

const suppliers = [
  ["TechDistrib Global", "Alan Park", "alan.park@techdistrib.com", "USA", "Preferred"],
  ["EuroComponents AG", "Lisa Müller", "l.muller@eurocomp.de", "Germany", "Active"],
  ["AsiaSource Ltd", "Jenny Chen", "jenny.chen@asiasource.hk", "Hong Kong", "Active"],
  ["FurniCraft Co.", "Marcus Webb", "m.webb@furnicraft.com", "Canada", "Active"],
  ["RapidGear Inc.", "Sofia Rossi", "sofia@rapidgear.it", "Italy", "Suspended"],
];
for (const s of suppliers) await run("INSERT INTO suppliers (name, contact, email, country, status) VALUES ($1, $2, $3, $4, $5)", s);

// A few past orders (inserted directly so stock levels above stay as listed)
const orders = [
  ["Nova Retail Ltd", "Delivered", 0, [["Laptop Pro 15", 2], ["Running Shoes X3", 4]]],
  ["Meridian Corp", "Processing", 1, [["Standing Desk 140cm", 1], ["Mechanical Keyboard", 2]]],
  ["Blake & Associates", "Shipped", 2, [["Power Drill 18V", 3]]],
  ["Pinnacle Trading", "Delivered", 32, [["Laptop Pro 15", 5], ["Wireless Headphones", 6]]],
  ["Crestline Group", "Cancelled", 3, [["Office Chair Ergonomic", 1]]],
  ["Meridian Corp", "Delivered", 65, [["Yoga Mat Premium", 20]]],
];
for (const [customer, status, daysAgo, lines] of orders) {
  const [o] = await run(
    "INSERT INTO orders (customer_id, status, created_at) VALUES ((SELECT id FROM customers WHERE name = $1), $2, now() - make_interval(days => $3)) RETURNING id",
    [customer, status, daysAgo],
  );
  for (const [name, qty] of lines)
    await run("INSERT INTO order_items (order_id, product_id, name, qty, unit_price) SELECT $1, id, name, $3, price FROM products WHERE name = $2", [o.id, name, qty]);
  await run("UPDATE orders SET total = (SELECT sum(qty * unit_price) FROM order_items WHERE order_id = $1) WHERE id = $1", [o.id]);
}

await run("INSERT INTO notifications (type, title, body) SELECT 'low_stock', name || ' is low on stock', stock || ' left (reorder level ' || reorder || ')' FROM products WHERE stock <= reorder");
console.log("Demo data added.");
