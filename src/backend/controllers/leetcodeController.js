import { LeetCode, Credential } from "leetcode-query";
import User from "../models/User.js";


export const getUser = async (req,res) => {
    try {
        const { username } = req.params;

        const leetcode = new LeetCode();
        const user = await leetcode.user(username);

        return res.json(user);
    } catch (err) {
        console.log(err);
    }
};

export const me = async (req, res) => {
    try {
        const session = process.env.LEETCODE_SESSION_COOKIE;
        if (!session) {
            return res.status(400).json({ error: "Missing LEETCODE_SESSION_COOKIE" });
        }

        const credential = new Credential();
        await credential.init(session);

        const leetcode = new LeetCode(credential);

        const limit = 50;
        let offset = 0;
        const all = [];

        while (true) {
            const page = await leetcode.submissions({ limit, offset });

            const items = Array.isArray(page)
                ? page
                : (page?.submissions ?? page?.data ?? page?.recentSubmissionList ?? []);

            if (!items.length) break;

            all.push(...items);
            offset += limit;

            // stop on last partial page
            // if (items.length < limit) break;
        }

        return res.json({ count: all.length, submissions: all });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Server error" });
    }
};

export const linkLeetcode = async (req, res) => {
    try {
        const { username, githubUrl } = req.body;

        const leetcode = new LeetCode();
        const leetcodeUser = await leetcode.user(username);

        if (!leetcodeUser) {
            return res.status(404).json({ error: "LeetCode user not found" });
        }

        let githubUrlFromLeetcode = leetcodeUser.matchedUser.githubUrl;
        if (!githubUrlFromLeetcode) { // check if leetcode user had github url in their profile
            return res.status(400).json({ error: "LeetCode user does not have a GitHub URL in their profile" });
        }
        // console.log("change to string");
        // githubUrlFromLeetcode = githubUrlFromLeetcode.toString();
        // console.log("after change");
        if (githubUrlFromLeetcode !== githubUrl) { // check leetcoduser github url if it matches the one provided on request
            return res.status(400).json({ error: "GitHub URL does not match the one in LeetCode profile" });
        }

        // look up user in db by github url, and update leetcode username
        const user = await User.findOne({ githubUrl: githubUrl });
        if (!user) {
            return res.status(404).json({ error: "User not found in database" });
        }
        
        user.leetcodeUsername = username;
        await user.save();

        return res.status(200).json({ message: "LeetCode account linked successfully" });

    } catch (err) {
        console.log(error);
    }
}