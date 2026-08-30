// app/layout.tsx
// Root application layout with theme providers.

import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter, Outfit, Playfair_Display, Roboto, Plus_Jakarta_Sans, Fira_Code, Lora, Poppins, Montserrat, Nunito, Merriweather } from "next/font/google";
import { ThemeProvider } from "@/providers/theme-provider";
import { FontProvider } from "@/providers/font-provider";
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

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const roboto = Roboto({
  variable: "--font-roboto",
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

const firaCode = Fira_Code({
  variable: "--font-fira",
  subsets: ["latin"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

const merriweather = Merriweather({
  variable: "--font-merriweather",
  weight: ["300", "400", "700"],
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
    <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} ${outfit.variable} ${playfair.variable} ${roboto.variable} ${jakarta.variable} ${firaCode.variable} ${lora.variable} ${poppins.variable} ${montserrat.variable} ${nunito.variable} ${merriweather.variable}`}>
      <body className="antialiased">
        <AuthProvider>
          <FontProvider>
            <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
          >
            {children}
            <CommandPalette />
            <Toaster richColors position="top-right" />
          </ThemeProvider>
          </FontProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
