import crypto from "crypto";
import { sql } from "../config/db.js";

/**
 * Convert a store name into a URL-safe slug base.
 */
export const slugifyStoreName = (name) => {
  const base = String(name || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 140)
    .replace(/-+$/g, "");

  return base || "store";
};

/**
 * Generate a unique URL-safe store slug against the stores table.
 */
export const generateUniqueStoreSlug = async (storeName, dbClient = sql) => {
  const baseSlug = slugifyStoreName(storeName);

  const existingRows = await dbClient`
    SELECT slug
    FROM stores
    WHERE slug = ${baseSlug} OR slug LIKE ${`${baseSlug}-%`}
  `;

  const takenSlugs = new Set(existingRows.map((row) => row.slug));
  if (!takenSlugs.has(baseSlug)) {
    return baseSlug;
  }

  let suffix = 2;
  while (takenSlugs.has(`${baseSlug}-${suffix}`) && suffix < 1000) {
    suffix += 1;
  }

  const candidate = `${baseSlug}-${suffix}`;
  if (!takenSlugs.has(candidate)) {
    return candidate;
  }

  return `${baseSlug}-${crypto.randomBytes(3).toString("hex")}`;
};

/**
 * Normalize a store row or joined store fields into the API store payload shape.
 */
export const formatStoreInfo = (row) => {
  if (!row) return null;

  const storeId = row.store_id ?? row.id;
  if (!storeId) return null;

  return {
    storeId: Number(storeId),
    storeName: row.store_name ?? row.name,
    storeSlug: row.store_slug ?? row.slug,
    subscriptionStatus: row.subscription_status,
    subscriptionPlan: row.subscription_plan ?? "free_trial",
    subscriptionExpiresAt: row.subscription_expires_at ?? null,
  };
};

/**
 * Normalize a user + optional joined store row into a safe API user payload.
 */
export const formatAuthUser = (row) => {
  if (!row) return null;

  return {
    id: Number(row.id),
    username: row.username,
    email: row.email,
    role: row.role,
    created_at: row.created_at,
    store: row.store_id ? formatStoreInfo(row) : null,
  };
};
