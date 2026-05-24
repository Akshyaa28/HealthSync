import express from "express";
import { signup, login, getProfile, updateProfile } from "../controllers/authController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);

router.get("/me", authMiddleware, getProfile);
router.put("/me", authMiddleware, updateProfile);

export default router;
