import express from "express";
import { langDistribution, difficultyPerformance, tagStrengths } from "../controllers/submissionController.js";

const router = express.Router();

router.get('/lang-distribution', langDistribution);
router.get('/difficulty-performance', difficultyPerformance)
router.get('/strengths', tagStrengths);

export default router;