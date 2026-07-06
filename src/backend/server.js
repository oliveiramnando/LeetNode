import "./env.js"; 
import express from "express";

import corsMiddleware from "./config/cors.js";
import sessionMiddleware from "./config/session.js";
import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import leetcodeRoutes from "./routes/leetcodeRoute.js";
import friendRoutes from "./routes/friendRoutes.js";
import submissionRoutes from "./routes/submissionRoutes.js";
import tagRoutes from "./routes/tagRoutes.js";
import feedRoutes from "./routes/feedRoutes.js";
// import testRoutes from "./routes/testRoutes.js";

const PORT = process.env.PORT || 8080;
const app = express();
app.set("trust proxy", 1);

console.log("1. imports finished");

app.use(express.json());

app.use(corsMiddleware);
app.use(sessionMiddleware);

app.get("/api/health", (_, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/leetcode", leetcodeRoutes);
app.use("/api/friend", friendRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/tags", tagRoutes);
app.use("/api/feed", feedRoutes);
// app.use("/api/test", testRoutes);

console.log("2. middleware and routes registered");
console.log("3. about to call connectDB()");

connectDB().then(() => {
	console.log("4. DB connected");
	app.listen(PORT, () => console.log("Server started on PORT:", PORT));
}).catch((err) => {
	console.error("DB connect failed:", err);
});