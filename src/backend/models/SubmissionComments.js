import mongoose from "mongoose";

const SubmissionCommentsSchema = new mongoose.Schema({
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    authorUsername: {
        type: String,
        required: true,
    },
    submissionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'lc_submission_events',
        required: true,
    },
    body:{
        type: String,
        trim: true,
        required: true,
        maxLength: 250,
        validate: {
            validator: function(v) {
                return v.trim().length >= 3;
            },
            message: "Comment must be at least 3 characters"
        }
    },
    likes: {
        type: Number,
        default: 0
    },
    parentComment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
        default: null
    }
}, {
    timestamps: true
});

SubmissionCommentsSchema.index({ submissionId: 1, createdAt: -1 });
SubmissionCommentsSchema.index({ author: 1 });

const Comment = mongoose.model('Comment', SubmissionCommentsSchema);
export default Comment;