"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import AppLayout from "@/components/AppLayout";
import { getAllEmployees } from "@/lib/employees";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Search, Users, TrendingUp, AlertCircle } from "lucide-react";

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

export default function EmployeesPage() {
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

      const employeesResponse = await fetch("/api/employees");
      const employeesData = await employeesResponse.json();

      if (!employeesResponse.ok) {
        console.error("Error fetching employees:", employeesData.error);
        return;
      }

      const employeeList: Employee[] = (employeesData.employees || []).filter(
        (emp: Employee) => !emp.is_archived
      );
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
          employeeLogs.map((log) => new Date(log.timestamp).toDateString())
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

  const getAttendanceStatus = (rate: number) => {
    if (rate >= 90) return { label: "EXCELLENT", variant: "default" as const, color: "bg-emerald-600" };
    if (rate >= 75) return { label: "OPTIMAL", variant: "secondary" as const, color: "bg-blue-500" };
    if (rate >= 60) return { label: "WARNING", variant: "outline" as const, color: "text-amber-500 border-amber-500" };
    return { label: "CRITICAL", variant: "destructive" as const, color: "bg-destructive" };
  };

  return (
    <AppLayout>
      <div className="space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-extrabold text-foreground tracking-tight">
              Workforce Overview
            </h1>
            <p className="text-muted-foreground mt-2 font-medium">
              Real-time monitoring and administrative management of personnel.
            </p>
          </div>
          
          <div className="flex items-center gap-4">
              <Card className="bg-muted/30 border-none shadow-none px-6 py-2 flex items-center gap-4 rounded-2xl">
                <Users className="w-5 h-5 text-primary" />
                <div>
                   <p className="text-2xl font-black text-foreground leading-none">{employees.length}</p>
                   <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Personnel</p>
                </div>
             </Card>
          </div>
        </div>

        <div className="relative group max-w-2xl">
           <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
           <Input
            type="text"
            placeholder="Identity scan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-16 pl-14 pr-6 rounded-[1.25rem] bg-muted/30 border-muted focus:bg-background text-lg font-bold transition-all"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading ? (
            Array(6).fill(0).map((_, i) => (
              <Card key={i} className="rounded-[2.5rem] overflow-hidden">
                <CardHeader className="p-8 pb-0">
                  <div className="flex justify-between">
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                    <Skeleton className="w-14 h-14 rounded-2xl" />
                  </div>
                </CardHeader>
                <CardContent className="p-8">
                   <Skeleton className="h-20 w-full rounded-2xl" />
                </CardContent>
              </Card>
            ))
          ) : filteredEmployees.map((employee) => {
            const stats = employeeStats.find(s => s.user_id === employee.user_id);
            const status = stats ? getAttendanceStatus(stats.attendance_rate) : null;

            return (
              <Link
                key={employee.user_id}
                href={`/employees/${employee.user_id}`}
                className="group block"
              >
                <Card className="rounded-[2.5rem] border-muted bg-background hover:bg-muted/5 group-hover:border-primary/50 transition-all duration-500 overflow-hidden relative">
                   <div className="absolute top-0 right-0 p-8">
                      <TrendingUp className="w-5 h-5 text-muted-foreground opacity-20 group-hover:text-primary group-hover:opacity-100 transition-all" />
                   </div>
                   <CardHeader className="p-8 pb-4">
                      <div className="flex items-start justify-between">
                        <div className="max-w-[70%]">
                           <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">ID: {employee.user_id}</p>
                           <CardTitle className="text-xl font-black truncate leading-tight">
                              {employee.name || employee.emp_code}
                           </CardTitle>
                        </div>
                        <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:bg-primary group-hover:scale-110 transition-all duration-500">
                          <span className="text-primary font-black text-sm group-hover:text-primary-foreground">
                            {(employee.name || employee.emp_code || "??").slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                      </div>
                   </CardHeader>

                   <CardContent className="p-8 pt-0">
                     {stats ? (
                       <div className="space-y-6">
                         <div className="flex justify-between items-center bg-muted/30 p-3 rounded-xl">
                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-2">Reliability</span>
                            <Badge className={`rounded-lg font-black text-[10px] tracking-widest border-none ${status?.color} text-white`}>
                               {status?.label}
                            </Badge>
                         </div>

                         <div className="grid grid-cols-2 gap-4">
                            <div className="bg-muted/10 p-4 rounded-2xl text-center">
                               <p className="text-2xl font-black">{stats.present_days}</p>
                               <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Days Logs</p>
                            </div>
                            <div className="bg-muted/10 p-4 rounded-2xl text-center">
                               <p className="text-2xl font-black">{Math.round(stats.attendance_rate)}%</p>
                               <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Duty Sync</p>
                            </div>
                         </div>

                         <div className="relative pt-2">
                            <div className="w-full bg-muted/30 rounded-full h-1.5 overflow-hidden">
                               <div
                                 className="bg-primary h-full transition-all duration-1000 ease-out"
                                 style={{ width: `${Math.min(stats.attendance_rate, 100)}%` }}
                               />
                            </div>
                         </div>
                       </div>
                     ) : (
                       <div className="p-8 text-center bg-muted/10 rounded-[1.5rem] border border-dashed border-muted">
                          <AlertCircle className="w-6 h-6 text-muted-foreground/30 mx-auto mb-2" />
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Awaiting Logs</p>
                       </div>
                     )}
                   </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {filteredEmployees.length === 0 && !loading && (
          <div className="text-center py-20 bg-muted/10 rounded-[3rem] border-2 border-dashed border-muted">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
               <Search className="w-10 h-10 opacity-20" />
            </div>
            <h3 className="text-2xl font-black tracking-tight mb-2">
              Identity Mismatch
            </h3>
            <p className="text-muted-foreground font-medium">
              {searchTerm ? "No personnel records match these parameters." : "The workforce registry is currently offline."}
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
