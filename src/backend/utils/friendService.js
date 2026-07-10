import Friend from "../models/Friend.js";
import User from "../models/User.js";

export async function getUsersWhoFollowBack(currentUserId, currentLeetcodeUsername) {
    const lc = String(currentLeetcodeUsername).trim().toLowerCase();

    const followingRecords = await Friend.find(
        { leetnodeUser: currentUserId },
        { leetcodeUsername: 1 }
    ).lean();

    const followingUsernames = [
        ...new Set(
            followingRecords
                .map((record) =>
                    record.leetcodeUsername?.trim().toLowerCase()
                )
                .filter(Boolean)
        ),
    ];

    if (followingUsernames.length === 0) {
        return [];
    }

    const usersYouFollow = await User.find(
        {
            leetcodeUsernameLower: {
                $in: followingUsernames,
            },
        },
        {
            _id: 1,
            leetcodeUsername: 1,
        }
    ).lean();

    if (usersYouFollow.length === 0) {
        return [];
    }

    const followBackRecords = await Friend.find({
        leetnodeUser: {
            $in: usersYouFollow.map((user) => user._id),
        },
        leetcodeUsername: lc,
    })
        .populate({
            path: "leetnodeUser",
            select: "_id leetcodeUsername",
        })
        .lean();

    return followBackRecords
        .filter((record) => record.leetnodeUser?.leetcodeUsername)
        .map((record) => ({
            userId: record.leetnodeUser._id,
            leetcodeUsername: record.leetnodeUser.leetcodeUsername,
        }));
}