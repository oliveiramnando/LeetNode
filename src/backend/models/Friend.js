import mongoose from "mongoose";

const FriendSchema = new mongoose.Schema({
    leetnodeUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    following: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        // required: true,
        index: true
    },
    leetcodeUsername: {
        type: String,
        required: true,
        index: true
    }
}, {
    timestamps: true
});

const Friend = mongoose.model('Friend', FriendSchema);
export default Friend;