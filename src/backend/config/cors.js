import cors from "cors";

export default cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
});
