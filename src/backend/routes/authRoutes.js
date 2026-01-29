import express from "express";

import { identifier } from '../middlewares/identification.js';
import authController from '../controllers/authController.js';

const router = express.Router();

router.get('/github/start', authController.githubStart);
router.get('/github/callback', authController.githubCallback);
router.post('/signout', identifier, authController.signout);

export default router;