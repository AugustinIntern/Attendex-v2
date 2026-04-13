"use client";

import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { RefreshCw, CheckCircle2, AlertCircle, Info } from "lucide-react";

export default function SettingsPage() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      setSyncResult(null);

      const response = await fetch("/api/employees/sync", {
        method: "POST",
      });

      const data = await response.json();
      setSyncResult({
        success: data.success,
        message: data.success 
          ? data.message 
          : (data.error || "Failed to sync with Zoho People"),
        details: data.details
      });
    } catch (error) {
      setSyncResult({
        success: false,
        message: "An unexpected error occurred during sync."
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-12 pb-12">
        {/* Page Header */}
        <div className="relative">
          <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-1 h-12 bg-blue-600 rounded-full hidden md:block" />
          <h1 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight">
            Update Options
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2 text-lg font-medium">
            Manage your organization&apos;s data pipelines and system integrations.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Integration Section */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden group">
              <div className="p-10 border-b border-zinc-100 dark:border-zinc-800/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-zinc-900 dark:bg-white flex items-center justify-center shadow-xl shadow-zinc-200 dark:shadow-none">
                    <RefreshCw className="text-white dark:text-zinc-900" size={32} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                      Zoho People Sync
                    </h2>
                    <p className="text-zinc-500 dark:text-zinc-400 font-medium">
                      Automated Employee Lifecycle Management
                    </p>
                  </div>
                </div>
                
                {!isSyncing && !syncResult && (
                  <span className="px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-widest border border-blue-100 dark:border-blue-800">
                    Ready to Sync
                  </span>
                )}
              </div>

              <div className="p-10 space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                       <Info size={14} className="text-blue-500" />
                       Synchronization Logic
                    </h3>
                    <ul className="space-y-4">
                      {[
                        { title: "Emp ID Matching", desc: "Correlates Zoho records with local user profiles using EmployeeID." },
                        { title: "Metadata Updates", desc: "Automatically synchronizes full names and organizational emails." },
                        { title: "Smart Insertion", desc: "Detects new hires in Zoho and initializes their local mapping." }
                      ].map((item, i) => (
                        <li key={i} className="flex gap-4">
                          <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 shrink-0" />
                          <div>
                            <p className="text-zinc-900 dark:text-white font-bold text-sm">{item.title}</p>
                            <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-0.5">{item.desc}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-3xl p-6 border border-zinc-100 dark:border-zinc-800">
                    <h3 className="text-sm font-black text-zinc-400 uppercase tracking-widest mb-4">
                       Active Sync Status
                    </h3>
                    {syncResult ? (
                      <div className={`space-y-3 ${syncResult.success ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                        <div className="flex items-center gap-3">
                          {syncResult.success ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                          <p className="font-bold">{syncResult.success ? "Last Sync Successful" : "Sync Failed"}</p>
                        </div>
                        <p className="text-sm opacity-80 leading-relaxed font-medium">
                          {syncResult.message}
                        </p>
                        {syncResult.details && (
                           <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
                            <p className="text-xs uppercase font-black tracking-widest text-zinc-400">Processed Records</p>
                            <p className="text-2xl font-black text-zinc-900 dark:text-white mt-1">{syncResult.details.total}</p>
                           </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full py-6 text-zinc-400 italic text-sm text-center">
                        <RefreshCw size={32} className="mb-3 opacity-20" />
                        <p>No synchronization has been <br /> performed in this session.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleSync}
                    disabled={isSyncing}
                    className={`group w-full relative overflow-hidden flex items-center justify-center gap-4 px-8 py-5 rounded-2xl font-black text-lg transition-all ${
                      isSyncing
                        ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed"
                        : "bg-blue-600 text-white shadow-2xl shadow-blue-500/30 hover:bg-blue-700 hover:-translate-y-1 active:translate-y-0"
                    }`}
                  >
                    <RefreshCw className={`${isSyncing ? "animate-spin" : "group-hover:rotate-180"} transition-transform duration-500`} size={24} />
                    {isSyncing ? "Establishing Connection..." : "Initiate Full Database Sync"}
                  </button>
                  <p className="text-center text-xs text-zinc-400 dark:text-zinc-500 mt-4 font-medium italic">
                    All local changes will be preserved. Only name, email, and missing records are updated.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Modules */}
          <div className="space-y-8">
            <div className="bg-zinc-900 dark:bg-white rounded-[2rem] p-8 text-white dark:text-zinc-900 shadow-xl overflow-hidden relative">
              <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl" />
              <h3 className="text-lg font-black tracking-tight mb-2">Quick Stats</h3>
              <div className="space-y-6 mt-8">
                <div>
                   <p className="text-zinc-400 dark:text-zinc-500 text-xs font-bold uppercase tracking-widest">Connected Sources</p>
                   <p className="text-2xl font-black mt-1">1 Integration</p>
                </div>
                <div>
                   <p className="text-zinc-400 dark:text-zinc-500 text-xs font-bold uppercase tracking-widest">Update Frequency</p>
                   <p className="text-2xl font-black mt-1">Manual Trigger</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </AppLayout>
  );
}
