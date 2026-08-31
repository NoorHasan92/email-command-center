import * as React from "react";
import { Text } from "@react-email/components";
import { EmailLayout } from "./EmailLayout";

interface AccountDeletionCompletedEmailProps {
  name?: string | null;
}

export const AccountDeletionCompletedEmail = ({
  name,
}: AccountDeletionCompletedEmailProps) => {
  return (
    <EmailLayout
      previewText="Your account has been successfully deleted"
      title="Account Deleted"
    >
      <Text style={paragraph}>
        Hello {name ? name.split(" ")[0] : "there"},
      </Text>
      <Text style={paragraph}>
        This is a final confirmation that your Inbox Sentinel account and all associated personal data have been permanently deleted from our servers as requested.
      </Text>
      <Text style={paragraph}>
        Thank you for trying Inbox Sentinel. If you ever need our services again, you are welcome to sign up for a new account at any time.
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

export default AccountDeletionCompletedEmail;
