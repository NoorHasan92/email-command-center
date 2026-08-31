import * as React from "react";
import { Text } from "@react-email/components";
import { EmailLayout } from "./EmailLayout";

interface AccountDeletionCancelledEmailProps {
  name?: string | null;
}

export const AccountDeletionCancelledEmail = ({
  name,
}: AccountDeletionCancelledEmailProps) => {
  return (
    <EmailLayout
      previewText="Your account deletion has been cancelled"
      title="Deletion Cancelled"
    >
      <Text style={paragraph}>
        Welcome back, {name ? name.split(" ")[0] : "there"}!
      </Text>
      <Text style={paragraph}>
        Your pending account deletion request has been successfully cancelled. Your account and all data have been restored and your scheduled deletion is revoked.
      </Text>
      <Text style={paragraph}>
        We are glad to have you back at Inbox Sentinel.
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

export default AccountDeletionCancelledEmail;
