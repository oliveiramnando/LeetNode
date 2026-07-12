import lc_submission_events from "../models/submissions/lc_submission_events.js";
import lc_daily_activity from "../models/submissions/lc_daily_activity.js";
import { getUsersWhoFollowBack } from "../utils/friendService.js";
import lc_user_submission_stats from "../models/submissions/lc_user_submission_stats.js";

export const friendLeaderboard = async (req, res) => {
    // leaderboard for following, based on submissions during the week (for now we gon do copleted of all time, once theres more users, we do weekly)
    // easy has weight of 1, medium has weight of 2, hard has weight of 3
    // sort by total score, top 5 gets displayed, underneath the top 5, display the current user's rank and score
    try {
        const userId = req.session?.userId;
        const currentLeetcodeUsername = req.session?.leetcodeUsernameLower;

        if (!userId) return res.status(401).json({ success:false, message: "Please log in" });
        if (!currentLeetcodeUsername) return res.status(400).json({ success:false, message: "LeetCode username not found" });

         const friendRecords = await getUsersWhoFollowBack(
            userId,
            currentLeetcodeUsername
        );

        const leaderboardUserIds = [
            userId,
            ...friendRecords.map(
                (friend) => friend.userId
            ),
        ];

        const stats = await lc_user_submission_stats
            .find({
                userId: {
                    $in: leaderboardUserIds,
                },
            })
            .populate({
                path: "userId",
                select: "leetcodeUsername",
            })
            .lean();

        const leaderboard = stats
            .filter((stat) => stat.userId)
            .map((stat) => {
                const score =
                    stat.totalEasySubmissions +
                    stat.totalMediumSubmissions * 2 +
                    stat.totalHardSubmissions * 3;

                return {
                    userId: stat.userId._id,
                    leetcodeUsername:
                        stat.userId.leetcodeUsername,
                    totalEasySubmissions:
                        stat.totalEasySubmissions,
                    totalMediumSubmissions:
                        stat.totalMediumSubmissions,
                    totalHardSubmissions:
                        stat.totalHardSubmissions,
                    score,
                };
            });

        leaderboard.sort(
            (a, b) => b.score - a.score
        );

        const rankedLeaderboard = leaderboard.map(
            (entry, index) => ({
                ...entry,
                rank: index + 1,
            })
        );

        const topFive =
            rankedLeaderboard.slice(0, 5);

        const currentUserEntry =
            rankedLeaderboard.find(
                (entry) =>
                    String(entry.userId) ===
                    String(userId)
            ) ?? null;

        return res.status(200).json({
            success: true,
            topFive,
            currentUser: currentUserEntry,
            totalParticipants:
                rankedLeaderboard.length,
        });
        
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }

}



