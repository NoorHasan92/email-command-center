import * as React from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface EmailLayoutProps {
  previewText: string;
  title: string;
  children: React.ReactNode;
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tars.homes";

export const EmailLayout = ({
  previewText,
  title,
  children,
}: EmailLayoutProps) => {
  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Img
              src={`${baseUrl}/app-logo.png`}
              width="40"
              height="40"
              alt="Inbox Sentinel"
              style={logo}
            />
            <Text style={headerText}>Inbox Sentinel</Text>
          </Section>

          <Section style={contentBox}>
            <Heading style={heading}>{title}</Heading>
            {children}
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              You received this email because it's related to your Inbox Sentinel account.
            </Text>
            <Text style={footerLinks}>
              <Link href={`${baseUrl}/privacy`} style={link}>
                Privacy Policy
              </Link>
              {" • "}
              <Link href={`${baseUrl}/terms`} style={link}>
                Terms of Service
              </Link>
            </Text>
            <Text style={footerText}>
              &copy; {new Date().getFullYear()} Inbox Sentinel. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

// Styles
const main = {
  backgroundColor: "#f8fafc", // slate-50
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "40px 20px",
  maxWidth: "600px",
};

const header = {
  display: "flex",
  alignItems: "center",
  padding: "0 0 24px 0",
};

const logo = {
  borderRadius: "8px",
  display: "inline-block",
  verticalAlign: "middle",
};

const headerText = {
  display: "inline-block",
  verticalAlign: "middle",
  fontSize: "20px",
  fontWeight: "700",
  color: "#0f172a", // slate-900
  marginLeft: "12px",
  marginTop: "0",
  marginBottom: "0",
};

const contentBox = {
  backgroundColor: "#ffffff",
  border: "1px solid #e2e8f0", // slate-200
  borderRadius: "12px",
  padding: "40px",
  boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)",
};

const heading = {
  fontSize: "24px",
  fontWeight: "600",
  color: "#0f172a",
  margin: "0 0 24px 0",
};

const footer = {
  padding: "32px 0 0 0",
  textAlign: "center" as const,
};

const footerText = {
  fontSize: "12px",
  color: "#64748b", // slate-500
  lineHeight: "16px",
  margin: "4px 0",
};

const footerLinks = {
  fontSize: "12px",
  margin: "8px 0",
};

const link = {
  color: "#64748b",
  textDecoration: "underline",
};
