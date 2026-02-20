import mongoose from "mongoose";

const SubmissionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true,
        index: true
    },
    problemId: {
        type: String,
        index: true,
        required: true
    },
    slug: {
        type: String,
        index: true,
        required: true
    },
    url: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    statusDisplay: {
        type: String,
        required: true
    }
});

const Submission = mongoose.model('Submission', SubmissionSchema);
export default Submission;