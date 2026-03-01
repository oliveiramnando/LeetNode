import express from "express";
import { follow, unfollow, getFollowers, getFollowing } from "../controllers/friendController.js";

const router = express.Router();


router.post('/follow', follow);
router.delete('/unfollow', unfollow);

router.get('/followers', getFollowers);
router.get('/following', getFollowing);

export default router;