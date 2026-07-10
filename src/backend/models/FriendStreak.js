import mongoose from "mongoose";

const friendStreakSchema = new mongoose.Schema({
    users: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "User",
        required: true,
        validate: {
            validator: (users) => users.length === 2,
            message: "A streak must contain exactly two users",
        },
    },
    pairKey: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    currentStreak: {
        type: Number,
        default: 0,
    },
    longestStreak: {
        type: Number,
        default: 0,
    },
    lastCompletedDate: {
        type: String,
        default: null,
    },
},{
    timestamps: true,
});

export default mongoose.model("FriendStreak", friendStreakSchema);