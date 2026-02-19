import express from "express";
import { getUser, me, getGithubUsername } from "../controllers/leetcodeController.js";

const router = express.Router();


router.get('/me', me);
router.get('/user/:username', getUser);

// router.get('/user/:username', getUser);

// router.get('/github-username', getGithubUsername);

export default router