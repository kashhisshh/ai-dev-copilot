import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    repoUrl: { type: String, required: true },
    userId: { type: String, required: true },
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
});

export const Message = mongoose.models.Message || mongoose.model("Message", messageSchema);
