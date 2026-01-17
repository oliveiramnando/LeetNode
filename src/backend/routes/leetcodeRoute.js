import express from "express";
import { getUser } from "../controllers/leetcodeController.js";

const router = express.Router();

router.get('/user/:username', getUser);

export default router