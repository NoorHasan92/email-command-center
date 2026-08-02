"use client";

import { useState } from "react";
import { Filter, Plus, Zap, Trash2, Edit2, CheckCircle2, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createRuleAction, updateRuleAction, deleteRuleAction, toggleRuleAction } from "@/server/actions/rules.actions";
import { useRouter } from "next/navigation";
import { NotificationChannel } from "@prisma/client";

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
        // Just refresh the page to get the new list with actual IDs
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
    <div className="flex-1 flex flex-col h-full bg-transparent overflow-auto p-6 lg:p-10 z-10 relative">
      <div className="max-w-4xl mx-auto w-full space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Rules Engine</h1>
            <p className="text-muted-foreground">Define custom actions based on AI analysis.</p>
          </div>
          <Button onClick={handleOpenNew}>
            <Plus className="w-4 h-4 mr-2" /> New Rule
          </Button>
        </div>

        {rules.length === 0 ? (
          <div className="bg-card/90 backdrop-blur border border-border rounded-xl p-12 flex flex-col items-center justify-center text-center shadow-sm">
            <div className="w-16 h-16 bg-secondary/50 rounded-2xl flex items-center justify-center mb-6 border border-border">
              <Filter className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-3">Automate your workflow</h2>
            <p className="text-muted-foreground max-w-md mb-8 leading-relaxed">
              Create rules to automatically forward critical alerts to WhatsApp based on the AI's consequence engine.
            </p>
            <Button variant="outline" className="mt-4" onClick={handleOpenNew}>
              Explore Templates
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {rules.map(rule => (
              <div key={rule.id} className="bg-card/90 backdrop-blur border border-border rounded-xl p-6 flex items-center justify-between shadow-sm transition-all hover:border-primary/30">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${rule.isActive ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'}`}>
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      Notify via {rule.channel}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      If email priority score is &ge; {rule.minScoreThreshold}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={rule.isActive} 
                      onChange={() => handleToggle(rule.id, rule.isActive)}
                    />
                    <div className="w-9 h-5 bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(rule)}>
                      <Edit2 className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(rule.id)}>
                      <Trash2 className="w-4 h-4 text-destructive hover:text-destructive/80" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-4 border-b border-border flex justify-between items-center">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Filter className="w-5 h-5 text-primary" /> 
                {editingRule ? "Edit Rule" : "New Rule"}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Condition: Minimum Priority Score</label>
                  <div className="flex items-center gap-4">
                    <input 
                      name="minScoreThreshold" 
                      type="range" 
                      min="1" max="100" 
                      defaultValue={editingRule?.minScoreThreshold || 80}
                      className="flex-1"
                      onChange={(e) => {
                        const valDisplay = document.getElementById("scoreDisplay");
                        if (valDisplay) valDisplay.innerText = e.target.value;
                      }}
                    />
                    <span id="scoreDisplay" className="font-mono text-sm w-8">{editingRule?.minScoreThreshold || 80}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">The AI assigns a score from 1-100 based on urgency.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Action: Notification Channel</label>
                  <select 
                    name="channel" 
                    defaultValue={editingRule?.channel || "WHATSAPP"}
                    className="w-full bg-secondary/50 border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="WHATSAPP">WhatsApp</option>
                    <option value="SLACK" disabled>Slack (Coming Soon)</option>
                    <option value="PUSH" disabled>Push Notification (Coming Soon)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={loading}>
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
