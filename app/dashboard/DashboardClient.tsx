"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNow, format } from "date-fns";
import { 
  Search, ShieldAlert, CheckCircle, Clock, Activity, 
  Check, Clock3, EyeOff, MoreHorizontal, X, Inbox
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

import { Email, EmailAnalysis } from "@prisma/client";
import { Lightbulb, Calendar, ThumbsUp, ThumbsDown, BellRing, BellOff, Sparkles, AlertCircle } from "lucide-react";

export type EmailWithAnalysis = Email & {
  analysis: EmailAnalysis | null;
  emailAccount?: {
    provider: string;
    emailAddress: string;
  };
};

interface HealthData {
  criticalCount: number;
  actionRequiredCount: number;
  deadlinesToday: number;
  deadlinesWeek: number;
  lastSync: string | null;
}

export default function DashboardClient({ 
  initialEmails, 
  healthData 
}: { 
  initialEmails: EmailWithAnalysis[];
  healthData: HealthData;
}) {
  const [emails, setEmails] = useState(initialEmails);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedEmail, setSelectedEmail] = useState<EmailWithAnalysis | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const handleMarkReviewed = (emailId: string) => {
    setEmails(prev => prev.filter(e => e.id !== emailId));
    if (selectedEmail?.id === emailId) {
      setSelectedEmail(null);
    }
  };

  const handleSnooze = (emailId: string) => {
    setEmails(prev => prev.filter(e => e.id !== emailId));
    if (selectedEmail?.id === emailId) {
      setSelectedEmail(null);
    }
  };

  // Filtered emails
  const filteredEmails = emails.filter(e => 
    (e.subject || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (e.from || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input
      if (document.activeElement?.tagName === "INPUT" && e.key !== "Escape") return;

      if (e.key === "j") {
        setSelectedIndex(prev => Math.min(prev + 1, filteredEmails.length - 1));
      } else if (e.key === "k") {
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === "e" || e.key === "Enter") {
        if (filteredEmails[selectedIndex]) {
          setSelectedEmail(filteredEmails[selectedIndex]);
        }
      } else if (e.key === "r") {
        if (selectedEmail) {
          handleMarkReviewed(selectedEmail.id);
        } else if (filteredEmails[selectedIndex]) {
          handleMarkReviewed(filteredEmails[selectedIndex].id);
        }
      } else if (e.key === "s") {
        if (selectedEmail) {
          handleSnooze(selectedEmail.id);
        } else if (filteredEmails[selectedIndex]) {
          handleSnooze(filteredEmails[selectedIndex].id);
        }
      } else if (e.key === "/") {
        e.preventDefault();
        document.getElementById("global-search")?.focus();
      } else if (e.key === "Escape") {
        setSelectedEmail(null);
        document.getElementById("global-search")?.blur();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex, filteredEmails]);

  return (
    <div className="flex h-full w-full">
      
      {/* Main Column */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${selectedEmail ? 'pr-[400px] xl:pr-[500px]' : ''}`}>
        
        {/* Top Header & Search */}
        <header className="h-14 border-b border-border flex items-center px-6 shrink-0 bg-background/95 backdrop-blur z-10">
          <div className="relative w-full max-w-md flex items-center">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3" />
            <input 
              id="global-search"
              type="text" 
              placeholder="Search emails, senders, or AI concepts (Press '/')" 
              className="w-full bg-secondary/50 border border-border rounded-md pl-10 pr-4 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring transition-all placeholder:text-muted-foreground"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </header>

        <ScrollArea className="flex-1">
          <div className="p-6 max-w-6xl mx-auto space-y-8">
            
            {/* Inbox Health Dashboard */}
            <section>
              <h2 className="text-lg font-semibold tracking-tight mb-4">Inbox Health</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <HealthCard 
                  title="Critical" 
                  value={healthData.criticalCount} 
                  icon={<ShieldAlert className="w-5 h-5 text-destructive" />} 
                  trend="Requires immediate attention"
                />
                <HealthCard 
                  title="Action Required" 
                  value={healthData.actionRequiredCount} 
                  icon={<CheckCircle className="w-5 h-5 text-orange-500" />} 
                  trend="Pending tasks"
                />
                <HealthCard 
                  title="Deadlines Today" 
                  value={healthData.deadlinesToday} 
                  icon={<Clock className="w-5 h-5 text-blue-500" />} 
                  trend="Due within 24h"
                />
                <HealthCard 
                  title="Last Sync" 
                  value={healthData.lastSync ? formatDistanceToNow(new Date(healthData.lastSync), { addSuffix: true }) : "Never"} 
                  icon={<Activity className="w-5 h-5 text-muted-foreground" />} 
                  trend="Gmail & WhatsApp active"
                />
              </div>
            </section>

            {/* Dashboard Additions for Milestone 8 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Opportunities Panel */}
              <section className="bg-card/50 border border-border rounded-lg p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-yellow-500" />
                    <h2 className="text-lg font-semibold tracking-tight">Opportunities</h2>
                  </div>
                </div>
                <div className="space-y-3">
                  {emails.filter(e => e.analysis?.opportunityDetected && e.analysis?.opportunityType !== "NONE").slice(0, 3).map(email => (
                    <div key={email.id} className="flex flex-col gap-1 p-3 bg-secondary/30 rounded-md border border-border">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-[10px] bg-yellow-500/10 text-yellow-600 border-yellow-500/20">{email.analysis?.opportunityType}</Badge>
                        <span className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(email.date), { addSuffix: true })}</span>
                      </div>
                      <span className="font-medium text-sm truncate">{email.subject || "No Subject"}</span>
                      <span className="text-xs text-muted-foreground truncate">{email.analysis?.explanation}</span>
                    </div>
                  ))}
                  {emails.filter(e => e.analysis?.opportunityDetected).length === 0 && (
                    <div className="text-sm text-muted-foreground text-center p-4">No opportunities detected yet.</div>
                  )}
                </div>
              </section>

              {/* Upcoming Deadlines */}
              <section className="bg-card/50 border border-border rounded-lg p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-500" />
                    <h2 className="text-lg font-semibold tracking-tight">Upcoming Deadlines</h2>
                  </div>
                </div>
                <div className="space-y-3">
                  {/* Flatten deadlines across emails */}
                  {emails.map(e => ({ email: e, deadlines: (e.analysis?.extractedDeadlines as {date: string; type: string; description: string}[]) || [] }))
                    .flatMap(item => item.deadlines.map(d => ({ ...d, emailId: item.email.id, subject: item.email.subject })))
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .filter(d => new Date(d.date) > new Date())
                    .slice(0, 3)
                    .map((deadline, idx) => (
                      <div key={idx} className="flex flex-col gap-1 p-3 bg-secondary/30 rounded-md border border-border">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className={`text-[10px] ${deadline.type === 'HARD' ? 'bg-destructive/10 text-destructive border-destructive/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'}`}>
                            {deadline.type}
                          </Badge>
                          <span className="text-[10px] font-medium text-foreground">{format(new Date(deadline.date), "MMM d, yyyy")}</span>
                        </div>
                        <span className="font-medium text-sm truncate">{deadline.subject || "No Subject"}</span>
                        <span className="text-xs text-muted-foreground truncate">{deadline.description}</span>
                      </div>
                    ))}
                    {emails.flatMap(e => (e.analysis?.extractedDeadlines as {date: string; type: string; description: string}[]) || []).length === 0 && (
                      <div className="text-sm text-muted-foreground text-center p-4">No upcoming deadlines detected.</div>
                    )}
                </div>
              </section>

            </div>

            {/* Email List */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold tracking-tight">Recent Activity</h2>
                <div className="text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-secondary rounded text-[10px] font-mono border border-border">J/K</kbd> Navigate</span>
                  <span className="inline-flex items-center gap-1 ml-3"><kbd className="px-1.5 py-0.5 bg-secondary rounded text-[10px] font-mono border border-border">E</kbd> Expand</span>
                </div>
              </div>
              
              <div className="border border-border rounded-lg bg-card overflow-hidden">
                {filteredEmails.length === 0 ? (
                  <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
                    <Inbox className="w-12 h-12 mb-4 opacity-20" />
                    <p>No emails found matching your criteria.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {filteredEmails.map((email, idx) => (
                      <EmailRow 
                        key={email.id}
                        email={email}
                        isSelected={idx === selectedIndex}
                        onClick={() => {
                          setSelectedIndex(idx);
                          setSelectedEmail(email);
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </section>

          </div>
        </ScrollArea>
      </div>

      {/* Sliding Right Pane */}
      <EmailDetailPane 
        email={selectedEmail} 
        onClose={() => setSelectedEmail(null)} 
        onMarkReviewed={() => selectedEmail && handleMarkReviewed(selectedEmail.id)}
      />

    </div>
  );
}

// ----------------------------------------------------------------------------
// Components
// ----------------------------------------------------------------------------

function HealthCard({ title, value, icon, trend }: { title: string, value: string | number, icon: React.ReactNode, trend: string }) {
  return (
    <Card className="bg-card/50 backdrop-blur border-border overflow-hidden group">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="p-2 bg-secondary/50 rounded-md transition-colors group-hover:bg-secondary">{icon}</div>
        </div>
        <div className="flex flex-col">
          <span className="text-3xl font-bold tracking-tight">{value}</span>
          <span className="text-xs text-muted-foreground mt-1">{trend}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function EmailRow({ email, isSelected, onClick }: { email: EmailWithAnalysis, isSelected: boolean, onClick: () => void }) {
  const analysis = email.analysis;
  const score = analysis?.score || 0;
  
  // Color code based on score
  let scoreColor = "text-muted-foreground bg-secondary";
  if (score >= 90) scoreColor = "text-destructive bg-destructive/10 border-destructive/20";
  else if (score >= 70) scoreColor = "text-orange-500 bg-orange-500/10 border-orange-500/20";
  else if (score >= 50) scoreColor = "text-blue-500 bg-blue-500/10 border-blue-500/20";

  return (
    <div 
      onClick={onClick}
      className={`group flex items-center px-4 py-3 cursor-pointer transition-all border-l-2 ${
        isSelected 
          ? "bg-secondary/50 border-l-primary" 
          : "border-l-transparent hover:bg-secondary/30"
      }`}
    >
      {/* Score Badge */}
      <div className="w-12 shrink-0 flex items-center justify-center mr-4">
        <div className={`text-xs font-bold px-2 py-1 rounded-md border ${scoreColor}`}>
          {score}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 mr-4">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-medium text-sm truncate text-foreground">{extractName(email.from)}</span>
          {analysis?.isActionRequired && (
            <Badge variant="outline" className="text-[10px] px-1.5 h-4 bg-orange-500/10 text-orange-500 border-orange-500/20">Action Req</Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="truncate max-w-[200px]">{email.subject || "(No Subject)"}</span>
          <span className="shrink-0 text-xs opacity-50">&bull;</span>
          <span className="truncate text-xs opacity-75">
            {analysis?.isActionRequired && analysis?.actionSummary ? (
              <strong className="text-foreground">{analysis.actionSummary}</strong>
            ) : (
              analysis?.explanation || "Analyzing..."
            )}
          </span>
        </div>
      </div>

      {/* Meta */}
      <div className="flex flex-col items-end shrink-0 gap-1.5">
        <span className="text-xs text-muted-foreground font-mono">
          {formatDistanceToNow(new Date(email.date), { addSuffix: true })}
        </span>
        
        {analysis?.estimatedReadTime && (
          <span className="text-[10px] text-muted-foreground flex items-center gap-1 bg-secondary/50 px-1.5 py-0.5 rounded">
            <Clock3 className="w-3 h-3" /> {analysis.estimatedReadTime}m
          </span>
        )}
        
        {/* Bulk Action Reveal */}
        <div className={`flex items-center gap-1 opacity-0 transition-opacity ${isSelected ? 'opacity-100' : 'group-hover:opacity-100'}`}>
          <ActionButton icon={<Check className="w-3.5 h-3.5" />} title="Mark Reviewed (R)" />
          <ActionButton icon={<Clock3 className="w-3.5 h-3.5" />} title="Snooze (S)" />
          <ActionButton icon={<EyeOff className="w-3.5 h-3.5" />} title="Ignore Sender" />
        </div>
      </div>
    </div>
  );
}

function ActionButton({ icon, title }: { icon: React.ReactNode, title: string }) {
  return (
    <button title={title} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors">
      {icon}
    </button>
  );
}

// ----------------------------------------------------------------------------
// Email Detail Pane
// ----------------------------------------------------------------------------

function EmailDetailPane({ email, onClose, onMarkReviewed }: { email: EmailWithAnalysis | null, onClose: () => void, onMarkReviewed: () => void }) {
  return (
    <aside 
      className={`fixed inset-y-0 right-0 w-[400px] xl:w-[500px] bg-card border-l border-border shadow-2xl transition-transform duration-300 ease-in-out z-20 flex flex-col ${
        email ? "translate-x-0" : "translate-x-full"
      }`}
    >
      {email && (
        <>
          <header className="h-14 border-b border-border flex items-center justify-between px-4 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Thread Details</span>
            </div>
            <button onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors">
              <X className="w-4 h-4" />
            </button>
          </header>

          <ScrollArea className="flex-1">
            <div className="p-6 space-y-6">
              
              {/* Header Info */}
              <div>
                <h2 className="text-xl font-semibold leading-tight mb-4">{email.subject || "(No Subject)"}</h2>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold">
                    {extractName(email.from).charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium">{extractName(email.from)}</span>
                    <span className="text-xs text-muted-foreground">{extractEmailAddress(email.from)}</span>
                  </div>
                  <div className="ml-auto text-xs text-muted-foreground font-mono">
                    {format(new Date(email.date), "MMM d, h:mm a")}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Consequence Engine Card */}
              {email.analysis && (
                <div className="bg-secondary/30 border border-border rounded-lg overflow-hidden relative">
                  {/* Priority Strip */}
                  <div className={`absolute top-0 left-0 w-1 h-full ${email.analysis.score >= 90 ? 'bg-destructive' : email.analysis.score >= 70 ? 'bg-orange-500' : 'bg-blue-500'}`} />
                  
                  <div className="p-5 space-y-5 pl-6">
                    {/* Top Row: AI Ring & Category */}
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Activity className="w-4 h-4 text-primary" />
                          <h3 className="font-semibold text-sm">Consequence Engine</h3>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">{email.analysis.category}</Badge>
                          {email.analysis.priority !== "LOW" && (
                            <Badge variant="outline" className="text-xs bg-secondary">{email.analysis.priority} Priority</Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="shrink-0 flex flex-col items-center">
                        <div className="relative flex items-center justify-center w-12 h-12" title={`Confidence: ${email.analysis.confidence}%`}>
                          <svg className="w-12 h-12 transform -rotate-90">
                            <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="none" className="text-secondary" />
                            <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="none" 
                              strokeDasharray={`${email.analysis.score * 1.25} 125`} 
                              className={email.analysis.score >= 90 ? "text-destructive" : email.analysis.score >= 70 ? "text-orange-500" : "text-blue-500"} 
                            />
                          </svg>
                          <span className="absolute text-xs font-bold">{email.analysis.score}</span>
                        </div>
                      </div>
                    </div>

                    {/* What happens if I ignore it? */}
                    {email.analysis.consequence && (
                      <div className="bg-destructive/10 border border-destructive/20 rounded p-3">
                        <p className="text-xs font-bold text-destructive uppercase tracking-wide mb-1">If Ignored:</p>
                        <p className="text-sm font-medium text-destructive/90 leading-snug">
                          {email.analysis.consequence}
                        </p>
                      </div>
                    )}

                    {/* What do I need to do? */}
                    {(email.analysis.actionSummary || email.analysis.suggestedNextStep) && (
                      <div className="bg-orange-500/10 border border-orange-500/20 rounded p-3">
                        <p className="text-xs font-bold text-orange-500 uppercase tracking-wide mb-1">Action Required:</p>
                        <p className="text-sm font-medium text-orange-500/90 leading-snug">
                          {email.analysis.actionSummary || email.analysis.suggestedNextStep}
                        </p>
                      </div>
                    )}

                    {/* By When? */}
                    {email.analysis.reminderSuggested && (
                      <div className="flex items-start gap-2 bg-blue-500/10 border border-blue-500/20 rounded p-3">
                        <Clock className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-blue-500 uppercase tracking-wide mb-1">Timing:</p>
                          <p className="text-sm font-medium text-blue-500/90 leading-snug">
                            {email.analysis.reminderReason} ({email.analysis.reminderWindow})
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Explanation */}
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">Context:</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {email.analysis.explanation}
                      </p>
                    </div>

                    {email.analysis.requiresHumanReview && (
                      <div className="flex items-center gap-2 text-xs text-orange-500 font-medium">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        AI confidence low ({email.analysis.confidence}%). Human review suggested.
                      </div>
                    )}

                    {/* AI Learning Insights (Applied Rules) */}
                    {(email.analysis.appliedRules as string[])?.length > 0 && (
                      <div className="border-t border-border pt-4 mt-2">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="w-4 h-4 text-purple-500" />
                          <h4 className="text-xs font-bold text-purple-500 uppercase tracking-wide">AI Learning Insights</h4>
                        </div>
                        <div className="space-y-1">
                          {(email.analysis.appliedRules as string[]).map((ruleId, idx) => (
                            <div key={idx} className="text-xs text-muted-foreground flex items-center gap-1.5">
                              <AlertCircle className="w-3 h-3 opacity-50" />
                              Rule applied: {ruleId}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Email Content */}
              <div>
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Message Body</h3>
                <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-secondary">
                  <div className="whitespace-pre-wrap font-mono text-xs p-4 bg-secondary/30 rounded-lg border border-border overflow-x-auto">
                    {email.plainText || "No plaintext body available."}
                  </div>
                </div>
              </div>

            </div>
          </ScrollArea>
          
          {/* Footer Actions (Feedback & Train AI) */}
          <footer className="p-4 border-t border-border bg-background flex flex-col gap-3 shrink-0">
            <div className="flex items-center justify-between text-xs text-muted-foreground font-medium mb-1 px-1">
              <span>Train AI</span>
            </div>
            <div className="flex gap-2">
              <button title="Spot On" className="flex-1 bg-secondary/50 text-foreground hover:bg-secondary border border-border px-3 py-2 rounded-md text-xs font-medium transition-colors flex items-center justify-center gap-1.5">
                <ThumbsUp className="w-3.5 h-3.5 text-green-500" /> Correct
              </button>
              <button title="Missed the mark" className="flex-1 bg-secondary/50 text-foreground hover:bg-secondary border border-border px-3 py-2 rounded-md text-xs font-medium transition-colors flex items-center justify-center gap-1.5">
                <ThumbsDown className="w-3.5 h-3.5 text-orange-500" /> Wrong
              </button>
              <button title="Always Notify" className="flex-1 bg-secondary/50 text-foreground hover:bg-secondary border border-border px-3 py-2 rounded-md text-xs font-medium transition-colors flex items-center justify-center gap-1.5">
                <BellRing className="w-3.5 h-3.5 text-blue-500" /> Always
              </button>
              <button title="Ignore Sender" className="flex-1 bg-secondary/50 text-foreground hover:bg-secondary border border-border px-3 py-2 rounded-md text-xs font-medium transition-colors flex items-center justify-center gap-1.5">
                <BellOff className="w-3.5 h-3.5 text-destructive" /> Ignore
              </button>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <button 
                onClick={onMarkReviewed}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" /> Mark Reviewed
              </button>
              <button className="px-4 py-2 bg-secondary text-foreground hover:bg-secondary/80 rounded-md text-sm font-medium transition-colors">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          </footer>
        </>
      )}
    </aside>
  );
}

// Helpers
function extractName(header: string) {
  if (!header) return "Unknown";
  const match = header.match(/^"?([^"<]+)"?\s*</);
  if (match) return match[1].trim();
  return header.replace(/<.*>/, "").trim() || header;
}

function extractEmailAddress(header: string) {
  if (!header) return "";
  const match = header.match(/<([^>]+)>/);
  if (match) return match[1];
  return header;
}
