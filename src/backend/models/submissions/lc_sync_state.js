import mongoose from "mongoose";

const lc_sync_stateSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    lastProfileSyncAt: {
        type: Date,
        required: true
    }
}, {
    timestamps: true
});

export default mongoose.model(
    "lc_sync_state",
    lc_sync_stateSchema
);