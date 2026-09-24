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
  applicationName: "Inbox Sentinel",
  title: {
    default: "Inbox Sentinel – Autonomous AI Email Intelligence & Chief of Staff",
    template: "%s | Inbox Sentinel",
  },
  description:
    "Inbox Sentinel (hosted at mail.tars.homes) is an autonomous AI Chief of Staff and email intelligence platform. Features the Consequence Engine, Personal Intelligence Profile, Deep Research synthesis, deadline extraction, and multi-channel triage for Gmail.",
  keywords: [
    "Inbox Sentinel",
    "mail.tars.homes",
    "tars.homes",
    "Inbox Sentinel AI",
    "AI Email Assistant",
    "Email Chief of Staff",
    "Autonomous Email Triage",
    "Gmail AI",
    "Consequence Engine",
    "Personal Intelligence Engine",
    "Executive Email Assistant",
    "Deep Research AI",
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
  authors: [{ name: "Md Noor Hasan Ansari", url: "https://mail.tars.homes" }],
  creator: "Md Noor Hasan Ansari",
  publisher: "Inbox Sentinel",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
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
    title: "Inbox Sentinel – Autonomous AI Email Intelligence & Chief of Staff (mail.tars.homes)",
    description:
      "Inbox Sentinel (mail.tars.homes) is an autonomous AI email assistant and executive Chief of Staff that analyzes your inbox, extracts deadlines, predicts consequences, and surfaces critical actions.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Inbox Sentinel – Autonomous AI Email Intelligence & Chief of Staff",
    description:
      "Inbox Sentinel (mail.tars.homes) is an autonomous AI email assistant and executive Chief of Staff with the Consequence Engine and Deep Research.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      "@id": "https://mail.tars.homes/#software",
      "name": "Inbox Sentinel",
      "alternateName": ["mail.tars.homes", "Inbox Sentinel AI"],
      "url": "https://mail.tars.homes",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web, iOS, Android, macOS, Windows",
      "description": "Inbox Sentinel (hosted at mail.tars.homes) is an enterprise-grade AI Chief of Staff and email intelligence software application. It features real-time consequence scoring, personal executive memory, deep research synthesis, deadline extraction, and multi-channel triage for Gmail.",
      "softwareVersion": "2.0",
      "offers": [
        {
          "@type": "Offer",
          "name": "Free Tier",
          "price": "0",
          "priceCurrency": "USD",
          "description": "50 AI analyses per month with basic email summarization"
        },
        {
          "@type": "Offer",
          "name": "Pro Plan",
          "price": "11.99",
          "priceCurrency": "USD",
          "description": "200 AI analyses per month, BYOK unlimited processing, smart drafts, and priority alerts"
        },
        {
          "@type": "Offer",
          "name": "Ultra Plan",
          "price": "24.99",
          "priceCurrency": "USD",
          "description": "500 AI analyses, Personal Intelligence Profile, Deep Research synthesis, and multi-Gmail support"
        }
      ],
      "author": {
        "@type": "Person",
        "name": "Md Noor Hasan Ansari",
        "url": "https://mail.tars.homes"
      },
      "publisher": {
        "@type": "Organization",
        "name": "Inbox Sentinel",
        "url": "https://mail.tars.homes",
        "logo": "https://mail.tars.homes/icon.png"
      }
    },
    {
      "@type": "WebSite",
      "@id": "https://mail.tars.homes/#website",
      "url": "https://mail.tars.homes",
      "name": "Inbox Sentinel",
      "alternateName": "mail.tars.homes",
      "description": "Official website and web portal of Inbox Sentinel – Autonomous AI Email Intelligence & Chief of Staff.",
      "publisher": {
        "@id": "https://mail.tars.homes/#organization"
      }
    },
    {
      "@type": "Organization",
      "@id": "https://mail.tars.homes/#organization",
      "name": "Inbox Sentinel",
      "url": "https://mail.tars.homes",
      "logo": "https://mail.tars.homes/icon.png",
      "founder": {
        "@type": "Person",
        "name": "Md Noor Hasan Ansari"
      },
      "sameAs": [
        "https://mail.tars.homes"
      ]
    },
    {
      "@type": "FAQPage",
      "@id": "https://mail.tars.homes/#faq",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What is Inbox Sentinel (mail.tars.homes)?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Inbox Sentinel, hosted at https://mail.tars.homes, is an enterprise-grade AI email assistant and autonomous Chief of Staff. It integrates with Gmail to categorize in-flight messages, detect critical deadlines, perform consequence analysis on incoming emails, and deliver intelligent alerts."
          }
        },
        {
          "@type": "Question",
          "name": "Is mail.tars.homes a housing or residential developer website?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "No. mail.tars.homes is the official web application portal for Inbox Sentinel, an AI-powered email productivity SaaS platform. It has no connection to modular housing or real estate construction."
          }
        },
        {
          "@type": "Question",
          "name": "How does the Consequence Engine work?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "The Consequence Engine evaluates incoming emails using advanced machine learning models to forecast the business and personal consequences of ignoring each message, highlighting urgent deadlines and high-stakes opportunities before they slip away."
          }
        },
        {
          "@type": "Question",
          "name": "Does Inbox Sentinel train AI models on my private emails?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "No. Inbox Sentinel maintains a strict zero-training policy. User email bodies are processed transiently in memory and are never used to train or refine generalized foundation AI models."
          }
        }
      ]
    }
  ]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} ${outfit.variable} ${playfair.variable} ${roboto.variable} ${jakarta.variable} ${firaCode.variable} ${lora.variable} ${poppins.variable} ${montserrat.variable} ${nunito.variable} ${merriweather.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
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
