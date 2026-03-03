// submission analysis/data processing
import { LeetCode } from "leetcode-query";
import lc_problems from "../models/submissions/lc_problems.js";
import lc_submission_events from "../models/submissions/lc_submission_events.js";
import User from "../models/User.js";

// make async helper function to backfill lc problemsDB
// make async helper functino to update submission events DB

export const tagStrengths = async (req,res) => {
    try {
        const userId = req.session?.userId;
        const leetcodeUsername = req.session?.leetcodeUsername;

        if (!userId) return res.status(401).json({ message: "log in" })
        if (!leetcodeUsername) return res.status(400).json({ message: "link your leetcode account" })

        const leetcode = new LeetCode();
        const recentSubmissions =  await leetcode.recent_submissions(leetcodeUsername);

        // update lc_problems and lc_submission_events
        for (const submission of recentSubmissions) {
            const { difficulty, topicTags} = await leetcode.problem(submission.titleSlug);

            await lc_problems.findOneAndUpdate({ titleSlug: submission.titleSlug },
                {
                    titleSlug: submission.titleSlug,
                    title: submission.title,
                    difficulty: difficulty,
                    topicTags: topicTags,
                }, {
                    upsert: true,
                    new: true
                }
            );   
            // check if submission is in recentSubmissions
            await lc_submission_events.findOneAndUpdate({ userId: userId, titleSlug: submission.titleSlug, timeStamp: submission.timestamp }, 
                {
                    userId: userId,
                    titleSlug: submission.titleSlug,
                    title: submission.title,
                    timeStamp: submission.timestamp,
                    status: submission.statusDisplay,
                    lang: submission.lang
                }, {
                    upsert: true,
                    new: true
                }
            )
        }
        // build tags from all user submission
        let tagDictionary = {}
        const userSubmissions = await lc_submission_events.find({ userId: userId, status: "Accepted" });
        // console.log(userSubmissions);

        for (const submission of userSubmissions) {
            const problem = await lc_problems.findOne({ titleSlug: submission.titleSlug });

            for (const tag of problem.topicTags.title) {
                tagDictionary[tag] = (tagDictionary[tag] || 0) + 1;
            }
        }
        
        

        return res.status(200).json({ success: true, tagDictionary});
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}