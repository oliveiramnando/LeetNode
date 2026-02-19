import { LeetCode, Credential } from "leetcode-query";

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

export const getGithubUsername = async (req, res) => {
    try {
        const { userName } = req.body;

        const leetcode = new LeetCode();
        const user = await leetcode.user(username);
        
        return res.json(user);
    } catch (err) {
        console.log(error);
    }
}