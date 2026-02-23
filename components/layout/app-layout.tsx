"use client";

import Sidebar from "./sidebar";
import { useTheme } from "../theme-provider";
import { Sun, Moon } from "lucide-react";
import { Button } from "../ui/button";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex bg-background text-foreground transition-colors duration-300">
      <Sidebar />
      <div className="flex-1 p-8 min-h-screen relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 blur-[120px] rounded-full -mr-64 -mt-64 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/5 blur-[100px] rounded-full -ml-32 -mb-32 pointer-events-none" />

        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="flex justify-end mb-8">
            <Button
              variant="outline"
              size="icon"
              onClick={toggleTheme}
              className="rounded-full shadow-lg border-muted hover:bg-muted"
            >
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}