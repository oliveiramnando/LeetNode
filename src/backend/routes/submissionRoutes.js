import express from "express";
import { langDistribution, tagStrengths } from "../controllers/submissionController.js";

const router = express.Router();

router.get('/lang-distribution', langDistribution);
router.get('/strengths', tagStrengths);

export default router;