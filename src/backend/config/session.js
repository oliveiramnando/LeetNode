import session from "express-session";

if (!process.env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET is missing. Check your .env loading/path.");
}

export default session({
    name: "sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
    },
});