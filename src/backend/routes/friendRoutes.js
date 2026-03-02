import express from "express";
import { follow, unfollow, getFriendCounts, isFollowing, getFollowers, getFollowing } from "../controllers/friendController.js";

const router = express.Router();


router.post('/:leetcodeUsername/follow', follow);
router.delete('/:leetcodeUsername/follow', unfollow);

router.get('/counts', getFriendCounts);
router.get('/is-following/:leetcodeUsername', isFollowing)

router.get('/followers', getFollowers);
router.get('/following', getFollowing);

export default router;