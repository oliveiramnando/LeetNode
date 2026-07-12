import { LeetCode } from "leetcode-query";
import User from "../models/User.js";
import { syncSubmissionsIfNeeded } from "../utils/syncSubmissions.js";
import lc_user_submission_stats from "../models/submissions/lc_user_submission_stats.js";


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
        const { username } = req.params;
        const userId = req.session?.userId;
        const leetcodeUsernameLower = req.session?.leetcodeUsernameLower;

        if (userId && leetcodeUsername && leetcodeUsername === String(username).toLowerCase()) {
            const syncResult = await syncSubmissionsIfNeeded(userId, leetcodeUsername);
        }

        const leetcode = new LeetCode();
        const user = await leetcode.user(username);

        if (userId && leetcodeUsernameLower && leetcodeUsernameLower === String(username).toLowerCase()) {
            await syncSubmissionsIfNeeded(userId, leetcodeUsernameLower);

            const acceptedStats = user?.matchedUser?.submitStats?.acSubmissionNum ?? [];

            const solvedByDifficulty = Object.fromEntries(
                acceptedStats.map((stat) => [
                    stat.difficulty,
                    stat.count,
                ])
            );

            await lc_user_submission_stats.findOneAndUpdate(
                { userId },
                {
                    $set: {
                        totalEasySubmissions: solvedByDifficulty.Easy ?? 0,
                        totalMediumSubmissions: solvedByDifficulty.Medium ?? 0,
                        totalHardSubmissions: solvedByDifficulty.Hard ?? 0,
                        lastSubmissionAt: new Date(),
                    },
                },
                {
                    upsert: true,
                    new: true,
                    setDefaultsOnInsert: true,
                }
            );
        } 
        
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
        
        req.session.leetcodeUsername = user.leetcodeUsername;
        req.session.leetcodeUsernameLower = user.leetcodeUsernameLower;

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