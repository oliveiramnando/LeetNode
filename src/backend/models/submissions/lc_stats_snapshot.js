import mongoose from "mongoose";
// for solved count over time, difficulty progression over time

const lc_stats_snapshotSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    capturedAt: {
        type: Date, // "YYYY-MM-DD"
        required: true
    },
    totalSolved: { // unique problems
        type: Number,
        default: 0,
        min: 0,
    },
    easySolved: { // unique accepted problems
        type: Number,
        default: 0,
        min: 0,
    },
    mediumSolved: {
        type: Number,
        default: 0,
        min: 0,
    },
    hardSolved: {
        type: Number,
        default: 0,
        min: 0,
    },
    totalAcceptedSubmissions: { // all accepted Submissions
        type: Number,
        default: 0,
        min: 0,
    },
    totalSubmissions: {
        type: Number,
        default: 0,
        min: 0,
    },
}, {
    timestamps: true
});

lc_stats_snapshotSchema.index(
    { userId: 1, capturedAt: -1 },
    { unique: true }
);

export default mongoose.model(
    "lc_stats_snapshot",
    lc_stats_snapshotSchema
);