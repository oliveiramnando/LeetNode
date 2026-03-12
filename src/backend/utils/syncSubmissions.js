import { LeetCode } from "leetcode-query";
import lc_problems from "../models/submissions/lc_problems.js";
import lc_submission_events from "../models/submissions/lc_submission_events.js";
import lc_daily_activity from "../models/submissions/lc_daily_activity.js";
import lc_sync_state from "../models/submissions/lc_sync_state.js";
import lc_stats_snapshot from "../models/submissions/lc_stats_snapshot.js";
import { fillLcProblems } from "../utils/fillLcProblems.js";

async function syncSubmissionsIfNeeded (userId, leetcodeUsername) {
    try {
        if (!userId) throw new Error("Missing userId");
        if (!leetcodeUsername) throw new Error("Missing leetcodeUsername");

        const leetcode = new LeetCode();
        const recentSubmissions = await leetcode.recent_submissions(leetcodeUsername);

        // if there's no lastSync, make a new last Sync
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const lastSync = await lc_sync_state.findOne({ userId: userId }).lean();
        
        if (lastSync?.lastProfileSyncAt && new Date(lastSync.lastProfileSyncAt).getTime() === today.getTime()) {
            console.log ("already synced");
            return { synced: false, reason: "already_synced" };
        }

        for (const submission of recentSubmissions) {
            const { difficulty } = await fillLcProblems(leetcode, submission); // fills lc_db problem

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
                        acceptedEasy: (difficulty === "Easy") && accepted ? 1 : 0,
                        acceptedMedium:(difficulty === "Medium") && accepted ? 1 : 0,
                        acceptedHard: (difficulty === "Hard") && accepted ? 1 : 0,
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
        console.log("finished syncing");
        return { synced: true };
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export { syncSubmissionsIfNeeded };