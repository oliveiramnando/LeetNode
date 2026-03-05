import { LeetCode } from "leetcode-query";
import lc_problems from "../models/submissions/lc_problems.js";
import lc_submission_events from "../models/submissions/lc_submission_events.js";

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

        console.log(allSubmissions);

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
            { titleSlug: 1, difficulty: 1, status: 1 }
        );

        for (const submission of userSubmissions) {
            const problem = await lc_problems.findOne({ titleSlug: submission.titleSlug })
            if (problem.difficulty === "Medium") {
                if (submission.status == "Accepted") medium[0] += 1
                medium[1] += 1
                continue;
            }
            if (problem.difficulty === "Easy") {
                if (submission.status == "Accepted") easy[0] += 1
                easy[1] += 1
                continue;
            }
            if (submission.status == "Accepted") hard[0] += 1
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
        }

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