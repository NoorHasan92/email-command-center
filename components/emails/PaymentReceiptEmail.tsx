import * as React from "react";
import { Section, Text, Button, Hr, Row, Column } from "@react-email/components";
import { EmailLayout } from "./EmailLayout";

interface PaymentReceiptEmailProps {
  receiptNumber: string;
  customerName?: string | null;
  customerEmail: string;
  productName: string;
  amount: number; // in paise
  currency: string;
  paymentStatus: string;
  orderReference: string;
  razorpayPaymentId?: string | null;
  razorpayOrderId?: string | null;
  paymentDate: Date;
  receiptUrl: string;
}

export const PaymentReceiptEmail = ({
  receiptNumber,
  customerName,
  customerEmail,
  productName,
  amount,
  currency,
  paymentStatus,
  orderReference,
  razorpayPaymentId,
  razorpayOrderId,
  paymentDate,
  receiptUrl,
}: PaymentReceiptEmailProps) => {
  const formattedAmount = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency || "INR",
  }).format(amount / 100);

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(paymentDate));

  return (
    <EmailLayout
      previewText={`Payment Receipt ${receiptNumber}`}
      title="Payment Receipt"
    >
      <Text style={receiptTitle}>Receipt Number: {receiptNumber}</Text>
      <Text style={verificationText}>
        This receipt confirms that the payment described below was successfully verified.
      </Text>

      <Hr style={divider} />

      <Row style={sectionRow}>
        <Column style={halfColumn}>
          <Text style={sectionTitle}>Customer Details</Text>
          {customerName && <Text style={detailText}>{customerName}</Text>}
          <Text style={detailText}>{customerEmail}</Text>
        </Column>
        <Column style={halfColumn}>
          <Text style={sectionTitle}>Payment Details</Text>
          <Text style={detailText}>Amount: {formattedAmount}</Text>
          <Text style={detailText}>Status: {paymentStatus}</Text>
          <Text style={detailText}>Date: {formattedDate}</Text>
        </Column>
      </Row>

      <Hr style={divider} />

      <Section>
        <Text style={sectionTitle}>Purchase Details</Text>
        <Text style={detailText}>Product: {productName}</Text>
      </Section>

      <Hr style={divider} />

      <Section>
        <Text style={sectionTitle}>Transaction References</Text>
        <Text style={detailText}>Internal Order: {orderReference}</Text>
        {razorpayPaymentId && <Text style={detailText}>Payment ID: {razorpayPaymentId}</Text>}
        {razorpayOrderId && <Text style={detailText}>Provider Order ID: {razorpayOrderId}</Text>}
        <Text style={detailText}>Provider: Razorpay</Text>
      </Section>

      <Section style={btnContainer}>
        <Button href={receiptUrl} style={buttonOutline}>
          View Receipt Online
        </Button>
      </Section>
    </EmailLayout>
  );
};

// Styles
const receiptTitle = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#64748b",
  margin: "0 0 16px 0",
};

const verificationText = {
  fontSize: "14px",
  lineHeight: "22px",
  color: "#334155",
  margin: "0 0 24px 0",
};

const divider = {
  borderColor: "#e2e8f0",
  margin: "24px 0",
};

const sectionRow = {
  width: "100%",
};

const halfColumn = {
  width: "50%",
  verticalAlign: "top",
};

const sectionTitle = {
  fontSize: "12px",
  fontWeight: "700",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
  color: "#94a3b8", // slate-400
  margin: "0 0 8px 0",
};

const detailText = {
  fontSize: "14px",
  color: "#0f172a",
  margin: "0 0 4px 0",
};

const btnContainer = {
  textAlign: "center" as const,
  marginTop: "40px",
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

export default PaymentReceiptEmail;
