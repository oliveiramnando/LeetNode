import User from "../models/User.js";
import { LeetCode } from "leetcode-query";
import { syncSubmissionsIfNeeded } from "../utils/syncSubmissions.js";

export const createAccount = async (req,res) => {
    try {
        const leetcodeUsername = "rpanchm1";
        const testAccount = await User.create({
            githubID: 123,
            githubUsername: "testAccount",
            githubUrl: "testAccount.com",
            leetcodeUsername,
            leetcodeUsernameLower: "rpanchm1",
        });

        const leetcode = new LeetCode();

        console.log(testAccount);

        console.log(testAccount?._id)

        await syncSubmissionsIfNeeded(testAccount?._id, leetcodeUsername)

        return res.status(200).json({ success: true });

    } catch (error) {
        console.log(error)
        return res.status(500).json({ success: false, message: error.message });
    }
}
