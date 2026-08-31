import * as React from "react";
import { Text, Button, Section } from "@react-email/components";
import { EmailLayout } from "./EmailLayout";

interface AccountDeletionConfirmationEmailProps {
  name?: string | null;
  confirmationUrl: string;
}

export const AccountDeletionConfirmationEmail = ({
  name,
  confirmationUrl,
}: AccountDeletionConfirmationEmailProps) => {
  return (
    <EmailLayout
      previewText="Action Required: Confirm account deletion request"
      title="Confirm Account Deletion"
    >
      <Text style={paragraph}>
        Hello {name ? name.split(" ")[0] : "there"},
      </Text>
      <Text style={paragraph}>
        We received a request to permanently delete your Inbox Sentinel account and all associated data.
      </Text>
      <Text style={paragraph}>
        To proceed with this request, you must confirm it by clicking the button below. If you did not make this request, you can safely ignore this email and your account will remain active.
      </Text>
      <Section style={btnContainer}>
        <Button href={confirmationUrl} style={buttonDanger}>
          Confirm Account Deletion
        </Button>
      </Section>
      <Text style={smallText}>
        For security reasons, this link will expire in 24 hours. Once confirmed, a 14-day grace period will begin before your data is permanently removed.
      </Text>
    </EmailLayout>
  );
};

const paragraph = {
  fontSize: "15px",
  lineHeight: "24px",
  color: "#334155",
  margin: "0 0 20px 0",
};

const smallText = {
  fontSize: "13px",
  lineHeight: "20px",
  color: "#64748b",
  margin: "24px 0 0 0",
  textAlign: "center" as const,
};

const btnContainer = {
  textAlign: "center" as const,
  marginTop: "24px",
  marginBottom: "16px",
};

const buttonDanger = {
  backgroundColor: "#ef4444",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "500",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
};

export default AccountDeletionConfirmationEmail;
