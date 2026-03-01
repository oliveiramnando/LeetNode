import { LeetCode, Credential } from "leetcode-query";
import User from "../models/User.js";


export const getUser = async (req,res) => {
    try {
        const { username } = req.params;

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

// export const me = async (req, res) => {
//     try {
//         const session = process.env.LEETCODE_SESSION_COOKIE;
//         if (!session) {
//             return res.status(400).json({ error: "Missing LEETCODE_SESSION_COOKIE" });
//         }

//         const credential = new Credential();
//         await credential.init(session);

//         const leetcode = new LeetCode(credential);

//         const limit = 50;
//         let offset = 0;
//         const all = [];

//         while (true) {
//             const page = await leetcode.submissions({ limit, offset });

//             const items = Array.isArray(page)
//                 ? page
//                 : (page?.submissions ?? page?.data ?? page?.recentSubmissionList ?? []);

//             if (!items.length) break;

//             all.push(...items);
//             offset += limit;

//             // stop on last partial page
//             // if (items.length < limit) break;
//         }

//         return res.json({ count: all.length, submissions: all });
//     } catch (err) {
//         console.error(err);
//         return res.status(500).json({ error: "Server error" });
//     }
// };

export const me = async (req, res) => {
    try {
        const leetnodeUser = await User.findOne({ userId: req.session.user._id })
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
        if (!userId) return res.status(400).json({ message: "user not logged in "});

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

        // check leetcoduser github url if it matches the one provided on request
        if (githubUrlFromLeetcode !== user.githubUrl) return res.status(400).json({ error: "GitHub URL does not match the one in LeetCode profile" });
        
        user.leetcodeUsername = leetcodeUsername;
        await user.save();

        return res.status(200).json({
            success: true,
            message: "LeetCode account linked successfully",
            user: {
                id: user?._id,
                leetcodeUsername: user.leetcodeUsername
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