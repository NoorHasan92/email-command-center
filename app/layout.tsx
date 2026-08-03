// app/layout.tsx
// Root application layout with theme providers.

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/providers/theme-provider";
import { AuthProvider } from "@/providers/auth-provider";
import { APP_CONFIG } from "@/config/app";
import "./globals.css";

import { CommandPalette } from "@/components/layout/command-palette";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://mail.tars.homes"),
  title: {
    default: "Inbox Sentinel \u2013 AI Email Assistant for Smarter Inbox Management",
    template: "%s | Inbox Sentinel",
  },
  description:
    "Inbox Sentinel is an AI-powered email assistant that analyzes your inbox, detects urgent actions, identifies phishing attempts, extracts deadlines, and delivers intelligent notifications through Gmail, WhatsApp, and Telegram.",
  keywords: [
    "AI Email Assistant",
    "Gmail AI",
    "Email Automation",
    "Inbox Management",
    "Productivity",
    "Email Intelligence",
    "Email Summarization",
    "Deadline Detection",
    "Phishing Detection",
    "WhatsApp Notifications",
    "Telegram Alerts",
  ],
  authors: [{ name: "Md Noor Hasan Ansari" }],
  creator: "Md Noor Hasan Ansari",
  publisher: "Inbox Sentinel",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  alternates: {
    canonical: "https://mail.tars.homes",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://mail.tars.homes",
    siteName: "Inbox Sentinel",
    title: "Inbox Sentinel \u2013 AI Email Assistant for Smarter Inbox Management",
    description:
      "Inbox Sentinel is an AI-powered email assistant that analyzes your inbox, detects urgent actions, identifies phishing attempts, extracts deadlines, and delivers intelligent notifications through Gmail, WhatsApp, and Telegram.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Inbox Sentinel \u2013 AI Email Assistant for Smarter Inbox Management",
    description:
      "Inbox Sentinel is an AI-powered email assistant that analyzes your inbox, detects urgent actions, identifies phishing attempts, extracts deadlines, and delivers intelligent notifications through Gmail, WhatsApp, and Telegram.",
  },
  verification: {
    // google: "your-google-site-verification-code",
    // yandex: "your-yandex-verification-code",
    // other: {
    //   me: ["your-email@domain.com"],
    // },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
          >
            {children}
            <CommandPalette />
            <Toaster richColors position="top-right" />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
