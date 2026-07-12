import mongoose from "mongoose";

const lcUserSubmissionStatsSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
            index: true,
        },

        totalEasySubmissions: {
            type: Number,
            default: 0,
            min: 0,
        },

        totalMediumSubmissions: {
            type: Number,
            default: 0,
            min: 0,
        },

        totalHardSubmissions: {
            type: Number,
            default: 0,
            min: 0,
        },

        lastSubmissionAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

lcUserSubmissionStatsSchema.virtual("score").get(function () {
    return (
        this.totalEasySubmissions +
        this.totalMediumSubmissions * 2 +
        this.totalHardSubmissions * 3
    );
});

lcUserSubmissionStatsSchema.set("toJSON", {
    virtuals: true,
});

lcUserSubmissionStatsSchema.set("toObject", {
    virtuals: true,
});

export default mongoose.model(
    "lc_user_submission_stats",
    lcUserSubmissionStatsSchema
);