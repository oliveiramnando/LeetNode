import express from "express";
import { startGithubOAuth, githubOAuthCallback, signin, signup } from "../controllers/authController.js";
// import { startGithubOAuth, githubOAuthCallback, logout, signin, signup } from "../controllers/authController.js";
import User from "../models/User.js";

const router = express.Router();


// router.get("/me", async (req, res) => {
//     try {
//         if (!req.session?.user) return res.status(401).json({ loggedIn: false });

//         const dbUser = await User.findById(req.session.userId);
//         if (!dbUser) {
//             // This shouldn't happen - session exists but user not found. Clear session to be safe.
//             req.session.destroy(() => {
//                 return res.status(401).json({ loggedIn: false });
//             });
//             return;
//         }
//         return res.json({ 
//             loggedIn: true, 
//             user: {
//                 id: dbUser._id,
//                 ghUsername: dbUser.ghUsername,
//                 githubUrl: dbUser.githubUrl,
//                 leetcodeUsername: dbUser.leetcodeUsername ?? null,
//             }
//         });
//     } catch (err) {
//         return res.status(500).json({ message: "Server error" });
//     }
// });

router.get("/github/start", startGithubOAuth);
router.get("/github/callback", githubOAuthCallback);
// router.post("/signout", logout);

router.post("/signup", signup);
router.post("/signin", signin);
// router.post("/signout", (req, res) => {
//   console.log("HIT /api/auth/signout");
//   return res.json({ ok: true });
// });

export default router;
