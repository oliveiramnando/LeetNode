import mongoose from "mongoose";
// powers profile heatmap, streak calculations, submissions/week/month

const lc_daily_activitySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    date: {
        type: Date, // "YYYY-MM-DD"
        required: true,
    },
    submissions: {
        type: Number,
        default: 0,
        min: 0,
    },
    acceptedSubmissions: {
        type: Number,
        default: 0,
        min: 0,
    },
    acceptedEasy: {
        type: Number,
        default: 0,
        min: 0,
    },
    acceptedMedium: {
        type: Number,
        default: 0,
        min: 0,
    },
    acceptedHard: {
        type: Number,
        default: 0,
        min: 0,
    }
}, {
    timestamps: true
});

lc_daily_activitySchema.index(
    { userId: 1, date: 1 },
    { unique: true }
);

lc_daily_activitySchema.index(
    { userId: 1, date: -1 }
);

export default mongoose.model(
    "lc_daily_activity",
    lc_daily_activitySchema
);