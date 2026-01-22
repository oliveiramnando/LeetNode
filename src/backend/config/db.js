import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        const uri = process.env.MONGO_URI;
        if (!uri) {
            throw new Error('MONGO_URI (or MONGODB_URI) env var missing');
        }
        await mongoose.connect(uri);
        console.log("MONGODB CONNECTED!");
    } catch (error) {
        console.log("Error connecting to MongoDB", error);
        process.exit(1);
    }
}