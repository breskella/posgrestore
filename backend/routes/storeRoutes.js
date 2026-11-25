import express from "express";
import { getStoreBySlug, getStores } from "../controllers/storeController.js";

const router = express.Router();

router.get("/", getStores);
router.get("/:slug", getStoreBySlug);

export default router;
