import session from "express-session";

export default session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false, // only get sesion when you store something

    name: "sid",
    cookie: {
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
        // maxAge: 1000 * 60 * 5 , // 5 minutes for testing
        sameSite: isProduction ? "none" : "lax",
        secure: process.env.NODE_ENV === 'production', // should be tru in prod
    }
})