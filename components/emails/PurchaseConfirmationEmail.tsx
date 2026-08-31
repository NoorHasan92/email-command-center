import * as React from "react";
import { Section, Text, Button, Hr, Row, Column } from "@react-email/components";
import { EmailLayout } from "./EmailLayout";

interface PurchaseConfirmationEmailProps {
  productName: string;
  amount: number; // in paise
  currency: string;
  purchaseDate: Date;
  referenceNumber: string;
  features: string[];
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tars.homes";

export const PurchaseConfirmationEmail = ({
  productName,
  amount,
  currency,
  purchaseDate,
  referenceNumber,
  features,
}: PurchaseConfirmationEmailProps) => {
  const formattedAmount = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency || "INR",
  }).format(amount / 100);

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(purchaseDate));

  return (
    <EmailLayout
      previewText="Your purchase was successful"
      title="Purchase Successful"
    >
      <Text style={paragraph}>
        Thank you for your purchase. Your transaction was successfully verified and your entitlement is now active.
      </Text>

      <Section style={summaryCard}>
        <Row style={summaryRow}>
          <Column style={summaryLabelCol}>
            <Text style={summaryLabel}>Product</Text>
          </Column>
          <Column style={summaryValueCol}>
            <Text style={summaryValue}>{productName}</Text>
          </Column>
        </Row>
        <Hr style={summaryDivider} />
        
        <Row style={summaryRow}>
          <Column style={summaryLabelCol}>
            <Text style={summaryLabel}>Amount</Text>
          </Column>
          <Column style={summaryValueCol}>
            <Text style={summaryValue}>{formattedAmount}</Text>
          </Column>
        </Row>
        <Hr style={summaryDivider} />
        
        <Row style={summaryRow}>
          <Column style={summaryLabelCol}>
            <Text style={summaryLabel}>Date</Text>
          </Column>
          <Column style={summaryValueCol}>
            <Text style={summaryValue}>{formattedDate}</Text>
          </Column>
        </Row>
        <Hr style={summaryDivider} />
        
        <Row style={summaryRow}>
          <Column style={summaryLabelCol}>
            <Text style={summaryLabel}>Reference</Text>
          </Column>
          <Column style={summaryValueCol}>
            <Text style={summaryValue}>{referenceNumber}</Text>
          </Column>
        </Row>
      </Section>

      <Text style={heading2}>Unlocked Features</Text>
      <Section style={featuresList}>
        {features.map((feature, idx) => (
          <Row key={idx} style={featureRow}>
            <Column style={featureBulletCol}>
              <Text style={featureBullet}>•</Text>
            </Column>
            <Column>
              <Text style={featureText}>{feature}</Text>
            </Column>
          </Row>
        ))}
      </Section>

      <Section style={btnContainer}>
        <Button href={`${baseUrl}/dashboard`} style={buttonPrimary}>
          Open Dashboard
        </Button>
      </Section>
    </EmailLayout>
  );
};

// Styles
const paragraph = {
  fontSize: "15px",
  lineHeight: "24px",
  color: "#334155",
  margin: "0 0 24px 0",
};

const summaryCard = {
  backgroundColor: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: "8px",
  padding: "20px",
  marginBottom: "32px",
};

const summaryRow = {
  padding: "4px 0",
};

const summaryLabelCol = {
  width: "35%",
};

const summaryValueCol = {
  width: "65%",
};

const summaryLabel = {
  fontSize: "14px",
  color: "#64748b",
  margin: "0",
};

const summaryValue = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#0f172a",
  margin: "0",
};

const summaryDivider = {
  borderColor: "#e2e8f0",
  margin: "12px 0",
};

const heading2 = {
  fontSize: "18px",
  fontWeight: "600",
  color: "#0f172a",
  margin: "0 0 16px 0",
};

const featuresList = {
  marginBottom: "32px",
};

const featureRow = {
  padding: "4px 0",
};

const featureBulletCol = {
  width: "24px",
  verticalAlign: "top",
};

const featureBullet = {
  fontSize: "15px",
  color: "#6366f1",
  fontWeight: "bold",
  margin: "0",
};

const featureText = {
  fontSize: "15px",
  color: "#334155",
  margin: "0",
  lineHeight: "22px",
};

const btnContainer = {
  textAlign: "center" as const,
  marginTop: "16px",
  marginBottom: "16px",
};

const buttonPrimary = {
  backgroundColor: "#0f172a",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "500",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
};

export default PurchaseConfirmationEmail;
