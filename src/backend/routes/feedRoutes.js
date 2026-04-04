import express from "express";
import { submissionFeed, getSubmissionComments, postSubmissionComment } from "../controllers/feedController.js";
// import { submissionFeed } from "../controllers/feedController.js";

const router = express.Router();

router.get('/submissions', submissionFeed);

router.get('/submissions/:submissionId', getSubmissionComments)
router.post('/submissions/:submissionId', postSubmissionComment);



export default router;