import User from "../models/User.js";
import Follow from "../models/Follow.js";

export const follow = async (req, res) => {
    try {
        const { targetUserId } = req.body;
        const currentUserId = req.session.userId;

        if (targetUserId === currentUserId) {
            return res.status(400).json({ message: "Cannot follow yourself" });
        }

        const targetUser = await User.findById(targetUserId);
        if (!targetUser) {
            return res.status(404).json({ message: "User not found" });
        }
        const currentUser = await User.findById(currentUserId);
        if (!currentUser) {
            return res.status(404).json({ message: "Current user not found" });
        }
        
        const existingFollow = await Follow.findOne({ follower: currentUserId, following: targetUserId });
        if (existingFollow) {
            return res.status(400).json({ message: "Already following this user" });
        }

        const follow = new Follow({ follower: currentUserId, following: targetUserId });
        await follow.save();

        return res.status(200).json({ message: "Successfully followed user" });
    } catch (err) {
        console.log(err);
    }
}

export const unfollow = async (req, res) => {
    try {
        const { targetUserId } = req.body;
        const currentUserId = req.session.userId;

        if (targetUserId === currentUserId) {
            return res.status(400).json({ message: "Cannot unfollow yourself" });
        }

        const targetUser = await User.findById(targetUserId);
        if (!targetUser) {
            return res.status(404).json({ message: "User not found" });
        }
        const currentUser = await User.findById(currentUserId);
        if (!currentUser) {
            return res.status(404).json({ message: "Current user not found" });
        }
        
        const existingFollow = await Follow.findOne({ follower: currentUserId, following: targetUserId });
        if (!existingFollow) {
            return res.status(400).json({ message: "You are not unfollowing this user" });
        }

        const result = new Follow.findOneAndDelte({ follower: currentUserId, following: targetUserId });
        await result.save();

        return res.status(200).json({ message: "Successfully unfollowed user" });
    } catch (err) { 
        console.log(err);
    }
}