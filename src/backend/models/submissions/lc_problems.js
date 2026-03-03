import mongoose from "mongoose";
// dictionary table for tags, Topic distribution charts, Difficulty breakdown by topic

const lc_problemsSchema = new mongoose.Schema({
    titleSlug: {
        type: String,
        required: true,
        unique: true,
        index: true,
        trim: true
    },
    title: {
        type: String,
        trim: true
    },
    difficulty: { 
        type: String,
        required: true,
        enum: ["Easy", "Medium", "Hard"],
        index: true
    },
    topicTags: {
        name: { type: String, required: true, trim: true },
        slug: { type: String, required: true, trim: true },
    },
    fetchedAt: {
        type: Date,
        default: () => new Date(),
        index: true,
    },
    source: {
        type: String,
        default: "leetcode_public_graphql",
    },
});

lc_problemsSchema.index({ "topicTags.slug": 1 });

export default mongoose.model(
    "lc_problems",
    lc_problemsSchema
);