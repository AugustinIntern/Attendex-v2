"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import { getAllEmployees, getEmployeeName } from "@/lib/employees";
import { formatCompanyTime } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Calendar, CheckCircle2, XCircle, Clock } from "lucide-react";

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
}

export default function PastDayPage() {
  const [selectedDate, setSelectedDate] = useState("");
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [employeeCount, setEmployeeCount] = useState(0);
  const [employeeCodes, setEmployeeCodes] = useState<Map<number, string>>(new Map());

  useEffect(() => {
    // Load employee data on mount
    getAllEmployees().then((employees) => {
      setEmployeeCount(employees.length);
      // Build a userId -> emp_code map for display
      const codeMap = new Map<number, string>();
      employees.forEach((emp) => {
        getEmployeeName(emp.user_id).then((name) => {
          codeMap.set(emp.user_id, name);
          setEmployeeCodes(new Map(codeMap));
        });
      });
    });
  }, []);

  const formattedDateLabel = useMemo(() => {
    if (!selectedDate) return "No Selection";
    return new Date(`${selectedDate}T12:00:00`).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, [selectedDate]);

  const fetchLogs = useCallback(async () => {
    if (!selectedDate) return;

    try {
      setLoading(true);
      setError(null);

      const start = `${selectedDate}T00:00:00`;
      const end = `${selectedDate}T23:59:59.999`;

      const { data, error: fetchError } = await supabase
        .from("attendance_logs")
        .select("*")
        .gte("timestamp", start)
        .lte("timestamp", end)
        .order("timestamp", { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setLogs(data || []);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch attendance logs";
      setError(errorMessage);
      console.error("Error loading past attendance logs:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    setLogs([]);
    if (!selectedDate) return;
    fetchLogs();
  }, [fetchLogs, selectedDate]);

  const uniquePresentIds = new Set(
    logs.filter((log) => log.check_type === 1).map((log) => log.user_id)
  );
  const presentCount = uniquePresentIds.size;
  const absenceCount = employeeCount - presentCount;

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-foreground tracking-tight">
            Historical Data
          </h1>
          <p className="text-muted-foreground mt-2 font-medium">
            Analyze and review past attendance telemetry.
          </p>
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <button className="flex bg-muted/50 p-1.5 rounded-2xl border border-muted w-full md:w-auto items-center hover:bg-muted/70 transition-colors focus:outline-none cursor-pointer">
              <div className="flex items-center gap-3 px-4">
                <Calendar className="w-5 h-5 text-primary" />
                <div className="h-8 w-px bg-muted" />
              </div>
              <div className="flex items-center justify-between w-full md:w-[200px] h-12 px-2 shadow-none text-lg font-black text-left">
                {selectedDate ? format(new Date(`${selectedDate}T12:00:00`), "MMM dd, yyyy") : <span className="opacity-50">Select date...</span>}
              </div>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 rounded-3xl overflow-hidden border-muted shadow-2xl" align="end">
            <CalendarComponent
              mode="single"
              selected={selectedDate ? new Date(`${selectedDate}T12:00:00`) : undefined}
              onSelect={(date) => setSelectedDate(date ? format(date, "yyyy-MM-dd") : "")}
              disabled={(date) => date > new Date()}
              initialFocus
              className="bg-background text-foreground"
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="md:col-span-2 border-primary/10 shadow-xl shadow-primary/5 bg-primary/5 rounded-[2.5rem]">
           <CardContent className="p-10 flex flex-col justify-center h-full">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-primary/60 mb-2">Selected Timeframe</p>
              <h2 className="text-3xl font-black text-foreground">{formattedDateLabel}</h2>
              <p className="text-muted-foreground mt-4 font-medium italic">
                {selectedDate
                  ? `Extraction complete for ${new Date(`${selectedDate}T12:00:00`).toLocaleDateString()}`
                  : "Standby for date selection..."}
              </p>
           </CardContent>
        </Card>

        <div className="grid gap-6">
           <Card className="border-emerald-500/10 shadow-lg shadow-emerald-500/5">
              <CardContent className="p-6 flex items-center justify-between">
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Present</p>
                    <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{presentCount}</p>
                 </div>
                 <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                 </div>
              </CardContent>
           </Card>

           <Card className="border-destructive/10 shadow-lg shadow-destructive-500/5">
              <CardContent className="p-6 flex items-center justify-between">
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Absent</p>
                    <p className="text-3xl font-black text-destructive mt-1">{absenceCount}</p>
                 </div>
                 <div className="w-12 h-12 bg-destructive/10 rounded-xl flex items-center justify-center">
                    <XCircle className="w-6 h-6 text-destructive" />
                 </div>
              </CardContent>
           </Card>
        </div>
      </div>

      {error && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="p-6">
            <p className="text-destructive font-bold flex items-center gap-2">
              <XCircle className="w-5 h-5" />
              {error}
            </p>
          </CardContent>
        </Card>
      )}

      <Card className="rounded-[2.5rem] border-muted overflow-hidden">
        <CardHeader className="bg-muted/30 px-10 py-8 border-b border-muted">
           <CardTitle className="text-2xl font-black tracking-tight flex items-center gap-4">
              <div className="w-1.5 h-8 bg-primary rounded-full" />
              Archives Analysis
           </CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-10 space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-2xl" />
              ))}
            </div>
          ) : !selectedDate ? (
            <div className="p-20 text-center text-muted-foreground">
               <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                  <Calendar className="w-10 h-10 opacity-20" />
               </div>
              <p className="font-bold text-lg">System Standby</p>
              <p className="mt-1 opacity-70">Initialize a date selection to extract data from archives.</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="p-20 text-center text-muted-foreground">
               <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                  <Clock className="w-10 h-10 opacity-20" />
               </div>
              <p className="font-bold text-lg">Zero Records Found</p>
              <p className="mt-1 opacity-70">No telemetry data was logged for {new Date(`${selectedDate}T12:00:00`).toLocaleDateString()}.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="px-10 font-black h-16 uppercase text-xs tracking-[0.2em]">Employee Identity</TableHead>
                    <TableHead className="font-black uppercase text-xs tracking-[0.2em]">ID</TableHead>
                    <TableHead className="font-black uppercase text-xs tracking-[0.2em]">Time Detected</TableHead>
                    <TableHead className="px-10 font-black uppercase text-xs tracking-[0.2em] text-right">Event Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log, index) => (
                    <TableRow
                      key={log.idx || index}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <TableCell className="px-10 py-6 font-bold">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-xs">
                              {(employeeCodes.get(log.user_id) ?? "??").slice(0, 2).toUpperCase()}
                           </div>
                           {employeeCodes.get(log.user_id) ?? `System User ${log.user_id}`}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-muted-foreground text-sm">
                        {log.user_id}
                      </TableCell>
                      <TableCell className="text-muted-foreground font-semibold">
                        {formatCompanyTime(log.timestamp)}
                      </TableCell>
                      <TableCell className="px-10 text-right">
                        <Badge
                          variant={log.check_type === 1 ? "default" : "outline"}
                          className={`rounded-full px-4 py-1 font-bold ${
                            log.check_type === 1 
                              ? "bg-emerald-600 hover:bg-emerald-700" 
                              : "border-blue-500 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/10"
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
