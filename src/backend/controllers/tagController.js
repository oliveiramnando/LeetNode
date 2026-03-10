import lc_problems from "../models/submissions/lc_problems.js";
import lc_submission_events from "../models/submissions/lc_submission_events.js";


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

export const tagWeaknesses = async (req, res) => {
    try {
        const userId = req.session?.userId;
        const leetcodeUsername = req.session?.leetcodeUsername;

        if (!userId) return res.status(401).json({ success: false, message: "log in" });
        if (!leetcodeUsername) return res.status(400).json({ success: false, message: "link your leetcode account", });

        const submissions = await lc_submission_events.find(
            { userId },
            { titleSlug: 1, status: 1 }
        ).lean();

        if (!submissions.length) return res.status(200).json({ success: true, weakestTags: [], tagStats: [], });
    
        // Track per-problem attempt/accepted state
        const problemStats = Object.create(null);

        for (const sub of submissions) {
            const slug = sub.titleSlug;
            if (!slug) continue;

            if (!problemStats[slug]) {
                problemStats[slug] = {
                    attempted: false,
                    accepted: false,
                };
            }
            problemStats[slug].attempted = true;

            if (sub.status === "Accepted") problemStats[slug].accepted = true;
        }

        const submissionSlugs = Object.keys(problemStats);
        const problems = await lc_problems.find(
            { titleSlug: { $in: submissionSlugs } },
            { titleSlug: 1, topicTags: 1 }
        ).lean();

        const tagMap = Object.create(null);

        for (const problem of problems) {
            const slug = problem.titleSlug;
            const stats = problemStats[slug];
            if (!stats) continue;

            const tagsArr = Array.isArray(problem.topicTags) ? problem.topicTags : [];

            for (const t of tagsArr) {
                const name =
                    typeof t === "string" ? t : t?.name ?? t?.title ?? t?.slug;

                if (!name) continue;

                if (!tagMap[name]) {
                    tagMap[name] = {
                        tag: name,
                        attemptedProblems: 0,
                        acceptedProblems: 0,
                    };
                }

                if (stats.attempted) tagMap[name].attemptedProblems += 1;
                if (stats.accepted) tagMap[name].acceptedProblems += 1; 
            }
        }

        const tagStats = Object.values(tagMap).map((tag) => {
            const acceptanceRate =
                tag.attemptedProblems > 0
                    ? tag.acceptedProblems / tag.attemptedProblems
                    : 0;

            const failedProblems =
                tag.attemptedProblems - tag.acceptedProblems;

            return {
                ...tag,
                failedProblems,
                acceptanceRate,
            };
        }).filter((tag) => tag.attemptedProblems >= 2).sort((a, b) => {
            if (a.acceptanceRate !== b.acceptanceRate) {
                return a.acceptanceRate - b.acceptanceRate; // lowest rate = weakest
            }
            return b.attemptedProblems - a.attemptedProblems; // more attempts = more meaningful
        });

        const weakestTags = tagStats.slice(0, 3);

        return res.status(200).json({
            success: true,
            weakestTags,
            tagStats,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
        success: false,
        message: error.message,
        });
    }
};