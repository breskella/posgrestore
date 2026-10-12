import { sql } from "../config/db.js";
import bcrypt from "bcryptjs";

export const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await sql`
      SELECT id, username, email, created_at FROM users WHERE id = ${userId}
    `;

    if (result.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, data: result[0] });
  } catch (error) {
    console.error("Error in getUserProfile:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const authenticatedUserId = Number(req.user.id);
    const requestedUserId = Number(req.params?.id ?? req.body?.userId ?? authenticatedUserId);

    if (!Number.isInteger(requestedUserId) || requestedUserId !== authenticatedUserId) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to update this profile",
      });
    }

    const { username, email, password = "", currentPassword = "" } = req.body ?? {};

    if (
      typeof username !== "string" || !username.trim() ||
      typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ) {
      return res.status(400).json({ success: false, message: "A username and valid email are required" });
    }

    if (typeof currentPassword !== "string" || currentPassword.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Your current password is required to save profile changes",
      });
    }

    if (typeof password !== "string" || (password.length > 0 && password.length < 8)) {
      return res.status(400).json({ success: false, message: "A new password must be at least 8 characters" });
    }

    const userRecord = await sql`
      SELECT id, password
      FROM users
      WHERE id = ${authenticatedUserId}
    `;

    if (!userRecord.length) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, userRecord[0].password);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "The current password you provided is incorrect",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const emailConflict = await sql`
      SELECT id
      FROM users
      WHERE LOWER(email) = LOWER(${normalizedEmail})
        AND id != ${authenticatedUserId}
    `;

    if (emailConflict.length > 0) {
      return res.status(409).json({ success: false, message: "That email address is already in use" });
    }

    let result;
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 12);
      result = await sql`
        UPDATE users
        SET
          username = ${username.trim()},
          email = ${normalizedEmail},
          password = ${hashedPassword},
          password_changed_at = NOW(),
          password_version = password_version + 1
        WHERE id = ${authenticatedUserId}
        RETURNING id, username, email, created_at
      `;
    } else {
      result = await sql`
        UPDATE users
        SET username = ${username.trim()}, email = ${normalizedEmail}
        WHERE id = ${authenticatedUserId}
        RETURNING id, username, email, created_at
      `;
    }

    if (result.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.status(200).json({
      success: true,
      data: result[0],
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("Error in updateUserProfile:", error);
    if (error.code === "23505") {
      return res.status(409).json({ success: false, message: "That email address is already in use" });
    }
    return res.status(500).json({ success: false, message: "Server error" });
  }
};