import { sql } from "../config/db.js";
import { deleteProductImage, uploadProductImage } from "../lib/cloudinary.js";

const normalizeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const getProducts = async (req, res) => {
  try {
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const category = typeof req.query.category === "string" ? req.query.category.trim() : "All";
    const sortBy = typeof req.query.sort === "string" ? req.query.sort : "newest";
    const page = Math.max(1, normalizeNumber(req.query.page, 1));
    const limit = Math.max(1, normalizeNumber(req.query.limit, 9));
    const offset = (page - 1) * limit;

    const minPrice = req.query.minPrice;
    const maxPrice = req.query.maxPrice;

    const conditions = [];
    const params = [];

    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      conditions.push(`LOWER(name) LIKE $${params.length}`);
    }

    if (category && category !== "All") {
      const normCat = category.toLowerCase();
      if (normCat === "low stock") {
        conditions.push(`"count" BETWEEN 1 AND 4`);
      } else if (normCat === "out of stock") {
        conditions.push(`"count" = 0`);
      } else {
        params.push(normCat);
        conditions.push(`LOWER(category) = $${params.length}`);
      }
    }

    if (minPrice !== undefined && minPrice !== "" && minPrice !== null) {
      params.push(Number(minPrice));
      conditions.push(`price >= $${params.length}`);
    }

    if (maxPrice !== undefined && maxPrice !== "" && maxPrice !== null) {
      params.push(Number(maxPrice));
      conditions.push(`price <= $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    let orderByClause = "ORDER BY created_at DESC, id DESC";
    if (sortBy === "price-asc") {
      orderByClause = "ORDER BY price ASC, id DESC";
    } else if (sortBy === "price-desc") {
      orderByClause = "ORDER BY price DESC, id DESC";
    } else if (sortBy === "oldest") {
      orderByClause = "ORDER BY created_at ASC, id ASC";
    } else if (sortBy === "stock") {
      orderByClause = 'ORDER BY "count" DESC, id DESC';
    }

    const productsQuery = `
      SELECT id, name, price, category, "count", image, image_public_id, created_at
      FROM products
      ${whereClause}
      ${orderByClause}
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    const products = await sql.query(productsQuery, [...params, limit, offset]);

    const countQuery = `
      SELECT COUNT(*)::int AS total
      FROM products
      ${whereClause}
    `;

    const countResult = await sql.query(countQuery, params);
    const totalProducts = Number(countResult[0]?.total ?? 0);
    const totalPages = Math.max(1, Math.ceil(totalProducts / limit));

    const facetsResult = await sql`
      SELECT category, COUNT(*)::int AS count
      FROM products
      GROUP BY category
      ORDER BY category
    `;

    const lowStockResult = await sql`
      SELECT COUNT(*)::int AS count
      FROM products
      WHERE "count" BETWEEN 1 AND 4
    `;

    const outOfStockResult = await sql`
      SELECT COUNT(*)::int AS count
      FROM products
      WHERE "count" = 0
    `;

    const globalCountResult = await sql`
      SELECT COUNT(*)::int AS count
      FROM products
    `;

    const inventoryValueQuery = `
      SELECT COALESCE(SUM(price * "count"), 0)::float AS inventory_value
      FROM products
      ${whereClause}
    `;
    const inventoryValueResult = await sql.query(inventoryValueQuery, params);

    const facets = [
      { category: "All", count: Number(globalCountResult[0]?.count ?? 0) },
      ...facetsResult.map((row) => ({
        category: String(row.category ?? "").trim(),
        count: Number(row.count ?? 0),
      })),
      { category: "Low Stock", count: Number(lowStockResult[0]?.count ?? 0) },
      { category: "Out of Stock", count: Number(outOfStockResult[0]?.count ?? 0) },
    ].filter((item, index, items) => {
      const key = String(item.category ?? "").trim().toLowerCase();
      return key && items.findIndex((entry) => String(entry.category ?? "").trim().toLowerCase() === key) === index;
    });

    return res.status(200).json({
      success: true,
      data: products,
      facets,
      summary: {
        totalProducts: Number(globalCountResult[0]?.count ?? 0),
        inventoryValue: Number(inventoryValueResult[0]?.inventory_value ?? 0),
      },
      pagination: {
        currentPage: page,
        totalPages,
        totalProducts,
        limit,
      },
    });
  } catch (error) {
    console.error("Error in getProducts:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await sql`
      SELECT id, name, price, category, "count", image, created_at
      FROM products
      WHERE id = ${Number(id)}
      LIMIT 1
    `;

    if (!result.length) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    return res.status(200).json({ success: true, data: result[0] });
  } catch (error) {
    console.error("Error in getProduct:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const createProduct = async (req, res) => {
  let uploadedImage;

  try {
    const { name, price, category = "General", count = 0 } = req.body ?? {};

    const parsedPrice = Number(price);
    const parsedCount = Number(count);

    if (!name || !String(name).trim()) {
      return res.status(400).json({ success: false, message: "Product name is required" });
    }

    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({ success: false, message: "A valid price is required" });
    }

    if (!Number.isInteger(parsedCount) || parsedCount < 0) {
      return res.status(400).json({ success: false, message: "Count must be a valid non-negative integer" });
    }

    if (req.file?.buffer) {
      uploadedImage = await uploadProductImage(req.file.buffer);
    }

    const imageValue = uploadedImage?.secure_url
      ?? (typeof req.body?.image === "string" && req.body.image)
      ?? "https://placehold.co/600x400?text=Product";
    const imagePublicId = uploadedImage?.public_id ?? null;

    const result = await sql`
      INSERT INTO products (name, price, category, "count", image, image_public_id)
      VALUES (${String(name).trim()}, ${parsedPrice}, ${String(category).trim() || "General"}, ${parsedCount}, ${imageValue}, ${imagePublicId})
      RETURNING *
    `;

    return res.status(201).json({ success: true, data: result[0], message: "Product created successfully" });
  } catch (error) {
    console.error("Error in createProduct:", error);

    if (uploadedImage?.public_id) {
      try {
        await deleteProductImage(uploadedImage.public_id);
      } catch (cleanupError) {
        console.error("Failed to clean up uploaded product image after create failure:", cleanupError);
      }
    }

    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const updateProduct = async (req, res) => {
  let uploadedImage;

  try {
    const { id } = req.params;
    const { name, price, category, count, image } = req.body ?? {};

    const existing = await sql`
      SELECT id, image_public_id FROM products WHERE id = ${Number(id)}
    `;

    if (!existing.length) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const safeName = typeof name === "string" ? name.trim() : undefined;
    const safeCategory = typeof category === "string" ? category.trim() : undefined;
    const safePrice = price !== undefined ? Number(price) : undefined;
    const safeCount = count !== undefined ? Number(count) : undefined;

    if (safeName !== undefined && !safeName) {
      return res.status(400).json({ success: false, message: "Product name cannot be empty" });
    }

    if (safePrice !== undefined && (!Number.isFinite(safePrice) || safePrice < 0)) {
      return res.status(400).json({ success: false, message: "Price must be a valid number" });
    }

    if (safeCount !== undefined && (!Number.isInteger(safeCount) || safeCount < 0)) {
      return res.status(400).json({ success: false, message: "Count must be a valid non-negative integer" });
    }

    if (req.file?.buffer) {
      uploadedImage = await uploadProductImage(req.file.buffer);
    }

    const nextImage = uploadedImage?.secure_url
      ?? (typeof image === "string" && image ? image : undefined);

    const updateValues = {
      ...(safeName !== undefined ? { name: safeName } : {}),
      ...(safePrice !== undefined ? { price: safePrice } : {}),
      ...(safeCategory !== undefined ? { category: safeCategory || "General" } : {}),
      ...(safeCount !== undefined ? { count: safeCount } : {}),
      ...(nextImage !== undefined ? { image: nextImage } : {}),
      ...(uploadedImage ? { image_public_id: uploadedImage.public_id } : {}),
    };

    if (Object.keys(updateValues).length === 0) {
      return res.status(400).json({ success: false, message: "No valid product fields provided" });
    }

    const fields = Object.entries(updateValues);
    const assignments = fields.map(([key], index) => `"${key}" = $${index + 1}`);
    const values = fields.map(([, value]) => value);
    values.push(Number(id));

    const updateQuery = `UPDATE products SET ${assignments.join(", ")} WHERE id = $${values.length} RETURNING *`;
    const result = await sql.query(updateQuery, values);

    const oldPublicId = existing[0].image_public_id;
    if (uploadedImage?.public_id && oldPublicId && oldPublicId !== uploadedImage.public_id) {
      try {
        await deleteProductImage(oldPublicId);
      } catch (cleanupError) {
        console.error("Product was updated, but the old Cloudinary image could not be deleted:", cleanupError);
      }
    }

    return res.status(200).json({ success: true, data: result[0], message: "Product updated successfully" });
  } catch (error) {
    console.error("Error in updateProduct:", error);

    if (uploadedImage?.public_id) {
      try {
        await deleteProductImage(uploadedImage.public_id);
      } catch (cleanupError) {
        console.error("Failed to clean up new Cloudinary image after product update failure:", cleanupError);
      }
    }

    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await sql`
      SELECT image_public_id
      FROM products
      WHERE id = ${Number(id)}
      LIMIT 1
    `;

    if (!existing.length) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const publicId = existing[0].image_public_id;
    if (publicId) {
      const references = await sql`
        SELECT COUNT(*)::int AS total
        FROM products
        WHERE image_public_id = ${publicId}
      `;

      if (Number(references[0]?.total ?? 0) === 1) {
        await deleteProductImage(publicId);
      }
    }

    const result = await sql`
      DELETE FROM products
      WHERE id = ${Number(id)}
      RETURNING *
    `;

    if (!result.length) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    return res.status(200).json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error in deleteProduct:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getActivityLogs = async (_req, res) => {
  try {
    const logs = await sql`
      SELECT id, action, product_name, details, created_at
      FROM activity_logs
      ORDER BY created_at DESC
      LIMIT 20
    `;

    return res.status(200).json({ success: true, data: logs });
  } catch (error) {
    console.error("Error in getActivityLogs:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

  export const cloneProduct = async (req, res) => {
  try {
    const { id } = req.params;

  
    const original = await sql`
      SELECT name, price, category, "count", image, image_public_id
      FROM products
      WHERE id = ${Number(id)}
      LIMIT 1
    `;

    if (!original.length) {
      return res.status(404).json({ success: false, message: "Product not found to clone" });
    }

    const prod = original[0];
    const clonedName = `${prod.name} (Copy)`;
 
    const result = await sql`
      INSERT INTO products (name, price, category, "count", image, image_public_id)
      VALUES (${clonedName}, ${prod.price}, ${prod.category}, ${prod.count}, ${prod.image}, ${prod.image_public_id})
      RETURNING *
    `;

    return res.status(201).json({
      success: true,
      data: result[0],
      message: "Product cloned successfully",
    });
  } catch (error) {
    console.error("Error in cloneProduct:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};