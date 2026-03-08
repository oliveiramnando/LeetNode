import { LeetCode } from "leetcode-query";
import lc_problems from "../models/submissions/lc_problems.js";
import lc_submission_events from "../models/submissions/lc_submission_events.js";
import lc_daily_activity from "../models/submissions/lc_daily_activity.js";
import mongoose from "mongoose";

export const syncSubmissions = async (req,res) => {
    try {
        // const userId = req.sesson?.userId;
        // const leetcodeUsername = req.session?.leetcodeUsername;

        // if (!userId) return res.status(401).json({ success: false, message: "Please Log In"});
        // if (!leetcodeUsername) return res.status(401).json({ success: false, message: "Please Link your account"});
        const userId = new mongoose.Types.ObjectId("69a762966d5221b434ea5b1d");
        const leetcodeUsername = 'n3m0lives';

        const leetcode = new LeetCode();
        const recentSubmissions = await leetcode.recent_submissions(leetcodeUsername);

        for (const submission of recentSubmissions) {
            const { difficulty, topicTags } = await leetcode.problem(submission.titleSlug);

            await lc_problems.findOneAndUpdate(
                { titleSlug: submission.titleSlug },
                {
                    titleSlug: submission.titleSlug,
                    title: submission.title,
                    difficulty,
                    topicTags,
                },{ 
                    upsert: true, 
                    new: true 
                }
            );

            const ts = Number(submission.timestamp);
            const date = new Date(ts * 1000);
            const formatted = date.toISOString().slice(0, 10);

            await lc_submission_events.findOneAndUpdate(
                { userId, titleSlug: submission.titleSlug, timeStamp: ts },
                {
                userId,
                    titleSlug: submission.titleSlug,
                    title: submission.title,
                    timeStamp: ts,
                    status: submission.statusDisplay,
                    lang: submission.lang,
                },
                { upsert: true, new: true }
            );

            await lc_daily_activity.findOneAndUpdate(
                { userId, date: formatted },
                {
                    userId,
                    date: formatted,
                    $inc: {
                        submissions: 1,
                        easy: difficulty === "Easy" ? 1 : 0,
                        medium: difficulty === "Medium" ? 1 : 0,
                        hard: difficulty === "Hard" ? 1 : 0,
                    }
                },
                { upsert: true, new: true }
            );
        }

        return res.status(200).json({
            success: true,
            message: "Submissions have synced"
        })
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

// export const updateDailyActivity = async (req,res) => {
//     try {


//     } catch (error) {
//         console.log(error);
//         res.status(500).json({
//             success: false,
//             message: error.message
//         })
//     }   
// }

export const langDistribution = async (req,res) => {
    try {
        const userId = req.session?.userId;
        const leetcodeUsername = req.session?.leetcodeUsername;

        if (!userId) return res.status(401).json({ success:false, message: "Please log in" });
        if (!leetcodeUsername) return res.status(400).json({ success: false, message: "Link your leetcode account" });

        const langMap = Object.create(null);
        const acceptedLangMap = Object.create(null);

        const allSubmissions = await lc_submission_events.find({ userId }, 
            { titleSlug: 1, lang: 1, status: 1}
        ).lean();

        for (const submission of allSubmissions) {
            langMap[submission.lang] = (langMap[submission.lang] || 0) + 1;
            if (submission.status === "Accepted") {
                acceptedLangMap[submission.lang] = (acceptedLangMap[submission.lang] || 0) + 1;
            }
        }

        return res.status(200).json({
            success: true,
            langMap,
            acceptedLangMap
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: error.message
        })
    }
}

export const difficultyPerformance = async (req,res) => {
    try {
        const userId = req.session?.userId;
        const leetcodeUsername = req.session?.leetcodeUsername;

        if (!userId) return res.status(401).json({ success:false, message: "Please log in" });
        if (!leetcodeUsername) return res.status(400).json({ success: false, message: "Link your leetcode account" });
        
        const easy = [0,0]; // [accepted, total]
        const medium = [0,0];
        const hard = [0,0];

        const userSubmissions = await lc_submission_events.find({ userId },
            { titleSlug: 1, status: 1 }
        );

        const slugs = [...new Set(userSubmissions.map(s => s.titleSlug).filter(Boolean))];
        const problems = await lc_problems.find(
            { titleSlug:{ $in: slugs } }, 
            { titleSlug: 1, difficulty: 1 }
        ).lean();

        const diffBySlug = Object.create(null);
        for (const p of problems) diffBySlug[p.titleSlug] = p.difficulty;

        for (const submission of userSubmissions) {
            const difficulty = diffBySlug[submission.titleSlug] || "Unknown";
            const accepted = submission.status === "Accepted"

            if (difficulty === "Medium") {
                if (accepted) medium[0] += 1
                medium[1] += 1
                continue;
            }
            if (difficulty === "Easy") {
                if (accepted) easy[0] += 1
                easy[1] += 1
                continue;
            }
            if (accepted) hard[0] += 1
            hard[1] += 1
            continue;
        }

        return res.status(200).json({ 
            success: true,
            easy,
            medium,
            hard
        })

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

export const tagStrengths = async (req, res) => {
    try {
        const userId = req.session?.userId;
        const leetcodeUsername = req.session?.leetcodeUsername;

        if (!userId) return res.status(401).json({ success: false, message: "log in" });
        if (!leetcodeUsername) return res.status(400).json({ success: false, message: "link your leetcode account" });

        const tagMap = Object.create(null);

        const accepted = await lc_submission_events.find({ userId, status: "Accepted" }, 
            { titleSlug: 1 }
        ).lean();

        const acceptedSlugs = [...new Set(accepted.map((s) => s.titleSlug))];

        const problems = await lc_problems.find({ titleSlug: { $in: acceptedSlugs } }, 
            { titleSlug: 1, topicTags: 1 }
        ).lean();

        for (const p of problems) {
            const tagsArr = Array.isArray(p.topicTags) ? p.topicTags : [];
            for (const t of tagsArr) {
                const name =
                    typeof t === "string" ? t : t?.name ?? t?.title ?? t?.slug;

                if (!name) continue;
                tagMap[name] = (tagMap[name] || 0) + 1;
            }
        }

        const tags = Object.entries(tagMap).map(([tag, acceptedCount]) => (
            { tag, acceptedCount }
        )).sort((a, b) => b.acceptedCount - a.acceptedCount);

        return res.status(200).json({
            success: true,
            stats: {
                acceptedSubmissionsCount: accepted.length, 
                uniqueAcceptedProblemsCount: acceptedSlugs.length,
                tagCount: tags.length,
                lastUpdated: new Date().toISOString(),
            },
            tags,
            tagMap,
        });
        
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};