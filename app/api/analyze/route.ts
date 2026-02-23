import { NextResponse } from "next/server";
import OpenAI from "openai";
import axios from "axios";
import { connectDB } from "@/lib/mongodb";
import { Repo } from "@/models/Repo";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
    try {
        // Lazily construct OpenAI client to avoid throwing at module-evaluation
        // time (which can break builds on platforms where env vars aren't
        // available at build time).
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "OpenAI API key is not configured" }, { status: 500 });
        }

        const openai = new OpenAI({ apiKey, baseURL: process.env.OPENAI_BASE_URL });

        const session = await getServerSession(authOptions);
        const { repoUrl, anonymousId } = await req.json();

        // Use session email or anonymous ID
        const userId = session?.user?.email || anonymousId;

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized or missing guest ID" }, { status: 401 });
        }

        if (!repoUrl) {
            return NextResponse.json({ error: "No URL provided" }, { status: 400 });
        }

        // --- CACHING LOGIC ---
        await connectDB();
        const existingRepo = await Repo.findOne({ url: repoUrl, userId: userId });
        if (existingRepo && existingRepo.analysis) {
            return NextResponse.json({ result: existingRepo.analysis });
        }
        // ---------------------

        const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
        if (!match) {
            return NextResponse.json({ error: "Invalid GitHub URL" }, { status: 400 });
        }

        const owner = match[1];
        const repoName = match[2].replace(/\.git$/, "");

        // 1. Fetch README
        let readme;
        try {
            const readmeRes = await axios.get(
                `https://api.github.com/repos/${owner}/${repoName}/readme`,
                {
                    headers: {
                        Accept: "application/vnd.github.v3.raw",
                        "User-Agent": "AI-Dev-Copilot"
                    }
                }
            );
            readme = readmeRes.data;
        } catch (error) {
            return NextResponse.json({ error: "Could not access README. The repository might be private or the link is incorrect." }, { status: 404 });
        }

        // 2. AI Analysis
        const completion = await openai.chat.completions.create({
            model: "openrouter/auto",
            response_format: { type: "json_object" },
            messages: [
                {
                    role: "system",
                    content: "You are a senior engineer. Return analysis in JSON format: { \"summary\": \"...\", \"tech_stack\": \"...\", \"architecture\": \"...\", \"improvements\": \"...\", \"issues\": \"...\" }"
                },
                {
                    role: "user",
                    content: `Analyze this repository:\n\nREADME:\n${readme}`
                }
            ]
        });

        const rawAnalysis = completion.choices[0].message.content;

        // --- BACKEND PARSING ---
        let analysisObj;
        try {
            // Clean AI response in case it returns markdown-wrapped JSON
            let cleanResponse = rawAnalysis || "{}";
            if (cleanResponse.includes("```json")) {
                cleanResponse = cleanResponse.split("```json")[1].split("```")[0].trim();
            } else if (cleanResponse.includes("```")) {
                cleanResponse = cleanResponse.split("```")[1].split("```")[0].trim();
            }
            analysisObj = JSON.parse(cleanResponse);
        } catch (err) {
            console.error("Failed to parse AI response:", rawAnalysis);
            return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
        }

        // 3. Save to MongoDB associated with User (Update if exists, or create new)
        await Repo.findOneAndUpdate(
            { url: repoUrl, userId: userId },
            { analysis: analysisObj, createdAt: new Date() }, // Saving as Object
            { upsert: true, new: true }
        );

        return NextResponse.json({ result: analysisObj }); // Returning Object
    } catch (e: any) {
        console.error("Analysis Error:", e.response?.data || e.message);
        return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
    }
}