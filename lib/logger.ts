import pino from "pino";
import { getCorrelationId } from "./context";
import { AppError } from "./error";

const isProduction = process.env.NODE_ENV === "production";

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers['x-razorpay-signature']",
      "password",
      "token",
      "accessToken",
      "refreshToken",
      "apiKey",
      "encryptedApiKey"
    ],
    censor: "[REDACTED]"
  },
  formatters: {
    level: (label) => {
      return { severity: label.toUpperCase() };
    },
  },
  mixin() {
    const correlationId = getCorrelationId();
    return correlationId ? { correlationId } : {};
  },
  base: {
    env: process.env.NODE_ENV,
    service: "inbox-sentinel"
  },
  serializers: {
    err: (err) => {
      if (err instanceof AppError) {
        return {
          type: "AppError",
          code: err.code,
          subsystem: err.subsystem,
          retryable: err.retryable,
          message: err.message,
          stack: isProduction ? undefined : err.stack
        };
      }
      return pino.stdSerializers.err(err);
    }
  }
});
