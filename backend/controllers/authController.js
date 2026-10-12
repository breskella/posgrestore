import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sql } from "../config/db.js";

const RESET_TOKEN_TTL_MS = 15 * 60 * 1000;
const genericResetMessage = "If an account exists for that email, a confirmation email will be sent.";

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }
  return process.env.JWT_SECRET;
};

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

const getEnvUrl = (key, fallback) => {
  const value = process.env[key]?.trim();
  return value ? value.replace(/\/+$/, "") : fallback;
};

const getResetEmailFrom = () => {
  const value = process.env.RESET_EMAIL_FROM?.trim();
  return value || "onboarding@resend.dev";
};

const generateToken = (user) => {
  const payload = {
    id: user.id,
    passwordVersion: Number(user.password_version ?? 1),
  };

  return jwt.sign(payload, getJwtSecret(), { expiresIn: "7d" });
};

const sendApprovalEmail = async (email, approvalUrl, denyUrl) => {
  const sender = getResetEmailFrom();

  if (!process.env.RESEND_API_KEY || !sender) {
    throw new Error("Password reset email is not configured");
  }

  const payload = {
    from: sender,
    to: [email],
    subject: "Security Alert: Password Reset Request",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;padding:24px;color:#111827;">
        <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:24px;">
          <h2 style="margin:0 0 16px;font-size:24px;color:#7c2d12;">Security Alert</h2>
          <p style="margin:0 0 16px;line-height:1.7;font-size:16px;">
            We received a request to reset your password. If this was you, click <strong>Approve</strong>.
            If this was not you, click <strong>Deny</strong> immediately.
          </p>
          <p style="margin:0 0 20px;line-height:1.7;">
            This secure confirmation link is valid for 15 minutes. No password change will occur until the request is explicitly approved.
          </p>

          <div style="display:flex;gap:12px;flex-wrap:wrap;margin:0 0 22px;">
            <a href="${approvalUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:14px 22px;border-radius:8px;font-weight:700;">
              Approve Password Reset
            </a>
            <a href="${denyUrl}" style="display:inline-block;background:#dc2626;color:#ffffff;text-decoration:none;padding:14px 22px;border-radius:8px;font-weight:700;">
              Deny / This wasn't me
            </a>
          </div>

          <p style="margin:0 0 8px;line-height:1.7;">
            If you did not initiate this reset, please deny it now to block the request and protect your account.
          </p>
          <p style="margin:0;line-height:1.7;">
            We recommend reviewing your account activity after denying the request.
          </p>
        </div>
      </div>
    `,
  };

  console.log("Sending password reset approval email", {
    to: email,
    from: sender,
    approvalUrl,
    denyUrl,
    nodeEnv: process.env.NODE_ENV,
  });

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const responseBody = await response.text();

    if (!response.ok) {
      console.error("Resend password reset email failed", {
        status: response.status,
        statusText: response.statusText,
        body: responseBody,
        to: email,
      });
      throw new Error(`Resend email error: ${response.status} ${response.statusText} - ${responseBody}`);
    }

    console.log("Resend password reset email accepted", {
      status: response.status,
      to: email,
      response: responseBody,
    });

    return responseBody;
  } catch (error) {
    console.error("Exception while sending password reset approval email", {
      to: email,
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
};

export const signup = async (req, res) => {
  const { username, email, password } = req.body ?? {};

  if (
    typeof username !== "string" || !username.trim() ||
    typeof email !== "string" || !email.trim() ||
    typeof password !== "string" || password.length < 8
  ) {
    return res.status(400).json({
      success: false,
      message: "Username, valid email, and a password of at least 8 characters are required",
    });
  }

  try {
    getJwtSecret();

    const existingUser = await sql`
      SELECT id FROM users
      WHERE LOWER(email) = LOWER(${email.trim()})
    `;

    if (existingUser.length) {
      return res.status(409).json({ success: false, message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const createdUsers = await sql`
      INSERT INTO users (username, email, password, password_version)
      VALUES (${username.trim()}, ${email.trim()}, ${hashedPassword}, 1)
      RETURNING id, username, email, password_version
    `;

    const user = createdUsers[0];
    return res.status(201).json({
      success: true,
      token: generateToken(user),
      data: { id: user.id, username: user.username, email: user.email },
      message: "Account created successfully",
    });
  } catch (error) {
    console.error("Error in signup:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body ?? {};

  if (typeof email !== "string" || !email.trim() || typeof password !== "string" || !password) {
    return res.status(400).json({ success: false, message: "Email and password are required" });
  }

  try {
    getJwtSecret();

    const users = await sql`
      SELECT id, username, email, password, password_version
      FROM users
      WHERE LOWER(email) = LOWER(${email.trim()})
    `;

    const user = users[0];
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const safeUser = { id: user.id, username: user.username, email: user.email };
    return res.status(200).json({
      success: true,
      token: generateToken(user),
      data: safeUser,
      message: "Logged in successfully",
    });
  } catch (error) {
    console.error("Error in login:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const logout = (_req, res) => {
  return res.status(200).json({ success: true, message: "Logged out successfully" });
};

export const forgotPassword = async (req, res) => {
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({
      success: false,
      message: "A valid email address is required",
    });
  }

  try {
    const users = await sql`
      SELECT id, email
      FROM users
      WHERE LOWER(email) = LOWER(${email})
    `;

    const user = users[0];
    if (!user) {
      return res.status(200).json({ success: true, message: genericResetMessage });
    }

    const approvalToken = crypto.randomBytes(32).toString("hex");
    const approvalTokenHash = hashToken(approvalToken);
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

    const frontendOrigin = getEnvUrl("FRONTEND_URL", "http://localhost:5173");
    const backendOrigin = getEnvUrl("BACKEND_URL", "http://localhost:3000");
    const approvalUrl = `${frontendOrigin}/confirm-password-reset/${approvalToken}`;
    const denyUrl = `${backendOrigin}/api/auth/deny-reset/${approvalToken}`;

    await sql`
      UPDATE users
      SET
        reset_approval_token_hash = ${approvalTokenHash},
        reset_approval_expires_at = ${expiresAt},
        reset_token_hash = NULL,
        reset_token_expires_at = NULL
      WHERE id = ${user.id}
    `;

    try {
      await sendApprovalEmail(user.email, approvalUrl, denyUrl);
      console.log("Password reset confirmation email dispatched successfully", {
        userId: user.id,
        email: user.email,
        approvalTokenHash: approvalTokenHash,
      });
    } catch (error) {
      console.error("Password reset email sending failed for user", {
        userId: user.id,
        email: user.email,
        error: error.message,
      });

      await sql`
        UPDATE users
        SET
          reset_approval_token_hash = NULL,
          reset_approval_expires_at = NULL
        WHERE id = ${user.id}
      `;

      throw error;
    }

    return res.status(200).json({
      success: true,
      message: genericResetMessage,
    });
  } catch (error) {
    console.error("Error in forgotPassword:", error);
    return res.status(503).json({
      success: false,
      message: "Password reset is temporarily unavailable",
    });
  }
};

export const denyPasswordReset = async (req, res) => {
  const rawToken = (req.params?.token ?? req.body?.token ?? "").toString();

  if (!rawToken || rawToken.length < 32) {
    return res.status(400).json({
      success: false,
      message: "Invalid or expired approval token",
    });
  }

  try {
    const tokenHash = hashToken(rawToken);
    const users = await sql`
      SELECT id, email
      FROM users
      WHERE reset_approval_token_hash = ${tokenHash}
        AND reset_approval_expires_at > NOW()
    `;

    const user = users[0];
    if (!user) {
      return res.status(200).json({
        success: true,
        message: "This reset request has already been cancelled or expired.",
      });
    }

    await sql`
      UPDATE users
      SET
        reset_approval_token_hash = NULL,
        reset_approval_expires_at = NULL,
        reset_token_hash = NULL,
        reset_token_expires_at = NULL
      WHERE id = ${user.id}
    `;

    await sql`
      INSERT INTO activity_logs (action, product_name, details)
      VALUES ('password_reset_denied', 'security', ${`Password reset denied for email: ${user.email}`} )
    `;

    console.warn("Password reset request denied and revoked", {
      userId: user.id,
      email: user.email,
      tokenHash,
      deniedAt: new Date().toISOString(),
    });

    return res.status(200).json({
      success: true,
      message: "Request has been successfully cancelled and secured.",
    });
  } catch (error) {
    console.error("Error in denyPasswordReset:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const confirmPasswordReset = async (req, res) => {
  const rawToken = (req.params?.token ?? req.body?.token ?? "").toString();

  if (!rawToken || rawToken.length < 32) {
    return res.status(400).json({
      success: false,
      message: "Invalid or expired approval token",
    });
  }

  try {
    const tokenHash = hashToken(rawToken);
    const finalResetToken = crypto.randomBytes(32).toString("hex");
    const finalHash = hashToken(finalResetToken);
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

    const users = await sql`
      SELECT id
      FROM users
      WHERE reset_approval_token_hash = ${tokenHash}
        AND reset_approval_expires_at > NOW()
    `;

    const user = users[0];
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired approval token",
      });
    }

    await sql`
      UPDATE users
      SET
        reset_approval_token_hash = NULL,
        reset_approval_expires_at = NULL,
        reset_token_hash = ${finalHash},
        reset_token_expires_at = ${expiresAt}
      WHERE id = ${user.id}
    `;

    return res.status(200).json({
      success: true,
      message: "Password reset approved. Please set your new password.",
      data: { resetToken: finalResetToken },
    });
  } catch (error) {
    console.error("Error in confirmPasswordReset:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const resetPassword = async (req, res) => {
  const rawToken = (req.params?.token ?? req.body?.token ?? "").toString();
  const { password } = req.body ?? {};

  if (!rawToken || rawToken.length < 32) {
    return res.status(400).json({
      success: false,
      message: "Invalid or expired reset token",
    });
  }

  if (typeof password !== "string" || password.length < 8) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 8 characters long",
    });
  }

  try {
    const tokenHash = hashToken(rawToken);
    const hashedPassword = await bcrypt.hash(password, 12);

    const updatedUsers = await sql`
      UPDATE users
      SET
        password = ${hashedPassword},
        reset_approval_token_hash = NULL,
        reset_approval_expires_at = NULL,
        reset_token_hash = NULL,
        reset_token_expires_at = NULL,
        password_changed_at = NOW(),
        password_version = password_version + 1
      WHERE reset_token_hash = ${tokenHash}
        AND reset_token_expires_at > NOW()
      RETURNING id, password_version
    `;

    if (!updatedUsers.length) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Password reset successfully. Please log in again.",
    });
  } catch (error) {
    console.error("Error in resetPassword:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};