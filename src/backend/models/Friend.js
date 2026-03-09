import mongoose from "mongoose";

const FriendSchema = new mongoose.Schema({
    leetnodeUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    leetcodeUsername: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
    }
}, {
    timestamps: true
});

FriendSchema.index({ leetnodeUser: 1 });
FriendSchema.index({ leetcodeUsername: 1 });
FriendSchema.index({ leetnodeUser: 1, leetcodeUsername: 1 }, { unique: true });

const Friend = mongoose.model('Friend', FriendSchema);
export default Friend;