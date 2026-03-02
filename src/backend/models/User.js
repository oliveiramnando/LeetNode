import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    name: String,
    githubID: {
        type: Number,
        index: true
    },
    githubUsername: {
        type: String,
        trim: true,
        unique: true,
        index: true
    },
    githubUrl: {
        type: String,
        trim: true,
        index: true
    },
    leetcodeUsername: {
        type: String, 
        trim: true
    },
    leetcodeUsernameLower: {
        type: String, 
        trim: true,
        sparse: true
    }
}, { timestamps: true });

UserSchema.index(
    { leetcodeUsernameLower: 1 },
    { unique: true, sparse: true }
);

export default mongoose.models.User || mongoose.model('User', UserSchema);