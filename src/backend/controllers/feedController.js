import User from  "../models/User.js";
import Friend from "../models/Friend.js";
import lc_submission_events from "../models/submissions/lc_submission_events.js";
import mongoose from "mongoose";

export const submissionFeed = async (req,res) => {
    try {
        // const currentUserId = req.session?.userId;
        // if (!currentUserId) return res.status(401).json({ success: false, message: "Please log in to view following" });
        const userId = new mongoose.Types.ObjectId("69a762966d5221b434ea5b1d");

        const followingsLeetcodeUsername = await Friend.find({ leetnodeUser: userId }, { leetcodeUsername: 1 }).lean();

        const followings = [...new Set(
            followingsLeetcodeUsername.map((friend) => friend.leetcodeUsername)
        )];
    
        const usersCurrentFollows = await User.find( // if empty then the user doesn't have a leetcode account
            { leetcodeUsername: { $in: followings } },
            { _id: 1, leetcodeUsername: 1 }
        ).lean();
        
        

        return res.status(200).json({
            success: true,
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}