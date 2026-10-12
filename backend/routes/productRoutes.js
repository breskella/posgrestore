import express from "express";
import { 
  createProduct, 
  getProducts, 
  getProduct, 
  updateProduct, 
  deleteProduct, 
  getActivityLogs,
  cloneProduct
} from "../controllers/productController.js";
import { protectRoute } from "../middleware/authMiddleware.js";
import upload from "../middleware/upload.js";

const router = express.Router();

// ==========================================
// Public Routes (Accessible to everyone)
// ==========================================
router.get("/", getProducts);
router.get("/logs", getActivityLogs); 
router.get("/:id", getProduct);

// ==========================================
// Protected Routes (Require Authentication & Image Upload Support)
// ==========================================
router.post("/", protectRoute, upload.single("image"), createProduct);
router.post("/:id/clone", protectRoute, cloneProduct);
router.put("/:id", protectRoute, upload.single("image"), updateProduct);
router.delete("/:id", protectRoute, deleteProduct);

export default router;