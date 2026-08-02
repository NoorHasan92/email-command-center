"use client";

import { useState } from "react";
import { AIEvalRun, AIEvalResult } from "@prisma/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

type RunWithResults = AIEvalRun & { results: AIEvalResult[] };

export function AdminClient({ runs }: { runs: RunWithResults[] }) {
  const [selectedRun, setSelectedRun] = useState<RunWithResults | null>(runs[0] || null);

  if (runs.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <h2 className="text-2xl font-semibold mb-2">No Evaluation Runs Found</h2>
        <p className="text-muted-foreground text-center max-w-md">
          Run the AI Evaluation Suite via CLI to generate evaluation metrics.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">AI Evaluation Dashboard</h1>
        <div className="flex space-x-2">
          <select 
            className="bg-background border rounded-md p-2 text-sm"
            onChange={(e) => setSelectedRun(runs.find(r => r.id === e.target.value) || null)}
            value={selectedRun?.id || ""}
          >
            {runs.map(run => (
              <option key={run.id} value={run.id}>
                {new Date(run.createdAt).toLocaleString()} - {run.promptVersion} ({run.datasetName})
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedRun && (
        <ScrollArea className="flex-1">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Overall Accuracy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(selectedRun.accuracy * 100).toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">F1 Score: {(selectedRun.f1Score * 100).toFixed(1)}%</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Opp / Deadline Acc</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(selectedRun.opportunityAccuracy * 100).toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">Deadline: {(selectedRun.deadlineAccuracy * 100).toFixed(1)}%</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Average Latency</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{selectedRun.averageLatencyMs.toFixed(0)} ms</div>
                <p className="text-xs text-muted-foreground">Per email processed</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${selectedRun.totalCost.toFixed(4)}</div>
                <p className="text-xs text-muted-foreground">Total for {selectedRun.totalEmails} emails</p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-4">Mismatches / Errors</h3>
            <div className="space-y-4">
              {selectedRun.results.filter(r => !r.isPerfectMatch).length === 0 ? (
                <div className="text-muted-foreground">No errors! 100% perfect match.</div>
              ) : (
                selectedRun.results.filter(r => !r.isPerfectMatch).map(result => (
                  <Card key={result.id} className="border-red-900/50 bg-red-950/10">
                    <CardHeader className="py-3">
                      <CardTitle className="text-base">{result.emailSubject}</CardTitle>
                      <CardDescription>{result.emailFrom}</CardDescription>
                    </CardHeader>
                    <CardContent className="py-3 text-sm">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="font-semibold text-muted-foreground mb-1">Expected</div>
                          <div>Cat: {result.expectedCategory}</div>
                          <div>Action: {result.expectedActionReq ? "Yes" : "No"}</div>
                          <div>Opp: {result.expectedOpportunity ? "Yes" : "No"}</div>
                        </div>
                        <div>
                          <div className="font-semibold text-muted-foreground mb-1">Actual</div>
                          <div className={result.actualCategory !== result.expectedCategory ? "text-red-400 font-bold" : ""}>Cat: {result.actualCategory}</div>
                          <div className={result.actualActionReq !== result.expectedActionReq ? "text-red-400 font-bold" : ""}>Action: {result.actualActionReq ? "Yes" : "No"}</div>
                          <div className={result.actualOpportunity !== result.expectedOpportunity ? "text-red-400 font-bold" : ""}>Opp: {result.actualOpportunity ? "Yes" : "No"}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </ScrollArea>
      )}
    </div>
  );
}