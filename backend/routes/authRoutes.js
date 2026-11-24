import express from "express";
import {
  login,
  signup,
  logout,
  checkAuth,
  forgotPassword,
  denyPasswordReset,
  confirmPasswordReset,
  resetPassword,
} from "../controllers/authController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { forgotPasswordArcjet, resetPasswordArcjet, protectWithArcjet } from "../lib/arcjet.js";

const router = express.Router();

const forgotPasswordLimiter = protectWithArcjet(
  forgotPasswordArcjet,
  "Too many password reset requests. Please wait a few minutes before trying again."
);

const resetPasswordLimiter = protectWithArcjet(
  resetPasswordArcjet,
  "Too many reset attempts. Please wait a few minutes before trying again."
);

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.get("/check-auth", verifyToken, checkAuth);

router.post("/forgot-password", forgotPasswordLimiter, forgotPassword);
router.get("/deny-reset/:token", denyPasswordReset);
router.post("/deny-reset/:token", denyPasswordReset);
router.post("/confirm-password-reset", confirmPasswordReset);
router.post("/confirm-password-reset/:token", confirmPasswordReset);
router.post("/reset-password", resetPasswordLimiter, resetPassword);
router.post("/reset-password/:token", resetPasswordLimiter, resetPassword);

export default router;