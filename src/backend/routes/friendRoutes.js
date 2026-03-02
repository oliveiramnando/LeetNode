import express from "express";
import { follow, unfollow, getFollowers, getFollowing } from "../controllers/friendController.js";

const router = express.Router();


router.post('/:leetcodeUsername/follow', follow);
router.delete('/:leetcodeUsername/follow', unfollow);

router.get('/followers', getFollowers);
router.get('/following', getFollowing);

export default router;