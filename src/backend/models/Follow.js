import mongoose from "mongoose";

const FollowSchema = new mongoose.Schema({
    follower: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    following: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    }
    
}, {
    timestamps: true
});

const Follow = mongoose.model('Follow', FollowSchema);
export default Follow;