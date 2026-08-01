import fs from "fs";
import path from "path";
import { db } from "../server/repositories/db";
import { OpenAIAdapter } from "../services/ai/openai.adapter";
import { EmailCategory } from "@prisma/client";

// Ensure environment variables are loaded
import * as dotenv from "dotenv";
dotenv.config({ path: path.join(__dirname, "../.env") });

async function runEvaluation() {
  console.log("Starting AI Evaluation...");
  const datasetPath = path.join(__dirname, "../data/eval/dataset.json");
  const dataset = JSON.parse(fs.readFileSync(datasetPath, "utf-8"));
  
  const aiProvider = new OpenAIAdapter();
  
  let correctCategory = 0;
  let correctAction = 0;
  let correctOpportunity = 0;
  
  let truePositivesNotif = 0;
  let falsePositivesNotif = 0;
  let trueNegativesNotif = 0;
  let falseNegativesNotif = 0;
  
  let totalLatency = 0;
  let totalCost = 0;
  
  const runId = `eval-${Date.now()}`;
  
  // We'll extract the promptVersion and modelVersion from the first run or default to config
  let promptVer = "Unknown";
  let modelVer = "Unknown";
  
  const resultsData = [];
  
  for (const email of dataset) {
    console.log(`Processing: ${email.subject}`);
    
    const startTime = performance.now();
    const result = await aiProvider.analyzeEmail(email.body, email.subject, { from: email.from, date: new Date().toISOString() });
    const latency = performance.now() - startTime;
    
    totalLatency += latency;
    totalCost += result.estimatedCost;
    
    promptVer = result.aiVersion.split("-")[0];
    modelVer = result.model;
    
    const expected = email.expected;
    
    const isCatCorrect = result.category === expected.category;
    const isActCorrect = result.isActionRequired === expected.isActionRequired;
    const isOppCorrect = result.opportunityDetected === expected.opportunityDetected;
    
    if (isCatCorrect) correctCategory++;
    if (isActCorrect) correctAction++;
    if (isOppCorrect) correctOpportunity++;
    
    // Notification logic
    const scoreThreshold = 50;
    const actualNotification = result.score >= scoreThreshold || result.isActionRequired || result.opportunityDetected;
    const expectedNotification = expected.notification;
    
    if (actualNotification && expectedNotification) truePositivesNotif++;
    else if (actualNotification && !expectedNotification) falsePositivesNotif++;
    else if (!actualNotification && !expectedNotification) trueNegativesNotif++;
    else if (!actualNotification && expectedNotification) falseNegativesNotif++;
    
    const isPerfect = isCatCorrect && isActCorrect && isOppCorrect && (actualNotification === expectedNotification);
    
    resultsData.push({
      emailSubject: email.subject,
      emailFrom: email.from,
      emailBody: email.body,
      expectedCategory: expected.category as EmailCategory,
      actualCategory: result.category,
      expectedActionReq: expected.isActionRequired || false,
      actualActionReq: result.isActionRequired,
      expectedOpportunity: expected.opportunityDetected || false,
      actualOpportunity: result.opportunityDetected,
      expectedNotification,
      actualNotification,
      latencyMs: Math.round(latency),
      cost: result.estimatedCost,
      isFalsePositive: actualNotification && !expectedNotification,
      isFalseNegative: !actualNotification && expectedNotification,
      isPerfectMatch: isPerfect,
    });
  }
  
  const total = dataset.length;
  const accuracy = correctCategory / total;
  const oppAccuracy = correctOpportunity / total;
  
  const precisionNotif = truePositivesNotif / (truePositivesNotif + falsePositivesNotif) || 0;
  const recallNotif = truePositivesNotif / (truePositivesNotif + falseNegativesNotif) || 0;
  const f1Notif = 2 * (precisionNotif * recallNotif) / (precisionNotif + recallNotif) || 0;
  const notifAccuracy = (truePositivesNotif + trueNegativesNotif) / total;
  
  console.log("Saving results to DB...");
  const evalRun = await db.aIEvalRun.create({
    data: {
      datasetName: "dataset.json",
      promptVersion: promptVer,
      modelVersion: modelVer,
      totalEmails: total,
      accuracy,
      opportunityAccuracy: oppAccuracy,
      notificationAccuracy: notifAccuracy,
      precision: precisionNotif,
      recall: recallNotif,
      f1Score: f1Notif,
      totalCost,
      averageLatencyMs: totalLatency / total,
      results: {
        create: resultsData
      }
    }
  });
  
  console.log(`Evaluation complete. Run ID: ${evalRun.id}`);
}

runEvaluation()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
