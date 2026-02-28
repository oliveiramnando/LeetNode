import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    name : {
        type: String
    },
    githubID:{
        type: Number,
        // required: true,
        trim: true,
        // unique: true,
        index: true
    },
    githubUsername: {
        type: String,
        // required: true,
        trim: true,
        unique: true,
        index: true
    },
    githubUrl: {
        type: String,
        // required: true,
        trim: true,
        // unique: true,
        index: true
    },
    leetcodeUsername: {
        type: String,
        unique: true,
        sparse: true, // allows multiple docs with null/undefined leetcodeUsername
        trim: true,
    }
}, {
    timestamps: true
});

const User = mongoose.model('User', UserSchema);
export default User;