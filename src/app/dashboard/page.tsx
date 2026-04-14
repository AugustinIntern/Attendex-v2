"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getAllEmployees } from "@/lib/employees";
import { formatCompanyTime, formatCompanyDate, getCompanyLocalTime } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, XCircle, Clock } from "lucide-react";

interface AttendanceLog {
  idx: number;
  id: number;
  user_id: number;
  timestamp: string;
  device_ip: string;
  synced_to_zoho: boolean;
  synced_at: string;
  zoho_sync_error: string | null;
  check_type: number;
  synthetic: boolean;
  paired_with: string | null;
  user_mapping?: {
    name: string;
    emp_code: string;
  };
}

export default function DashboardPage() {
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [employeeCount, setEmployeeCount] = useState(0);

  const fetchAttendanceLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Load employee count for the total employees card
      const employees = await getAllEmployees();
      setEmployeeCount(employees.length);
      


      // Calculate today's date range
      const date = getCompanyLocalTime(new Date());
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const todayStart = `${year}-${month}-${day}T00:00:00`;
      const todayEnd = `${year}-${month}-${day}T23:59:59.999`;

      const { data, error: fetchError } = await supabase
        .from("attendance_logs")
        .select("*, user_mapping(name, emp_code)")
        .gte("timestamp", todayStart)
        .lte("timestamp", todayEnd)
        .order("timestamp", { ascending: false })
        .limit(1000);

      if (fetchError) {
        throw fetchError;
      }

      setLogs(data || []);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch attendance logs";
      setError(errorMessage);
      console.error("Error fetching attendance logs:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAttendanceLogs();
  }, [fetchAttendanceLogs]);

  const uniquePresentIds = new Set(
    logs.filter((log) => log.check_type === 1).map((log) => log.user_id)
  );
  const presentCount = uniquePresentIds.size;
  const absenceCount = employeeCount - presentCount;

  if (error) {
    return (
      <Card className="border-destructive/50 bg-destructive/10">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <XCircle className="h-5 w-5" />
            Error Loading Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive font-medium">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-extrabold text-foreground tracking-tight">
          Today&apos;s Statistics
        </h1>
        <p className="text-muted-foreground mt-2 font-medium flex items-center gap-2">
          <Clock className="h-4 w-4" />
          {formatCompanyDate(new Date(), true)}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="overflow-hidden border-emerald-500/20 shadow-lg shadow-emerald-500/5">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-bold uppercase tracking-wider">
                  Operational Presence
                </p>
                <div className="flex items-baseline gap-2 mt-3">
                   <p className="text-6xl font-black text-emerald-600 dark:text-emerald-400">
                    {presentCount}
                  </p>
                  <p className="text-muted-foreground font-medium">/ {employeeCount}</p>
                </div>
              </div>
              <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-[2rem] flex items-center justify-center rotate-3 group-hover:rotate-0 transition-transform">
                <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-destructive/20 shadow-lg shadow-destructive-500/5">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-bold uppercase tracking-wider">
                  Missing Personnel
                </p>
                <div className="flex items-baseline gap-2 mt-3">
                  <p className="text-6xl font-black text-destructive">
                    {absenceCount}
                  </p>
                  <p className="text-muted-foreground font-medium">absent</p>
                </div>
              </div>
              <div className="w-20 h-20 bg-destructive/10 rounded-[2.5rem] flex items-center justify-center -rotate-3 group-hover:rotate-0 transition-transform">
                <XCircle className="h-10 w-10 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Table */}
      <Card className="rounded-[2.5rem] border-muted overflow-hidden">
        <CardHeader className="bg-muted/30 px-8 py-6">
          <CardTitle className="text-xl font-black tracking-tight flex items-center gap-3">
             <div className="w-1.5 h-6 bg-primary rounded-full" />
             Live Attendance Feed
          </CardTitle>
        </CardHeader>

        <CardContent className="p-6">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center">
               <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-muted-foreground" />
               </div>
              <p className="text-muted-foreground font-medium">
                No attendance data received for today yet.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-3xl">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="font-black h-14">Employee</TableHead>
                    <TableHead className="font-black">ID</TableHead>
                    <TableHead className="font-black">Time</TableHead>
                    <TableHead className="font-black text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log, index) => (
                    <TableRow
                      key={log.idx || index}
                      className="hover:bg-muted/20 transition-colors group"
                    >
                      <TableCell className="font-bold py-5">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-xs">
                              {(log.user_mapping?.name || "??").slice(0, 2).toUpperCase()}
                           </div>
                           {log.user_mapping?.name || "???"}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-muted-foreground">
                        {log.user_mapping?.emp_code || log.user_id}
                      </TableCell>
                      <TableCell className="text-muted-foreground font-medium">
                        {formatCompanyTime(log.timestamp, true)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={log.check_type === 1 ? "default" : "secondary"}
                          className={`rounded-lg px-3 py-1 font-bold ${
                            log.check_type === 1 
                              ? "bg-emerald-600 hover:bg-emerald-700" 
                              : "bg-blue-600 hover:bg-blue-700 text-white"
                          }`}
                        >
                          {log.check_type === 1 ? "CHECK-IN" : "CHECK-OUT"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
