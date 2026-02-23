import mongoose from "mongoose";

const repoSchema = new mongoose.Schema({
    url: { type: String, required: true },
    analysis: { type: mongoose.Schema.Types.Mixed, required: true }, // Changed from String to Mixed/Object
    userId: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
});

export const Repo = mongoose.models.Repo || mongoose.model("Repo", repoSchema);
