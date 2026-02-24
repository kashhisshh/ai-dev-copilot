import { NextResponse } from "next/server";
import OpenAI from "openai";
import { connectDB } from "@/lib/mongodb";
import { Message } from "@/models/Message";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
    baseURL: process.env.OPENAI_BASE_URL,
    defaultHeaders: {
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "AI Dev Copilot",
    }
});

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        const { searchParams } = new URL(req.url);
        const repoUrl = searchParams.get("repoUrl");
        const anonymousId = searchParams.get("anonymousId");

        const userId = session?.user?.email || anonymousId;

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!repoUrl) {
            return NextResponse.json({ error: "No repoUrl provided" }, { status: 400 });
        }

        await connectDB();
        const messages = await Message.find({
            userId: userId,
            repoUrl: repoUrl
        }).sort({ createdAt: 1 });

        return NextResponse.json(messages);
    } catch (error: any) {
        console.error("Fetch Chat Error:", error.message);
        return NextResponse.json({ error: "Failed to fetch chat history" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        const { question, context, repoUrl, anonymousId } = await req.json();

        const userId = session?.user?.email || anonymousId;

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!question || !repoUrl) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        await connectDB();

        // 1. Save User Message
        await Message.create({
            repoUrl,
            userId: userId,
            role: "user",
            content: question
        });

        // 2. Get AI Response
        const history = await Message.find({
            repoUrl,
            userId: userId
        }).sort({ createdAt: -1 }).limit(10);

        const formattedHistory = history.reverse().map(m => ({
            role: m.role as "user" | "assistant",
            content: m.content
        }));

        const completion = await openai.chat.completions.create({
            model: "openrouter/auto",
            messages: [
                {
                    role: "system",
                    content: "You are a senior GitHub repository assistant. Your goal is to help users understand the codebase, architecture, and tech stack provided in the context. Be concise, technical, and helpful."
                },
                {
                    role: "user",
                    content: `Here is the repository analysis context for ${repoUrl}:\n${context || "No context provided"}`
                },
                ...formattedHistory,
                { role: "user", content: question }
            ]
        });

        const answer = completion.choices[0].message.content;

        // 3. Save Assistant Message
        await Message.create({
            repoUrl,
            userId: userId,
            role: "assistant",
            content: answer
        });

        return NextResponse.json({ answer });
    } catch (error: any) {
        console.error("Chat Error:", error);
        return NextResponse.json({ error: error.message || "Chat failed" }, { status: 500 });
    }
}