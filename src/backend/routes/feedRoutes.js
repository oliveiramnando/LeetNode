import express from "express";
import { submissionFeed } from "../controllers/feedController.js";

const router = express.Router();

router.get('/submissions', submissionFeed);

export default router;