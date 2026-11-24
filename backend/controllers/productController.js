import { sql } from "../config/db.js";
import { deleteProductImage, uploadProductImage } from "../lib/cloudinary.js";

const normalizeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getOrderByClause = (sortBy) => {
  switch (sortBy) {
    case "price-asc":
      return "ORDER BY p.price ASC, p.id DESC";
    case "price-desc":
      return "ORDER BY p.price DESC, p.id DESC";
    case "oldest":
      return "ORDER BY p.created_at ASC, p.id ASC";
    case "stock":
      return 'ORDER BY p."count" DESC, p.id DESC';
    default:
      return "ORDER BY p.created_at DESC, p.id DESC";
  }
};

const buildProductFilters = ({ storeId = null, search = "", category = "All", minPrice, maxPrice }) => {
  const conditions = [];
  const params = [];

  if (storeId !== null && storeId !== undefined) {
    params.push(Number(storeId));
    conditions.push(`p.store_id = $${params.length}`);
  }

  if (search) {
    params.push(`%${search.toLowerCase()}%`);
    conditions.push(`LOWER(p.name) LIKE $${params.length}`);
  }

  if (category && category !== "All") {
    const normCat = category.toLowerCase();
    if (normCat === "low stock") {
      conditions.push(`p."count" BETWEEN 1 AND 4`);
    } else if (normCat === "out of stock") {
      conditions.push(`p."count" = 0`);
    } else {
      params.push(normCat);
      conditions.push(`LOWER(p.category) = $${params.length}`);
    }
  }

  if (minPrice !== undefined && minPrice !== "" && minPrice !== null) {
    const parsedMin = Number(minPrice);
    if (Number.isFinite(parsedMin)) {
      params.push(parsedMin);
      conditions.push(`p.price >= $${params.length}`);
    }
  }

  if (maxPrice !== undefined && maxPrice !== "" && maxPrice !== null) {
    const parsedMax = Number(maxPrice);
    if (Number.isFinite(parsedMax)) {
      params.push(parsedMax);
      conditions.push(`p.price <= $${params.length}`);
    }
  }

  return {
    whereClause: conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "",
    params,
  };
};

const resolvePublicStoreFilter = async (req) => {
  const rawSlug = typeof req.query.storeSlug === "string" ? req.query.storeSlug.trim().toLowerCase() : "";
  if (rawSlug) {
    const stores = await sql`SELECT id FROM stores WHERE LOWER(slug) = ${rawSlug} LIMIT 1`;
    if (!stores.length) {
      return { errorStatus: 404, errorMessage: "Store not found" };
    }
    return { storeId: Number(stores[0].id) };
  }

  if (req.query.storeId !== undefined && req.query.storeId !== "") {
    const parsedStoreId = Number(req.query.storeId);
    if (!Number.isInteger(parsedStoreId) || parsedStoreId <= 0) {
      return { errorStatus: 400, errorMessage: "Invalid storeId parameter" };
    }
    return { storeId: parsedStoreId };
  }

  if (req.user?.role === "store_admin" && req.store?.id) {
    return { storeId: Number(req.store.id) };
  }

  return { storeId: null };
};

export const logActivity = async (action, productName, details = "", storeId = null) => {
  try {
    const cleanAction = String(action || "").toUpperCase().slice(0, 50);
    const cleanName = String(productName || "Unknown Product").slice(0, 255);
    const cleanDetails = details ? String(details) : null;
    const cleanStoreId = storeId ? Number(storeId) : null;

    const res = await sql`
      INSERT INTO activity_logs (store_id, action, product_name, details)
      VALUES (${cleanStoreId}, ${cleanAction}, ${cleanName}, ${cleanDetails})
      RETURNING *
    `;
    console.log(`[ACTIVITY LOG SUCCESS] Recorded ${cleanAction} for "${cleanName}":`, res[0]);
    return res[0];
  } catch (error) {
    console.error(`[ACTIVITY LOG ERROR] Failed to record activity log [${action}] for "${productName}":`, {
      message: error?.message,
      code: error?.code,
      detail: error?.detail,
    });
  }
};

export const getProducts = async (req, res) => {
  try {
    const storeFilter = await resolvePublicStoreFilter(req);
    if (storeFilter.errorStatus) {
      return res.status(storeFilter.errorStatus).json({
        success: false,
        message: storeFilter.errorMessage,
      });
    }

    const effectiveStoreId = storeFilter.storeId;
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const category = typeof req.query.category === "string" ? req.query.category.trim() : "All";
    const sortBy = typeof req.query.sort === "string" ? req.query.sort : "newest";
    const page = Math.max(1, normalizeNumber(req.query.page, 1));
    const limit = Math.max(1, normalizeNumber(req.query.limit, 9));
    const offset = (page - 1) * limit;

    const { whereClause, params } = buildProductFilters({
      storeId: effectiveStoreId,
      search,
      category,
      minPrice: req.query.minPrice,
      maxPrice: req.query.maxPrice,
    });

    const orderByClause = getOrderByClause(sortBy);

    const productsQuery = `
      SELECT
        p.id,
        p.store_id,
        p.name,
        p.price,
        p.category,
        p."count",
        p.image,
        p.image_public_id,
        p.created_at,
        s.name AS store_name,
        s.slug AS store_slug
      FROM products p
      LEFT JOIN stores s ON s.id = p.store_id
      ${whereClause}
      ${orderByClause}
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    const products = await sql.query(productsQuery, [...params, limit, offset]);

    const countQuery = `
      SELECT COUNT(*)::int AS total
      FROM products p
      ${whereClause}
    `;
    const countResult = await sql.query(countQuery, params);
    const totalProducts = Number(countResult[0]?.total ?? 0);
    const totalPages = Math.max(1, Math.ceil(totalProducts / limit));

    const storeParams = effectiveStoreId !== null ? [effectiveStoreId] : [];
    const storeWhere = effectiveStoreId !== null ? "WHERE store_id = $1" : "";
    const storeAnd = effectiveStoreId !== null ? "AND store_id = $1" : "";

    const facetsResult = await sql.query(
      `SELECT category, COUNT(*)::int AS count FROM products ${storeWhere} GROUP BY category ORDER BY category`,
      storeParams
    );

    const lowStockResult = await sql.query(
      `SELECT COUNT(*)::int AS count FROM products WHERE "count" BETWEEN 1 AND 4 ${storeAnd}`,
      storeParams
    );

    const outOfStockResult = await sql.query(
      `SELECT COUNT(*)::int AS count FROM products WHERE "count" = 0 ${storeAnd}`,
      storeParams
    );

    const globalCountResult = await sql.query(
      `SELECT COUNT(*)::int AS count FROM products ${storeWhere}`,
      storeParams
    );

    const inventoryValueQuery = `
      SELECT COALESCE(SUM(p.price * p."count"), 0)::float AS inventory_value
      FROM products p
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

export const exportProductsCsv = async (req, res) => {
  try {
    const storeId = req.store?.id ? Number(req.store.id) : null;
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const category = typeof req.query.category === "string" ? req.query.category.trim() : "All";
    const sortBy = typeof req.query.sort === "string" ? req.query.sort : "newest";

    const { whereClause, params } = buildProductFilters({
      storeId,
      search,
      category,
      minPrice: req.query.minPrice,
      maxPrice: req.query.maxPrice,
    });

    const orderByClause = getOrderByClause(sortBy);
    const productsQuery = `
      SELECT p.name, p.category, p.price, p."count"
      FROM products p
      ${whereClause}
      ${orderByClause}
      LIMIT 5000
    `;

    const exportData = await sql.query(productsQuery, params);
    const headers = ["Product Name", "Category", "Price ($)", "Stock Count", "Status"];
    const rows = exportData.map((p) => {
      const count = Number(p.count ?? 0);
      const status = count === 0 ? "Out of Stock" : count < 5 ? "Low Stock" : "In Stock";
      const safeName = `"${String(p.name || "").replace(/"/g, '""')}"`;
      const safeCategory = `"${String(p.category || "General").replace(/"/g, '""')}"`;
      const price = Number(p.price || 0).toFixed(2);
      return [safeName, safeCategory, price, count, `"${status}"`].join(",");
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="products_export.csv"');
    return res.status(200).send(csvContent);
  } catch (error) {
    console.error("Error in exportProductsCsv:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getProduct = async (req, res) => {
  try {
    const parsedId = Number(req.params.id);
    if (!Number.isInteger(parsedId) || parsedId <= 0) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }

    const result = await sql`
      SELECT
        p.id,
        p.store_id,
        p.name,
        p.price,
        p.category,
        p."count",
        p.image,
        p.created_at,
        s.name AS store_name,
        s.slug AS store_slug
      FROM products p
      LEFT JOIN stores s ON s.id = p.store_id
      WHERE p.id = ${parsedId}
      LIMIT 1
    `;

    if (!result.length) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const product = result[0];
    if (
      req.user?.role === "store_admin" &&
      req.store?.id &&
      req.query.public !== "true" &&
      Number(product.store_id) !== Number(req.store.id)
    ) {
      return res.status(403).json({
        success: false,
        message: "Forbidden - You do not have access to this store's product",
      });
    }

    return res.status(200).json({ success: true, data: product });
  } catch (error) {
    console.error("Error in getProduct:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const createProduct = async (req, res) => {
  let uploadedImage;

  try {
    const storeId = req.store?.id ? Number(req.store.id) : null;
    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: "Store context is required to create a product",
      });
    }

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
      INSERT INTO products (store_id, name, price, category, "count", image, image_public_id)
      VALUES (${storeId}, ${String(name).trim()}, ${parsedPrice}, ${String(category).trim() || "General"}, ${parsedCount}, ${imageValue}, ${imagePublicId})
      RETURNING *
    `;

    const createdProduct = result[0];
    await logActivity(
      "ADD",
      createdProduct.name,
      `Added to ${createdProduct.category} (Price: $${Number(createdProduct.price).toFixed(2)}, Qty: ${createdProduct.count})`,
      storeId
    );

    return res.status(201).json({ success: true, data: createdProduct, message: "Product created successfully" });
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
    const parsedId = Number(req.params.id);
    if (!Number.isInteger(parsedId) || parsedId <= 0) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }

    const scopedStoreId = req.store?.id ? Number(req.store.id) : null;
    const { name, price, category, count, image } = req.body ?? {};

    const existing = scopedStoreId !== null
      ? await sql`
          SELECT id, store_id, name, price, category, "count", image_public_id
          FROM products
          WHERE id = ${parsedId} AND store_id = ${scopedStoreId}
          LIMIT 1
        `
      : await sql`
          SELECT id, store_id, name, price, category, "count", image_public_id
          FROM products
          WHERE id = ${parsedId}
          LIMIT 1
        `;

    if (!existing.length) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const currentProd = existing[0];

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
    values.push(parsedId);

    let whereCondition = `WHERE id = $${values.length}`;
    if (scopedStoreId !== null) {
      values.push(scopedStoreId);
      whereCondition += ` AND store_id = $${values.length}`;
    }

    const updateQuery = `UPDATE products SET ${assignments.join(", ")} ${whereCondition} RETURNING *`;
    const result = await sql.query(updateQuery, values);
    const updatedProd = result[0];

    const oldPublicId = existing[0].image_public_id;
    if (uploadedImage?.public_id && oldPublicId && oldPublicId !== uploadedImage.public_id) {
      try {
        await deleteProductImage(oldPublicId);
      } catch (cleanupError) {
        console.error("Product was updated, but the old Cloudinary image could not be deleted:", cleanupError);
      }
    }

    const changedSummary = [];
    if (safeName !== undefined && safeName !== currentProd.name) changedSummary.push(`Name changed to "${safeName}"`);
    if (safePrice !== undefined && safePrice !== Number(currentProd.price)) changedSummary.push(`Price: $${safePrice}`);
    if (safeCategory !== undefined && safeCategory !== currentProd.category) changedSummary.push(`Category: "${safeCategory}"`);
    if (safeCount !== undefined && safeCount !== currentProd.count) changedSummary.push(`Qty: ${safeCount}`);
    if (nextImage !== undefined) changedSummary.push("Image updated");

    const details = changedSummary.length > 0
      ? `Updated: ${changedSummary.join(", ")}`
      : `Updated fields: ${Object.keys(updateValues).join(", ")}`;

    await logActivity("UPDATE", updatedProd?.name || currentProd.name, details, updatedProd?.store_id ?? currentProd.store_id);

    return res.status(200).json({ success: true, data: updatedProd, message: "Product updated successfully" });
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
    const parsedId = Number(req.params.id);

    if (!Number.isInteger(parsedId) || parsedId <= 0) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }

    const scopedStoreId = req.store?.id ? Number(req.store.id) : null;
    const existing = scopedStoreId !== null
      ? await sql`
          SELECT id, store_id, name, category, image_public_id
          FROM products
          WHERE id = ${parsedId} AND store_id = ${scopedStoreId}
          LIMIT 1
        `
      : await sql`
          SELECT id, store_id, name, category, image_public_id
          FROM products
          WHERE id = ${parsedId}
          LIMIT 1
        `;

    if (!existing.length) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const productToDelete = existing[0];
    const publicId = productToDelete.image_public_id;
    if (publicId) {
      try {
        const references = await sql`
          SELECT COUNT(*)::int AS total
          FROM products
          WHERE image_public_id = ${publicId}
        `;

        if (Number(references[0]?.total ?? 0) === 1) {
          await deleteProductImage(publicId);
        }
      } catch (imgCleanupErr) {
        console.warn("Could not clean up Cloudinary image during delete (proceeding with DB deletion):", imgCleanupErr?.message || imgCleanupErr);
      }
    }

    const result = scopedStoreId !== null
      ? await sql`
          DELETE FROM products
          WHERE id = ${parsedId} AND store_id = ${scopedStoreId}
          RETURNING *
        `
      : await sql`
          DELETE FROM products
          WHERE id = ${parsedId}
          RETURNING *
        `;

    if (!result.length) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const deletedItem = result[0] || productToDelete;
    const isCloned = String(deletedItem.name).toLowerCase().includes("copy");
    const logDetails = isCloned
      ? `Deleted duplicate product from ${deletedItem.category || "inventory"} (ID: ${deletedItem.id})`
      : `Deleted from ${deletedItem.category || "inventory"} (ID: ${deletedItem.id})`;

    await logActivity("DELETE", deletedItem.name, logDetails, deletedItem.store_id ?? productToDelete.store_id);

    return res.status(200).json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error in deleteProduct:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getActivityLogs = async (req, res) => {
  try {
    const scopedStoreId = req.store?.id ? Number(req.store.id) : null;

    const logs = scopedStoreId !== null
      ? await sql`
          SELECT id, store_id, action, product_name, details, created_at
          FROM activity_logs
          WHERE store_id = ${scopedStoreId}
          ORDER BY created_at DESC
          LIMIT 50
        `
      : await sql`
          SELECT id, store_id, action, product_name, details, created_at
          FROM activity_logs
          ORDER BY created_at DESC
          LIMIT 50
        `;

    return res.status(200).json({ success: true, data: logs });
  } catch (error) {
    console.error("Error in getActivityLogs:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const cloneProduct = async (req, res) => {
  try {
    const parsedId = Number(req.params.id);
    if (!Number.isInteger(parsedId) || parsedId <= 0) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }

    const scopedStoreId = req.store?.id ? Number(req.store.id) : null;
    const original = scopedStoreId !== null
      ? await sql`
          SELECT store_id, name, price, category, "count", image, image_public_id
          FROM products
          WHERE id = ${parsedId} AND store_id = ${scopedStoreId}
          LIMIT 1
        `
      : await sql`
          SELECT store_id, name, price, category, "count", image, image_public_id
          FROM products
          WHERE id = ${parsedId}
          LIMIT 1
        `;

    if (!original.length) {
      return res.status(404).json({ success: false, message: "Product not found to clone" });
    }

    const prod = original[0];
    const targetStoreId = scopedStoreId ?? prod.store_id;
    const clonedName = `${prod.name} (Copy)`;

    const result = await sql`
      INSERT INTO products (store_id, name, price, category, "count", image, image_public_id)
      VALUES (${targetStoreId}, ${clonedName}, ${prod.price}, ${prod.category}, ${prod.count}, ${prod.image}, ${prod.image_public_id})
      RETURNING *
    `;

    await logActivity(
      "ADD",
      clonedName,
      `Cloned from "${prod.name}" (Price: $${Number(prod.price).toFixed(2)}, Qty: ${prod.count})`,
      targetStoreId
    );

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
