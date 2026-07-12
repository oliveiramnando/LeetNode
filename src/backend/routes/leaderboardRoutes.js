import express from "express";
import { friendLeaderboard } from "../controllers/leaderboardController.js";

const router = express.Router();

router.get('/friends', friendLeaderboard);

export default router;