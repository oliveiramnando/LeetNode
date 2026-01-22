import "dotenv/config";
import express from "express";

import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js"
import leetcodeRoutes from "./routes/leetcodeRoute.js";


const PORT = process.env.PORT || 5050
const app = express();

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
