"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { MessageSquare, Send, Bot, User, Loader2, Github } from "lucide-react";
import AppLayout from "@/components/layout/app-layout";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";

function RepoContent() {
  const params = useSearchParams();
  const repoUrl = params.get("url");

  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);

  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, chatLoading]);

  useEffect(() => {
    if (!repoUrl) {
      setError("No repository URL provided.");
      setLoading(false);
      return;
    }

    const fetchChat = async () => {
      try {
        const anonymousId = localStorage.getItem("anonymousId");
        const url = anonymousId
          ? `/api/chat?repoUrl=${encodeURIComponent(repoUrl)}&anonymousId=${anonymousId}`
          : `/api/chat?repoUrl=${encodeURIComponent(repoUrl)}`;
        const res = await fetch(url);
        const data = await res.json();
        if (Array.isArray(data)) setMessages(data);
      } catch (err) {
        console.error("Failed to fetch chat:", err);
      }
    };

    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        let anonymousId = localStorage.getItem("anonymousId");
        if (!anonymousId) {
          anonymousId = "guest_" + Math.random().toString(36).substring(2, 15);
          localStorage.setItem("anonymousId", anonymousId);
        }

        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ repoUrl, anonymousId }),
        });

        const data = await res.json();

        if (res.status === 401) {
          setUnauthorized(true);
          setLoading(false);
          return;
        }

        if (!res.ok) {
          setError(data.error || "Failed to analyze repository.");
          setLoading(false);
          return;
        }

        if (data.result) {
          setAnalysis(data.result);
        } else {
          setError("Failed to parse analysis data.");
        }

        setLoading(false);
        fetchChat();
      } catch (err) {
        console.error(err);
        setError("A network error occurred.");
        setLoading(false);
      }
    };

    run();
  }, [repoUrl]);

  const askQuestion = async () => {
    if (!analysis || !question.trim()) return;

    const userMessage = { role: "user", content: question };
    setMessages(prev => [...prev, userMessage]);
    setQuestion("");
    setChatLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({
          question,
          context: `Summary: ${analysis.summary}\nTech Stack: ${analysis.tech_stack}\nArchitecture: ${analysis.architecture}`,
          repoUrl,
          anonymousId: localStorage.getItem("anonymousId")
        }),
      });

      const data = await res.json();
      if (data.answer) {
        setMessages(prev => [...prev, { role: "assistant", content: data.answer }]);
      }
    } catch (err) {
      console.error("Chat failed:", err);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Github className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight truncate max-w-2xl">{repoUrl || "Repository Analysis"}</h1>
            <p className="text-muted-foreground text-sm font-medium">Artificial Intelligence Code Analysis</p>
          </div>
        </div>
      </div>

      {error && (
        <Card className="p-12 text-center bg-card/40 backdrop-blur-xl border-destructive/20 border-dashed rounded-3xl mt-10">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Github className="text-destructive w-8 h-8 opacity-50" />
          </div>
          <h3 className="text-2xl font-bold mb-2">Analysis Failed</h3>
          <p className="text-muted-foreground mb-8 font-medium max-w-md mx-auto">{error}</p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => window.location.reload()} variant="outline" className="px-8 h-12 rounded-xl">
              Try Again
            </Button>
            <Button onClick={() => window.location.href = "/"} className="bg-foreground text-background font-bold px-8 h-12 rounded-xl border-0">
              Go to Home
            </Button>
          </div>
        </Card>
      )}


      {!error && unauthorized && (
        <Card className="p-12 text-center bg-card/40 backdrop-blur-xl border-border border-dashed rounded-3xl mt-10">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <User className="text-red-500 w-8 h-8" />
          </div>
          <p className="text-muted-foreground mb-6 font-medium text-lg leading-relaxed">Please log in with Google to use the full power of AI Copilot.</p>
          <Button onClick={() => window.location.href = "/"} className="bg-foreground text-background font-bold px-8 h-12 rounded-xl border-0">
            Go to Home
          </Button>
        </Card>
      )}

      {!error && !unauthorized && (
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="improvements">Improvements</TabsTrigger>
            <TabsTrigger value="chat">Chat</TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview">
            {loading ? (
              <div className="space-y-4 mt-4">
                <div className="h-32 bg-zinc-800 animate-pulse rounded-xl" />
                <div className="h-32 bg-zinc-800 animate-pulse rounded-xl" />
                <div className="h-32 bg-zinc-800 animate-pulse rounded-xl" />
              </div>
            ) : analysis ? (
              <Card className="p-6 hover:border-zinc-600 transition">
                <Card className="p-6">
                  <h2 className="font-semibold mb-2">Summary</h2>
                  <p>{analysis.summary}</p>
                </Card>

                <Card className="p-6">
                  <h2 className="font-semibold mb-2">Tech Stack</h2>
                  <p>{analysis.tech_stack}</p>
                </Card>

                <Card className="p-6">
                  <h2 className="font-semibold mb-2">Architecture</h2>
                  <p>{analysis.architecture}</p>
                </Card>
              </Card>
            ) : (
              <p className="mt-4 text-red-500">
                Failed to parse AI response.
              </p>
            )}
          </TabsContent>

          {/* IMPROVEMENTS TAB */}
          <TabsContent value="improvements">
            {loading ? (
              <p className="mt-4">Loading...</p>
            ) : analysis ? (
              <Card className="p-6 mt-4">
                <h2 className="font-semibold mb-2">Improvements</h2>
                <p>{analysis.improvements}</p>

                <h2 className="font-semibold mt-6 mb-2">
                  Potential Issues
                </h2>
                <p>{analysis.issues}</p>
              </Card>
            ) : (
              <p className="mt-4 text-red-500">
                No improvement data available.
              </p>
            )}
          </TabsContent>

          <TabsContent value="chat" className="mt-0">
            <Card className="flex flex-col h-[680px] bg-zinc-950 border border-zinc-900 rounded-2xl overflow-hidden mt-4 shadow-xl">

              {/* HEADER */}
              <div className="px-5 py-4 border-b border-zinc-900 bg-gradient-to-b from-zinc-900 to-zinc-950 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow">
                    <Bot className="w-5 h-5 text-black" />
                  </div>

                  <div className="leading-tight">
                    <p className="font-semibold text-sm">Repository Copilot</p>
                    <div className="flex items-center gap-2 text-[11px] text-green-500">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      Online
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-zinc-500">
                  Ask anything about this repo
                </p>
              </div>

              {/* MESSAGES */}
              <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6 scrollbar-thin scrollbar-thumb-zinc-800">

                {messages.length === 0 && !chatLoading && (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-40 space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-zinc-900 flex items-center justify-center">
                      <MessageSquare className="w-8 h-8" />
                    </div>

                    <div className="max-w-[260px]">
                      <p className="text-lg font-semibold">
                        Ask about this repository
                      </p>
                      <p className="text-sm text-zinc-500">
                        Architecture, bugs, improvements, flow — anything.
                      </p>
                    </div>
                  </div>
                )}

                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`flex gap-3 max-w-[82%] ${msg.role === "user" ? "flex-row-reverse" : ""
                        }`}
                    >
                      {/* AVATAR */}
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center border ${msg.role === "user"
                          ? "bg-zinc-800 border-zinc-700"
                          : "bg-white border-white"
                          }`}
                      >
                        {msg.role === "user" ? (
                          <User className="w-4 h-4 text-zinc-400" />
                        ) : (
                          <Bot className="w-4 h-4 text-black" />
                        )}
                      </div>

                      {/* BUBBLE */}
                      <div
                        className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-md transition ${msg.role === "user"
                          ? "bg-white text-black rounded-tr-sm"
                          : "bg-zinc-900 border border-zinc-800 rounded-tl-sm"
                          }`}
                      >
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>

                        <div className="text-[10px] mt-2 opacity-40 text-right">
                          {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* TYPING */}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="flex gap-3 max-w-[80%]">
                      <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center">
                        <Loader2 className="w-4 h-4 animate-spin text-black" />
                      </div>

                      <div className="bg-zinc-900 border border-zinc-800 px-4 py-3 rounded-2xl text-sm flex items-center gap-2">
                        <span className="flex gap-1">
                          <span className="w-1 h-1 bg-white rounded-full animate-bounce" />
                          <span className="w-1 h-1 bg-white rounded-full animate-bounce [animation-delay:-0.2s]" />
                          <span className="w-1 h-1 bg-white rounded-full animate-bounce [animation-delay:-0.4s]" />
                        </span>
                        Thinking…
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* INPUT */}
              <div className="p-4 border-t border-zinc-900 bg-zinc-950">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Ask about the repository..."
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && !chatLoading && askQuestion()
                    }
                    className="bg-zinc-900 border-zinc-800 h-12 rounded-xl"
                    disabled={chatLoading}
                  />

                  <Button
                    onClick={askQuestion}
                    disabled={chatLoading || !question.trim()}
                    className="h-12 w-12 rounded-xl bg-white text-black hover:bg-zinc-200"
                  >
                    {chatLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                <p className="text-[10px] text-zinc-500 text-center mt-2">
                  AI may produce incorrect answers
                </p>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </AppLayout>
  );
}

export default function RepoPage() {
  return (
    <Suspense fallback={<div>Loading repository analysis...</div>}>
      <RepoContent />
    </Suspense>
  );
}
