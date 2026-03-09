import express from "express";
import { me, startGithubOAuth, githubOAuthCallback, logout } from "../controllers/authController.js";

const router = express.Router();

router.get("/me", me);

router.get("/github/start", startGithubOAuth);
router.get("/github/callback", githubOAuthCallback);
router.post("/signout", logout);

export default router;
