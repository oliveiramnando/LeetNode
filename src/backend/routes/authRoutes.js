import express from "express";
import { me, startGithubOAuth, githubOAuthCallback, logout, signin, signup } from "../controllers/authController.js";

const router = express.Router();

router.get("/me", me);

router.get("/github/start", startGithubOAuth);
router.get("/github/callback", githubOAuthCallback);
router.post("/signout", logout);

router.post("/signup", signup);
router.post("/signin", signin);
// router.post("/signout", (req, res) => {
//   console.log("HIT /api/auth/signout");
//   return res.json({ ok: true });
// });

export default router;
