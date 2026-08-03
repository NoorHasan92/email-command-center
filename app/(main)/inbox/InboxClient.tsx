"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { formatDistanceToNow, format } from "date-fns";
import { 
  Search, ShieldAlert, CheckCircle, Clock, Activity, 
  Check, Clock3, EyeOff, MoreHorizontal, X, Inbox
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

import { Email, EmailAnalysis } from "@prisma/client";
import { Lightbulb, Calendar, Sparkles, AlertCircle, ThumbsUp, ThumbsDown, BellRing, BellOff } from "lucide-react";
import { submitAIFeedbackAction } from "@/server/actions/training.actions";
import { markEmailReviewedAction, getInboxEmailsAction } from "@/server/actions/inbox.actions";
import { cleanEmailText } from "@/lib/utils";

export type EmailWithAnalysis = Email & {
  analysis: EmailAnalysis | null;
  emailAccount?: {
    provider: string;
    emailAddress: string;
  };
};

export default function InboxClient({ 
  initialEmails 
}: { 
  initialEmails: EmailWithAnalysis[];
}) {
  const [emails, setEmails] = useState(initialEmails);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedEmail, setSelectedEmail] = useState<EmailWithAnalysis | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [isPending, startTransition] = useTransition();
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialEmails.length >= 10);
  const [reviewedEmails, setReviewedEmails] = useState<Set<string>>(new Set());
  const [feedbackStates, setFeedbackStates] = useState<Record<string, string>>({});

  const handleMarkReviewed = useCallback((emailId: string) => {
    setReviewedEmails(prev => {
      const next = new Set(prev);
      next.add(emailId);
      return next;
    });
    startTransition(async () => {
      const result = await markEmailReviewedAction(emailId);
      if (result.error) toast.error(result.error);
    });
  }, []);

  const handleFeedback = async (feedbackType: "CORRECT" | "WRONG" | "ALWAYS_NOTIFY" | "NEVER_NOTIFY") => {
    if (!selectedEmail) return;

    let reason = undefined;
    if (feedbackType === "WRONG") {
      const userInput = prompt("Why was the AI wrong? What should the category/priority be?");
      if (userInput === null) return; // User cancelled
      reason = userInput;
    }
    
    // Optimistically update UI
    const emailId = selectedEmail.id;
    setFeedbackStates(prev => ({ ...prev, [emailId]: feedbackType }));

    startTransition(async () => {
      const result = await submitAIFeedbackAction(emailId, feedbackType, reason);
      if (result.error) {
        toast.error(result.error);
        setFeedbackStates(prev => {
          const next = { ...prev };
          delete next[emailId];
          return next;
        });
      } else {
        toast.success("AI Training Feedback submitted!");
      }
    });
  };

  const handleSnooze = useCallback((emailId: string) => {
    setEmails(prev => prev.filter(e => e.id !== emailId));
    if (selectedEmail?.id === emailId) {
      setSelectedEmail(null);
    }
  }, [selectedEmail]);

  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMore || emails.length === 0) return;
    setIsLoadingMore(true);
    const lastCursor = emails[emails.length - 1].id;
    const res = await getInboxEmailsAction(lastCursor, 10);
    if (res.success && res.data) {
      setEmails(prev => [...prev, ...(res.data as EmailWithAnalysis[])]);
      if (res.data.length < 10) {
        setHasMore(false);
      }
    } else {
      toast.error(res.error || "Failed to load more emails");
    }
    setIsLoadingMore(false);
  };

  // Filtered emails
  const filteredEmails = emails.filter(e => {
    const matchesSearch = (e.subject || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (e.from || "").toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (filterType === "critical") return e.analysis?.urgencyScore && e.analysis.urgencyScore >= 90;
    if (filterType === "action_req") return e.analysis?.requiresAction;
    if (filterType === "deadlines") return !!e.analysis?.deadline;
    return true;
  });

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
        if (selectedEmail) {
          setSelectedEmail(null); // Toggle close
        } else if (filteredEmails[selectedIndex]) {
          setSelectedEmail(filteredEmails[selectedIndex]); // Toggle open
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
  }, [selectedIndex, filteredEmails, selectedEmail, handleMarkReviewed, handleSnooze]);

  return (
    <div className="flex h-full w-full">
      
      {/* Main Column */}
      <div className={`flex-1 flex flex-col min-w-0 overflow-hidden transition-all duration-300 ${selectedEmail ? 'pr-[400px] xl:pr-[500px]' : ''}`}>
        
        {/* Top Header & Search */}
        <header className="h-14 border-b border-border flex items-center px-6 shrink-0 bg-background/95 backdrop-blur z-10 gap-4">
          <div className="relative flex-1 max-w-md flex items-center">
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
          <select 
            className="bg-background border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring text-foreground"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option className="bg-background text-foreground" value="all">All Emails</option>
            <option className="bg-background text-foreground" value="critical">Critical Priority</option>
            <option className="bg-background text-foreground" value="action_req">Action Required</option>
            <option className="bg-background text-foreground" value="deadlines">Has Deadlines</option>
          </select>
        </header>

        <ScrollArea className="flex-1 min-h-0">
          <div className="p-6 pb-20 max-w-6xl mx-auto space-y-8">
            
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
                        isReviewed={reviewedEmails.has(email.id) || email.status === 'NOTIFIED'}
                        onClick={() => {
                          setSelectedIndex(idx);
                          setSelectedEmail(email);
                        }}
                      />
                    ))}
                    {hasMore && !searchQuery && (
                      <div className="p-4 flex justify-center border-t border-border bg-secondary/10">
                        <button 
                          onClick={handleLoadMore} 
                          disabled={isLoadingMore}
                          className="text-sm font-medium text-muted-foreground hover:text-foreground px-4 py-2 bg-secondary rounded-md transition-colors"
                        >
                          {isLoadingMore ? "Loading..." : "Load More"}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>

          </div>
        </ScrollArea>
      </div>

      <EmailDetailPane 
        email={selectedEmail} 
        onClose={() => setSelectedEmail(null)} 
        onMarkReviewed={() => selectedEmail && handleMarkReviewed(selectedEmail.id)}
        onFeedback={handleFeedback}
        isPending={isPending}
        feedbackState={selectedEmail ? (feedbackStates[selectedEmail.id] || (selectedEmail.pipelineMetrics as any)?.userFeedback) : undefined}
        isReviewed={selectedEmail ? (reviewedEmails.has(selectedEmail.id) || selectedEmail.status === 'NOTIFIED') : false}
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

function EmailRow({ email, isSelected, isReviewed, onClick }: { email: EmailWithAnalysis, isSelected: boolean, isReviewed?: boolean, onClick: () => void }) {
  const analysis = email.analysis;
  const score = analysis?.urgencyScore || 0;
  
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
      } ${isReviewed ? "opacity-60" : ""}`}
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
          {isReviewed && (
            <Badge variant="outline" className="text-[10px] px-1.5 h-4 bg-green-500/10 text-green-500 border-green-500/20 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> Reviewed
            </Badge>
          )}
          {analysis?.requiresAction && !isReviewed && (
            <Badge variant="outline" className="text-[10px] px-1.5 h-4 bg-orange-500/10 text-orange-500 border-orange-500/20">Action Req</Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="truncate max-w-[200px]">{email.subject || "(No Subject)"}</span>
          <span className="shrink-0 text-xs opacity-50">&bull;</span>
          <span className="truncate text-xs opacity-75">
            {analysis?.requiresAction && (analysis?.actionItems as string[])?.length > 0 ? (
              <strong className="text-foreground">{(analysis.actionItems as string[])[0]}</strong>
            ) : (
              analysis?.summary || (email.status === 'SKIPPED' ? "Skipped (Not Important)" : email.status === 'AI_FAILED' ? "Analysis Failed" : "Analyzing...")
            )}
          </span>
        </div>
      </div>

      {/* Meta */}
      <div className="flex flex-col items-end shrink-0 gap-1.5">
        <span className="text-xs text-muted-foreground font-mono">
          {formatDistanceToNow(new Date(email.date), { addSuffix: true })}
        </span>
        
        {analysis?.estimatedReadingTime && (
          <span className="text-[10px] text-muted-foreground flex items-center gap-1 bg-secondary/50 px-1.5 py-0.5 rounded">
            <Clock3 className="w-3 h-3" /> {analysis.estimatedReadingTime}m
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

function EmailDetailPane({ 
  email, 
  onClose, 
  onMarkReviewed,
  onFeedback,
  isPending,
  feedbackState,
  isReviewed
}: { 
  email: EmailWithAnalysis | null;
  onClose: () => void;
  onMarkReviewed: () => void;
  onFeedback: (type: "CORRECT" | "WRONG" | "ALWAYS_NOTIFY" | "NEVER_NOTIFY") => void;
  isPending: boolean;
  feedbackState?: string;
  isReviewed?: boolean;
}) {
  return (
    <aside 
      className={`fixed inset-y-0 right-0 w-[400px] xl:w-[500px] bg-card border-l border-border shadow-2xl transition-transform duration-300 ease-in-out z-50 flex flex-col ${
        email ? "translate-x-0" : "translate-x-full"
      }`}
    >
      {email && (
        <>
          <header className="h-14 border-b border-border flex items-center justify-between px-4 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Thread Details</span>
            </div>
            <button 
              onClick={onClose} 
              title="Close panel (Esc)"
              className="p-1.5 bg-secondary/80 text-foreground hover:bg-destructive hover:text-destructive-foreground rounded-md transition-colors border border-border flex items-center gap-1.5 text-xs font-medium px-2"
            >
              <X className="w-3.5 h-3.5" /> Close
            </button>
          </header>

          <div className="flex-1 overflow-y-auto min-h-0">
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
                  <div className={`absolute top-0 left-0 w-1 h-full ${email.analysis.urgencyScore >= 90 ? 'bg-destructive' : email.analysis.urgencyScore >= 70 ? 'bg-orange-500' : 'bg-blue-500'}`} />
                  
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
                      
                      <div className="shrink-0 flex items-center gap-4">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Urgency</span>
                          <div className="relative flex items-center justify-center w-10 h-10" title={`Urgency Score: ${email.analysis.urgencyScore}`}>
                            <svg className="w-10 h-10 transform -rotate-90">
                              <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="3" fill="none" className="text-secondary" />
                              <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="3" fill="none" 
                                strokeDasharray={`${email.analysis.urgencyScore * 1.0} 100`} 
                                className={email.analysis.urgencyScore >= 90 ? "text-destructive" : email.analysis.urgencyScore >= 70 ? "text-orange-500" : "text-blue-500"} 
                              />
                            </svg>
                            <span className="absolute text-xs font-bold">{email.analysis.urgencyScore}</span>
                          </div>
                        </div>

                        <div className="flex flex-col items-center gap-1">
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Confidence</span>
                          <div className="relative flex items-center justify-center w-10 h-10" title={`Confidence: ${email.analysis.confidence}%`}>
                            <svg className="w-10 h-10 transform -rotate-90">
                              <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="3" fill="none" className="text-secondary" />
                              <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="3" fill="none" 
                                strokeDasharray={`${email.analysis.confidence * 1.0} 100`} 
                                className={email.analysis.confidence >= 80 ? "text-green-500" : email.analysis.confidence >= 50 ? "text-orange-500" : "text-destructive"} 
                              />
                            </svg>
                            <span className="absolute text-[10px] font-bold">{email.analysis.confidence}%</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Context / Reasoning */}
                    {email.analysis.reasoning && (
                      <div className="bg-secondary/20 border border-border rounded p-3">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">Reasoning:</p>
                        <p className="text-sm text-foreground/90 leading-snug">
                          {email.analysis.reasoning}
                        </p>
                      </div>
                    )}

                    {/* Action Items */}
                    {(email.analysis.actionItems as string[])?.length > 0 && (
                      <div className="bg-orange-500/10 border border-orange-500/20 rounded p-3">
                        <p className="text-xs font-bold text-orange-500 uppercase tracking-wide mb-1">Action Items:</p>
                        <ul className="text-sm font-medium text-orange-500/90 leading-snug list-disc pl-4 space-y-1">
                          {(email.analysis.actionItems as string[]).map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Entities */}
                    {(email.analysis.entities as string[])?.length > 0 && (
                      <div className="flex items-start gap-2 bg-blue-500/10 border border-blue-500/20 rounded p-3">
                        <Sparkles className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-blue-500 uppercase tracking-wide mb-1">Entities Detected:</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {(email.analysis.entities as string[]).map((entity, idx) => (
                              <Badge key={idx} variant="outline" className="text-[10px] bg-blue-500/10 text-blue-500 border-blue-500/20">{entity}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Explanation */}
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">Summary:</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {email.analysis.summary}
                      </p>
                    </div>

                    {email.analysis.confidence < 80 && (
                      <div className="flex items-center gap-2 text-xs text-orange-500 font-medium mt-2">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        AI confidence low ({email.analysis.confidence}%). Human review suggested.
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
                    {cleanEmailText(email.plainText) || "No plaintext body available."}
                  </div>
                </div>
              </div>

            </div>
          </div>
          
          {/* Footer Actions (Feedback & Train AI) */}
          <footer className="p-4 border-t border-border bg-background flex flex-col gap-3 shrink-0">
            <div className="flex items-center justify-between text-xs text-muted-foreground font-medium mb-1 px-1">
              <span>Train AI</span>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => onFeedback('CORRECT')} 
                disabled={isPending || feedbackState === 'CORRECT'} 
                title="Spot On" 
                className={`flex-1 ${feedbackState === 'CORRECT' ? 'bg-green-500/20 text-green-500 border-green-500/30' : 'bg-secondary/50 text-foreground hover:bg-secondary border-border'} border px-3 py-2 rounded-md text-xs font-medium transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50`}
              >
                <ThumbsUp className="w-3.5 h-3.5" /> Correct
              </button>
              <button 
                onClick={() => onFeedback('WRONG')} 
                disabled={isPending || feedbackState === 'WRONG'} 
                title="Missed the mark" 
                className={`flex-1 ${feedbackState === 'WRONG' ? 'bg-orange-500/20 text-orange-500 border-orange-500/30' : 'bg-secondary/50 text-foreground hover:bg-secondary border-border'} border px-3 py-2 rounded-md text-xs font-medium transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50`}
              >
                <ThumbsDown className="w-3.5 h-3.5" /> Wrong
              </button>
              <button 
                onClick={() => onFeedback('ALWAYS_NOTIFY')} 
                disabled={isPending || feedbackState === 'ALWAYS_NOTIFY'} 
                title="Always Notify" 
                className={`flex-1 ${feedbackState === 'ALWAYS_NOTIFY' ? 'bg-blue-500/20 text-blue-500 border-blue-500/30' : 'bg-secondary/50 text-foreground hover:bg-secondary border-border'} border px-3 py-2 rounded-md text-xs font-medium transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50`}
              >
                <BellRing className="w-3.5 h-3.5" /> Always
              </button>
              <button 
                onClick={() => onFeedback('NEVER_NOTIFY')} 
                disabled={isPending || feedbackState === 'NEVER_NOTIFY'} 
                title="Ignore Sender" 
                className={`flex-1 ${feedbackState === 'NEVER_NOTIFY' ? 'bg-destructive/20 text-destructive border-destructive/30' : 'bg-secondary/50 text-foreground hover:bg-secondary border-border'} border px-3 py-2 rounded-md text-xs font-medium transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50`}
              >
                <BellOff className="w-3.5 h-3.5" /> Ignore
              </button>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <button 
                onClick={onMarkReviewed}
                disabled={isReviewed}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  isReviewed 
                    ? "bg-secondary text-muted-foreground cursor-default" 
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                }`}
              >
                {isReviewed ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-500" /> Reviewed
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" /> Mark Reviewed
                  </>
                )}
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
