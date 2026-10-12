import { sql } from "../config/db.js";

// Sample products with category classification and initial stock count included
const SAMPLE_PRODUCTS = [
  {
    name: "Premium Wireless Headphones",
    price: 1799.99,
    category: "Electronics",
    count: 15,
    image:
      "https://images.unsplash.com/photo-1613040809024-b4ef7ba99bc3?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8YWlycG9kc3xlbnwwfHwwfHx8MA%3D%3D",
  },
  {
    name: "Mechanical Gaming Keyboard",
    price: 159.99,
    category: "Accessories",
    count: 8,
    image:
      "https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=800&auto=format&fit=crop&q=60",
  },
  {
    name: "Smart Watch Pro",
    price: 3999.99,
    category: "Gadgets",
    count: 5,
    image:
      "https://images.unsplash.com/photo-1546868871-7041f2a55e12?q=80&w=764&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    name: "4K Ultra HD Camera",
    price: 899.99,
    category: "Electronics",
    count: 0, // Out of stock example
    image:
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&auto=format&fit=crop&q=60",
  },
  {
    name: "Minimalist Backpack",
    price: 249.99,
    category: "Accessories",
    count: 20,
    image:
      "https://plus.unsplash.com/premium_photo-1723649902660-66643962d57b?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8YmFjayUyMGJhZ3xlbnwwfHwwfHx8MA%3D%3D",
  },
  {
    name: "Wireless Gaming Mouse",
    price: 89.99,
    category: "Accessories",
    count: 12,
    image:
      "https://images.unsplash.com/photo-1527814050087-3793815479db?w=800&auto=format&fit=crop&q=60",
  },
  {
    name: "Smart Home Speaker",
    price: 159.99,
    category: "Gadgets",
    count: 7,
    image:
      "https://images.unsplash.com/photo-1589492477829-5e65395b66cc?w=800&auto=format&fit=crop&q=60",
  },
  {
    name: "LED Gaming Monitor",
    price: 449.99,
    category: "Electronics",
    count: 4,
    image:
      "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&auto=format&fit=crop&q=60",
  },
  {
    name: "iPad Pro",
    price: 2554.99,
    category: "Gadgets",
    count: 10,
    image:
      "https://images.unsplash.com/photo-1561154464-82e9adf32764?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
];

async function seedDatabase() {
  try {
    // Ensure the category, count, and image_public_id columns exist in the products table
    await sql`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS category VARCHAR(100),
      ADD COLUMN IF NOT EXISTS count INT DEFAULT 0,
      ADD COLUMN IF NOT EXISTS image_public_id TEXT;
    `;

    // Clear existing data and restart table identity/IDs
    await sql`TRUNCATE TABLE products RESTART IDENTITY`;

    // Insert all sample products including their categories and stock count into the database
    for (const product of SAMPLE_PRODUCTS) {
      await sql`
        INSERT INTO products (name, price, category, count, image)
        VALUES (${product.name}, ${product.price}, ${product.category}, ${product.count}, ${product.image})
      `;
    }

    console.log("Database seeded successfully with categories and stock counts");
    process.exit(0); // Success exit code
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1); // Failure exit code
  }
}

seedDatabase();