"use client";

import { useState } from "react";
import { Filter, Plus, Zap, Trash2, Edit2, CheckCircle2, X, Loader2, ArrowRight, Smartphone, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createRuleAction, updateRuleAction, deleteRuleAction, toggleRuleAction } from "@/server/actions/rules.actions";
import { useRouter } from "next/navigation";
import { NotificationChannel } from "@prisma/client";
import { Badge } from "@/components/ui/badge";

export default function RulesClient({ initialRules }: { initialRules: any[] }) {
  const [rules, setRules] = useState(initialRules);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleOpenNew = () => {
    setEditingRule(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (rule: any) => {
    setEditingRule(rule);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);

    if (editingRule) {
      const res = await updateRuleAction(editingRule.id, formData);
      if (res.success) {
        setRules(rules.map(r => r.id === editingRule.id ? { ...r, minScoreThreshold: parseInt(formData.get("minScoreThreshold") as string), channel: formData.get("channel") } : r));
      }
    } else {
      const res = await createRuleAction(formData);
      if (res.success) {
        router.refresh();
      }
    }

    setLoading(false);
    setModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    setRules(rules.filter(r => r.id !== id));
    await deleteRuleAction(id);
    router.refresh();
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    setRules(rules.map(r => r.id === id ? { ...r, isActive: !currentStatus } : r));
    await toggleRuleAction(id, !currentStatus);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent overflow-auto p-4 md:p-6 lg:p-10 z-10 relative">
      <div className="max-w-5xl mx-auto w-full space-y-6 md:space-y-8 pb-24">
        <div className="flex items-center justify-between pb-6 border-b border-border/50">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Rules Engine</h1>
            <p className="text-muted-foreground">Visually construct AI routing logic for your alerts.</p>
          </div>
          <Button onClick={handleOpenNew} className="rounded-full shadow-sm">
            <Plus className="w-4 h-4 mr-2" /> New Rule
          </Button>
        </div>

        {rules.length === 0 ? (
          <div className="bg-card/80 backdrop-blur border border-border/50 rounded-3xl p-16 flex flex-col items-center justify-center text-center shadow-sm">
            <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mb-6 border border-primary/20 shadow-inner">
              <Filter className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-3 tracking-tight">Automate your workflow</h2>
            <p className="text-muted-foreground max-w-md mb-8 leading-relaxed">
              Create rules to automatically forward critical alerts to WhatsApp or Telegram based on the AI's consequence engine.
            </p>
            <Button className="rounded-full px-6" onClick={handleOpenNew}>
              Create First Rule
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            {rules.map(rule => (
              <div key={rule.id} className={`relative flex flex-col md:flex-row items-stretch md:items-center gap-4 md:gap-8 bg-card/80 backdrop-blur border rounded-2xl p-6 md:p-8 shadow-sm transition-all duration-300 hover:shadow-md ${rule.isActive ? 'border-primary/40 shadow-[0_0_15px_rgba(var(--color-primary),0.1)]' : 'border-border/50 opacity-80'}`}>
                
                {/* Trigger Node */}
                <div className="flex-1 flex flex-col p-5 bg-secondary/30 rounded-xl border border-border/50 relative group">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20">
                      <Zap className="w-4 h-4 text-yellow-500" />
                    </div>
                    <span className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Trigger</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold">Email Priority</span>
                    <Badge variant="outline" className="text-sm font-bold bg-background border-border shadow-sm px-2">
                      &ge; {rule.minScoreThreshold}
                    </Badge>
                  </div>
                </div>

                {/* Arrow Connector */}
                <div className="hidden md:flex shrink-0 items-center justify-center w-12 text-muted-foreground/50">
                  <ArrowRight className={`w-8 h-8 ${rule.isActive ? 'text-primary' : ''}`} />
                </div>
                <div className="flex md:hidden shrink-0 items-center justify-center h-8 text-muted-foreground/50">
                  <ArrowRight className={`w-6 h-6 rotate-90 ${rule.isActive ? 'text-primary' : ''}`} />
                </div>

                {/* Action Node */}
                <div className="flex-1 flex flex-col p-5 bg-primary/5 rounded-xl border border-primary/20 relative group">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 shadow-inner">
                      {rule.channel === "WHATSAPP" ? <MessageCircle className="w-4 h-4 text-primary" /> : <Smartphone className="w-4 h-4 text-primary" />}
                    </div>
                    <span className="font-semibold text-sm uppercase tracking-wider text-primary">Action</span>
                  </div>
                  <h3 className="text-lg font-bold">Forward to {rule.channel === "WHATSAPP" ? "WhatsApp" : "Telegram"}</h3>
                </div>

                {/* Controls (Absolute on md) */}
                <div className="absolute top-4 right-4 flex items-center gap-3 bg-card/90 backdrop-blur p-1.5 rounded-xl border border-border/50 shadow-sm">
                  <label className="relative inline-flex items-center cursor-pointer mr-2">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={rule.isActive}
                      onChange={() => handleToggle(rule.id, rule.isActive)}
                    />
                    <div className="w-9 h-5 bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                  <Button variant="ghost" size="icon" className="w-7 h-7 rounded-lg hover:bg-secondary" onClick={() => handleOpenEdit(rule)}>
                    <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                  </Button>
                  <Button variant="ghost" size="icon" className="w-7 h-7 rounded-lg hover:bg-destructive/20 hover:text-destructive" onClick={() => handleDelete(rule.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm transition-opacity">
          <div className="bg-card border border-border/50 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-6 border-b border-border/50 flex justify-between items-center bg-secondary/20">
              <h3 className="font-bold text-xl flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Filter className="w-4 h-4" />
                </div>
                {editingRule ? "Edit Routing Rule" : "New Routing Rule"}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-muted-foreground hover:bg-secondary p-1.5 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-8">
              
              <div className="space-y-6">
                <div className="p-5 border border-border/50 rounded-xl bg-secondary/20 space-y-4 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500" />
                  <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Condition</label>
                  <h4 className="font-semibold mb-2">If Urgency Score is &ge; <span id="scoreDisplay" className="text-yellow-500">{editingRule?.minScoreThreshold || 80}</span></h4>
                  <input
                    name="minScoreThreshold"
                    type="range"
                    min="1" max="100"
                    defaultValue={editingRule?.minScoreThreshold || 80}
                    className="w-full accent-yellow-500"
                    onChange={(e) => {
                      const valDisplay = document.getElementById("scoreDisplay");
                      if (valDisplay) valDisplay.innerText = e.target.value;
                    }}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground font-medium">
                    <span>1 (Low)</span>
                    <span>100 (Critical)</span>
                  </div>
                </div>

                <div className="p-5 border border-border/50 rounded-xl bg-primary/5 space-y-4 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                  <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Action</label>
                  <h4 className="font-semibold mb-2">Forward Notification to Channel</h4>
                  <div className="relative">
                    <select
                      name="channel"
                      defaultValue={editingRule?.channel || "WHATSAPP"}
                      className="w-full appearance-none bg-background border border-border/50 rounded-lg px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all text-foreground shadow-sm"
                    >
                      <option className="bg-background text-foreground" value="WHATSAPP">WhatsApp</option>
                      <option className="bg-background text-foreground" value="TELEGRAM">Telegram</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-muted-foreground">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-border/50">
                <Button type="button" variant="ghost" className="rounded-full" onClick={() => setModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={loading} className="rounded-full shadow-sm px-6">
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editingRule ? "Save Changes" : "Create Rule"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
