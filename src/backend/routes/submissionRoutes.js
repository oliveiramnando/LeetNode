import express from "express";
import { syncSubmissions, submissionTracker, langDistribution, difficultyPerformance } from "../controllers/submissionController.js";

const router = express.Router();

router.post('/sync-submissions', syncSubmissions);

router.get('/submission-tracker', submissionTracker);
router.get('/lang-distribution', langDistribution);
router.get('/difficulty-performance', difficultyPerformance)

export default router;