import jwt from "jsonwebtoken";
import { sql } from "../config/db.js";
import { formatAuthUser } from "../lib/storeUtils.js";

const loadAuthenticatedUser = async (token) => {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const userId = decoded.id ?? decoded.userId;

  if (!userId) {
    return null;
  }

  const rows = await sql`
    SELECT
      u.id,
      u.username,
      u.email,
      u.role,
      u.password_version,
      u.created_at,
      s.id AS store_id,
      s.owner_id AS store_owner_id,
      s.name AS store_name,
      s.slug AS store_slug,
      s.description AS store_description,
      s.logo_url AS store_logo_url,
      s.subscription_status,
      s.subscription_plan,
      s.subscription_expires_at
    FROM users u
    LEFT JOIN stores s ON s.owner_id = u.id
    WHERE u.id = ${userId}
    LIMIT 1
  `;

  const row = rows[0];
  if (!row || Number(decoded.passwordVersion ?? 1) !== Number(row.password_version ?? 1)) {
    return null;
  }

  const user = {
    ...formatAuthUser(row),
    passwordVersion: Number(row.password_version ?? 1),
  };

  const store = row.store_id
    ? {
        id: Number(row.store_id),
        owner_id: Number(row.store_owner_id),
        name: row.store_name,
        slug: row.store_slug,
        description: row.store_description,
        logo_url: row.store_logo_url,
        subscription_status: row.subscription_status,
        subscription_plan: row.subscription_plan,
        subscription_expires_at: row.subscription_expires_at,
      }
    : null;

  return { user, store };
};

export const verifyToken = async (req, res, next) => {
  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ success: false, message: "Authentication is not configured" });
  }

  try {
    const token = req.cookies?.token;
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized - No token provided" });
    }

    const authContext = await loadAuthenticatedUser(token);
    if (!authContext) {
      return res.status(401).json({
        success: false,
        message: "Session invalid. Please log in again.",
      });
    }

    req.user = authContext.user;
    req.store = authContext.store;
    next();
  } catch (error) {
    console.error("Error in verifyToken middleware:", error);
    return res.status(401).json({ success: false, message: "Unauthorized - Invalid token" });
  }
};

export const optionalVerifyToken = async (req, _res, next) => {
  if (!process.env.JWT_SECRET) {
    return next();
  }

  try {
    const token = req.cookies?.token;
    if (!token) {
      return next();
    }

    const authContext = await loadAuthenticatedUser(token);
    if (authContext) {
      req.user = authContext.user;
      req.store = authContext.store;
    }
  } catch {
    // Public routes continue unauthenticated if optional token is invalid/expired
  }

  next();
};

export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized - Authentication required" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden - You do not have permission to perform this action",
      });
    }

    next();
  };
};

export const attachStoreContext = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Unauthorized - Authentication required" });
  }

  try {
    if (req.user.role === "store_admin") {
      if (req.store?.id) {
        return next();
      }

      const stores = await sql`
        SELECT id, owner_id, name, slug, description, logo_url, subscription_status, subscription_plan, subscription_expires_at
        FROM stores
        WHERE owner_id = ${req.user.id}
        LIMIT 1
      `;

      if (!stores.length) {
        return res.status(404).json({
          success: false,
          message: "Store not found for this account",
        });
      }

      req.store = stores[0];
      return next();
    }

    if (req.user.role === "super_admin") {
      const requestedStoreId = req.query?.storeId ?? req.body?.storeId;
      if (requestedStoreId !== undefined && requestedStoreId !== "") {
        const parsedStoreId = Number(requestedStoreId);
        if (!Number.isInteger(parsedStoreId) || parsedStoreId <= 0) {
          return res.status(400).json({ success: false, message: "Invalid storeId" });
        }

        const stores = await sql`
          SELECT id, owner_id, name, slug, description, logo_url, subscription_status, subscription_plan, subscription_expires_at
          FROM stores
          WHERE id = ${parsedStoreId}
          LIMIT 1
        `;

        if (!stores.length) {
          return res.status(404).json({ success: false, message: "Store not found" });
        }

        req.store = stores[0];
      }

      return next();
    }

    return res.status(403).json({
      success: false,
      message: "Forbidden - Store context requires a store admin account",
    });
  } catch (error) {
    console.error("Error in attachStoreContext middleware:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const protectRoute = verifyToken;
