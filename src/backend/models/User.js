import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    githubUsername: {
        type: String,
        trim: true,
        unique: true,
    },
    githubUrl: {
        type: String,
        trim: true,
    },
    leetcodeUsername: {
        type: String, 
        trim: true
    },
    leetcodeUsernameLower: {
        type: String, 
        trim: true,
    }
}, { timestamps: true });

UserSchema.index(
    { leetcodeUsernameLower: 1 },
    { unique: true, sparse: true }
);

export default mongoose.models.User || mongoose.model('User', UserSchema);