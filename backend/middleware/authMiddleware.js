import jwt from "jsonwebtoken";
import { sql } from "../config/db.js";

export const verifyToken = async (req, res, next) => {
  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ success: false, message: "Authentication is not configured" });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Unauthorized - No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id ?? decoded.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized - Invalid token" });
    }

    const users = await sql`
      SELECT id, password_version
      FROM users
      WHERE id = ${userId}
    `;

    const user = users[0];
    if (!user || Number(decoded.passwordVersion ?? 1) !== Number(user.password_version ?? 1)) {
      return res.status(401).json({
        success: false,
        message: "Session invalid. Please log in again.",
      });
    }

    req.user = { ...decoded, id: userId };
    next();
  } catch (error) {
    console.error("Error in verifyToken middleware:", error);
    return res.status(401).json({ success: false, message: "Unauthorized - Invalid token" });
  }
};

export const protectRoute = verifyToken;