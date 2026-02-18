import { LeetCode, Credential } from "leetcode-query";

export const getUser = async (req,res) => {
    try {
        const { username } = req.params;

        const credential = new Credential();
        await credential.init("YOUR-LEETCODE-SESSION-COOKIE");

        const leetcode = new LeetCode(credential);

        const user = await leetcode.user(username);
        // const submissions =  await leetcode.submissions({ limit: 10, offset: 0 });
        // return res.json({user, submissions});
        return res.json({user});
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