import * as React from "react";
import { Section, Text, Button } from "@react-email/components";
import { EmailLayout } from "./EmailLayout";

interface WelcomeEmailProps {
  name?: string | null;
}

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://mail.tars.homes";

export const WelcomeEmail = ({ name }: WelcomeEmailProps) => {
  const firstName = name ? name.split(" ")[0] : "there";

  return (
    <EmailLayout
      previewText="Welcome to Inbox Sentinel — Your AI Email Command Center is ready"
      title="Welcome to Inbox Sentinel"
    >
      <Text style={paragraphGreeting} className="email-text-title">
        Dear {firstName},
      </Text>

      <Text style={paragraph} className="email-text-body">
        Thank you for joining <strong>Inbox Sentinel</strong>. Your personal command center is now active, providing intelligent email triage, milestone tracking, and real-time alerts for your most important communications.
      </Text>

      {/* Program Details / Core Capabilities Box */}
      <Section style={calloutBox} className="callout-box">
        <Text style={calloutHeader} className="callout-header">
          Active Capabilities Enabled
        </Text>
        
        <table role="presentation" border={0} cellPadding="0" cellSpacing="0" style={tableFull}>
          <tbody>
            <tr>
              <td style={featureCell}>
                <Text style={featureBullet}>
                  <strong style={bulletTitle} className="bullet-title">Intelligent Thread Synthesis:</strong>{" "}
                  <span style={bulletDesc} className="bullet-desc">
                    Distills lengthy conversations into concise executive summaries and key action items automatically.
                  </span>
                </Text>
              </td>
            </tr>
            <tr>
              <td style={featureCell}>
                <Text style={featureBullet}>
                  <strong style={bulletTitle} className="bullet-title">Priority Notifications:</strong>{" "}
                  <span style={bulletDesc} className="bullet-desc">
                    Delivers immediate alerts via Telegram or WhatsApp when an email requires your direct attention.
                  </span>
                </Text>
              </td>
            </tr>
            <tr>
              <td style={featureCell}>
                <Text style={featureBullet}>
                  <strong style={bulletTitle} className="bullet-title">Autonomous Research & Verification:</strong>{" "}
                  <span style={bulletDesc} className="bullet-desc">
                    Cross-checks organizations, sender domains, and public business records using Google Search intelligence.
                  </span>
                </Text>
              </td>
            </tr>
            <tr>
              <td style={featureCell}>
                <Text style={featureBullet}>
                  <strong style={bulletTitle} className="bullet-title">Action Items & Deadlines:</strong>{" "}
                  <span style={bulletDesc} className="bullet-desc">
                    Surfaces key commitments, upcoming meetings, and time-sensitive milestones effortlessly.
                  </span>
                </Text>
              </td>
            </tr>
          </tbody>
        </table>
      </Section>

      {/* Getting Started Section */}
      <Text style={sectionSubheading} className="email-text-title">
        Getting Started
      </Text>
      <Text style={paragraph} className="email-text-body">
        Inbox Sentinel operates quietly in the background without modifying your mailbox. Complete your setup in two quick steps:
      </Text>

      <Section style={stepsBox} className="steps-box">
        <table role="presentation" border={0} cellPadding="0" cellSpacing="0" style={tableFull}>
          <tbody>
            <tr>
              <td style={stepIconCell}>
                <div style={stepBadge}>1</div>
              </td>
              <td style={stepContentCell}>
                <Text style={stepText}>
                  <strong style={stepTitle} className="step-title">Connect Alerts in Settings:</strong>{" "}
                  <span style={stepDesc} className="step-desc">Link your Telegram or WhatsApp account in Integrations to activate instant mobile alerts.</span>
                </Text>
              </td>
            </tr>
            <tr>
              <td style={stepIconCell}>
                <div style={stepBadge}>2</div>
              </td>
              <td style={stepContentCell}>
                <Text style={stepText}>
                  <strong style={stepTitle} className="step-title">Continuous Background Analysis:</strong>{" "}
                  <span style={stepDesc} className="step-desc">As new emails arrive, Sentinel evaluates priority, surfaces actionable tasks, and keeps your inbox organized.</span>
                </Text>
              </td>
            </tr>
            <tr>
              <td style={stepIconCell}>
                <div style={stepBadge}>3</div>
              </td>
              <td style={stepContentCell}>
                <Text style={stepText}>
                  <strong style={stepTitle} className="step-title">On-Demand Deep Research:</strong>{" "}
                  <span style={stepDesc} className="step-desc">On any email alert in Telegram, reply with <em>"Research this company"</em> to receive an exhaustive AI intelligence report.</span>
                </Text>
              </td>
            </tr>
          </tbody>
        </table>
      </Section>

      {/* High-Contrast CTA Button */}
      <Section style={btnContainer}>
        <Button href={`${appUrl}/dashboard`} style={button}>
          Launch Sentinel Dashboard &rarr;
        </Button>
      </Section>

      <Text style={signoffText} className="email-text-muted">
        Welcome aboard,<br />
        <strong style={signoffStrong} className="email-text-title">The Inbox Sentinel Team</strong>
      </Text>
    </EmailLayout>
  );
};

// Styles (Default to clean, crisp Light Mode, with dark mode CSS class overrides)
const paragraphGreeting = {
  fontSize: "16px",
  fontWeight: "600",
  lineHeight: "24px",
  color: "#0f172a",
  margin: "0 0 16px 0",
};

const paragraph = {
  fontSize: "15px",
  lineHeight: "24px",
  color: "#334155",
  margin: "0 0 20px 0",
};

const calloutBox = {
  backgroundColor: "#f8fafc",
  borderLeft: "3.5px solid #4f46e5",
  borderTop: "1px solid #e2e8f0",
  borderRight: "1px solid #e2e8f0",
  borderBottom: "1px solid #e2e8f0",
  borderRadius: "8px",
  padding: "20px 22px",
  marginBottom: "24px",
};

const calloutHeader = {
  fontSize: "15px",
  fontWeight: "700",
  color: "#0f172a",
  margin: "0 0 14px 0",
  letterSpacing: "0.2px",
};

const tableFull = {
  width: "100%",
};

const featureCell = {
  paddingBottom: "12px",
};

const featureBullet = {
  fontSize: "14px",
  lineHeight: "21px",
  margin: "0",
};

const bulletTitle = {
  color: "#0f172a",
  fontWeight: "600",
};

const bulletDesc = {
  color: "#475569",
};

const sectionSubheading = {
  fontSize: "16px",
  fontWeight: "700",
  color: "#0f172a",
  margin: "24px 0 10px 0",
  letterSpacing: "-0.2px",
};

const stepsBox = {
  backgroundColor: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: "8px",
  padding: "18px 20px 10px 20px",
  marginBottom: "28px",
};

const stepIconCell = {
  verticalAlign: "top",
  width: "28px",
  paddingBottom: "14px",
};

const stepBadge = {
  width: "20px",
  height: "20px",
  borderRadius: "50%",
  backgroundColor: "#4f46e5",
  color: "#ffffff",
  fontSize: "11px",
  fontWeight: "700",
  textAlign: "center" as const,
  lineHeight: "20px",
};

const stepContentCell = {
  verticalAlign: "top",
  paddingLeft: "8px",
  paddingBottom: "14px",
};

const stepText = {
  fontSize: "14px",
  lineHeight: "21px",
  margin: "0",
  color: "#475569",
};

const stepTitle = {
  color: "#0f172a",
  fontWeight: "600",
};

const stepDesc = {
  color: "#475569",
};

const btnContainer = {
  textAlign: "center" as const,
  marginTop: "24px",
  marginBottom: "24px",
};

const button = {
  backgroundColor: "#4f46e5",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 28px",
  boxShadow: "0 4px 14px rgba(79, 70, 229, 0.35)",
};

const signoffText = {
  fontSize: "14px",
  lineHeight: "22px",
  color: "#64748b",
  margin: "12px 0 0 0",
  borderTop: "1px solid #f1f5f9",
  paddingTop: "18px",
};

const signoffStrong = {
  color: "#0f172a",
};

export default WelcomeEmail;
