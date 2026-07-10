import User from  "../models/User.js";
import Friend from "../models/Friend.js";
import lc_submission_events from "../models/submissions/lc_submission_events.js";
import Comment from "../models/SubmissionComments.js";
import mongoose from "mongoose";
import { getStreaksForUser } from "../utils/streakService.js";

export const getUserStreaks = async (req, res) => {
    try {
        const currentUserId = req.session?.userId;
        const currentLeetcodeUsername =
            req.session?.leetcodeUsername;

        if (!currentUserId) {
            return res.status(401).json({
                success: false,
                message: "Please log in to view streaks",
            });
        }

        if (!currentLeetcodeUsername) {
            return res.status(400).json({
                success: false,
                message:
                    "Please link your LeetCode account to view streaks",
            });
        }

        const streaks = await getStreaksForUser(
            currentUserId,
            currentLeetcodeUsername
        );

        return res.status(200).json({
            success: true,
            streaks,
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


export const submissionFeed = async (req,res) => {
    try {
        const currentUserId = req.session?.userId;
        if (!currentUserId) return res.status(401).json({ success: false, message: "Please log in to view following" });

        const currentUserObjectId = new mongoose.Types.ObjectId(currentUserId);

        const followingsLeetcodeUsername = await Friend.find({ leetnodeUser: currentUserId }, { leetcodeUsername: 1 }).lean();

        const followings = [...new Set(
            followingsLeetcodeUsername.map((friend) => friend.leetcodeUsername?.trim().toLowerCase()).filter(Boolean)
        )];
    
        const userFollowings =
            followings.length > 0
                ? await User.find(
                    { leetcodeUsernameLower: { $in: followings } },
                    { _id: 1, leetcodeUsername: 1 }
                ).lean()
                : [];


        const followingUserIds = [
            currentUserObjectId,
            ...new Set(userFollowings.map((user) => user._id)),
        ];
        
        // get last 20 submissions from each user, store them in one array arrange in chronological descending order, display them
        // const submissions = await lc_submission_events.find(
        //     { userId: { $in: followingUserIds } },
        // ).sort({ timeStamp: -1}).limit(20).populate("userId").lean();
        const submissions = await lc_submission_events.aggregate([
            {
                $match: {
                userId: { $in: followingUserIds },
                },
            },
            {
                $sort: { timeStamp: -1 },
            },
            {
                $limit: 20,
            },
            {
                $lookup: {
                from: "comments",
                localField: "_id",
                foreignField: "submissionId",
                as: "comments",
                },
            },
            {
                $addFields: {
                commentCount: { $size: "$comments" },
                },
            },
            {
                $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "userId",
                },
            },
            {
                $unwind: "$userId",
            },
            {
                $project: {
                comments: 0,
                "userId.password": 0,
                "userId.__v": 0,
                },
            },
            ]);
        

        return res.status(200).json({
            success: true,
            currentUserId,
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

export const deleteSubmissionComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const userId = req.session?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Please log in to delete a comment"
            });
        }

        if (!mongoose.Types.ObjectId.isValid(commentId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid comment id"
            });
        }

        const comment = await Comment.findById(commentId);

        if (!comment) {
            return res.status(404).json({
                success: false,
                message: "Comment not found"
            });
        }

        const submission = await lc_submission_events.findById(comment.submissionId);

        if (!submission) {
            return res.status(404).json({
                success: false,
                message: "Submission not found"
            });
        }

        const isCommentAuthor = comment.author.toString() === userId.toString();
        const isSubmissionOwner = submission.userId.toString() === userId.toString();

        if (!isCommentAuthor && !isSubmissionOwner) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to delete this comment"
            });
        }

        await Comment.findByIdAndDelete(commentId);

        return res.status(200).json({
            success: true,
            // currentUserId: userId,
            message: "Comment deleted successfully"
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
