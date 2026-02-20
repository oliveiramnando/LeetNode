import session from "express-session";
import MongoStore from "connect-mongo";

if (!process.env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET is missing. Check your .env loading/path.");
}
if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing.");
}

const isProd = process.env.NODE_ENV === "production";

export default session({
    name: "sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,

    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI,
        collectionName: "sessions",
        ttl: 60 * 60 * 24 * 7, // 7 days
    }),

    proxy: isProd,
    cookie: {
        httpOnly: true,
        sameSite: isProd ? "none" : "lax",
        secure: isProd,
        maxAge: 1000 * 60 * 60 * 24 * 7,
    },
});