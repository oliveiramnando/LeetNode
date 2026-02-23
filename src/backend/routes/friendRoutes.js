import express from "express";
import { follow, unfollow } from "../controllers/friendController.js";

const router = express.Router();


router.post('/follow', follow);
router.delete('/unfollow', unfollow);

router.get('followers');
router.get('following');

export default router;