"use client";

import { Home, Github } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";
import { Button } from "../ui/button";

export default function Sidebar() {
    const pathname = usePathname();
    const { data: session } = useSession();

    const navItems = [
        { name: "Dashboard", href: "/", icon: Home },
        { name: "Repos", href: "/history", icon: Github },
    ];

    return (
        <aside className="w-64 h-screen sticky top-0 border-r border-border bg-card flex flex-col">

            {/* TOP */}
            <div className="p-6">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                        <Github className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <h1 className="text-xl font-bold">AI Copilot</h1>
                </div>

                <nav className="space-y-2">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg ${pathname === item.href
                                    ? "bg-secondary font-medium"
                                    : "text-muted-foreground hover:bg-secondary/50"
                                }`}
                        >
                            <item.icon size={18} />
                            {item.name}
                        </Link>
                    ))}
                </nav>
            </div>

            {/* BOTTOM LOGIN */}
            <div className="mt-auto p-6 border-t border-border">
                {session ? (
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            {session.user?.image && (
                                <img
                                    src={session.user.image}
                                    className="w-9 h-9 rounded-full"
                                />
                            )}
                            <p className="text-sm">{session.user?.name}</p>
                        </div>

                        <Button onClick={() => signOut()} className="w-full">
                            Logout
                        </Button>
                    </div>
                ) : (
                    <Button onClick={() => signIn("google")} className="w-full">
                        Login with Google
                    </Button>
                )}
            </div>
        </aside>
    );
}