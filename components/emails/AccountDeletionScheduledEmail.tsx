import * as React from "react";
import { Text, Section } from "@react-email/components";
import { EmailLayout } from "./EmailLayout";

interface AccountDeletionScheduledEmailProps {
  name?: string | null;
  scheduledDate: Date;
}

export const AccountDeletionScheduledEmail = ({
  name,
  scheduledDate,
}: AccountDeletionScheduledEmailProps) => {
  return (
    <EmailLayout
      previewText="Your account deletion has been scheduled"
      title="Account Deletion Scheduled"
    >
      <Text style={paragraph}>
        Hello {name ? name.split(" ")[0] : "there"},
      </Text>
      <Text style={paragraph}>
        We have confirmed your request to delete your Inbox Sentinel account. 
      </Text>
      <Text style={paragraph}>
        Your account and all associated data are scheduled to be permanently deleted on <strong>{scheduledDate.toLocaleDateString()}</strong>.
      </Text>
      <Section style={alertBox}>
        <Text style={alertText}>
          Changed your mind? You can cancel this deletion at any time before the scheduled date simply by logging back into your account.
        </Text>
      </Section>
    </EmailLayout>
  );
};

const paragraph = {
  fontSize: "15px",
  lineHeight: "24px",
  color: "#334155",
  margin: "0 0 20px 0",
};

const alertBox = {
  backgroundColor: "#f8fafc",
  borderLeft: "4px solid #3b82f6",
  padding: "16px 20px",
  marginBottom: "16px",
  borderRadius: "0 8px 8px 0",
};

const alertText = {
  fontSize: "14px",
  lineHeight: "20px",
  color: "#475569",
  margin: "0",
};

export default AccountDeletionScheduledEmail;
