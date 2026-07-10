import express from "express";
import { getUserStreaks, submissionFeed, getSubmissionComments, postSubmissionComment, deleteSubmissionComment } from "../controllers/feedController.js";
// import { submissionFeed } from "../controllers/feedController.js";

const router = express.Router();

router.get('/streaks', getUserStreaks);
router.get('/submissions', submissionFeed);

router.get('/submissions/:submissionId/comments', getSubmissionComments)
router.post('/submissions/:submissionId/comments', postSubmissionComment);
router.delete('/submissions/:submissionId/comments/:commentId', deleteSubmissionComment);



export default router;