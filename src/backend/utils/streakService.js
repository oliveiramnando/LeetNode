import FriendStreak from "../models/FriendStreak.js";
import lc_submission_events from "../models/submissions/lc_submission_events.js";
import { getUsersWhoFollowBack } from "./friendService.js";
import { createPairKey, getUtcDateKey, getPreviousUtcDateKey, getUtcDayRange, } from "./date.js";


export async function initializeFriendStreaks(currentUserId, currentLeetcodeUsername) {
    const usersWhoFollowBack = await getUsersWhoFollowBack(
        currentUserId,
        currentLeetcodeUsername
    );

    if (usersWhoFollowBack.length === 0) {
        return [];
    }

    const operations = usersWhoFollowBack.map((friend) => {
        const pairKey = createPairKey(
            currentUserId,
            friend.userId
        );

        return {
            updateOne: {
                filter: { pairKey },
                update: {
                    $setOnInsert: {
                        users: [
                            currentUserId,
                            friend.userId,
                        ],
                        pairKey,
                        currentStreak: 0,
                        longestStreak: 0,
                        lastCompletedDate: null,
                    },
                },
                upsert: true,
            },
        };
    });

    await FriendStreak.bulkWrite(operations);

    const pairKeys = usersWhoFollowBack.map((friend) =>
        createPairKey(currentUserId, friend.userId)
    );

    return FriendStreak.find({
        pairKey: { $in: pairKeys },
    })
        .populate({
            path: "users",
            select: "_id leetcodeUsername",
        })
        .lean();
}


export async function bothUsersSolvedOnDate(
    userIds,
    date = new Date()
) {
    const normalizedUserIds = userIds.map((user) =>
        user?._id ? user._id : user
    );

    const { start, end } = getUtcDayRange(date);

    const usersWhoSolved =
        await lc_submission_events.distinct("userId", {
            userId: {
                $in: normalizedUserIds,
            },
            timeStamp: {
                $gte: start,
                $lt: end,
            },
            statusDisplay: "Accepted",
        });

    const uniqueUserIds = new Set(
        usersWhoSolved.map((userId) => userId.toString())
    );

    return normalizedUserIds.every((userId) =>
        uniqueUserIds.has(userId.toString())
    );
}


export async function updateFriendStreak(
    streak,
    date = new Date()
) {
    const dateKey = getUtcDateKey(date);
    const previousDateKey = getPreviousUtcDateKey(date);

    if (streak.lastCompletedDate === dateKey) {
        return streak;
    }

    const bothSolved = await bothUsersSolvedOnDate(
        streak.users,
        date
    );

    if (!bothSolved) {
        return FriendStreak.findByIdAndUpdate(
            streak._id,
            {
                $set: {
                    currentStreak: 0,
                },
            },
            {
                returnDocument: "after",
            }
        )
            .populate({
                path: "users",
                select: "_id leetcodeUsername",
            })
            .lean();
    }

    const nextStreak =
        streak.lastCompletedDate === previousDateKey
            ? streak.currentStreak + 1
            : 1;

    return FriendStreak.findByIdAndUpdate(
        streak._id,
        {
            $set: {
                currentStreak: nextStreak,
                lastCompletedDate: dateKey,
            },
            $max: {
                longestStreak: nextStreak,
            },
        },
        {
            returnDocument: "after",
        }
    )
        .populate({
            path: "users",
            select: "_id leetcodeUsername",
        })
        .lean();
}


export async function getStreaksForUser(
    currentUserId,
    currentLeetcodeUsername
) {
    const streaks = await initializeFriendStreaks(
        currentUserId,
        currentLeetcodeUsername
    );

    if (streaks.length === 0) {
        return [];
    }

    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);

    return Promise.all(
        streaks.map((streak) =>
            updateFriendStreak(streak, yesterday)
        )
    );
}

