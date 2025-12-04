import type { Metadata } from "next";
import { ClerkProvider } from '@clerk/nextjs'
import "./globals.css";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";

export const metadata: Metadata = {
  title: "JJ's Task Manager",
  description: "Simple task management with Google Sheets",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="antialiased bg-background text-foreground min-h-screen flex flex-col">
          <AppHeader />
          <main className="flex-1">
            {children}
          </main>
          <AppFooter />
        </body>
      </html>
    </ClerkProvider>
  );
}
