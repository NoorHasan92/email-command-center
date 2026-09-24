"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Check,
  X,
  Plus,
  Trash2,
  Brain,
  AlertCircle,
  Briefcase,
  Users,
  Target,
  MessageSquare,
  Compass,
  Loader2,
  Lock,
  FileText,
  Building2,
  Tag,
  RotateCcw,
  CheckCircle2,
  ExternalLink,
  Info,
} from "lucide-react";
import { toast } from "sonner";

interface ProfileItem {
  id: string;
  category: string;
  key: string;
  value: string;
  provenance: "USER_ENTERED" | "IMPORTED" | "AI_INFERRED" | "SYSTEM_DERIVED";
  status: "ACTIVE" | "PENDING_APPROVAL" | "REJECTED";
  confidence: number;
  sourceReference?: string | null;
  createdAt: string;
}

interface PersonalProfileData {
  id: string;
  summary?: string | null;
  primaryRole?: string | null;
  organization?: string | null;
  keyPriorities: string[];
  vipDomains: string[];
  items: ProfileItem[];
}

interface PersonalIntelligenceTabProps {
  user: any;
}

const CATEGORIES = [
  { id: "ROLE_GOALS", label: "Role & Objectives", icon: Briefcase, color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  { id: "KEY_RELATIONSHIPS", label: "VIP Relationships", icon: Users, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  { id: "PROJECTS_PRIORITIES", label: "Projects & Priorities", icon: Target, color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  { id: "COMMUNICATION_PREFERENCES", label: "Communication Rules", icon: MessageSquare, color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
  { id: "INTERESTS_DOMAINS", label: "Specialized Domains", icon: Compass, color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" },
];

export function PersonalIntelligenceTab({ user }: PersonalIntelligenceTabProps) {
  const isUltra = user?.plan === "ULTRA" || user?.plan === "ADMIN";

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<PersonalProfileData | null>(null);
  const [savingHeader, setSavingHeader] = useState(false);

  // Form states
  const [role, setRole] = useState("");
  const [org, setOrg] = useState("");
  const [summary, setSummary] = useState("");
  const [priorityInput, setPriorityInput] = useState("");
  const [priorities, setPriorities] = useState<string[]>([]);

  // Add Item Dialog State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemCategory, setNewItemCategory] = useState("PROJECTS_PRIORITIES");
  const [newItemKey, setNewItemKey] = useState("");
  const [newItemValue, setNewItemValue] = useState("");
  const [addingItem, setAddingItem] = useState(false);

  // Textarea auto-height ref for instant lag-free expansion
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const autoResizeTextarea = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.max(90, textareaRef.current.scrollHeight)}px`;
    }
  };

  useEffect(() => {
    autoResizeTextarea();
  }, [summary]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/settings/profile");
      const data = await res.json();
      if (data.success && data.profile) {
        setProfile(data.profile);
        setRole(data.profile.primaryRole || "");
        setOrg(data.profile.organization || "");

        // Consolidate single hard linebreaks so text fills the entire width naturally without awkward gaps
        const cleanSummary = (data.profile.summary || "")
          .replace(/([^\n])\n(?!\n)([^\n])/g, "$1 $2")
          .replace(/[ \t]+/g, " ")
          .trim();

        setSummary(cleanSummary);
        setPriorities(Array.isArray(data.profile.keyPriorities) ? data.profile.keyPriorities : []);
      }
    } catch (e: any) {
      toast.error("Failed to load personal intelligence profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Compute if there are unsaved edits
  const isDirty =
    role !== (profile?.primaryRole || "") ||
    org !== (profile?.organization || "") ||
    summary !== (profile?.summary || "") ||
    JSON.stringify(priorities) !== JSON.stringify(profile?.keyPriorities || []);

  const handleReset = () => {
    if (!profile) return;
    setRole(profile.primaryRole || "");
    setOrg(profile.organization || "");
    const cleanSummary = (profile.summary || "")
      .replace(/([^\n])\n(?!\n)([^\n])/g, "$1 $2")
      .replace(/[ \t]+/g, " ")
      .trim();
    setSummary(cleanSummary);
    setPriorities(Array.isArray(profile.keyPriorities) ? profile.keyPriorities : []);
    toast.info("Restored saved profile.");
  };

  const handleSaveHeader = async () => {
    try {
      setSavingHeader(true);
      const res = await fetch("/api/settings/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_header",
          data: {
            primaryRole: role,
            organization: org,
            summary,
            keyPriorities: priorities,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Intelligence profile updated successfully!");
        setProfile((prev) => ({
          ...data.profile,
          items: data.profile.items || prev?.items || [],
        }));
      } else {
        toast.error(data.error || "Failed to update profile.");
      }
    } catch (e: any) {
      toast.error("Error saving profile.");
    } finally {
      setSavingHeader(false);
    }
  };

  const handleAddItem = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newItemKey.trim() || !newItemValue.trim()) return;

    try {
      setAddingItem(true);
      const res = await fetch("/api/settings/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_item",
          item: {
            category: newItemCategory,
            key: newItemKey.trim(),
            value: newItemValue.trim(),
            provenance: "USER_ENTERED",
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Item added to your intelligence profile.");
        setNewItemKey("");
        setNewItemValue("");
        setShowAddModal(false);
        fetchProfile();
      } else {
        toast.error(data.error || "Failed to add item.");
      }
    } catch {
      toast.error("Error adding item.");
    } finally {
      setAddingItem(false);
    }
  };

  const handleApprove = async (itemId: string) => {
    try {
      const res = await fetch("/api/settings/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve_item", itemId }),
      });
      if (res.ok) {
        toast.success("Observation approved and added to active intelligence.");
        fetchProfile();
      }
    } catch {
      toast.error("Failed to approve item.");
    }
  };

  const handleReject = async (itemId: string) => {
    try {
      const res = await fetch("/api/settings/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject_item", itemId }),
      });
      if (res.ok) {
        toast.info("Observation rejected.");
        fetchProfile();
      }
    } catch {
      toast.error("Failed to reject item.");
    }
  };

  const handleDelete = async (itemId: string) => {
    try {
      const res = await fetch("/api/settings/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_item", itemId }),
      });
      if (res.ok) {
        toast.success("Item removed.");
        fetchProfile();
      }
    } catch {
      toast.error("Failed to delete item.");
    }
  };

  const addPriorityTag = () => {
    const val = priorityInput.trim();
    if (val && !priorities.includes(val)) {
      setPriorities([...priorities, val]);
      setPriorityInput("");
    }
  };

  const removePriorityTag = (tag: string) => {
    setPriorities(priorities.filter((t) => t !== tag));
  };

  const activeItems = profile?.items?.filter((it) => it.status === "ACTIVE") || [];
  const pendingItems = profile?.items?.filter((it) => it.status === "PENDING_APPROVAL") || [];

  return (
    <div className="space-y-8">
      {/* Entitlement Banner if not Ultra */}
      {!isUltra && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-3xl border border-purple-500/30 bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-purple-900/20 p-6 shadow-2xl backdrop-blur-xl overflow-hidden"
        >
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-400/50 to-transparent" />
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/30 p-3.5 text-purple-300 shadow-inner">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-bold text-foreground">Ultra Personal Intelligence</h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Pro / Ultra Tier
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 max-w-xl leading-relaxed">
                  Personalized inbox relevance scoring, VIP routing, and autonomous Deep Research inquiries require an active <strong>Ultra Plan</strong>. Configure your profile below; it will activate immediately upon upgrading.
                </p>
              </div>
            </div>
            <Link
              href="/billing"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-500/20 hover:shadow-purple-500/35 transition-all w-full sm:w-auto shrink-0 active:scale-95"
            >
              Upgrade to Ultra
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </motion.div>
      )}

      {/* Profile Header Configuration Card */}
      <div className="relative rounded-3xl border border-white/[0.08] dark:border-white/[0.08] bg-card/85 backdrop-blur-xl text-card-foreground shadow-[0_12px_40px_rgba(0,0,0,0.35)] overflow-hidden">
        {/* Card Header */}
        <div className="p-6 border-b border-border/40 bg-secondary/10 dark:bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-500/20 via-indigo-500/15 to-purple-500/5 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-inner shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
                  Executive Identity & Core Focus
                </h3>
                {isDirty ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/25 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    Unsaved Edits
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    In Sync
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Inbox Sentinel tailors its triage and research to your specific career, team, and current initiatives.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            {isDirty && (
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground bg-secondary/40 hover:bg-secondary/70 border border-white/5 transition-colors cursor-pointer"
                title="Discard unsaved changes"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
            <button
              onClick={handleSaveHeader}
              disabled={savingHeader || !isDirty}
              className={`relative group flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors shadow-md ${
                isDirty
                  ? "bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-500/25 hover:shadow-purple-500/40 cursor-pointer"
                  : "bg-secondary/40 text-muted-foreground border border-white/5 cursor-default opacity-80"
              } disabled:opacity-50`}
            >
              {savingHeader ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isDirty ? (
                <Check className="w-4 h-4 text-purple-200" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              )}
              <span>{savingHeader ? "Saving..." : isDirty ? "Save Changes" : "Saved"}</span>
            </button>
          </div>
        </div>

        {/* Card Form Body */}
        <div className="p-6 sm:p-7 space-y-6">
          {/* Row 1: Role & Organization */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Primary Role */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Briefcase className="w-3.5 h-3.5 text-purple-400" />
                  <span>Primary Role / Title</span>
                </label>
                <span className="text-[11px] text-muted-foreground/60 font-normal">e.g. Lead Engineer, CTO</span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Founder & CTO, VP of Engineering, Student"
                  className="w-full h-11 px-4 rounded-xl border border-white/[0.08] dark:border-white/[0.08] bg-secondary/15 dark:bg-white/[0.03] text-foreground text-sm placeholder:text-muted-foreground/40 hover:border-white/[0.18] hover:bg-secondary/25 dark:hover:bg-white/[0.05] focus:outline-none focus:border-purple-500/60 focus:ring-4 focus:ring-purple-500/10 transition-colors"
                />
              </div>
            </div>

            {/* Organization / Firm */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Organization / Firm</span>
                </label>
                <span className="text-[11px] text-muted-foreground/60 font-normal">Company or University</span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={org}
                  onChange={(e) => setOrg(e.target.value)}
                  placeholder="e.g. Acme Innovations, Stanford University"
                  className="w-full h-11 px-4 rounded-xl border border-white/[0.08] dark:border-white/[0.08] bg-secondary/15 dark:bg-white/[0.03] text-foreground text-sm placeholder:text-muted-foreground/40 hover:border-white/[0.18] hover:bg-secondary/25 dark:hover:bg-white/[0.05] focus:outline-none focus:border-indigo-500/60 focus:ring-4 focus:ring-indigo-500/10 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Row 2: Background Summary (Continuous width wrap & instant lag-free expansion) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <FileText className="w-3.5 h-3.5 text-pink-400" />
                <span>Background Summary</span>
              </label>
              <span className={`text-[11px] font-mono ${summary.length > 900 ? "text-amber-400" : "text-muted-foreground/60"}`}>
                {summary.length} / 1000
              </span>
            </div>
            <div className="relative w-full">
              <textarea
                ref={textareaRef}
                value={summary}
                maxLength={1000}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Brief summary of your responsibilities, key projects, and communication guidelines..."
                className="w-full p-4 rounded-xl border border-white/[0.08] dark:border-white/[0.08] bg-secondary/15 dark:bg-white/[0.03] text-foreground text-sm leading-relaxed placeholder:text-muted-foreground/40 hover:border-white/[0.18] hover:bg-secondary/25 dark:hover:bg-white/[0.05] focus:outline-none focus:border-pink-500/60 focus:ring-4 focus:ring-pink-500/10 transition-colors resize-y min-h-[90px] block"
              />
            </div>
          </div>

          {/* Row 3: Top Priorities & Initiatives */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Target className="w-3.5 h-3.5 text-amber-400" />
                <span>Top Priorities & Initiatives</span>
              </label>
              <span className="text-[11px] text-muted-foreground/60 font-normal">Press Enter to tag</span>
            </div>

            {/* Integrated Input Bar */}
            <div className="relative flex items-center">
              <input
                type="text"
                value={priorityInput}
                onChange={(e) => setPriorityInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addPriorityTag())}
                placeholder="Add priority tag (press Enter)..."
                className="w-full h-11 pl-4 pr-24 rounded-xl border border-white/[0.08] dark:border-white/[0.08] bg-secondary/15 dark:bg-white/[0.03] text-foreground text-sm placeholder:text-muted-foreground/40 hover:border-white/[0.18] hover:bg-secondary/25 dark:hover:bg-white/[0.05] focus:outline-none focus:border-amber-500/60 focus:ring-4 focus:ring-amber-500/10 transition-colors"
              />
              <button
                type="button"
                onClick={addPriorityTag}
                disabled={!priorityInput.trim()}
                className="absolute right-1.5 top-1.5 bottom-1.5 px-3.5 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 hover:text-amber-200 border border-amber-500/30 text-xs font-semibold transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              >
                Add
              </button>
            </div>

            {/* Priority Tags List */}
            <div className="flex flex-wrap gap-2 mt-3 min-h-[32px] items-center">
              <AnimatePresence>
                {priorities.map((p) => (
                  <motion.span
                    key={p}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    transition={{ duration: 0.15 }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-gradient-to-r from-purple-500/15 via-indigo-500/15 to-purple-500/15 text-purple-200 border border-purple-500/30 shadow-sm group hover:border-purple-400/60 transition-colors"
                  >
                    <Tag className="w-3 h-3 text-purple-400" />
                    <span>{p}</span>
                    <button
                      type="button"
                      onClick={() => removePriorityTag(p)}
                      className="ml-0.5 p-0.5 rounded-md text-purple-400/60 hover:text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer"
                      aria-label={`Remove priority ${p}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </motion.span>
                ))}
              </AnimatePresence>
              {priorities.length === 0 && (
                <span className="text-xs text-muted-foreground/50 italic flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5" />
                  No priorities set yet. Add tags above to prioritize matching email threads.
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Pending AI Inferred Observations (Review Gate) */}
      {pendingItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-950/20 via-amber-900/10 to-transparent backdrop-blur-xl p-6 shadow-2xl overflow-hidden"
        >
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="rounded-xl bg-amber-500/20 border border-amber-500/30 p-2.5 text-amber-400 shadow-inner shrink-0 mt-0.5 sm:mt-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-foreground flex flex-wrap items-center gap-2">
                  Pending AI Inferences
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    {pendingItems.length} require review
                  </span>
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  Extracted from patterns in incoming emails. You must approve them before they enter your active profile.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {pendingItems.map((item) => (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-4 rounded-2xl border border-border/50 dark:border-white/[0.08] bg-card/80 backdrop-blur hover:border-amber-500/30 transition-colors shadow-sm"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {item.category.replace(/_/g, " ")}
                    </span>
                    <span className="text-xs font-bold text-foreground truncate">{item.key}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate leading-relaxed">{item.value}</p>
                </div>
                <div className="flex items-center justify-end gap-2 shrink-0 self-end sm:self-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40 w-full sm:w-auto">
                  <button
                    onClick={() => handleApprove(item.id)}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 transition-colors shadow-sm cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button
                    onClick={() => handleReject(item.id)}
                    className="p-1.5 rounded-xl text-muted-foreground hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-colors cursor-pointer"
                    title="Reject Observation"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Active Profile Intelligence Items */}
      <div className="relative rounded-3xl border border-white/[0.08] dark:border-white/[0.08] bg-card/85 backdrop-blur-xl text-card-foreground shadow-[0_12px_40px_rgba(0,0,0,0.35)] overflow-hidden">
        {/* Card Header */}
        <div className="p-5 sm:p-6 border-b border-border/40 bg-secondary/10 dark:bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3 sm:gap-3.5 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-indigo-500/20 via-purple-500/15 to-indigo-500/5 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner shrink-0 mt-0.5 sm:mt-0">
              <Brain className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
                  Active Intelligence Attributes
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0">
                  {activeItems.length}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                Verified items currently shaping AI triage and personal relevance scoring.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/35 transition-all cursor-pointer w-full sm:w-auto shrink-0 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Attribute</span>
          </button>
        </div>

        {/* Card Content */}
        <div className="p-6 sm:p-7">
          {activeItems.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm border border-dashed border-border/60 dark:border-white/[0.08] rounded-2xl">
              No custom attributes configured yet. Click "Add Attribute" to customize your profile.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeItems.map((item) => {
                const catMeta = CATEGORIES.find((c) => c.id === item.category) || CATEGORIES[0];
                const CatIcon = catMeta.icon;

                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl border border-white/[0.08] dark:border-white/[0.08] bg-secondary/15 dark:bg-white/[0.025] hover:border-purple-500/40 hover:bg-secondary/25 dark:hover:bg-white/[0.04] transition-colors relative group shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-lg border ${catMeta.color}`}>
                        <CatIcon className="w-3 h-3" />
                        {catMeta.label}
                      </span>
                      <span className="text-[10px] uppercase font-semibold text-muted-foreground/60 tracking-wider">
                        {item.provenance === "USER_ENTERED" ? "User Defined" : "AI Inferred"}
                      </span>
                    </div>
                    <h5 className="text-xs font-bold text-foreground mb-1 tracking-tight">{item.key}</h5>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{item.value}</p>

                    <button
                      onClick={() => handleDelete(item.id)}
                      className="absolute top-3.5 right-3.5 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                      title="Delete attribute"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add Item Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-lg rounded-3xl border border-white/[0.12] bg-card/95 backdrop-blur-2xl p-6 sm:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.5)] space-y-5 overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-border/40 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
                    <Brain className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-foreground">Add Profile Attribute</h4>
                    <p className="text-xs text-muted-foreground">Teach AI your specific context and handling rules.</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddItem} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                    Category
                  </label>
                  <select
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-white/[0.08] bg-secondary/20 dark:bg-white/[0.03] text-foreground text-sm focus:outline-none focus:border-purple-500/60 focus:ring-4 focus:ring-purple-500/10 transition-colors"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id} className="bg-popover text-popover-foreground">
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                    Attribute Name (Key)
                  </label>
                  <input
                    type="text"
                    required
                    value={newItemKey}
                    onChange={(e) => setNewItemKey(e.target.value)}
                    placeholder="e.g. Current Focus, Mentorship Requests, Preferred Hours"
                    className="w-full h-11 px-4 rounded-xl border border-white/[0.08] bg-secondary/20 dark:bg-white/[0.03] text-foreground text-sm placeholder:text-muted-foreground/40 hover:border-white/[0.18] focus:outline-none focus:border-purple-500/60 focus:ring-4 focus:ring-purple-500/10 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                    Details & Instructions (Value)
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={newItemValue}
                    onChange={(e) => setNewItemValue(e.target.value)}
                    placeholder="Provide specific guidelines, scope, or handling instructions for the AI..."
                    className="w-full p-4 rounded-xl border border-white/[0.08] bg-secondary/20 dark:bg-white/[0.03] text-foreground text-sm placeholder:text-muted-foreground/40 hover:border-white/[0.18] focus:outline-none focus:border-purple-500/60 focus:ring-4 focus:ring-purple-500/10 transition-colors leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/40">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-muted-foreground hover:bg-secondary/40 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addingItem}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-500/20 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {addingItem ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    <span>Add Attribute</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
