import User from  "../models/User.js";
import Friend from "../models/Friend.js";
import lc_submission_events from "../models/submissions/lc_submission_events.js";
import Comment from "../models/SubmissionComments.js";
import mongoose from "mongoose";

export const submissionFeed = async (req,res) => {
    try {
        const currentUserId = req.session?.userId;
        if (!currentUserId) return res.status(401).json({ success: false, message: "Please log in to view following" });

        const followingsLeetcodeUsername = await Friend.find({ leetnodeUser: currentUserId }, { leetcodeUsername: 1 }).lean();

        const followings = [...new Set(
            followingsLeetcodeUsername.map((friend) => friend.leetcodeUsername?.trim().toLowerCase()).filter(Boolean)
        )];

        if (followings.length === 0) {
            return res.status(200).json({
                success: true,
                submissions: [],
            });
        }
    
        const userFollowings = await User.find( // if empty then the user doesn't have a leetcode account
            { leetcodeUsername: { $in: followings } },
            { _id: 1, leetcodeUsername: 1 }
        ).lean();

        const followingUserIds = [...new Set(
            userFollowings.map((id) => id._id)
        )];
        
        if (followingUserIds.length === 0) {
            return res.status(200).json({
                success: true,
                submissions: [],
            });
        }
        // get last 20 submissions from each user, store them in one array arrange in chronological descending order, display them
        const submissions = await lc_submission_events.find(
            { userId: { $in: followingUserIds } },
        ).sort({ timeStamp: -1}).limit(20).populate("userId").lean();
        

        return res.status(200).json({
            success: true,
            submissions
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const getSubmissionComments = async (req,res) => {
    try {
        const { submissionId } = req.params;
        const userId = req.session?.userId;
        const leetcodeUsername = req.session?.leetcodeUsername;

        const submissionComments = await Comment.find({ submissionId: submissionId }).lean();

        return res.status(200).json({
            success: true,
            submissionComments
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
};


export const postSubmissionComment = async (req,res) => {
    try {
        const { submissionId } = req.params; // id over submission slug
        const { userComment } = req.body;
        const userId = req.session?.userId;
        const leetcodeUsername = req.session?.leetcodeUsername;

        const comment = new Comment({
            author: userId,
            authorUsername: leetcodeUsername,
            submissionId,
            body: userComment
        });

        await comment.save();

        return res.status(200).json({
            success: true,
            comment
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
};
