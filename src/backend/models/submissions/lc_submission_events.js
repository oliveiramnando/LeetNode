import mongoose from "mongoose";

const lc_submission_eventsSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    titleSlug: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    title: {
        type: String,
    },
    timeStamp: {
        type: Number,
        required: true
    }, 
    status: {
        type: String,
        required: true,
    },
    lang: {
        type: String,
        required: true
    }, 
},{
    timestamps: true
})

lc_submission_eventsSchema.index(
    { userId: 1, titleSlug: 1, timestamp: 1 },
    { unique: true }
)

lc_submission_eventsSchema.index(
    { userId: 1, status: 1 },
    { unique: true }
)

export default mongoose.model(
    "lc_submission_events",
    lc_submission_eventsSchema
);