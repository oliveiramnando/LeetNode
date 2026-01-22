import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Name is required!"],
        trim: true,
        minLength: [2, "Name must have at least 2 characters"]
    },
    email: {
        type: String,
        required: [true, "Email is required!"],
        trim: true,
        unique: true,
        minLength: [5, "Email must have at least 5 characters"],
        lowercase: true
    },
    password: {
        type: String,
        required: [true, "Password is required!"],
        trim: true,
        select: false
    },
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