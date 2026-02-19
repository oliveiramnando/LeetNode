import "./env.js"; 

import express from "express";

import corsMiddleware from "./config/cors.js";
import sessionMiddleware from "./config/session.js";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import leetcodeRoutes from "./routes/leetcodeRoute.js";

const PORT = process.env.PORT || 8080;
const app = express();

app.use(express.json());

app.use(corsMiddleware);
app.use(sessionMiddleware);

app.get("/api/health", (_, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/leetcode", leetcodeRoutes);

connectDB().then(() => {
	app.listen(PORT, () => console.log("Server started on PORT:", PORT));
});
