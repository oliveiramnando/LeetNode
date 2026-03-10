import express from "express";
import { tagStrengths, tagWeaknesses } from "../controllers/tagController.js";

const router = express.Router();

router.get('/strengths', tagStrengths);
router.get('/weaknesses', tagWeaknesses);

export default router;