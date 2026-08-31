import * as React from "react";
import { Section, Text, Button, Hr } from "@react-email/components";
import { EmailLayout } from "./EmailLayout";

interface WelcomeEmailProps {
  name?: string | null;
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tars.homes";

export const WelcomeEmail = ({ name }: WelcomeEmailProps) => {
  return (
    <EmailLayout
      previewText="Welcome to Inbox Sentinel"
      title="Welcome to Inbox Sentinel"
    >
      <Text style={paragraph}>
        Hello {name ? name.split(" ")[0] : "there"},
      </Text>
      <Text style={paragraph}>
        Thank you for joining Inbox Sentinel. Our platform analyzes your incoming emails and helps surface important actions, deadlines, opportunities, and messages that require your attention.
      </Text>

      <Section style={featureBox}>
        <Text style={featureTitle}>AI Email Analysis</Text>
        <Text style={featureDesc}>
          Automatically identify important information and required actions without reading every thread.
        </Text>
      </Section>

      <Section style={featureBox}>
        <Text style={featureTitle}>Smart Notifications</Text>
        <Text style={featureDesc}>
          Receive concise alerts when an email requires your immediate attention through WhatsApp or Telegram.
        </Text>
      </Section>

      <Section style={featureBox}>
        <Text style={featureTitle}>Never Miss Important Emails</Text>
        <Text style={featureDesc}>
          Surface deadlines, confirmations, applications, opportunities, and other actionable messages effortlessly.
        </Text>
      </Section>

      <Section style={btnContainer}>
        <Button href={`${baseUrl}/dashboard`} style={button}>
          Open Inbox Sentinel
        </Button>
      </Section>
    </EmailLayout>
  );
};

// Styles
const paragraph = {
  fontSize: "15px",
  lineHeight: "24px",
  color: "#334155", // slate-700
  margin: "0 0 20px 0",
};

const featureBox = {
  backgroundColor: "#f8fafc", // slate-50
  borderLeft: "4px solid #6366f1", // indigo-500
  padding: "16px 20px",
  marginBottom: "16px",
  borderRadius: "0 8px 8px 0",
};

const featureTitle = {
  fontSize: "15px",
  fontWeight: "600",
  color: "#0f172a",
  margin: "0 0 4px 0",
};

const featureDesc = {
  fontSize: "14px",
  lineHeight: "20px",
  color: "#475569", // slate-600
  margin: "0",
};

const btnContainer = {
  textAlign: "center" as const,
  marginTop: "32px",
  marginBottom: "16px",
};

const button = {
  backgroundColor: "#0f172a", // slate-900
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "500",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
};

export default WelcomeEmail;
