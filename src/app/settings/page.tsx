"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { RefreshCw, CheckCircle2, AlertCircle, Database, ShieldCheck, Zap, HelpCircle, Activity, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";

const DAILY_LIMIT = 10000;

export default function SettingsPage() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);

  // API Usage State
  const [usage, setUsage] = useState<{ count: number; updated_at: string } | null>(null);
  const [loadingUsage, setLoadingUsage] = useState(true);

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        setLoadingUsage(true);
        const today = new Date().toISOString().split("T")[0];
        const { data, error } = await supabase
          .from("api_usage")
          .select("call_count, updated_at")
          .eq("date", today)
          .limit(1);

        if (error) {
          console.error("Error fetching API usage:", error);
          setUsage(null);
        } else if (data && data.length > 0) {
          setUsage({ count: data[0].call_count, updated_at: data[0].updated_at });
        } else {
          setUsage(null);
        }
      } catch (err) {
        console.error("API usage fetch error:", err);
      } finally {
        setLoadingUsage(false);
      }
    };

    fetchUsage();
    const interval = setInterval(fetchUsage, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      setSyncResult(null);

      // 1. Trigger the Zoho sync
      const response = await fetch("/api/employees/sync", { method: "POST" });
      const data = await response.json();

      setSyncResult({
        success: data.success,
        message: data.success ? data.message : (data.error || "Failed to sync with Zoho People"),
        details: data.details,
      });

      // 2. Increment api_usage call_count for today
      const today = new Date().toISOString().split("T")[0];
      const now = new Date().toISOString();

      const { data: existing } = await supabase
        .from("api_usage")
        .select("call_count")
        .eq("date", today)
        .limit(1);

      const currentCount = existing && existing.length > 0 ? existing[0].call_count : 0;

      await supabase
        .from("api_usage")
        .upsert(
          { date: today, call_count: currentCount + 1, updated_at: now },
          { onConflict: "date" }
        );

      // 3. Refresh the displayed usage
      setUsage({ count: currentCount + 1, updated_at: now });
    } catch {
      setSyncResult({ success: false, message: "An unexpected error occurred during sync." });
    } finally {
      setIsSyncing(false);
    }
  };

  const usageCount = usage?.count || 0;
  const usagePct = Math.min((usageCount / DAILY_LIMIT) * 100, 100);
  const usageColor =
    usagePct < 50 ? "bg-emerald-500" : usagePct < 85 ? "bg-amber-500" : "bg-destructive";
  const usageStatusColor =
    usagePct < 85 ? "text-emerald-500" : "text-destructive";

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-10">

        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-extrabold text-foreground tracking-tight">Settings</h1>
            <p className="text-muted-foreground mt-1 font-medium">
              Manage system configurations and integrations.
            </p>
          </div>
          <Badge variant="outline" className="h-9 px-5 rounded-xl border-primary/30 text-primary font-black text-[10px] tracking-widest bg-primary/5">
            ADMIN ACCESS
          </Badge>
        </div>

        {/* Zoho Integration Card — full width */}
        <Card className="rounded-[2.5rem] border-muted bg-background shadow-xl overflow-hidden">
          <CardHeader className="p-8 border-b border-muted bg-muted/5">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                <RefreshCw className="text-primary w-7 h-7" />
              </div>
              <div>
                <CardTitle className="text-2xl font-black tracking-tight">Zoho Integration</CardTitle>
                <CardDescription className="text-muted-foreground font-bold text-[10px] uppercase tracking-widest mt-0.5">
                  Employee Data Sync
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">

              {/* Validation Rules */}
              <div className="space-y-5">
                <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  Validation Rules
                </h3>
                <div className="space-y-4">
                  {[
                    { title: "ID Verification", desc: "Matching employee IDs." },
                    { title: "Data Accuracy", desc: "Checking for required information." },
                    { title: "Employee Import", desc: "Adding new employees to the system." },
                  ].map((item, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                      <div>
                        <p className="text-foreground font-bold text-sm">{item.title}</p>
                        <p className="text-muted-foreground text-xs leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sync Status */}
              <div className="bg-muted/20 rounded-2xl p-6 border border-muted">
                <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-5 flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  Sync Status
                </h3>
                {syncResult ? (
                  <div className={`space-y-3 ${syncResult.success ? "text-emerald-500" : "text-destructive"}`}>
                    <div className="flex items-center gap-2">
                      {syncResult.success ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                      <p className="font-black text-xs uppercase tracking-widest">
                        {syncResult.success ? "SYNC SUCCESSFUL" : "SYNC FAILED"}
                      </p>
                    </div>
                    <p className="text-xs font-medium leading-relaxed opacity-80">{syncResult.message}</p>
                    {syncResult.details && (
                      <div className="mt-4 pt-4 border-t border-muted">
                        <p className="text-[9px] uppercase font-black tracking-widest text-muted-foreground">Employees Loaded</p>
                        <p className="text-3xl font-black text-foreground mt-1">{syncResult.details.total}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground/40">
                    <Database className="w-10 h-10 mb-3 opacity-10" />
                    <p className="text-[10px] font-bold uppercase tracking-widest">Ready</p>
                    <p className="text-[9px] mt-1">Click Start Sync below</p>
                  </div>
                )}
              </div>

              {/* Sync Button + Rate Limit */}
              <div className="flex flex-col gap-4 justify-center">
                <Button
                  onClick={handleSync}
                  disabled={isSyncing}
                  className={`w-full h-14 rounded-2xl font-black text-sm tracking-widest transition-all ${
                    isSyncing
                      ? "bg-muted text-muted-foreground cursor-not-allowed"
                      : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
                  }`}
                >
                  <RefreshCw className={`w-5 h-5 mr-3 ${isSyncing ? "animate-spin" : ""} transition-transform duration-700`} />
                  {isSyncing ? "SYNCING..." : "START SYNC"}
                </Button>

                <p className="text-center text-[9px] font-bold text-muted-foreground italic tracking-wide uppercase opacity-50">
                  Data updates automatically
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bottom Row: API Usage + Add Employee Guide */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* API Usage Card */}
          <Card className="rounded-[2.5rem] border-muted bg-background shadow-xl overflow-hidden">
            <CardHeader className="p-8 border-b border-muted bg-muted/5">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Activity className="text-primary w-7 h-7" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-black tracking-tight">API Usage</CardTitle>
                  <CardDescription className="text-muted-foreground font-bold text-[10px] uppercase tracking-widest mt-0.5">
                    Zoho People Daily Credits
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-8">
              {loadingUsage ? (
                <div className="space-y-4 py-2">
                  <div className="h-10 w-1/2 bg-muted animate-pulse rounded-xl" />
                  <div className="h-3 w-full bg-muted animate-pulse rounded-full" />
                  <div className="h-3 w-2/3 bg-muted animate-pulse rounded-full" />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Credit counts */}
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-4xl font-black tracking-tighter text-foreground">
                        {usageCount.toLocaleString()}
                      </p>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">
                        / {DAILY_LIMIT.toLocaleString()} credits used today
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-black uppercase tracking-widest ${usageStatusColor}`}>
                        {usagePct >= 100 ? "At Limit" : usagePct >= 85 ? "Critical" : usagePct >= 50 ? "Moderate" : "Healthy"}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
                        {(100 - usagePct).toFixed(1)}% remaining
                      </p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-2">
                    <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${usageColor}`}
                        style={{ width: `${usagePct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                      <span>0</span>
                      <span>5,000</span>
                      <span>10,000</span>
                    </div>
                  </div>

                  {/* Last updated */}
                  {usage?.updated_at && (
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium border-t border-muted pt-4">
                      <Clock className="w-3 h-3 shrink-0" />
                      <span>Last updated: {new Date(usage.updated_at).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Add Employee Guide */}
          <Card className="rounded-[2.5rem] border-muted bg-background shadow-xl overflow-hidden">
            <CardHeader className="p-8 border-b border-muted bg-muted/5">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center shrink-0">
                  <HelpCircle className="text-amber-500 w-7 h-7" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-black tracking-tight">Add New Employee</CardTitle>
                  <CardDescription className="text-muted-foreground font-bold text-[10px] uppercase tracking-widest mt-0.5">
                    Step-by-Step Guide
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-8">
              <div className="space-y-6">
                {[
                  { step: "01", title: "Zoho Setup", desc: "Add them in Zoho People first with a correct Employee ID." },
                  { step: "02", title: "Sync App", desc: 'Click "Start Sync" above to import them automatically.' },
                  { step: "03", title: "Verify", desc: "Check the Active Employees list to confirm the record." },
                  { step: "04", title: "Biometrics", desc: "Get their Code & User ID from the profile to register the device." },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 relative group/step">
                    <div className="flex flex-col items-center shrink-0">
                      <div className="w-9 h-9 rounded-xl bg-muted border border-muted-foreground/10 flex items-center justify-center font-black text-xs text-muted-foreground group-hover/step:bg-primary group-hover/step:text-primary-foreground group-hover/step:border-primary transition-all duration-300">
                        {item.step}
                      </div>
                      {i < 3 && <div className="w-px flex-1 bg-muted-foreground/10 my-1.5 group-hover/step:bg-primary/30 transition-colors" />}
                    </div>
                    <div className="pb-1 pt-1">
                      <p className="text-sm font-black text-foreground">{item.title}</p>
                      <p className="text-xs text-muted-foreground font-medium leading-relaxed mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </AppLayout>
  );
}
