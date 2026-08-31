import * as React from "react";
import { Section, Text, Button } from "@react-email/components";
import { EmailLayout } from "./EmailLayout";

interface PasswordChangedEmailProps {
  changeTime: Date;
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tars.homes";

export const PasswordChangedEmail = ({ changeTime }: PasswordChangedEmailProps) => {
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
    timeStyle: "short",
    timeZoneName: "short",
  }).format(new Date(changeTime));

  return (
    <EmailLayout
      previewText="Your password was changed"
      title="Your password was changed"
    >
      <Text style={paragraph}>
        The password for the Inbox Sentinel account associated with this email address was successfully changed.
      </Text>
      
      <Text style={paragraph}>
        <strong>Time of change:</strong> {formattedDate}
      </Text>

      <Section style={securityBox}>
        <Text style={securityText}>
          <strong>If you made this change, no action is required.</strong>
        </Text>
        <Text style={securityText}>
          If you did not make this change, please secure your account immediately by resetting your password.
        </Text>
      </Section>

      <Section style={btnContainer}>
        <Button href={`${baseUrl}/forgot-password`} style={buttonOutline}>
          Reset Password
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

const securityBox = {
  backgroundColor: "#fef2f2", // red-50
  border: "1px solid #fecaca", // red-200
  borderRadius: "8px",
  padding: "16px 20px",
  marginTop: "24px",
  marginBottom: "24px",
};

const securityText = {
  fontSize: "14px",
  lineHeight: "20px",
  color: "#991b1b", // red-800
  margin: "0 0 8px 0",
};

const btnContainer = {
  textAlign: "center" as const,
  marginTop: "16px",
  marginBottom: "16px",
};

const buttonOutline = {
  backgroundColor: "transparent",
  border: "1px solid #cbd5e1", // slate-300
  borderRadius: "6px",
  color: "#0f172a",
  fontSize: "14px",
  fontWeight: "500",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
};

export default PasswordChangedEmail;
