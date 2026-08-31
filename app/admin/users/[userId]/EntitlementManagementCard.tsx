"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { adminGrantEntitlement, adminRevokeEntitlement } from "@/server/actions/admin-entitlement.actions";
import { EntitlementType, EntitlementValue } from "@/server/services/entitlement.service";
import { Shield, Plus, Trash2, Clock } from "lucide-react";

export function EntitlementManagementCard({ userId, entitlements }: { userId: string, entitlements: any[] }) {
  const [loading, setLoading] = useState(false);
  const [grantType, setGrantType] = useState<EntitlementType>("PLAN");
  const [grantValue, setGrantValue] = useState<EntitlementValue>("PRO");
  const [grantDays, setGrantDays] = useState<number | undefined>(undefined);

  const handleGrant = async () => {
    setLoading(true);
    try {
      await adminGrantEntitlement(userId, grantType, grantValue, grantDays);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm("Are you sure you want to revoke this entitlement?")) return;
    setLoading(true);
    try {
      await adminRevokeEntitlement(id, userId, "Revoked manually by Admin");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-bold text-white flex items-center gap-2">
        <Shield className="w-5 h-5 text-amber-400" />
        Entitlements & Features
      </h2>
      <Card className="bg-[#0f0f0f] border-border/10">
        <CardHeader className="flex flex-row justify-between items-center pb-2">
          <CardTitle className="text-sm">Active Grants</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {entitlements.length === 0 ? (
            <div className="text-slate-500 text-sm">No recorded entitlements. Falling back to legacy plan fields.</div>
          ) : (
            <div className="flex flex-col gap-2">
              {entitlements.map(e => (
                <div key={e.id} className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-border/5">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-200">{e.type}: {e.value}</span>
                      <Badge variant="outline" className={e.status === "ACTIVE" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : "text-red-400 bg-red-500/10 border-red-500/20"}>
                        {e.status}
                      </Badge>
                    </div>
                    <span className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3" />
                      {e.expiresAt ? `Expires: ${new Date(e.expiresAt).toLocaleDateString()}` : "Lifetime"}
                      {" • "}Source: {e.source}
                    </span>
                  </div>
                  {e.status === "ACTIVE" && (
                    <button 
                      onClick={() => handleRevoke(e.id)} 
                      disabled={loading}
                      className="text-red-400 hover:text-red-300 p-2 rounded-md hover:bg-red-400/10 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-border/10 pt-4 mt-2 flex flex-col gap-3">
            <h4 className="text-sm font-semibold text-slate-300">Grant New Entitlement</h4>
            <div className="flex flex-wrap gap-2">
              <select 
                value={grantType} 
                onChange={e => setGrantType(e.target.value as any)}
                className="bg-black border border-border/20 rounded-md p-2 text-sm text-slate-200"
              >
                <option value="PLAN">PLAN</option>
                <option value="FEATURE">FEATURE</option>
              </select>
              <input 
                type="text" 
                value={grantValue}
                onChange={e => setGrantValue(e.target.value)}
                placeholder="PRO, BYOK_ADDON"
                className="bg-black border border-border/20 rounded-md p-2 text-sm text-slate-200 flex-1 min-w-[120px]"
              />
              <input 
                type="number" 
                placeholder="Days valid (blank = lifetime)"
                value={grantDays || ""}
                onChange={e => setGrantDays(e.target.value ? parseInt(e.target.value) : undefined)}
                className="bg-black border border-border/20 rounded-md p-2 text-sm text-slate-200 flex-1 min-w-[150px]"
              />
              <button 
                onClick={handleGrant}
                disabled={loading}
                className="flex items-center gap-1 bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-2 rounded-md text-sm transition-colors font-medium disabled:opacity-50"
              >
                <Plus className="w-4 h-4" /> Grant
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
