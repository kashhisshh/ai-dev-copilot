"use client";

import { useEffect, useState } from "react";
import AppLayout from "@/components/layout/app-layout";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { Github, Clock, History as HistoryIcon, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HistoryPage() {
    const [repos, setRepos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const anonymousId = localStorage.getItem("anonymousId");
        const url = anonymousId ? `/api/history?anonymousId=${anonymousId}` : "/api/history";

        fetch(url)
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data)) setRepos(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    return (
        <AppLayout>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-4xl font-extrabold tracking-tight">Repository History</h2>
                    <p className="text-muted-foreground mt-1 text-sm">Review your previous repository analyses and insights.</p>
                </div>
                <div className="p-2 bg-primary/10 rounded-full">
                    <HistoryIcon className="text-primary w-6 h-6" />
                </div>
            </div>

            {loading ? (
                <div className="grid gap-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-24 bg-card/50 animate-pulse rounded-2xl border border-border" />
                    ))}
                </div>
            ) : repos.length > 0 ? (
                <div className="grid gap-4">
                    {repos.map((repo) => (
                        <Link key={repo._id} href={`/repo?url=${encodeURIComponent(repo.url)}`}>
                            <Card className="p-5 bg-card/40 backdrop-blur-sm border-border hover:border-primary/50 transition-all flex items-center justify-between group rounded-2xl shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                        <Github className="text-muted-foreground group-hover:text-primary transition-colors" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg group-hover:text-primary transition-colors truncate max-w-md">{repo.url}</h3>
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                                            <div className="flex items-center gap-1">
                                                <Clock size={12} />
                                                {new Date(repo.createdAt).toLocaleDateString()}
                                            </div>
                                            <span className="w-1 h-1 rounded-full bg-border" />
                                            <span>Analyzed</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="w-10 h-10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-primary text-primary-foreground shadow-lg">
                                    <ArrowRight size={18} />
                                </div>
                            </Card>
                        </Link>
                    ))}
                </div>
            ) : (
                <Card className="p-12 text-center bg-card/20 border-border/50 border-dashed rounded-3xl">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 opacity-50">
                        <HistoryIcon size={32} />
                    </div>
                    <p className="text-muted-foreground font-medium">No repositories analyzed yet.</p>
                    <Link href="/">
                        <Button variant="link" className="mt-2 text-primary">Start your first analysis</Button>
                    </Link>
                </Card>
            )}
        </AppLayout>
    );
}
