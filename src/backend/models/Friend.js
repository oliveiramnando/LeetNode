import mongoose from "mongoose";

const FriendSchema = new mongoose.Schema({
    leetnodeUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    leetcodeUsername: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        index: true
    }
}, {
    timestamps: true
});

FriendSchema.index(
    { leetnodeUser: 1, leetcodeUsername: 1 },
    { unique: true }
);

const Friend = mongoose.model('Friend', FriendSchema);
export default Friend;