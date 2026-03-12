import lc_problems from "../models/submissions/lc_problems.js";
import lc_submission_events from "../models/submissions/lc_submission_events.js";
import lc_daily_activity from "../models/submissions/lc_daily_activity.js";
;

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
