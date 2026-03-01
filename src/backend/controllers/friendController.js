import Friend from "../models/Friend.js";
import User from "../models/User.js";
import { LeetCode, Credential } from "leetcode-query";
import mongoose from "mongoose";

async function verifyLeetcodeUser(leetcodeUsername) {
    const leetcode = new LeetCode();
    const user = await leetcode.user(leetcodeUsername);

    if (!user) return false;
    return true;
}

export const follow = async (req,res) => {
    try {
        const { targetLeetcodeUsername } = req.body;

        const existsLeetcoder = verifyLeetcodeUser(targetLeetcodeUsername);
        if (!existsLeetcoder) return res.status(404),json({ success: false, message: "Leetcoder does not exist"});

        const currentUserId = req.session?.userId;
        // const currentUserId = new mongoose.Types.ObjectId(); testing
        const currentLeetcodeUsername = req.session?.leetcodeUsername;

        console.log(currentUserId);

        if (!targetLeetcodeUsername) return res.status(400).json({ success: false, message: "Leetcode username not provided" });
        if (!currentUserId) return res.status(400).json({ success: false, message: "Not logged in" });

        if (targetLeetcodeUsername === currentLeetcodeUsername) return res.status(400).json({ success: false, message: "Cannot follow yourself" });

        const existingFollow = await Friend.findOne({ leetnodeUser: currentUserId, leetcodeUsername: targetLeetcodeUsername })
        if (existingFollow) return res.status(400).json({ success: false, message: "Already following user" });

        const follow = new Friend({ leetnodeUser: currentUserId, leetcodeUsername: targetLeetcodeUsername })
        console.log(follow)

        await follow.save();

        return res.status(200).json({
            success: true,
            message: "Successfully followed user",
            follow
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: error.message
        });
    }
}


export const unfollow = async (req,res) => {
    try {
        const { targetLeetcodeUsername } = req.body;

        const existsLeetcoder = verifyLeetcodeUser(targetLeetcodeUsername);
        if (!existsLeetcoder) return res.status(404),json({ success: false, message: "Leetcoder does not exist"});

        const currentUserId = req.session?.userId;
        // const currentUserId = new mongoose.Types.ObjectId(); testing
        const currentLeetcodeUsername = req.session?.leetcodeUsername;

        if (!targetLeetcodeUsername) return res.status(400).json({ success: false, message: "Leetcode username not provided" });
        if (!currentUserId) return res.status(400).json({ success: false, message: "Not logged in" });

        if (targetLeetcodeUsername === currentLeetcodeUsername) return res.status(400).json({ success: false, message: "Cannot unfollow yourself" });

        const existingFollow = await Friend.findOne({ leetnodeUser: currentUserId, leetcodeUsername: targetLeetcodeUsername })
        if (!existingFollow) return res.status(400).json({ success: false, message: "You are not following this user" });

        const unfollow = await Friend.findOneAndDelete({ leetnodeUser: currentUserId, leetcodeUsername: targetLeetcodeUsername })
        console.log(unfollow)

        // unfollow.save();

        return res.status(200).json({
            success: true,
            message: "Successfully unfollowed user",
            unfollow
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: error.message
        });
    }
}

export const getFollowers = async (req,res) => {
    try {
        const { currentleetcodeUsername } = req.body
        if (!currentleetcodeUsername) return res.status(400).json({ succes: false, message: "leetcodeUsername not provided" });

        const followers = await Friend.find({ leetcodeUsername: currentleetcodeUsername });
        if (!followers) return res.status(400).json({ success: false, message: "unable to get fetch user followers" });

        // in front end should display only leetNodeuser cause that's whos following them
        return res.status(200).json({
            success: true,
            message: "User Followers",
            followers
        })

    } catch (error){
        console.log(error);
        return res.status(500).json({
            message: error.message
        });
    }
}

export const getFollowing = async (req,res) => {
    try {
        // get leetcode username, and then if in db look it up ad use object id to get it
        const { currentleetcodeUsername } = req.body
        if (!currentleetcodeUsername) return res.status(400).json({ succes: false, message: "leetcodeUsername not provided" });

        const existingUser = await User.findOne({ leetcodeUsername: currentleetcodeUsername });
        if (!existingUser) return res.status(401).json({ success: false, message: "Profile is not a leetNode user, cannot view following"}); // maybe make it so that you can't even look up followers at all

        const currentUserId = existingUser?._id ;
        // const currentUserId = new mongoose.Types.ObjectId();

        if (!currentUserId) return res.status(400).json({ succes: false, message: "userId not provided" });

        const following = await Friend.find({ leetnodeUser: currentUserId });
        if (!following) return res.status(400).json({ success: false, message: "unable to get fetch user following" });

        return res.status(200).json({
            success: true,
            message: "User Following",
            following
        })

    } catch (error){
        console.log(error);
        return res.status(500).json({
            message: error.message
        });
    }
}