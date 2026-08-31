"use client";

import { Settings, ExternalLink } from "lucide-react";

export function ConfigurationClient() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-indigo-400" />
          System Configuration
        </h2>
      </div>

      <div className="bg-[#0f0f0f] border border-border/10 rounded-2xl overflow-hidden p-6 text-sm">
        <p className="text-slate-400 mb-6">
          Global system configurations are currently managed via Environment Variables to guarantee atomic zero-downtime deployments. 
          To modify these settings, please update your infrastructure provider (e.g., Vercel) and trigger a redeploy.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="font-semibold text-white uppercase tracking-wider text-xs">Environment Flags</h3>
            
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between p-3 bg-black/40 rounded-xl border border-border/10">
                <div>
                  <div className="font-medium text-slate-200">NODE_ENV</div>
                  <div className="text-[10px] text-slate-500">Current execution environment</div>
                </div>
                <div className="font-mono text-xs text-emerald-400">production</div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-black/40 rounded-xl border border-border/10">
                <div>
                  <div className="font-medium text-slate-200">ENABLE_SIGNUPS</div>
                  <div className="text-[10px] text-slate-500">Allow new user registration</div>
                </div>
                <div className="font-mono text-xs text-emerald-400">true</div>
              </div>

              <div className="flex items-center justify-between p-3 bg-black/40 rounded-xl border border-border/10">
                <div>
                  <div className="font-medium text-slate-200">MAINTENANCE_MODE</div>
                  <div className="text-[10px] text-slate-500">Global traffic lock</div>
                </div>
                <div className="font-mono text-xs text-slate-400">false</div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-white uppercase tracking-wider text-xs">External Dashboards</h3>
            
            <div className="flex flex-col gap-3">
              <a href="https://dashboard.razorpay.com" target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 bg-black/40 hover:bg-white/5 rounded-xl border border-border/10 transition-colors group">
                <div className="font-medium text-slate-200">Razorpay Dashboard</div>
                <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-indigo-400" />
              </a>
              <a href="https://console.upstash.com" target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 bg-black/40 hover:bg-white/5 rounded-xl border border-border/10 transition-colors group">
                <div className="font-medium text-slate-200">Upstash Redis Console</div>
                <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-indigo-400" />
              </a>
              <a href="https://console.cloud.google.com" target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 bg-black/40 hover:bg-white/5 rounded-xl border border-border/10 transition-colors group">
                <div className="font-medium text-slate-200">GCP Console (Pub/Sub)</div>
                <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-indigo-400" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
