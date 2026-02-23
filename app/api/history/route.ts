import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Repo } from "@/models/Repo";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        const { searchParams } = new URL(req.url);
        const anonymousId = searchParams.get("anonymousId");

        const userId = session?.user?.email || anonymousId;

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();
        const repos = await Repo.find({ userId: userId }).sort({ createdAt: -1 });
        return NextResponse.json(repos);
    } catch (error: any) {
        console.error("History Error:", error.message);
        return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
    }
}