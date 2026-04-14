"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { RefreshCw, CheckCircle2, AlertCircle, Info, Database, ShieldCheck, Zap, HelpCircle, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const RATE_LIMIT_HOURS = 4;
const RATE_LIMIT_MS = RATE_LIMIT_HOURS * 60 * 60 * 1000;

export default function SettingsPage() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [nextSyncTime, setNextSyncTime] = useState<number | null>(null);
  const [isRateLimited, setIsRateLimited] = useState(false);

  useEffect(() => {
    const storedTime = localStorage.getItem("lastZohoSync");
    if (storedTime) {
      const time = parseInt(storedTime, 10);
      setLastSyncTime(time);
      if (Date.now() - time < RATE_LIMIT_MS) {
        setIsRateLimited(true);
        setNextSyncTime(time + RATE_LIMIT_MS);
      }
    }
  }, []);

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
      
      if (data.success) {
        const now = Date.now();
        localStorage.setItem("lastZohoSync", now.toString());
        setLastSyncTime(now);
        setIsRateLimited(true);
        setNextSyncTime(now + RATE_LIMIT_MS);
      }

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
              Settings
            </h1>
            <p className="text-muted-foreground mt-2 text-lg font-medium">
              Manage system configurations and employee data syncing.
            </p>
          </div>
          <Badge variant="outline" className="h-10 px-6 rounded-xl border-primary/30 text-primary font-black text-[10px] tracking-widest bg-primary/5">ADMIN ACCESS</Badge>
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
                    <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center shadow-xl group-hover:bg-primary transition-all duration-500">
                       <RefreshCw className="text-primary group-hover:text-primary-foreground w-10 h-10" />
                    </div>
                    <div>
                       <CardTitle className="text-3xl font-black tracking-tight">Zoho Integration</CardTitle>
                       <CardDescription className="text-muted-foreground font-bold text-sm mt-1 uppercase tracking-widest">DATA SYNC</CardDescription>
                    </div>
                 </div>
               </CardHeader>

               <CardContent className="p-10 space-y-12">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                     <div className="space-y-6">
                        <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                           <ShieldCheck className="w-4 h-4 text-emerald-500" />
                           Validation Rules
                        </h3>
                        <div className="space-y-4">
                           {[
                             { title: "ID Verification", desc: "Matching employee IDs." },
                             { title: "Data Accuracy", desc: "Checking for required information." },
                             { title: "Employee Import", desc: "Adding new employees to the system." }
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
                           Sync Status
                        </h3>
                        
                        {syncResult ? (
                          <div className={`space-y-4 ${syncResult.success ? "text-emerald-500" : "text-destructive"}`}>
                            <div className="flex items-center gap-3">
                              {syncResult.success ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
                              <p className="font-black text-sm uppercase tracking-widest">{syncResult.success ? "SYNC SUCCESSFUL" : "SYNC FAILED"}</p>
                            </div>
                            <p className="text-xs font-bold leading-relaxed opacity-80">
                              {syncResult.message}
                            </p>
                            {syncResult.details && (
                               <div className="mt-6 pt-6 border-t border-muted">
                                <p className="text-[9px] uppercase font-black tracking-widest text-muted-foreground">Employees Loaded</p>
                                <p className="text-4xl font-black text-foreground mt-2">{syncResult.details.total}</p>
                               </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground/40 italic text-center">
                            <Database className="w-12 h-12 mb-4 opacity-10 group-hover:scale-110 transition-transform" />
                            <p className="text-[10px] font-bold uppercase tracking-widest">Ready</p>
                            <p className="text-[9px] mt-1">Click button below to sync</p>
                          </div>
                        )}
                     </div>
                  </div>

                  <div className="pt-4">
                     <Button
                       onClick={handleSync}
                       disabled={isSyncing || isRateLimited}
                       className={`w-full h-20 rounded-2xl font-black text-lg tracking-widest group transition-all ${
                         isSyncing || isRateLimited
                           ? "bg-muted text-muted-foreground cursor-not-allowed" 
                           : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xl shadow-primary/30"
                       }`}
                     >
                       <RefreshCw className={`w-6 h-6 mr-4 ${isSyncing ? "animate-spin" : isRateLimited ? "" : "group-hover:rotate-180"} transition-transform duration-700`} />
                       {isSyncing ? "SYNCING..." : isRateLimited ? "SYNC UNAVAILABLE" : "START SYNC"}
                     </Button>
                     
                     {isRateLimited && lastSyncTime && nextSyncTime ? (
                        <p className="text-center text-[10px] font-bold text-amber-500 mt-6 tracking-wide uppercase">
                           * RATE LIMITED: Last synced at {new Date(lastSyncTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — Next sync available at {new Date(nextSyncTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                     ) : (
                        <p className="text-center text-[10px] font-bold text-muted-foreground mt-6 italic tracking-wide uppercase opacity-50">
                           * DATA IS UPDATED AUTOMATICALLY.
                        </p>
                     )}
                  </div>
               </CardContent>
            </Card>
          </div>

          {/* Sidebar Area */}
          <div className="space-y-10">
             <Card className="bg-background border-muted rounded-[2.5rem] overflow-hidden shadow-2xl shadow-primary/10 group">
                <CardHeader className="p-8 border-b border-muted bg-muted/5">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                         <HelpCircle className="text-amber-500 w-6 h-6" />
                      </div>
                      <div>
                         <CardTitle className="text-xl font-black tracking-tight leading-tight">Add New Employee</CardTitle>
                         <CardDescription className="text-muted-foreground font-black text-[9px] uppercase tracking-widest mt-0.5">Step-by-Step Guide</CardDescription>
                      </div>
                   </div>
                </CardHeader>
                <CardContent className="p-8">
                   <div className="space-y-8">
                      {[
                         {
                            step: "Step 1",
                            title: "Zoho Setup",
                            desc: "Add them in Zoho People first with a correct Employee ID."
                         },
                         {
                            step: "Step 2",
                            title: "Sync App",
                            desc: "Click \"Start Sync\" here to import them automatically."
                         },
                         {
                            step: "Step 3",
                            title: "Verify",
                            desc: "Check the Active Employees list to confirm the record."
                         },
                         {
                            step: "Step 4",
                            title: "Biometrics",
                            desc: "Get their Code & User ID from the profile to register the device."
                         }
                      ].map((item, i) => (
                         <div key={i} className="flex gap-5 relative group/step">
                            <div className="flex flex-col items-center shrink-0">
                               <div className="w-10 h-10 rounded-xl bg-muted border border-muted-foreground/10 flex items-center justify-center font-black text-[10px] text-muted-foreground group-hover/step:bg-primary group-hover/step:text-primary-foreground group-hover/step:border-primary transition-all duration-300">
                                  {i + 1}
                               </div>
                               {i < 3 && <div className="w-px h-full bg-muted-foreground/10 mt-3 group-hover/step:bg-primary/30 transition-colors" />}
                            </div>
                            <div className="pb-2">
                               <h4 className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mb-1">{item.step}</h4>
                               <h3 className="text-sm font-black text-foreground mb-1">{item.title}</h3>
                               <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">{item.desc}</p>
                            </div>
                         </div>
                      ))}
                   </div>
                </CardContent>
             </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
