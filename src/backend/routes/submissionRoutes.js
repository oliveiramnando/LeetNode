import express from "express";
import { syncSubmissions, langDistribution, difficultyPerformance, tagStrengths } from "../controllers/submissionController.js";

const router = express.Router();

router.post('/sync-submissions', syncSubmissions);

router.get('/lang-distribution', langDistribution);
router.get('/difficulty-performance', difficultyPerformance)
router.get('/strengths', tagStrengths);

export default router;