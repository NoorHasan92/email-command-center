import * as React from "react";
import {
  Body,
  Container,
  Head,
  Heading,
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

// Ensures image assets always resolve to public production URL even when dispatched locally
const assetBaseUrl =
  process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes("localhost")
    ? process.env.NEXT_PUBLIC_APP_URL
    : "https://mail.tars.homes";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://mail.tars.homes";

export const EmailLayout = ({
  previewText,
  title,
  children,
}: EmailLayoutProps) => {
  return (
    <Html lang="en">
      <Head>
        <meta name="color-scheme" content="light dark" />
        <meta name="supported-color-schemes" content="light dark" />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              :root {
                color-scheme: light dark;
                supported-color-schemes: light dark;
              }
              body {
                margin: 0;
                padding: 0;
                background-color: #f4f6f9;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              }
              /* Seamless dark mode support for dark-mode clients */
              @media (prefers-color-scheme: dark) {
                .email-body { background-color: #07090e !important; }
                .email-card { background-color: #0d1019 !important; border-color: #1e2436 !important; box-shadow: 0 10px 30px rgba(0,0,0,0.5) !important; }
                .email-heading { color: #ffffff !important; }
                .email-brand-title { color: #ffffff !important; }
                .email-brand-tagline { color: #818cf8 !important; }
                .email-text-title { color: #ffffff !important; }
                .email-text-body { color: #cbd5e1 !important; }
                .email-text-muted { color: #94a3b8 !important; }
                .callout-box { background-color: #131726 !important; border-color: #1e243a !important; }
                .callout-header { color: #ffffff !important; }
                .bullet-title { color: #f8fafc !important; }
                .bullet-desc { color: #94a3b8 !important; }
                .steps-box { background-color: #101320 !important; border-color: #1d2334 !important; }
                .step-title { color: #f8fafc !important; }
                .step-desc { color: #94a3b8 !important; }
                .footer-brand { color: #94a3b8 !important; }
                .footer-text { color: #64748b !important; }
                .footer-links { color: #64748b !important; }
                .footer-copyright { color: #475569 !important; }
              }
              /* Outlook dark mode */
              [data-ogsc] .email-card { background-color: #0d1019 !important; }
              [data-ogsc] .email-heading { color: #ffffff !important; }
            `,
          }}
        />
      </Head>
      <Preview>{previewText}</Preview>
      <Body style={main} className="email-body">
        <Container style={container}>
          {/* Centered Brand Header */}
          <Section style={headerSection}>
            <table
              role="presentation"
              border={0}
              cellPadding="0"
              cellSpacing="0"
              style={headerTable}
            >
              <tbody>
                <tr>
                  <td align="center">
                    <div style={logoBadge}>
                      <Img
                        src={`${assetBaseUrl}/app-logo.png`}
                        width="44"
                        height="44"
                        alt="Inbox Sentinel"
                        style={logoImg}
                      />
                    </div>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <Text style={brandTitle} className="email-brand-title">
                      INBOX SENTINEL
                    </Text>
                    <Text style={brandTagline} className="email-brand-tagline">
                      Autonomous Email Intelligence
                    </Text>
                  </td>
                </tr>
              </tbody>
            </table>
          </Section>

          {/* Main Content Card */}
          <Section style={contentBox} className="email-card">
            {title && (
              <Heading style={heading} className="email-heading">
                {title}
              </Heading>
            )}
            {children}
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerBrand} className="footer-brand">
              Inbox Sentinel &middot; Autonomous Email Intelligence & Action Engine
            </Text>
            <Text style={footerText} className="footer-text">
              You received this message because of your Inbox Sentinel account settings.
              Need assistance? Reply directly to this email or visit your{" "}
              <Link href={`${appUrl}/dashboard`} style={link}>
                Command Center
              </Link>.
            </Text>
            <Text style={footerLinks} className="footer-links">
              <Link href={`${appUrl}/dashboard`} style={link}>
                Dashboard
              </Link>
              {" · "}
              <Link href={`${appUrl}/privacy`} style={link}>
                Privacy Policy
              </Link>
              {" · "}
              <Link href={`${appUrl}/terms`} style={link}>
                Terms of Service
              </Link>
            </Text>
            <Text style={footerCopyright} className="footer-copyright">
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
  backgroundColor: "#f4f6f9",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
  padding: "36px 12px 48px 12px",
  margin: "0",
};

const container = {
  margin: "0 auto",
  maxWidth: "580px",
  width: "100%",
};

const headerSection = {
  padding: "0 0 22px 0",
  textAlign: "center" as const,
};

const headerTable = {
  margin: "0 auto",
  textAlign: "center" as const,
};

const logoBadge = {
  width: "56px",
  height: "56px",
  borderRadius: "14px",
  backgroundColor: "#0f172a",
  border: "1px solid #1e293b",
  display: "inline-block",
  padding: "6px",
  boxSizing: "border-box" as const,
  textAlign: "center" as const,
  marginBottom: "10px",
  boxShadow: "0 4px 12px rgba(15, 23, 42, 0.12)",
};

const logoImg = {
  display: "inline-block",
  verticalAlign: "middle",
  margin: "0 auto",
};

const brandTitle = {
  margin: "0",
  fontSize: "17px",
  fontWeight: "700",
  letterSpacing: "2.5px",
  color: "#0f172a",
  textTransform: "uppercase" as const,
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const brandTagline = {
  margin: "4px 0 0 0",
  fontSize: "11px",
  fontWeight: "600",
  letterSpacing: "1.2px",
  color: "#4f46e5",
  textTransform: "uppercase" as const,
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const contentBox = {
  backgroundColor: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "14px",
  padding: "36px 32px",
  boxShadow: "0 4px 20px rgba(15, 23, 42, 0.05)",
};

const heading = {
  fontSize: "22px",
  fontWeight: "700",
  color: "#0f172a",
  letterSpacing: "-0.3px",
  margin: "0 0 22px 0",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const footer = {
  padding: "32px 0 0 0",
  textAlign: "center" as const,
};

const footerBrand = {
  fontSize: "12px",
  fontWeight: "600",
  color: "#64748b",
  letterSpacing: "0.4px",
  margin: "0 0 8px 0",
};

const footerText = {
  fontSize: "12px",
  color: "#64748b",
  lineHeight: "18px",
  margin: "4px 0",
};

const footerLinks = {
  fontSize: "12px",
  color: "#64748b",
  margin: "12px 0 6px 0",
};

const footerCopyright = {
  fontSize: "11px",
  color: "#94a3b8",
  margin: "8px 0 0 0",
};

const link = {
  color: "#4f46e5",
  textDecoration: "underline",
};
