import { LeetCode } from "leetcode-query";
import lc_problems from "../models/submissions/lc_problems.js";
import lc_submission_events from "../models/submissions/lc_submission_events.js";
import lc_daily_activity from "../models/submissions/lc_daily_activity.js";
import lc_sync_state from "../models/submissions/lc_sync_state.js";
import lc_stats_snapshot from "../models/submissions/lc_stats_snapshot.js";
import mongoose from "mongoose";

export const syncSubmissions = async (req,res) => {
    try {
        const userId = req.session?.userId;
        const leetcodeUsername = req.session?.leetcodeUsername;

        if (!userId) return res.status(401).json({ success: false, message: "Please Log In"});
        if (!leetcodeUsername) return res.status(401).json({ success: false, message: "Please Link your account"});


        const leetcode = new LeetCode();
        const recentSubmissions = await leetcode.recent_submissions(leetcodeUsername);

        // if there's no lastSync, make a new last Sync
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const lastSync = await lc_sync_state.findOne({ userId: userId }).lean();
        
        if (lastSync?.lastProfileSyncAt && new Date(lastSync.lastProfileSyncAt).getTime() === today.getTime()) {
            return res.status(400).json({
                success: false,
                message: "Already Synced For today"
            });
        }

        for (const submission of recentSubmissions) {
            let diff;
            const existingProblem = await lc_problems.findOne({ titleSlug: submission.titleSlug }).lean();
            if (!existingProblem){ 
                const { difficulty, topicTags } = await leetcode.problem(submission.titleSlug);
                diff = difficulty
                await lc_problems.findOneAndUpdate(
                    { titleSlug: submission.titleSlug },
                    {
                        $setOnInsert: {
                            titleSlug: submission.titleSlug,
                            title: submission.title,
                            difficulty,
                            topicTags,
                        }
                    },
                    { upsert: true, returnDocument: 'after' }
                );
            } else {
                diff = existingProblem?.difficulty;
            }

            const ts = Number(submission.timestamp);
            const submissionDate = new Date(ts * 1000);
            submissionDate.setHours(0, 0, 0, 0);

            const existingSubmission = await lc_submission_events.findOne({
                userId,
                titleSlug: submission.titleSlug,
                timeStamp: ts
            }).lean();
            
            if (existingSubmission) continue;

            await lc_submission_events.create({
                userId,
                titleSlug: submission.titleSlug,
                title: submission.title,
                timeStamp: ts,
                status: submission.statusDisplay,
                lang: submission.lang,
            });
            
            const accepted = submission.statusDisplay === "Accepted";

            await lc_daily_activity.findOneAndUpdate(
                { userId, date: submissionDate },
                {
                    $setOnInsert: {
                        userId,
                        date: submissionDate,
                    },
                    $inc: {
                        submissions: 1,
                        acceptedSubmissions: accepted ? 1 : 0,
                        acceptedEasy: (diff === "Easy") && accepted ? 1 : 0,
                        acceptedMedium:(diff === "Medium") && accepted ? 1 : 0,
                        acceptedHard: (diff === "Hard") && accepted ? 1 : 0,
                    }
                },
                { upsert: true, returnDocument: 'after' }
            );
        }

        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const lastSnapShot = await lc_stats_snapshot.findOne({ userId: userId }).sort({ capturedAt: -1 }).lean();

        // recompute all stats for snapshot every 7days, create new snapshot if no snap shot in past 7 days
        if (!lastSnapShot || lastSnapShot.capturedAt < sevenDaysAgo) {
            const submissions = await lc_submission_events.find(
                { userId: userId },
                { titleSlug: 1, status: 1 }
            );

            const totalSubmissions = submissions.length;
            const acceptedEvents = submissions.filter(
                (submission) => submission.status === "Accepted"
            );

            const totalAcceptedSubmissions = acceptedEvents.length;
            const uniqueSolvedSlugs = [...new Set(
                acceptedEvents.map((submission) => submission.titleSlug)
            )];

            const solvedProblems = await lc_problems.find(
                { titleSlug: { $in: uniqueSolvedSlugs } },
                { titleSlug: 1, difficulty: 1 }
            ).lean();

            let easySolved = 0;
            let mediumSolved = 0;
            let hardSolved = 0;

            for (const problem of solvedProblems) {
                if (problem.difficulty === "Easy") easySolved++;
                else if (problem.difficulty === "Medium") mediumSolved++;
                else if (problem.difficulty === "Hard") hardSolved++;
            }

            const totalSolved = solvedProblems.length;
            
            await lc_stats_snapshot.create({
                userId,
                capturedAt: today,
                totalSolved,
                easySolved,
                mediumSolved,
                hardSolved,
                totalAcceptedSubmissions,
                totalSubmissions,
            });
        }

        await lc_sync_state.findOneAndUpdate(
            { userId },
            {
                $set: {
                    userId,
                    lastProfileSyncAt: today
                }
            },
            { upsert: true, returnDocument: 'after' }
        );

        return res.status(200).json({
            success: true,
            message: "Submissions have synced"
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

export const submissionTracker = async(req,res) => {
    try {
        const userId = req.session?.userId;
        if (!userId) return res.status(401).json({ success:false, message: "Please log in" });;
        
        const allDailyActivity = await lc_daily_activity.find({ userId: userId }).sort({ date: 1}).lean();

        if (allDailyActivity.length === 0) {
            return res.status(200).json({
                success: true,
                total_submissions: 0,
                avg_submissions_per_day: 0,
                longest_streak: 0,
                current_streak: 0,
                most_active_day: null,
            });
        }

        let total_submissions = 0;
        const activeDays = allDailyActivity.length;

        let longest_streak = 1;
        let running_streak = 1;
        let most_active_day = allDailyActivity[0];


        for (let i = 0; i < allDailyActivity.length; i++) {
            const activity = allDailyActivity[i];
            total_submissions += activity.submissions;

            if (activity.submissions > most_active_day.submissions)  {
                most_active_day = activity;
            }

            if (i > 0) {
                const prev = new Date(allDailyActivity[i - 1].date);
                const curr = new Date(activity.date);

                const diffInMs = curr - prev;
                const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

                if (diffInDays === 1) { 
                    running_streak += 1;
                    if (running_streak > longest_streak) longest_streak = running_streak;
                } else {
                    running_streak = 1
                }
            }
        }

        let current_streak = 1;
        for (let i = allDailyActivity.length - 1; i > 0; i--) {
            const prev = new Date(allDailyActivity[i - 1].date);
            const curr = new Date(allDailyActivity[i].date);

            const diffInMs = curr - prev;
            const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

            if (diffInDays === 1) {
                current_streak += 1;
            } else {
                break;
            }
        }

        const avg_submissions_per_day = total_submissions / activeDays;

        return res.status(200).json({
            success: true,
            total_submissions,
            avg_submissions_per_day,
            longest_streak,
            current_streak,
            most_active_day
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

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
        });
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
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
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