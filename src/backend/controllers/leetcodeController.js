import { LeetCode } from "leetcode-query";

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