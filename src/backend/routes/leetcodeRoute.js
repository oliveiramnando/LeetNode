import express from "express";
import { getUser, getGithubUsername } from "../controllers/leetcodeController.js";

const router = express.Router();

router.get('/user/:username', getUser);
// router.get('/github-username', getGithubUsername);

export default router