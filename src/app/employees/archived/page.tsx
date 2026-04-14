"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { formatCompanyDate } from "@/lib/utils";
import { Search, Archive, AlertCircle, History } from "lucide-react";

interface Employee {
  user_id: number;
  emp_code: string;
  name?: string;
  email?: string;
  is_archived?: boolean;
}

interface EmployeeStats {
  user_id: number;
  total_days: number;
  present_days: number;
  attendance_rate: number;
}

export default function ArchivedEmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeStats, setEmployeeStats] = useState<EmployeeStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchEmployeeStats();
  }, []);

  const fetchEmployeeStats = async () => {
    try {
      setLoading(true);

      const employeesResponse = await fetch("/api/employees?archived=true");
      const employeesData = await employeesResponse.json();

      if (!employeesResponse.ok) {
        console.error("Error fetching employees:", employeesData.error);
        return;
      }

      const employeeList: Employee[] = employeesData.employees || [];
      setEmployees(employeeList);

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const { data: logs, error } = await supabase
        .from("attendance_logs")
        .select("user_id, timestamp")
        .gte("timestamp", startOfMonth.toISOString())
        .lte("timestamp", endOfMonth.toISOString());

      if (error) {
        console.error("Error fetching attendance logs:", error);
        return;
      }

      const stats: EmployeeStats[] = employeeList.map((employee: Employee) => {
        const userId = employee.user_id;
        const employeeLogs = (userId !== undefined && logs)
          ? logs.filter((log) => log.user_id === userId)
          : [];
        const uniqueDays = new Set(
          employeeLogs.map((log) => formatCompanyDate(log.timestamp))
        );
        const presentDays = uniqueDays.size;
        const totalDays = Math.min(now.getDate(), 31);
        const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

        return {
          user_id: employee.user_id,
          total_days: totalDays,
          present_days: presentDays,
          attendance_rate: Math.round(attendanceRate * 100) / 100,
        };
      });

      setEmployeeStats(stats);
    } catch (error) {
      console.error("Error fetching employee stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = useMemo(() => {
    return employees.filter((employee) => {
      const empCode = (employee.emp_code ?? "").toLowerCase();
      const name = (employee.name ?? "").toLowerCase();
      const searchLower = searchTerm.toLowerCase();
      return empCode.includes(searchLower) || name.includes(searchLower);
    });
  }, [employees, searchTerm]);

  const getStatusConfig = (rate: number) => {
    if (rate >= 90) return { label: "EXCELLENT", cls: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" };
    if (rate >= 75) return { label: "OPTIMAL", cls: "bg-blue-500/20 text-blue-400 border-blue-500/30" };
    if (rate >= 60) return { label: "WARNING", cls: "bg-amber-500/20 text-amber-400 border-amber-500/30" };
    return { label: "CRITICAL", cls: "bg-red-500/20 text-red-400 border-red-500/30" };
  };

  return (
    <AppLayout>
      <div className="space-y-10">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-5xl font-extrabold text-foreground tracking-tighter flex items-center gap-4">
              <Archive className="w-10 h-10 text-muted-foreground/40" />
              Archived Employees
            </h1>
            <p className="text-muted-foreground mt-2 font-medium">
              Records of former employees and past attendance data.
            </p>
          </div>

          <div className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-muted/20 border border-muted">
            <History className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-2xl font-black leading-none">{employees.length}</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Archived</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-2xl">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search archived records..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-14 pl-14 pr-6 rounded-2xl bg-muted/20 border-muted focus-visible:ring-primary text-base font-bold placeholder:text-muted-foreground/50"
          />
        </div>

        {/* Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            Array(6).fill(0).map((_, i) => (
              <Card key={i} className="rounded-3xl border-muted bg-muted/10 p-6 space-y-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="w-14 h-14 rounded-2xl flex-shrink-0" />
                  <div className="space-y-2 flex-1 min-w-0">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
                <Skeleton className="h-16 w-full rounded-2xl" />
              </Card>
            ))
          ) : filteredEmployees.map((employee) => {
            const stats = employeeStats.find(s => s.user_id === employee.user_id);
            const statusCfg = stats ? getStatusConfig(stats.attendance_rate) : null;
            const displayName = employee.name || employee.emp_code || "Unknown";
            const initials = displayName.slice(0, 2).toUpperCase();

            return (
              <Link
                key={employee.user_id}
                href={`/employees/${employee.user_id}`}
                className="group block"
              >
                <Card className="rounded-3xl border-muted bg-muted/10 hover:bg-muted/20 hover:border-muted-foreground/20 transition-all duration-300 overflow-hidden">
                  <CardContent className="p-6 space-y-5">

                    {/* Identity row */}
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="w-14 h-14 flex-shrink-0 rounded-2xl bg-muted border border-muted-foreground/10 flex items-center justify-center group-hover:border-muted-foreground/30 transition-colors">
                        <span className="text-muted-foreground font-black text-sm">{initials}</span>
                      </div>

                      {/* Name + meta */}
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-base text-foreground/70 group-hover:text-foreground truncate transition-colors">
                          {displayName}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                            ID #{employee.user_id}
                          </span>
                          <span className="text-muted-foreground/30">·</span>
                          <span className="text-[10px] font-bold font-mono text-muted-foreground">
                            {employee.emp_code}
                          </span>
                        </div>
                      </div>

                      {/* Deactivated badge */}
                      <Badge
                        variant="outline"
                        className="flex-shrink-0 text-[9px] font-black uppercase tracking-widest border-muted-foreground/20 text-muted-foreground/60 bg-muted/30 rounded-lg px-2 py-1"
                      >
                        OFF
                      </Badge>
                    </div>

                    {/* Stats */}
                    {stats ? (
                      <div className="space-y-3">
                        {/* Status + rate in one row */}
                        <div className="flex items-center justify-between bg-muted/30 rounded-xl px-4 py-2.5 border border-muted/50">
                          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                            Status
                          </span>
                          <Badge className={`text-[9px] font-black uppercase tracking-widest border rounded-lg px-3 py-1 shadow-none ${statusCfg?.cls}`}>
                            {statusCfg?.label}
                          </Badge>
                        </div>

                        {/* Metrics */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-muted/20 rounded-xl p-3 text-center border border-muted/30">
                            <p className="text-xl font-black text-foreground/60 group-hover:text-foreground transition-colors">
                              {stats.present_days}
                            </p>
                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                              Days Present
                            </p>
                          </div>
                          <div className="bg-muted/20 rounded-xl p-3 text-center border border-muted/30">
                            <p className="text-xl font-black text-foreground/60 group-hover:text-foreground transition-colors">
                              {Math.round(stats.attendance_rate)}%
                            </p>
                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                              Attendance
                            </p>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="w-full bg-muted/30 rounded-full h-1 overflow-hidden">
                          <div
                            className="bg-muted-foreground/30 group-hover:bg-primary h-full transition-all duration-700 ease-out"
                            style={{ width: `${Math.min(stats.attendance_rate, 100)}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-xl border border-dashed border-muted-foreground/10">
                        <AlertCircle className="w-4 h-4 text-muted-foreground/30 flex-shrink-0" />
                        <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">
                          No telemetry records
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Empty state */}
        {filteredEmployees.length === 0 && !loading && (
          <div className="text-center py-24 rounded-3xl border-2 border-dashed border-muted">
            <div className="w-20 h-20 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <Archive className="w-10 h-10 text-muted-foreground/20" />
            </div>
            <h3 className="text-2xl font-black tracking-tight mb-2">End of Line</h3>
            <p className="text-muted-foreground font-medium">
              No archived records match the current query.
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
