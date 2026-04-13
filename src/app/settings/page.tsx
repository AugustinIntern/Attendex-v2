"use client";

import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { RefreshCw, CheckCircle2, AlertCircle, Info, Database, ShieldCheck, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-5xl font-extrabold text-foreground tracking-tighter">
              Control Center
            </h1>
            <p className="text-muted-foreground mt-2 text-lg font-medium">
              Manage system protocols and neural database synchronization.
            </p>
          </div>
          <Badge variant="outline" className="h-10 px-6 rounded-xl border-primary/30 text-primary font-black text-[10px] tracking-widest bg-primary/5">SYSTEM_ADMIN_V2</Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main Integration Section */}
          <div className="lg:col-span-2 space-y-10">
            <Card className="rounded-[3rem] border-muted bg-background shadow-2xl overflow-hidden relative group">
               <div className="absolute top-0 right-0 p-10">
                  <Database className="w-12 h-12 text-muted-foreground opacity-10 group-hover:opacity-20 transition-opacity" />
               </div>
               
               <CardHeader className="p-10 border-b border-muted bg-muted/5">
                 <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-3xl bg-foreground dark:bg-white flex items-center justify-center shadow-2xl shadow-foreground/20 dark:shadow-none">
                       <RefreshCw className="text-background dark:text-foreground w-10 h-10" />
                    </div>
                    <div>
                       <CardTitle className="text-3xl font-black tracking-tight">Zoho Integrator</CardTitle>
                       <CardDescription className="text-muted-foreground font-bold text-sm mt-1 uppercase tracking-widest">REAL-TIME DATA RELAY</CardDescription>
                    </div>
                 </div>
               </CardHeader>

               <CardContent className="p-10 space-y-12">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                     <div className="space-y-6">
                        <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                           <ShieldCheck className="w-4 h-4 text-emerald-500" />
                           Security Protocols
                        </h3>
                        <div className="space-y-4">
                           {[
                             { title: "Emp ID Verification", desc: "Hash-based identity correlation." },
                             { title: "Metadta Integrity", desc: "Automated Field-Level validation." },
                             { title: "Atomic Insertion", desc: "New record isolation & onboarding." }
                           ].map((item, i) => (
                             <div key={i} className="flex gap-4">
                               <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                               <div>
                                 <p className="text-foreground font-black text-sm">{item.title}</p>
                                 <p className="text-muted-foreground text-[11px] font-medium leading-relaxed">{item.desc}</p>
                               </div>
                             </div>
                           ))}
                        </div>
                     </div>

                     <div className="bg-muted/20 rounded-[2rem] p-8 border border-muted group-hover:border-primary/20 transition-colors">
                        <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                           <Zap className="w-4 h-4 text-amber-500" />
                           Live Terminal
                        </h3>
                        
                        {syncResult ? (
                          <div className={`space-y-4 ${syncResult.success ? "text-emerald-500" : "text-destructive"}`}>
                            <div className="flex items-center gap-3">
                              {syncResult.success ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
                              <p className="font-black text-sm uppercase tracking-widest">{syncResult.success ? "OP_SUCCESSFUL" : "OP_FAILED"}</p>
                            </div>
                            <p className="text-xs font-bold leading-relaxed opacity-80">
                              {syncResult.message}
                            </p>
                            {syncResult.details && (
                               <div className="mt-6 pt-6 border-t border-muted">
                                <p className="text-[9px] uppercase font-black tracking-widest text-muted-foreground">Packets Received</p>
                                <p className="text-4xl font-black text-foreground mt-2">{syncResult.details.total}</p>
                               </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground/40 italic text-center">
                            <Database className="w-12 h-12 mb-4 opacity-10 group-hover:scale-110 transition-transform" />
                            <p className="text-[10px] font-bold uppercase tracking-widest">System Standby</p>
                            <p className="text-[9px] mt-1">Awaiting manual initiation</p>
                          </div>
                        )}
                     </div>
                  </div>

                  <div className="pt-4">
                     <Button
                       onClick={handleSync}
                       disabled={isSyncing}
                       className={`w-full h-20 rounded-2xl font-black text-lg tracking-widest group transition-all ${
                         isSyncing 
                           ? "bg-muted text-muted-foreground cursor-not-allowed" 
                           : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xl shadow-primary/30"
                       }`}
                     >
                       <RefreshCw className={`w-6 h-6 mr-4 ${isSyncing ? "animate-spin" : "group-hover:rotate-180"} transition-transform duration-700`} />
                       {isSyncing ? "ESTABLISHING RELAY..." : "EXECUTE MASTER SYNC"}
                     </Button>
                     <p className="text-center text-[10px] font-bold text-muted-foreground mt-6 italic tracking-wide uppercase opacity-50">
                        * NO LOCAL OVERWRITE DETECTED. DELTA_RECONCILIATION ONLY.
                     </p>
                  </div>
               </CardContent>
            </Card>
          </div>

          {/* Sidebar Area */}
          <div className="space-y-10">
             <Card className="bg-foreground dark:bg-white rounded-[2.5rem] p-10 text-background dark:text-foreground shadow-2xl shadow-primary/10 relative overflow-hidden group">
                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-primary/20 rounded-full blur-[80px] group-hover:scale-150 transition-transform duration-1000" />
                <h3 className="text-xl font-black tracking-tighter mb-10 flex items-center justify-between">
                   Quick Insight
                   <Info className="w-5 h-5 opacity-30" />
                </h3>
                
                <div className="space-y-8 relative">
                   <div>
                      <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Active Links</p>
                      <p className="text-2xl font-black mt-2">1 Secure Node</p>
                      <div className="h-1 w-12 bg-primary mt-3 rounded-full" />
                   </div>
                   <div>
                      <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Schedule</p>
                      <p className="text-2xl font-black mt-2">Demand-Only</p>
                      <div className="h-1 w-12 bg-primary mt-3 rounded-full" />
                   </div>
                </div>
             </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
