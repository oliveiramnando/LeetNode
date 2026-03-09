import crypto from "crypto";
import axios from "axios";
import User from "../models/User.js";

export const me = async (req,res) =>{
    try {
        const userId = req.session?.userId
        if (!userId) return res.status(401).json({ loggedIn: false });

        const dbUser = await User.findById(userId).lean();
        if (!dbUser) {
            // This shouldn't happen - session exists but user not found. Clear session to be safe.
            req.session.destroy(() => {
                return res.status(401).json({ loggedIn: false });
            });
            return;
        }
        return res.json({ 
            loggedIn: true, 
            user: {
                id: dbUser._id,
                githubID: dbUser.githubID,
                githubUsername: dbUser.githubUsername,
                githubUrl: dbUser.githubUrl,
                leetcodeUsername: dbUser.leetcodeUsername ?? null,
            }
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: error.message
        });
    }
}

export const startGithubOAuth = async (req, res) => {
    try {
        const state = crypto.randomBytes(16).toString("hex");
        req.session.oAuthState = state;

        const params = new URLSearchParams({
            client_id: process.env.GITHUB_CLIENT_ID,
            redirect_uri: process.env.GITHUB_REDIRECT_URI,
            scope: "read:user user:email",
            state: state
        });

        return res.redirect(`https://github.com/login/oauth/authorize/?${params.toString()}`);

    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
}

export const githubOAuthCallback = async (req, res) => {
    try {
        const { code, state } = req.query;
        if (!code) {
            return res.status(400).json({
                success:false,
                message: "Missing oAuth code"
            });
        }

        const expectedState = req.session.oAuthState;
        if (!expectedState || state !== expectedState) {
            return res.status(400).json({
                success: false,
                message: "Security validation failed. Please try logging in again"
            });
        }  

        delete req.session.oAuthState;

        const params = new URLSearchParams({
            client_id: process.env.GITHUB_CLIENT_ID,
            client_secret: process.env.GITHUB_CLIENT_SECRET,
            code,
            redirect_uri: process.env.GITHUB_REDIRECT_URI
        });
         
        let config = {
            headers: {
                Accept: 'application/json'
            }
        }

        const userData = await axios.post('https://github.com/login/oauth/access_token/', params, config);  
        const accessToken = userData.data.access_token;

        config = {
            headers:{
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json'
            }
        }
        const userGithubData = await axios.get(`https://api.github.com/user`, config);
        const githubUsername = userGithubData.data.login;
        const githubUrl = userGithubData.data.html_url;
        // console.log(userGithubData);

        if (!githubID) {
            return res.status(400).json({ success: false, message: "Github ID missing" });
        }

        // creating new user/login
        const user = await User.findOneAndUpdate( 
            { githubID },
            {
                githubUsername,
                githubUrl
            },
            { upsert: true, returnDocument: 'after' }
        );

        req.session.regenerate((err) => { // generatees new session and destroys old one
            if (err) return res.status(500).json({ message: "Failed to create session" });

            req.session.userId = user?._id;
            if (user.leetcodeUsernameLower) {
                req.session.leetcodeUsername = user.leetcodeUsernameLower;
            }

            if (!user.leetcodeUsername) return res.redirect(`${process.env.FRONTEND_URL}/link-account`);
            return res.redirect(`${process.env.FRONTEND_URL}/profile/${encodeURIComponent(user.leetcodeUsername)}`);
        })

    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
}

export const logout = async (req,res) => {
    req.session.destroy(() => {
        return res.status(401).json({ loggedIn: false });
    });
    return;
}

