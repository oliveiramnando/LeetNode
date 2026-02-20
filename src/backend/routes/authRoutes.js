import express from "express";
import { identifier } from "../middlewares/identification.js";
import { startGithubOAuth, githubCallback, logout } from "../controllers/authController.js";

const router = express.Router();

function requireSession(req, res, next) {
    if (!req.session?.user) return res.status(401).json({ message: "Not logged in" });
    next();
}

router.get("/me", (req, res) => {
    if (!req.session?.user) return res.status(401).json({ loggedIn: false });
    return res.json({ loggedIn: true, user: req.session.user });
});

router.get("/github/start", startGithubOAuth);
router.get("/github/callback", githubCallback);
router.post("/signout", logout);
// router.post("/signout", (req, res) => {
//   console.log("HIT /api/auth/signout");
//   return res.json({ ok: true });
// });

export default router;
