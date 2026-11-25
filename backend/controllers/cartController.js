import { sql } from "../config/db.js";

const getOrCreateCart = async (userId) => {
  await sql`
    INSERT INTO carts (user_id)
    VALUES (${userId})
    ON CONFLICT (user_id) DO NOTHING
  `;
  const rows = await sql`SELECT id, store_id FROM carts WHERE user_id = ${userId} LIMIT 1`;
  if (!rows.length) throw new Error("Could not initialize the user's cart");
  return rows[0];
};

const getStoreForProduct = async (productId) => {
  const rows = await sql`
    SELECT
      p.id AS product_id,
      p.name,
      p.price,
      p.image AS image_url,
      p."count" AS stock_count,
      p.category,
      p.description,
      p.store_id,
      s.name AS store_name,
      s.slug AS store_slug,
      s.subscription_status
    FROM products p
    LEFT JOIN stores s ON s.id = p.store_id
    WHERE p.id = ${productId}
    LIMIT 1
  `;

  if (!rows.length) {
    return { errorStatus: 404, message: "Product not found" };
  }

  const product = rows[0];
  if (
    !product.store_id ||
    !product.store_name ||
    !["trial", "active"].includes(product.subscription_status)
  ) {
    return { errorStatus: 400, message: "This product's store is not currently available" };
  }

  if (Number(product.stock_count) <= 0) {
    return { errorStatus: 400, message: "This product is out of stock" };
  }

  return { product };
};

const getCartItems = async (cartId) => sql`
  SELECT
    ci.id AS item_id,
    ci.product_id,
    ci.quantity,
    ci.created_at,
    ci.updated_at,
    p.name,
    p.price,
    p.image AS image_url,
    p.image,
    p."count" AS stock_count,
    p."count" AS count,
    p.category,
    p.description,
    p.store_id,
    s.name AS store_name,
    s.slug AS store_slug,
    s.subscription_status,
    (p.price * ci.quantity)::numeric(12, 2) AS subtotal
  FROM cart_items ci
  JOIN products p ON p.id = ci.product_id
  LEFT JOIN stores s ON s.id = p.store_id
  WHERE ci.cart_id = ${cartId}
  ORDER BY ci.created_at ASC, ci.id ASC
`;

const readCart = async (userId, { reconcile = false } = {}) => {
  const cart = await getOrCreateCart(userId);
  let rows = await getCartItems(cart.id);
  const adjustments = [];

  if (reconcile) {
    for (const item of rows) {
      if (!item.store_id || !["trial", "active"].includes(item.subscription_status)) {
        await sql`DELETE FROM cart_items WHERE id = ${item.item_id} AND cart_id = ${cart.id}`;
        adjustments.push(`${item.name} was removed because its store is unavailable.`);
      } else {
        const available = Math.max(0, Number(item.stock_count));
        if (available === 0) {
          await sql`DELETE FROM cart_items WHERE id = ${item.item_id} AND cart_id = ${cart.id}`;
          adjustments.push(`${item.name} was removed because it is out of stock.`);
        } else if (Number(item.quantity) > available) {
          await sql`
            UPDATE cart_items
            SET quantity = ${available}, updated_at = CURRENT_TIMESTAMP
            WHERE id = ${item.item_id} AND cart_id = ${cart.id}
          `;
          adjustments.push(`${item.name} quantity was adjusted to ${available} to match current stock.`);
        }
      }
    }

    rows = await getCartItems(cart.id);
    const activeStoreId = rows[0]?.store_id ?? null;
    await sql`
      UPDATE carts
      SET store_id = ${activeStoreId}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${cart.id}
    `;
  }

  const items = rows.map((item) => ({
    ...item,
    item_id: Number(item.item_id),
    product_id: Number(item.product_id),
    quantity: Number(item.quantity),
    price: Number(item.price),
    stock_count: Number(item.stock_count),
    count: Number(item.count),
    store_id: Number(item.store_id),
    subtotal: Number(item.subtotal),
  }));
  const totalItems = items.reduce((total, item) => total + item.quantity, 0);
  const subtotal = items.reduce((total, item) => total + item.subtotal, 0);
  const firstItem = items[0];

  return {
    id: Number(cart.id),
    store_id: firstItem?.store_id ?? null,
    store: firstItem
      ? { id: firstItem.store_id, name: firstItem.store_name, slug: firstItem.store_slug }
      : null,
    items,
    totalItems,
    subtotal: Number(subtotal.toFixed(2)),
    adjustments,
  };
};

const getCartStore = async (cartId) => {
  const rows = await sql`
    SELECT s.id, s.name, s.slug
    FROM carts c
    JOIN stores s ON s.id = c.store_id
    WHERE c.id = ${cartId}
    LIMIT 1
  `;
  return rows[0] ?? null;
};

const sendStoreConflict = async (res, cartId) => {
  const activeStore = await getCartStore(cartId);
  return res.status(409).json({
    success: false,
    code: "DIFFERENT_STORE",
    message: "Your cart already contains items from another store.",
    activeStore,
  });
};

const validateQuantity = (quantity) => {
  const parsed = Number(quantity);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

export const getCart = async (req, res) => {
  try {
    const cart = await readCart(req.user.id, { reconcile: true });
    return res.status(200).json({ success: true, data: cart });
  } catch (error) {
    console.error("Error in getCart:", error);
    return res.status(500).json({ success: false, message: "Could not load cart" });
  }
};

export const addCartItem = async (req, res) => {
  try {
    const productId = Number(req.body?.productId);
    const quantity = validateQuantity(req.body?.quantity ?? 1);
    const replaceStore = req.body?.replaceStore === true;

    if (!Number.isInteger(productId) || productId <= 0 || !quantity) {
      return res.status(400).json({ success: false, message: "A valid productId and positive integer quantity are required" });
    }

    const lookup = await getStoreForProduct(productId);
    if (lookup.errorStatus) {
      return res.status(lookup.errorStatus).json({ success: false, message: lookup.message });
    }
    const { product } = lookup;
    if (quantity > Number(product.stock_count)) {
      return res.status(400).json({ success: false, message: `Only ${product.stock_count} item(s) are currently available` });
    }

    const cart = await getOrCreateCart(req.user.id);
    const existingRows = await getCartItems(cart.id);
    const existingStoreId = existingRows[0]?.store_id;
    if (existingStoreId && Number(existingStoreId) !== Number(product.store_id) && !replaceStore) {
      return sendStoreConflict(res, cart.id);
    }

    const existingItem = existingRows.find((item) => Number(item.product_id) === productId);
    const nextQuantity = Number(existingItem?.quantity ?? 0) + quantity;
    if (nextQuantity > Number(product.stock_count)) {
      return res.status(400).json({ success: false, message: `Only ${product.stock_count} item(s) are currently available` });
    }

    if (replaceStore && existingStoreId && Number(existingStoreId) !== Number(product.store_id)) {
      await sql`DELETE FROM cart_items WHERE cart_id = ${cart.id}`;
    }

    await sql`
      INSERT INTO cart_items (cart_id, product_id, quantity)
      VALUES (${cart.id}, ${productId}, ${quantity})
      ON CONFLICT (cart_id, product_id) DO UPDATE
      SET quantity = cart_items.quantity + EXCLUDED.quantity,
          updated_at = CURRENT_TIMESTAMP
    `;
    await sql`
      UPDATE carts
      SET store_id = ${product.store_id}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${cart.id}
    `;

    const data = await readCart(req.user.id);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Error in addCartItem:", error);
    return res.status(500).json({ success: false, message: "Could not add product to cart" });
  }
};

export const updateCartItem = async (req, res) => {
  try {
    const requestedId = Number(req.params.itemId);
    if (!Number.isInteger(requestedId) || requestedId <= 0) {
      return res.status(400).json({ success: false, message: "Invalid cart item ID" });
    }

    const quantity = Number(req.body?.quantity);
    if (!Number.isInteger(quantity)) {
      return res.status(400).json({ success: false, message: "Quantity must be an integer" });
    }

    const cart = await getOrCreateCart(req.user.id);
    const matchingItems = await sql`
      SELECT id, product_id
      FROM cart_items
      WHERE cart_id = ${cart.id}
        AND (id = ${requestedId} OR product_id = ${requestedId})
      ORDER BY CASE WHEN id = ${requestedId} THEN 0 ELSE 1 END
      LIMIT 1
    `;
    if (!matchingItems.length) {
      return res.status(404).json({ success: false, message: "Cart item not found" });
    }

    const item = matchingItems[0];
    if (quantity <= 0) {
      await sql`DELETE FROM cart_items WHERE id = ${item.id} AND cart_id = ${cart.id}`;
      const data = await readCart(req.user.id, { reconcile: true });
      return res.status(200).json({ success: true, data });
    }

    const lookup = await getStoreForProduct(Number(item.product_id));
    if (lookup.errorStatus) {
      return res.status(lookup.errorStatus).json({ success: false, message: lookup.message });
    }
    if (quantity > Number(lookup.product.stock_count)) {
      return res.status(400).json({
        success: false,
        message: `Only ${lookup.product.stock_count} item(s) are currently available`,
      });
    }

    await sql`
      UPDATE cart_items
      SET quantity = ${quantity}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${item.id} AND cart_id = ${cart.id}
    `;
    await sql`UPDATE carts SET updated_at = CURRENT_TIMESTAMP WHERE id = ${cart.id}`;
    const data = await readCart(req.user.id);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Error in updateCartItem:", error);
    return res.status(500).json({ success: false, message: "Could not update cart item" });
  }
};

export const removeCartItem = async (req, res) => {
  try {
    const requestedId = Number(req.params.itemId);
    if (!Number.isInteger(requestedId) || requestedId <= 0) {
      return res.status(400).json({ success: false, message: "Invalid cart item ID" });
    }

    const cart = await getOrCreateCart(req.user.id);
    const matchingItems = await sql`
      SELECT id
      FROM cart_items
      WHERE cart_id = ${cart.id}
        AND (id = ${requestedId} OR product_id = ${requestedId})
      ORDER BY CASE WHEN id = ${requestedId} THEN 0 ELSE 1 END
      LIMIT 1
    `;
    if (matchingItems.length) {
      await sql`DELETE FROM cart_items WHERE id = ${matchingItems[0].id} AND cart_id = ${cart.id}`;
    }
    const data = await readCart(req.user.id, { reconcile: true });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Error in removeCartItem:", error);
    return res.status(500).json({ success: false, message: "Could not remove cart item" });
  }
};

export const clearCart = async (req, res) => {
  try {
    const cart = await getOrCreateCart(req.user.id);
    await sql`DELETE FROM cart_items WHERE cart_id = ${cart.id}`;
    await sql`
      UPDATE carts
      SET store_id = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${cart.id}
    `;
    const data = await readCart(req.user.id);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Error in clearCart:", error);
    return res.status(500).json({ success: false, message: "Could not clear cart" });
  }
};

export const syncCart = async (req, res) => {
  try {
    const requestedItems = req.body?.items;
    const replaceStore = req.body?.replaceStore === true;
    if (!Array.isArray(requestedItems) || requestedItems.length > 100) {
      return res.status(400).json({ success: false, message: "Cart items must be an array with no more than 100 entries" });
    }

    const requested = new Map();
    for (const entry of requestedItems) {
      const productId = Number(entry?.productId);
      const quantity = validateQuantity(entry?.quantity);
      if (!Number.isInteger(productId) || productId <= 0 || !quantity) {
        return res.status(400).json({ success: false, message: "Each cart item requires a valid productId and positive integer quantity" });
      }
      requested.set(productId, (requested.get(productId) ?? 0) + quantity);
    }

    const cart = await getOrCreateCart(req.user.id);
    const existingItems = await getCartItems(cart.id);
    const existingStoreId = existingItems[0]?.store_id;
    const incomingProducts = [];
    for (const [productId, quantity] of requested) {
      const lookup = await getStoreForProduct(productId);
      if (lookup.errorStatus) {
        return res.status(lookup.errorStatus).json({ success: false, message: lookup.message });
      }
      if (quantity > Number(lookup.product.stock_count)) {
        return res.status(400).json({
          success: false,
          message: `${lookup.product.name}: only ${lookup.product.stock_count} item(s) are currently available`,
        });
      }
      incomingProducts.push({ product: lookup.product, quantity });
    }

    const requestedStoreIds = [...new Set(incomingProducts.map(({ product }) => Number(product.store_id)))];
    if (requestedStoreIds.length > 1) {
      return res.status(409).json({
        success: false,
        code: "DIFFERENT_STORE",
        message: "A cart can contain products from only one store.",
        activeStore: {
          id: Number(incomingProducts[0].product.store_id),
          name: incomingProducts[0].product.store_name,
          slug: incomingProducts[0].product.store_slug,
        },
      });
    }

    const targetStoreId = requestedStoreIds[0] ?? (replaceStore ? null : existingItems[0]?.store_id ?? null);
    if (targetStoreId && existingStoreId && Number(existingStoreId) !== targetStoreId && !replaceStore) {
      return sendStoreConflict(res, cart.id);
    }

    const initialQuantities = new Map();
    if (!replaceStore) {
      existingItems.forEach((item) => initialQuantities.set(Number(item.product_id), Number(item.quantity)));
    }
    for (const { product, quantity } of incomingProducts) {
      const next = (initialQuantities.get(Number(product.product_id)) ?? 0) + quantity;
      if (next > Number(product.stock_count)) {
        return res.status(400).json({
          success: false,
          message: `${product.name}: only ${product.stock_count} item(s) are currently available`,
        });
      }
      initialQuantities.set(Number(product.product_id), next);
    }

    if (replaceStore) {
      await sql`DELETE FROM cart_items WHERE cart_id = ${cart.id}`;
    }
    for (const { product, quantity } of incomingProducts) {
      await sql`
        INSERT INTO cart_items (cart_id, product_id, quantity)
        VALUES (${cart.id}, ${product.product_id}, ${quantity})
        ON CONFLICT (cart_id, product_id) DO UPDATE
        SET quantity = cart_items.quantity + EXCLUDED.quantity,
            updated_at = CURRENT_TIMESTAMP
      `;
    }

    await sql`
      UPDATE carts
      SET store_id = ${targetStoreId}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${cart.id}
    `;

    const data = await readCart(req.user.id, { reconcile: true });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Error in syncCart:", error);
    return res.status(500).json({ success: false, message: "Could not sync cart" });
  }
};
