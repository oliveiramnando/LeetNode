import { LeetCode } from "leetcode-query";
import User from "../models/User.js";
import { syncSubmissionsIfNeeded } from "../utils/syncSubmissions.js";


function normalizeGithubUrl(url) {
    if (!url) return null;

    let s = String(url).trim();
    if (!/^https?:\/\//i.test(s)) {
        s = "https://" + s;
    }

    try {
        const u = new URL(s);

        let host = u.hostname.toLowerCase();
        if (host.startsWith("www.")) host = host.slice(4);
        if (host !== "github.com") return null;

        let path = u.pathname.trim();
        if (path.endsWith("/")) path = path.slice(0, -1);
        path = path.toLowerCase();

        if (!path || path === "/") return null;

        return `https://github.com${path}`;
    } catch {
        return null;
    }
}


export const getUser = async (req,res) => {
    try {
        console.log("EXPRESS raw cookie:", req.headers.cookie);
        console.log("EXPRESS session:", req.session);

        const { username } = req.params;
        const userId = req.session?.userId;
        const leetcodeUsername = req.session?.leetcodeUsername;

        console.log({ userId, leetcodeUsername });

        if (userId && leetcodeUsername && leetcodeUsername === String(username).toLowerCase()) {
            const syncResult = await syncSubmissionsIfNeeded(userId, leetcodeUsername);
            console.log(syncResult);
        }

        const leetcode = new LeetCode();
        const user = await leetcode.user(username);

        return res.json(user);
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: error.message
        });
    }
};

export const me = async (req, res) => {
    try {
        const leetnodeUser = await User.findOne({ userId: req.session?.userId })
        console.log(leetnodeUser);

        const username = leetnodeUser.leetcodeUsername;

        const leetcode = new LeetCode();
        const user = await leetcode.user(username);

        return res.status(200).json(user);

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: error.message
        });
    }
};

export const linkLeetcode = async (req, res) => {
    try {
        const userId = req.session?.userId;
        if (!userId) return res.status(401).json({ message: "user not logged in "});

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: "Session user not found" });
        
        const leetcodeUsername = (req.body?.leetcodeUsername || "").trim();
        if (!leetcodeUsername) return res.status(400).json({ message: "Leetcode username is required"})

        const leetcode = new LeetCode();
        const leetcodeUser = await leetcode.user(leetcodeUsername);

        if (!leetcodeUser) return res.status(404).json({ error: "LeetCode user not found" });
    
        const githubUrlFromLeetcode = leetcodeUser?.matchedUser?.githubUrl || null;
         // check if leetcode user had github url in their profile
        if (!githubUrlFromLeetcode) return res.status(400).json({ error: "LeetCode user does not have a GitHub URL in their profile" });

        const leetGh = normalizeGithubUrl(githubUrlFromLeetcode);
        if (!leetGh) {
            return res.status(400).json({
                error: "LeetCode profile GitHub URL is invalid or not a github.com profile."
            });
        }

        const userGh = normalizeGithubUrl(user.githubUrl);
        if (!userGh) {
            return res.status(500).json({
                error: "Your GitHub URL from OAuth is invalid (unexpected)."
            });
        }

        if (leetGh !== userGh) {
            return res.status(400).json({
                error: "GitHub URL does not match the one in LeetCode profile"
            });
        }
        
        user.leetcodeUsername = String(leetcodeUsername);
        user.leetcodeUsernameLower = String(leetcodeUsername).toLowerCase();
        await user.save();

        req.session.leetcodeUsername = user.leetcodeUsernameLower;

        return res.status(200).json({
            success: true,
            message: "LeetCode account linked successfully",
            user: {
                id: user?._id,
                leetcodeUsername: user.leetcodeUsername,
                leetcodeUsernameLower: user.leetcodeUsernameLower
            }
        });

    } catch (error) {
        if (error?.code === 11000) {
            return res.status(409).json({ message: "That LeetCode username is already linked to another account." });
        }
        console.error("linkLeetcode error:", error);
        return res.status(500).json({ message: "Server error" });
    }
}