import express from "express";
import {
  addCartItem,
  clearCart,
  getCart,
  removeCartItem,
  syncCart,
  updateCartItem,
} from "../controllers/cartController.js";
import { protectRoute } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protectRoute);
router.get("/", getCart);
router.post("/items", addCartItem);
router.patch("/items/:itemId", updateCartItem);
router.delete("/items/:itemId", removeCartItem);
router.delete("/", clearCart);
router.post("/sync", syncCart);

export default router;
