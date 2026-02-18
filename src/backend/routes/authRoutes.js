import express from "express";

import { identifier } from '../middlewares/identification.js';
import { startGithubOAuth, githubCallback, logout } from '../controllers/authController.js';

const router = express.Router();

router.get('/github/start', startGithubOAuth);
router.get('/github/callback', githubCallback);
router.post('/signout', identifier, logout);

export default router;