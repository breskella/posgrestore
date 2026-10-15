import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import dotenv from "dotenv";

import { aj } from "./lib/arcjet.js";
import productRoutes from "./routes/productRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import { sql } from "./config/db.js";

dotenv.config();

const SAMPLE_PRODUCTS = [
    {
        name: "Premium Wireless Headphones",
        price: 1799.99,
        category: "Electronics",
        count: 15,
        image: "https://images.unsplash.com/photo-1613040809024-b4ef7ba99bc3?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8YWlycG9kc3xlbnwwfHwwfHx8MA%3D%3D",
    },
    {
        name: "Mechanical Gaming Keyboard",
        price: 159.99,
        category: "Accessories",
        count: 8,
        image: "https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=800&auto=format&fit=crop&q=60",
    },
    {
        name: "Smart Watch Pro",
        price: 3999.99,
        category: "Gadgets",
        count: 5,
        image: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?q=80&w=764&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    {
        name: "4K Ultra HD Camera",
        price: 899.99,
        category: "Electronics",
        count: 0,
        image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&auto=format&fit=crop&q=60",
    },
    {
        name: "Minimalist Backpack",
        price: 249.99,
        category: "Accessories",
        count: 20,
        image: "https://plus.unsplash.com/premium_photo-1723649902660-66643962d57b?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8YmFjayUyMGJhZ3xlbnwwfHwwfHx8MA%3D%3D",
    },
    {
        name: "Wireless Gaming Mouse",
        price: 89.99,
        category: "Accessories",
        count: 12,
        image: "https://images.unsplash.com/photo-1527814050087-3793815479db?w=800&auto=format&fit=crop&q=60",
    },
    {
        name: "Smart Home Speaker",
        price: 159.99,
        category: "Gadgets",
        count: 7,
        image: "https://images.unsplash.com/photo-1589492477829-5e65395b66cc?w=800&auto=format&fit=crop&q=60",
    },
    {
        name: "LED Gaming Monitor",
        price: 449.99,
        category: "Electronics",
        count: 4,
        image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&auto=format&fit=crop&q=60",
    },
    {
        name: "iPad Pro",
        price: 2554.99,
        category: "Gadgets",
        count: 10,
        image: "https://images.unsplash.com/photo-1561154464-82e9adf32764?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
];

const app = express();
const PORT = process.env.PORT || 3000;

console.log(PORT);

app.use(express.json());
app.use(
    cors({
        origin: true,
        credentials: true,
    })
);
// helmet is a security middleware that helps you protect your app by setting various HTTP headers
app.use(helmet());

// log the requests
app.use(morgan("dev"));

// apply arcjet rate-limit and bot protection to all routes
app.use(async (req, res, next) => {
    try {
        const decision = await aj.protect(req, {
            requested: 1 // specifies that each request consumes 1 token
        });

        if (decision.isDenied()) {
            if (decision.reason.isRateLimit()) {
                res.status(429).json({
                    error: "Too many requests. Please try again later."
                });
            } else if (decision.reason.isBot()) {
                res.status(403).json({
                    error: "Bot access denied"
                });
            } else {
                res.status(403).json({
                    error: "Forbidden"
                });
            }
            return;
        }

        // check for spoofed bots
        if (decision.results.some((result) => result.reason.isBot() && result.reason.isSpoofed())) {
            res.status(403).json({
                error: "Spoofed bot detected"
            });
            return;
        }

        next();
    } catch (error) {
        console.log("Arcjet error:", error);
        next(error);
    }
});

app.use("/api/products", productRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

async function initDB() {
    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            // 1. Create products table if not exists
            await sql`
                CREATE TABLE IF NOT EXISTS products (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    image TEXT NOT NULL,
                    price DECIMAL(10, 2) NOT NULL,
                    category VARCHAR(100),
                    count INTEGER NOT NULL DEFAULT 0 CHECK (count >= 0),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `;

            await sql`ALTER TABLE products ALTER COLUMN image TYPE TEXT`;
            await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS category VARCHAR(100)`;
            await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS count INTEGER DEFAULT 0`;
            await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS image_public_id TEXT`;
            await sql`UPDATE products SET count = 0 WHERE count IS NULL`;
            await sql`ALTER TABLE products ALTER COLUMN count SET NOT NULL`;

            // Clean up any legacy heavy Base64 images that cause socket timeout / 500 payload errors
            await sql`
                UPDATE products
                SET image = 'https://images.unsplash.com/photo-1613040809024-b4ef7ba99bc3?w=600&auto=format&fit=crop&q=60'
                WHERE image LIKE 'data:image%' OR LENGTH(image) > 1000
            `;

            await sql`CREATE INDEX IF NOT EXISTS products_category_created_at_idx ON products (category, created_at DESC)`;
            await sql`CREATE INDEX IF NOT EXISTS products_count_created_at_idx ON products (count, created_at DESC)`;
            try {
                await sql`CREATE EXTENSION IF NOT EXISTS pg_trgm`;
                await sql`CREATE INDEX IF NOT EXISTS products_name_trgm_idx ON products USING GIN (name gin_trgm_ops)`;
            } catch (indexError) {
                console.warn("Could not enable trigram search index:", indexError.message);
            }

            // 2. Create activity_logs table if not exists
            await sql`
                CREATE TABLE IF NOT EXISTS activity_logs (
                    id SERIAL PRIMARY KEY,
                    action VARCHAR(50) NOT NULL,
                    product_name VARCHAR(255) NOT NULL,
                    details TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `;

            // 3. Create users table if not exists
            await sql`
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    username VARCHAR(100) NOT NULL,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    password VARCHAR(255) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `;

            // Ensure columns exist even if the table was already created before
            await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_hash VARCHAR(255)`;
            await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires_at TIMESTAMPTZ`;
            await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_approval_token_hash VARCHAR(255)`;
            await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_approval_expires_at TIMESTAMPTZ`;
            await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ`;
            await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_version INTEGER NOT NULL DEFAULT 1`;

            await sql`CREATE INDEX IF NOT EXISTS users_reset_token_hash_idx ON users (reset_token_hash)`;
            await sql`CREATE INDEX IF NOT EXISTS users_reset_approval_token_hash_idx ON users (reset_approval_token_hash)`;
            await sql`CREATE INDEX IF NOT EXISTS users_email_lower_idx ON users (LOWER(email))`;

            const productCount = await sql`SELECT COUNT(*)::int AS total FROM products`;
            if (Number(productCount[0]?.total ?? 0) === 0) {
                await sql`TRUNCATE TABLE products RESTART IDENTITY`;
                for (const product of SAMPLE_PRODUCTS) {
                    await sql`
                        INSERT INTO products (name, price, category, count, image)
                        VALUES (${product.name}, ${product.price}, ${product.category}, ${product.count}, ${product.image})
                    `;
                }
                console.log("Seeded demo products because the inventory was empty");
            }

            console.log("Database and tables initialized successfully");
            break;
        } catch (error) {
            console.log(`Error initDB (Attempt ${attempt}/${maxRetries}):`, error.message || error);
            if (attempt === maxRetries) {
                console.error("Failed to initialize database after maximum retries.");
            } else {
                console.log(`Retrying database connection in 3 seconds...`);
                await new Promise((resolve) => setTimeout(resolve, 3000));
            }
        }
    }
}

initDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
});