import dotenv from "dotenv";
import express from "express";

dotenv.config();

import { connectDB } from "./config/db.js";
import { session } from "./config/session.js";
import { cors } from "./config/cors.js";
import authRoutes from "./routes/authRoutes.js"
import leetcodeRoutes from "./routes/leetcodeRoute.js";

const PORT = process.env.PORT || 5050
const app = express();

app.use(express.json);

app.use(cors); // allows frontend use with cookies
app.use(session); // cookie-based session

app.get('/api/health', (_,res) => {
    res.json({ok: true});
})

app.use('/api/auth', authRoutes);
app.use('/api/leetcode', leetcodeRoutes);

connectDB().then(() => {
	app.listen(PORT, () => {
		console.log('Server started on PORT:', PORT);
	});
});
