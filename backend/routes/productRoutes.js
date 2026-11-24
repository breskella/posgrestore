import express from "express";
import {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  getActivityLogs,
  cloneProduct,
  exportProductsCsv,
} from "../controllers/productController.js";
import {
  protectRoute,
  optionalVerifyToken,
  requireRole,
  attachStoreContext,
} from "../middleware/authMiddleware.js";
import upload from "../middleware/upload.js";

const router = express.Router();

const requireStoreAdmin = [protectRoute, requireRole("store_admin", "super_admin"), attachStoreContext];

// ==========================================
// Admin Scoped Read Routes (Must precede /:id)
// ==========================================
router.get("/logs", ...requireStoreAdmin, getActivityLogs);
router.get("/export", ...requireStoreAdmin, exportProductsCsv);

// ==========================================
// Public / Storefront & Scoped Product Read Routes
// ==========================================
router.get("/", optionalVerifyToken, getProducts);
router.get("/:id", optionalVerifyToken, getProduct);

// ==========================================
// Protected Admin Routes (Require store_admin / super_admin & Tenant Context)
// ==========================================
router.post("/", ...requireStoreAdmin, upload.single("image"), createProduct);
router.post("/:id/clone", ...requireStoreAdmin, cloneProduct);
router.put("/:id", ...requireStoreAdmin, upload.single("image"), updateProduct);
router.delete("/:id", ...requireStoreAdmin, deleteProduct);

export default router;
