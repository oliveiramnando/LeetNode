import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    ghUsername: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        index: true
    },
    leetcodeUsername: {
        type: String,
        unique: true,
        trim: true,
    }
}, {
    timestamps: true
});

const User = mongoose.model('User', UserSchema);
export default User;