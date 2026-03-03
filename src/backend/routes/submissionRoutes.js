import express from "express";
import { tagStrengths } from "../controllers/submissionController.js";

const router = express.Router();

router.get('/strengths', tagStrengths);

export default router;