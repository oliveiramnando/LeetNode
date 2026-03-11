import lc_problems from "../models/submissions/lc_problems.js";
import lc_submission_events from "../models/submissions/lc_submission_events.js";
import { LeetCode } from "leetcode-query";
import mongoose from "mongoose";


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
        // const userId = req.session?.userId;
        // const leetcodeUsername = req.session?.leetcodeUsername;

        // if (!userId) return res.status(401).json({ success: false, message: "log in" });
        // if (!leetcodeUsername) return res.status(400).json({ success: false, message: "link your leetcode account" });

        const userId = new mongoose.Types.ObjectId("69a762966d5221b434ea5b1d");
        const leetcodeUsername = "n3m0lives";

        const submissions = await lc_submission_events.find(
            { userId },
            { titleSlug: 1, status: 1 }
        ).lean();

        if (!submissions.length) {
            return res.status(200).json({
                success: true,
                weakestTags: [],
                tagStats: [],
                recommendations: [],
            });
        }

        const problemStats = Object.create(null);

        for (const sub of submissions) {
            const slug = sub.titleSlug;
            if (!slug) continue;

            if (!problemStats[slug]) {
                problemStats[slug] = {
                    attempted: 0,
                    accepted: 0,
                };
            }

            problemStats[slug].attempted += 1;

            if (sub.status === "Accepted") {
                problemStats[slug].accepted += 1;
            }
        }

        const submissionSlugs = Object.keys(problemStats);

        const acceptedSlugs = new Set(
            submissions
                .filter((s) => s.status === "Accepted" && s.titleSlug)
                .map((s) => s.titleSlug)
        );

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
                        attemptedSubmissions: 0,
                        acceptedSubmissions: 0,
                    };
                }

                tagMap[name].attemptedSubmissions += stats.attempted;
                tagMap[name].acceptedSubmissions += stats.accepted;
            }
        }

        const tagStats = Object.values(tagMap)
            .map((tag) => {
                const acceptanceRate =
                    tag.attemptedSubmissions > 0
                        ? tag.acceptedSubmissions / tag.attemptedSubmissions
                        : 0;

                const failedSubmissions =
                    tag.attemptedSubmissions - tag.acceptedSubmissions;

                return {
                    ...tag,
                    failedSubmissions,
                    acceptanceRate,
                };
            })
            .filter((tag) => tag.attemptedSubmissions >= 2)
            .sort((a, b) => {
                if (a.acceptanceRate !== b.acceptanceRate) {
                    return a.acceptanceRate - b.acceptanceRate;
                }
                if (a.failedSubmissions !== b.failedSubmissions) {
                    return b.failedSubmissions - a.failedSubmissions;
                }
                return b.attemptedSubmissions - a.attemptedSubmissions;
            });

        const weakestTags = tagStats.slice(0, 3);

        const leetcode = new LeetCode();

        const weaknessResults = await Promise.all(
            weakestTags.map(async (weakness) => {
                const result = await leetcode.problems({
                    filters: {
                        difficulty: "MEDIUM",
                        tags: [weakness.tag],
                    },
                    limit: 20,
                });

                return {
                    tag: weakness.tag,
                    questions: Array.isArray(result?.questions) ? result.questions : [],
                };
            })
        );

        const weakTagSet = new Set(weakestTags.map((t) => t.tag));

        const uniqueProblems = new Map();

        for (const entry of weaknessResults) {
            for (const q of entry.questions) {
                if (!q?.titleSlug) continue;

                if (!uniqueProblems.has(q.titleSlug)) {
                    uniqueProblems.set(q.titleSlug, {
                        ...q,
                        weakTagMatches: 0,
                        matchedWeakTags: [],
                    });
                }

                const existing = uniqueProblems.get(q.titleSlug);

                const questionTags = Array.isArray(q.topicTags) ? q.topicTags : [];
                const matched = [];

                for (const tagObj of questionTags) {
                    const name =
                        typeof tagObj === "string"
                            ? tagObj
                            : tagObj?.name ?? tagObj?.title ?? tagObj?.slug;

                    if (name && weakTagSet.has(name)) {
                        matched.push(name);
                    }
                }

                const dedupedMatched = [...new Set(matched)];
                existing.weakTagMatches = dedupedMatched.length;
                existing.matchedWeakTags = dedupedMatched;
            }
        }

        const recommendations = [...uniqueProblems.values()].filter((p) => !acceptedSlugs.has(p.titleSlug))
            .sort((a, b) => {
                if (a.weakTagMatches !== b.weakTagMatches) {
                    return b.weakTagMatches - a.weakTagMatches;
                }
                return a.title.localeCompare(b.title);
            }).slice(0, 5).map((p) => ({
                title: p.title,
                titleSlug: p.titleSlug,
                difficulty: p.difficulty,
                weakTagMatches: p.weakTagMatches,
                matchedWeakTags: p.matchedWeakTags,
                libraryUrl: p.libraryUrl,
                url: p.libraryUrl
                    ? `https://leetcode.com${p.libraryUrl}`
                    : `https://leetcode.com/problems/${p.titleSlug}`,
            }));

        return res.status(200).json({
            success: true,
            weakestTags,
            tagStats,
            recommendations,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};