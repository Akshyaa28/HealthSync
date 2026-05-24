import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { analyzeReport, getUserReports } from "../controllers/reportController.js";

const router = express.Router();

router.get("/history", authMiddleware, getUserReports);
router.post("/analyze", analyzeReport);

export default router;
