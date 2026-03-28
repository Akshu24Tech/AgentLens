import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AgentLens Dashboard",
  description: "Visualize AI Agent trajectories and state transitions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <div className="flex flex-col min-h-screen">
          <header className="border-b bg-muted/40 backdrop-blur-sm sticky top-0 z-50">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="size-8 bg-primary rounded-lg flex items-center justify-center font-bold text-primary-foreground">
                  AL
                </div>
                <h1 className="font-bold text-xl tracking-tight">AgentLens</h1>
              </div>
              <nav className="flex items-center gap-4">
                <div className="px-3 py-1 bg-green-500/10 text-green-500 border border-green-500/20 rounded-full text-xs font-medium flex items-center gap-1.5">
                  <span className="size-1.5 bg-green-500 rounded-full animate-pulse" />
                  Service Online
                </div>
              </nav>
            </div>
          </header>
          <main className="flex-1 overflow-hidden h-[calc(100vh-64px)]">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
