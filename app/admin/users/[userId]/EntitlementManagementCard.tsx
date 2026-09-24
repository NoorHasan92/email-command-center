"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { adminGrantEntitlement, adminRevokeEntitlement } from "@/server/actions/admin-entitlement.actions";
import { EntitlementType } from "@/server/services/entitlement.service";
import { 
  Shield, 
  Plus, 
  Trash2, 
  Clock, 
  HelpCircle, 
  Crown, 
  Sparkles, 
  CheckCircle2, 
  Info,
  Calendar,
  Layers
} from "lucide-react";
import { toast } from "sonner";
import { AdminTooltip } from "@/components/ui/admin-tooltip";

interface EntitlementRecord {
  id: string;
  type: string;
  value: string;
  status: string;
  source: string;
  expiresAt?: Date | string | null;
  grantedAt?: Date | string;
  [key: string]: any;
}

const PLAN_OPTIONS = [
  { value: "ULTRA", label: "ULTRA — Chief of Staff (5,000 req/mo, Research, Intelligence)" },
  { value: "PRO", label: "PRO — Sentinel (2,000 req/mo, Multi-Inbox, Calendar)" },
  { value: "ADMIN", label: "ADMIN — Superadmin Tier (Unlimited Platform Quota)" },
  { value: "FREE", label: "FREE — Starter Tier (500 Platform Quota)" },
  { value: "__CUSTOM__", label: "Custom Plan Name..." },
];

const FEATURE_OPTIONS = [
  { value: "BYOK_ADDON", label: "BYOK_ADDON — Bring Your Own AI Key" },
  { value: "MULTI_INBOX", label: "MULTI_INBOX — Unlimited Gmail Account Linking" },
  { value: "PERSONAL_INTELLIGENCE", label: "PERSONAL_INTELLIGENCE — Executive Memory & Context" },
  { value: "DEEP_RESEARCH", label: "DEEP_RESEARCH — Autonomous Grounded Web Research" },
  { value: "VIP_ALERTS", label: "VIP_ALERTS — Priority Telegram & WhatsApp Alerts" },
  { value: "__CUSTOM__", label: "Custom Feature Flag..." },
];

const DURATION_PRESETS = [
  { label: "7 Days", days: 7 },
  { label: "30 Days", days: 30 },
  { label: "90 Days", days: 90 },
  { label: "1 Year", days: 365 },
  { label: "Lifetime (∞)", days: undefined },
];

export function EntitlementManagementCard({ userId, entitlements }: { userId: string, entitlements: EntitlementRecord[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [grantType, setGrantType] = useState<EntitlementType>("PLAN");
  const [selectedPresetValue, setSelectedPresetValue] = useState<string>("ULTRA");
  const [customValue, setCustomValue] = useState("");
  const [grantDays, setGrantDays] = useState<number | undefined>(undefined);
  const [showGuide, setShowGuide] = useState(false);

  const effectiveValue = selectedPresetValue === "__CUSTOM__" ? customValue.trim().toUpperCase() : selectedPresetValue;

  const handleTypeChange = (newType: EntitlementType) => {
    setGrantType(newType);
    if (newType === "PLAN") {
      setSelectedPresetValue("ULTRA");
    } else {
      setSelectedPresetValue("BYOK_ADDON");
    }
  };

  const handleGrant = async () => {
    if (!effectiveValue) {
      toast.error("Please specify a valid plan or feature value.");
      return;
    }

    if (grantDays !== undefined && (grantDays < 1 || isNaN(grantDays))) {
      toast.error("Validity period must be at least 1 day.");
      return;
    }

    setLoading(true);
    try {
      await adminGrantEntitlement(userId, grantType, effectiveValue, grantDays);
      toast.success(`Granted ${grantType}: ${effectiveValue} ${grantDays ? `for ${grantDays} days` : '(Lifetime)'}`);
      if (selectedPresetValue === "__CUSTOM__") setCustomValue("");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to grant entitlement");
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to revoke entitlement '${name}'? The user will immediately lose access.`)) return;
    setLoading(true);
    try {
      await adminRevokeEntitlement(id, userId, "Revoked manually by Admin in Console");
      toast.success(`Revoked entitlement: ${name}`);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to revoke entitlement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Shield className="w-5 h-5 text-amber-400" />
          Entitlements & Features
        </h2>
        <button
          type="button"
          onClick={() => setShowGuide(!showGuide)}
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors px-2 py-1 rounded bg-white/5 border border-white/10"
        >
          <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
          {showGuide ? "Hide Guide" : "What is this?"}
        </button>
      </div>

      {/* Guide explanation box */}
      {showGuide && (
        <div className="bg-black/60 border border-indigo-500/20 rounded-xl p-4 text-xs text-slate-300 space-y-2 animate-in fade-in">
          <div className="flex items-center gap-1.5 text-indigo-300 font-semibold text-sm">
            <Info className="w-4 h-4" />
            Entitlements Architecture Explained
          </div>
          <p className="leading-relaxed">
            <strong className="text-white">PLAN Entitlement:</strong> Overrides the user&apos;s base subscription tier (e.g. assigning <span className="font-mono text-purple-300">ULTRA</span> or <span className="font-mono text-indigo-300">PRO</span> for a friend or VIP). It determines monthly AI request allowances, quota limits, and system permissions.
          </p>
          <p className="leading-relaxed">
            <strong className="text-white">FEATURE Entitlement:</strong> Unlocks a standalone add-on or platform capability (e.g. <span className="font-mono text-emerald-300">BYOK_ADDON</span>, <span className="font-mono text-amber-300">MULTI_INBOX</span>, <span className="font-mono text-blue-300">PERSONAL_INTELLIGENCE</span>) independent of whether the user is on Free or Pro.
          </p>
          <p className="text-slate-400">
            Grants take immediate effect upon submission and can be given a duration (e.g. 30 days) or left blank for permanent Lifetime access.
          </p>
        </div>
      )}

      <Card className="bg-[#0f0f0f] border-border/10 shadow-xl">
        <CardHeader className="flex flex-row justify-between items-center pb-2 border-b border-white/5">
          <CardTitle className="text-sm font-semibold text-slate-300 flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-400" />
            Active Grants & Overrides
          </CardTitle>
          <span className="text-xs text-slate-500 font-mono">
            {entitlements.length} record{entitlements.length === 1 ? "" : "s"}
          </span>
        </CardHeader>
        <CardContent className="flex flex-col gap-5 pt-4">
          {entitlements.length === 0 ? (
            <div className="text-slate-500 text-sm py-4 text-center bg-black/20 rounded-xl border border-dashed border-border/10">
              No recorded custom entitlements. Account currently falls back to legacy plan database fields.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {entitlements.map(e => {
                const isPlan = e.type === "PLAN";
                const isActive = e.status === "ACTIVE";
                const isExpired = e.expiresAt && new Date(e.expiresAt).getTime() < Date.now();

                return (
                  <div key={e.id} className="flex justify-between items-center p-3.5 rounded-xl bg-white/[0.02] border border-border/10 hover:border-white/20 transition-all">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isPlan ? 'bg-purple-500/10 text-purple-400' : 'bg-amber-500/10 text-amber-400'}`}>
                        {isPlan ? <Crown className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm tracking-wide">
                            {e.type}: <span className="font-mono text-indigo-300">{e.value}</span>
                          </span>
                          <Badge variant="outline" className={
                            isActive && !isExpired
                              ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20 text-[10px]" 
                              : "text-red-400 bg-red-500/10 border-red-500/20 text-[10px]"
                          }>
                            {isExpired ? "EXPIRED" : e.status}
                          </Badge>
                        </div>
                        <span className="text-xs text-slate-400 flex items-center gap-1.5 mt-1 font-mono">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {e.expiresAt ? (
                            <span>
                              Expires: {new Date(e.expiresAt).toLocaleDateString()} ({Math.ceil((new Date(e.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))}d left)
                            </span>
                          ) : (
                            <span className="text-emerald-400 font-semibold">Lifetime (Permanent)</span>
                          )}
                          <span className="text-slate-600">•</span>
                          <span className="text-slate-500">Src: {e.source}</span>
                        </span>
                      </div>
                    </div>
                    {isActive && (
                      <AdminTooltip
                        title={
                          <span className="flex items-center gap-1.5 text-red-400">
                            <Trash2 className="w-3.5 h-3.5" />
                            Revoke Entitlement
                          </span>
                        }
                        content={`Immediately revokes '${e.type}: ${e.value}' and terminates this grant for the user.`}
                      >
                        <button 
                          onClick={() => handleRevoke(e.id, `${e.type}:${e.value}`)} 
                          disabled={loading}
                          className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-400/10 transition-colors disabled:opacity-50 flex items-center gap-1 text-xs cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="hidden sm:inline">Revoke</span>
                        </button>
                      </AdminTooltip>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Grant New Entitlement Panel */}
          <div className="border-t border-border/10 pt-4 flex flex-col gap-3.5 bg-black/30 p-4 rounded-xl">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-400" />
                Grant New Entitlement
              </h4>
              <span className="text-[11px] text-slate-400">Takes effect immediately</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              {/* Entitlement Type (PLAN vs FEATURE) */}
              <div className="md:col-span-3 flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                  Entitlement Type
                  <span className="text-slate-500 font-normal">({grantType === "PLAN" ? "Tier Override" : "Modular Addon"})</span>
                </label>
                <select 
                  value={grantType} 
                  onChange={e => handleTypeChange(e.target.value as EntitlementType)}
                  className="bg-black/60 border border-border/20 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                >
                  <option value="PLAN">PLAN (Subscription Tier)</option>
                  <option value="FEATURE">FEATURE (Platform Add-on)</option>
                </select>
              </div>

              {/* Value Dropdown */}
              <div className="md:col-span-5 flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                  Select {grantType}
                </label>
                <select 
                  value={selectedPresetValue}
                  onChange={e => setSelectedPresetValue(e.target.value)}
                  className="bg-black/60 border border-border/20 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                >
                  {(grantType === "PLAN" ? PLAN_OPTIONS : FEATURE_OPTIONS).map(opt => (
                    <option key={opt.value} value={opt.value} className="bg-[#111] text-white">
                      {opt.label}
                    </option>
                  ))}
                </select>

                {selectedPresetValue === "__CUSTOM__" && (
                  <input 
                    type="text" 
                    value={customValue}
                    onChange={e => setCustomValue(e.target.value)}
                    placeholder="e.g. VIP_PARTNER, BETA_TESTER"
                    className="mt-1 bg-black/60 border border-border/20 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-indigo-500 uppercase"
                  />
                )}
              </div>

              {/* Duration in Days (cannot go negative) */}
              <div className="md:col-span-2 flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                  Days Valid
                </label>
                <input 
                  type="number" 
                  min="1"
                  step="1"
                  placeholder="Blank = Lifetime"
                  value={grantDays !== undefined ? grantDays : ""}
                  onChange={e => {
                    const val = e.target.value;
                    if (!val) {
                      setGrantDays(undefined);
                    } else {
                      const parsed = parseInt(val, 10);
                      if (!isNaN(parsed)) {
                        setGrantDays(Math.max(1, parsed));
                      }
                    }
                  }}
                  className="bg-black/60 border border-border/20 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {/* Submit Button */}
              <div className="md:col-span-2">
                <button 
                  onClick={handleGrant}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-50 shadow-lg shadow-indigo-600/20"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {loading ? "Granting..." : "Grant"}
                </button>
              </div>
            </div>

            {/* Quick Duration Preset Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-slate-500 mr-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Quick Presets:
              </span>
              {DURATION_PRESETS.map((preset) => {
                const isSelected = grantDays === preset.days;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setGrantDays(preset.days)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                      isSelected
                        ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
                        : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5"
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
              <span className="text-[11px] text-slate-500 ml-auto font-mono">
                {grantDays ? `Valid for ${grantDays} days` : "Permanent Lifetime Access"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
