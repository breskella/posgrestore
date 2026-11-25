import { sql } from "../config/db.js";

export const getStores = async (req, res) => {
  try {
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const searchPattern = `%${search}%`;
    const stores = await sql`
      SELECT
        s.id,
        s.name,
        s.slug,
        s.description,
        s.logo_url,
        s.created_at,
        COUNT(p.id)::int AS product_count
      FROM stores s
      LEFT JOIN products p ON p.store_id = s.id
      WHERE s.subscription_status IN ('trial', 'active')
        AND (
          ${search.length === 0}
          OR s.name ILIKE ${searchPattern}
          OR COALESCE(s.description, '') ILIKE ${searchPattern}
        )
      GROUP BY s.id
      ORDER BY s.created_at DESC, s.name ASC
    `;

    return res.status(200).json({ success: true, data: stores });
  } catch (error) {
    console.error("Error in getStores:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getStoreBySlug = async (req, res) => {
  try {
    const slug = typeof req.params.slug === "string" ? req.params.slug.trim().toLowerCase() : "";
    const stores = await sql`
      SELECT
        s.id,
        s.name,
        s.slug,
        s.description,
        s.logo_url,
        s.subscription_status,
        s.created_at,
        COUNT(p.id)::int AS product_count
      FROM stores s
      LEFT JOIN products p ON p.store_id = s.id
      WHERE LOWER(s.slug) = ${slug}
        AND s.subscription_status IN ('trial', 'active')
      GROUP BY s.id
      LIMIT 1
    `;

    if (!stores.length) {
      return res.status(404).json({ success: false, message: "Store not found" });
    }

    const categoryRows = await sql`
      SELECT DISTINCT category
      FROM products
      WHERE store_id = ${stores[0].id}
        AND category IS NOT NULL
        AND BTRIM(category) <> ''
      ORDER BY category
    `;

    return res.status(200).json({
      success: true,
      data: {
        ...stores[0],
        product_count: Number(stores[0].product_count ?? 0),
        categories: categoryRows.map((row) => row.category),
      },
    });
  } catch (error) {
    console.error("Error in getStoreBySlug:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
