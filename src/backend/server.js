import "dotenv/config";

import express from "express";
import leetcodeRoutes from "./routes/leetcodeRoute.js";

const PORT = process.env.PORT || 5050
const app = express();

app.get('/api/health', (_,res) => {
    res.json({ok: true});
})

app.use('/api/leetcode', leetcodeRoutes)

app.listen(PORT, () => {
    console.log("Server listening on PORT: ", PORT);
});
