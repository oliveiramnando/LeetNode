import express from "express";
import { submissionFeed, submissionComment } from "../controllers/feedController.js";

const router = express.Router();

router.get('/submissions', submissionFeed);
router.post('/submissions/:submissionId', submissionComment);

export default router;