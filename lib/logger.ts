import pino from "pino";

// Define custom levels or formats if necessary to match OpenTelemetry
// OpenTelemetry typically uses standard levels (trace, debug, info, warn, error, fatal)

const isProduction = process.env.NODE_ENV === "production";

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  // Omit pretty print in production for raw JSON (better for Datadog / GCP / OTEL)
  // Removed pino-pretty for development to fix Turbopack module resolution crashes.
  // Standard JSON logs will be emitted instead.
  formatters: {
    level: (label) => {
      return { severity: label.toUpperCase() }; // Helps GCP logging identify level
    },
  },
  base: {
    env: process.env.NODE_ENV,
    service: "inbox-sentinel"
  },
});
