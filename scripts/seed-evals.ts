import { db } from "../server/repositories/db";
import { EmailCategory } from "@prisma/client";

async function seedEvals() {
  console.log("Seeding AI Evaluation Run...");
  
  const run = await db.aIEvalRun.create({
    data: {
      datasetName: "dataset.json",
      promptVersion: "1.0",
      modelVersion: "gpt-4o-mini",
      totalEmails: 3,
      accuracy: 0.66,
      opportunityAccuracy: 1.0,
      notificationAccuracy: 0.66,
      precision: 0.5,
      recall: 1.0,
      f1Score: 0.66,
      totalCost: 0.0034,
      averageLatencyMs: 1205.5,
      results: {
        create: [
          {
            emailSubject: "Your Google Cloud Invoice",
            emailFrom: "billing@google.com",
            emailBody: "Your invoice for $54.32 is due on Aug 15. Please pay to avoid suspension.",
            expectedCategory: "NOTIFICATION",
            actualCategory: "NOTIFICATION",
            expectedActionReq: true,
            actualActionReq: true,
            expectedOpportunity: false,
            actualOpportunity: false,
            expectedNotification: true,
            actualNotification: true,
            latencyMs: 1100,
            cost: 0.0011,
            isFalsePositive: false,
            isFalseNegative: false,
            isPerfectMatch: true,
          },
          {
            emailSubject: "Weekend Sale: 50% Off Everything!",
            emailFrom: "marketing@ecommerce.com",
            emailBody: "Don't miss out on our huge weekend sale. Click here to shop.",
            expectedCategory: "NEWSLETTER",
            actualCategory: "SPAM", // Mismatch!
            expectedActionReq: false,
            actualActionReq: false,
            expectedOpportunity: false,
            actualOpportunity: false,
            expectedNotification: false,
            actualNotification: false,
            latencyMs: 1300,
            cost: 0.0012,
            isFalsePositive: false,
            isFalseNegative: false,
            isPerfectMatch: false, // Category mismatch
          },
          {
            emailSubject: "Software Engineer Intern - Final Interview Invitation",
            emailFrom: "recruiting@techgiant.com",
            emailBody: "Congratulations! We would like to invite you to the final interview stage on Friday at 10 AM.",
            expectedCategory: "DIRECT_MESSAGE",
            actualCategory: "DIRECT_MESSAGE",
            expectedActionReq: true,
            actualActionReq: true,
            expectedOpportunity: true,
            actualOpportunity: true,
            expectedNotification: true,
            actualNotification: true,
            latencyMs: 1211,
            cost: 0.0011,
            isFalsePositive: false,
            isFalseNegative: false,
            isPerfectMatch: true,
          }
        ]
      }
    }
  });

  console.log(`Eval Seed complete. Run ID: ${run.id}`);
}

seedEvals()
  .catch(e => console.error(e))
  .finally(async () => await db.$disconnect());
