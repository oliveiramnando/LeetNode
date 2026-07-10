import Friend from "../models/Friend.js";
import { LeetCode } from "leetcode-query";

async function verifyLeetcodeUser(leetcodeUsername, timeoutMs = 5000) {
    const leetcode = new LeetCode();
    
    try {
        const user = await Promise.race([ // timeout
            leetcode.user(leetcodeUsername),
            new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), timeoutMs)),
        ]);

        if (!user) return { ok: false, reason: "not_found" };
        return { ok: true };
    } catch (error) {
        console.error("LeetCode verify error:", error?.message || error);
        return { ok: false, reason: "unavailable" };
    }
}

export const follow = async (req,res) => {
    try {
        const { leetcodeUsername } = req.params;
        const currentUserId = req.session?.userId;
        // const currentUserId = new mongoose.Types.ObjectId(); testing
        const currentLeetcodeUsername = req.session?.leetcodeUsername;

        const target = String(leetcodeUsername).trim().toLowerCase();

        if (!target) return res.status(400).json({ success: false, message: "Leetcode username not provided" });
        if (!currentUserId) return res.status(401).json({ success: false, message: "Not logged in" });

        if (target === currentLeetcodeUsername) return res.status(400).json({ success: false, message: "Cannot follow yourself" });

        const existingFollow = await Friend.findOne({ leetnodeUser: currentUserId, leetcodeUsername: target })
        if (existingFollow) return res.status(400).json({ success: false, message: "Already following user" });

        const verify = await verifyLeetcodeUser(target);
        if (!verify.ok) {
            if (verify.reason === "not_found") return res.status(404).json({ success: false, message: "LeetCode user not found" });

            return res.status(503).json({ success: false, message: "LeetCode verification unavailable. Try again." });
        }
        const follow = new Friend({ leetnodeUser: currentUserId, leetcodeUsername: target });

        await follow.save();

        return res.status(200).json({
            success: true,
            message: "Successfully followed user",
            follow
        });

    } catch (error) {
        if (error?.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Already following user"
            })
        }
        console.log(error);
        return res.status(500).json({
            message: error.message
        });
    }
}


export const unfollow = async (req,res) => {
    try {
        const { leetcodeUsername } = req.params;
        const currentUserId = req.session?.userId;
        const currentLeetcodeUsername = req.session?.leetcodeUsername;

        const target = String(leetcodeUsername).trim().toLowerCase();

        if (!target) return res.status(400).json({ success: false, message: "Leetcode username not provided" });
        if (!currentUserId) return res.status(401).json({ success: false, message: "Not logged in" });

        if (target === currentLeetcodeUsername) return res.status(400).json({ success: false, message: "Cannot unfollow yourself" });

        const existingFollow = await Friend.findOne({ leetnodeUser: currentUserId, leetcodeUsername: target })
        if (!existingFollow) return res.status(400).json({ success: false, message: "You are not following this user" });

        const unfollow = await Friend.findOneAndDelete({ leetnodeUser: currentUserId, leetcodeUsername: target });

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

export const getFriendCounts = async (req, res) => {
    try {
        const currentUserId = req.session?.userId;
        const currentLeetcodeUsername = req.session?.leetcodeUsername;

        if (!currentUserId) return res.status(401).json({ success: false, message: "Please log in to view friend counts" });
        if (!currentLeetcodeUsername) return res.status(400).json({ success: false, message: "Please link your leetcode-account to view friend counts" });
    

        const lc = String(currentLeetcodeUsername).trim().toLowerCase();

        const [followerCount, followingCount] = await Promise.all([
            Friend.countDocuments({ leetcodeUsername: lc }), // followers
            Friend.countDocuments({ leetnodeUser: currentUserId }) // following
        ]);

        return res.status(200).json({
            success: true,
            counts: { followerCount, followingCount },
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: error.message
        });
    }
};

export const isFollowing = async (req,res) => {
    try {
        const { leetcodeUsername } = req.params;
        const currentUserId = req.session?.userId;

        if (!leetcodeUsername) return res.status(400).json({ success: false, message: "Please provide a leetcode username" });
        if (!currentUserId) return res.status(401).json({ success: false, message: "Please log in to view isFollowing" });

        const target = String(leetcodeUsername).trim().toLowerCase();
        const exists = await Friend.exists({ leetnodeUser: currentUserId, leetcodeUsername: target });

        return res.json({ isFollowing: !!exists });
        
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: error.message
        });
    }
}

export const getFollowers = async (req,res) => {
    try {
        const currentUserId = req.session?.userId;
        const currentLeetcodeUsername = req.session?.leetcodeUsername;

        if (!currentUserId) return res.status(401).json({ success: false, message: "please log in to view folllowers"});
        if (!currentLeetcodeUsername) return res.status(401).json({ success: false, message: "Please link your leetcode account"});

        // Find all follow records where the current user's LeetCode username 
        // is the account being followed. Populate `leetnodeUser` so the follower's
        // User document replaces the stored ObjectId, allowing access to
        // `record.leetnodeUser.leetcodeUsername`. Only fetch the follower's `_id`
        // and `leetcodeUsername`, sort newest followers first, and return plain objects.

        const followerRecords = await Friend.find({ leetcodeUsername: currentLeetcodeUsername })
            .populate({
                path: 'leetnodeUser',
                select: '_id leetcodeUsername' 
            }).sort({ createdAt: -1 }).lean();

        const followers = followerRecords.filter((record) => record.leetnodeUser?.leetcodeUsername)
        .map((record) => ({
            _id: record._id,
            userId: record.leetnodeUser._id,
            leetcodeUsername: record.leetnodeUser.leetcodeUsername,
            createdAt: record.createdAt,
        }));

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
        const currentUserId = req.session?.userId;
        if (!currentUserId) return res.status(401).json({ success: false, message: "Please log in to view following" });

        const following = await Friend.find({ leetnodeUser: currentUserId });

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