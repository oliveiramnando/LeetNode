import mongoose from "mongoose";

const lc_submission_eventsSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    titleSlug: {
        type: String,
        required: true,
        index: true
    },
    title: {
        type: String
    },
    timeStamp: {
        type: Number,
        required: true,
        index: true
    },
    status: {
        type: String,
        required: true,
        index: true
    },
    lang: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

lc_submission_eventsSchema.index(
    { userId: 1, titleSlug: 1, timeStamp: 1 },
    { unique: true }
);

lc_submission_eventsSchema.index({ 
    userId: 1, status: 1, titleSlug: 1 
});


export default mongoose.model(
    "lc_submission_events",
    lc_submission_eventsSchema
);