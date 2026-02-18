import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    githubUrl: {
        type: String,
        required: true,
        trim: true,
        unique: true
    }
}, {
    timestamps: true
});

const User = mongoose.model('User', UserSchema);
export default User;