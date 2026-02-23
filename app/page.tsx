"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AppLayout from "@/components/layout/app-layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Github, History, Search, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    const anonymousId = localStorage.getItem("anonymousId");
    const url = anonymousId ? `/api/history?anonymousId=${anonymousId}` : "/api/history";

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setHistory(data.slice(0, 3));
        }
      })
      .catch(console.error);
  }, []);

  const handleAnalyze = () => {
    if (!url) return;

    // Simple GitHub URL validation
    if (!url.toLowerCase().includes("github.com/")) {
      alert("Please enter a valid GitHub repository URL.");
      return;
    }

    router.push(`/repo?url=${encodeURIComponent(url)}`);
  };

  return (
    <AppLayout>
      <div className="py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-6 border border-primary/20">
            <Sparkles size={14} />
            <span>AI-POWERED CODE ANALYSIS</span>
          </div>
          <h2 className="text-6xl font-extrabold mb-6 tracking-tight bg-gradient-to-r from-foreground to-foreground/50 bg-clip-text text-transparent">
            Understand any Repo <br /> in Seconds.
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Leverage advanced AI to analyze architecture, identify tech stacks, and discover improvement areas for any public GitHub repository.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="p-1 max-w-3xl mx-auto bg-card/50 backdrop-blur-xl border-border/50 shadow-2xl rounded-2xl overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            <div className="p-2 flex gap-2 relative z-10">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                <Input
                  placeholder="Paste GitHub URL (e.g., https://github.com/vercel/next.js)"
                  className="pl-12 h-14 bg-transparent border-0 focus-visible:ring-0 text-lg placeholder:text-muted-foreground/50"
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                />
              </div>
              <Button
                onClick={handleAnalyze}
                className="h-14 px-8 rounded-xl bg-foreground text-background hover:opacity-90 transition-all font-bold text-base flex gap-2"
              >
                Analyze Now
                <ArrowRight size={18} />
              </Button>
            </div>
          </Card>
        </motion.div>

        {history.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-24"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 text-muted-foreground">
                <History size={18} />
                <h3 className="font-bold uppercase tracking-widest text-[10px]">Your Recent Vault</h3>
              </div>
              <Link href="/history" className="text-xs font-semibold hover:underline opacity-50 hover:opacity-100 transition-opacity">
                View All History
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {history.map((repo, i) => (
                <motion.div
                  key={repo._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + i * 0.1 }}
                >
                  <Link href={`/repo?url=${encodeURIComponent(repo.url)}`}>
                    <Card className="p-5 bg-card border-border hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer group rounded-xl">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                          <Github size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        <p className="text-sm font-bold truncate group-hover:text-primary transition-colors">
                          {repo.url.split("/").filter(Boolean).pop()}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground truncate opacity-60 px-1">{repo.url}</p>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
}