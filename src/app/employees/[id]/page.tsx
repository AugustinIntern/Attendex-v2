"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AppLayout from "@/components/AppLayout";
import EditEmployeeModal from "@/components/EditEmployeeModal";
import ArchiveEmployeeModal from "@/components/ArchiveEmployeeModal";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCompanyDate, formatCompanyTime } from "@/lib/utils";
import { ChevronLeft, Edit3, Trash2, Calendar, Fingerprint, Mail, Hash, ShieldAlert, CheckCircle2, TrendingUp, Clock, AlertCircle } from "lucide-react";

interface AttendanceLog {
  id: number;
  user_id: number;
  timestamp: string;
}

interface EmployeeDetails {
  emp_code: string;
  user_id: number;
  name: string;
  email: string;
  is_archived?: boolean;
  total_days: number;
  present_days: number;
  attendance_rate: number;
  recent_logs: AttendanceLog[];
}

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = parseInt(params.id as string);

  const [employee, setEmployee] = useState<EmployeeDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchEmployeeDetails();
    }
  }, [userId, selectedMonth, selectedYear]);

  const fetchEmployeeDetails = async () => {
    try {
      setLoading(true);

      const { data: mappingData, error: mappingError } = await supabase
        .from("user_mapping")
        .select("user_id, emp_code, name, email, is_archived")
        .eq("user_id", userId)
        .single();
      
      if (mappingError || !mappingData) {
        console.error("Employee not found:", mappingError);
        router.push("/employees");
        return;
      }

      const startOfMonth = new Date(selectedYear, selectedMonth, 1);
      const endOfMonth = new Date(selectedYear, selectedMonth + 1, 0);

      const { data: logs, error: logsError } = await supabase
        .from("attendance_logs")
        .select("*")
        .eq("user_id", userId)
        .gte("timestamp", startOfMonth.toISOString())
        .lte("timestamp", endOfMonth.toISOString())
        .order("timestamp", { ascending: false });

      if (logsError) {
        console.error("Error fetching attendance logs:", logsError);
        return;
      }

      const uniqueDays = new Set(
        logs?.map((log) => formatCompanyDate(log.timestamp)) || []
      );
      const presentDays = uniqueDays.size;
      const totalDays = new Date(selectedYear, selectedMonth + 1, 0).getDate();
      const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

      setEmployee({
        emp_code: mappingData.emp_code,
        name: mappingData.name || "N/A",
        email: mappingData.email || "N/A",
        user_id: userId,
        is_archived: mappingData.is_archived,
        total_days: totalDays,
        present_days: presentDays,
        attendance_rate: Math.round(attendanceRate * 100) / 100,
        recent_logs: logs || [],
      });
    } catch (error) {
      console.error("Error fetching employee details:", error);
    } finally {
      setLoading(false);
    }
  };

  const getAttendanceStatus = (rate: number) => {
    if (rate >= 90) return { label: "EXCELLENT", variant: "default" as const, color: "bg-emerald-600 shadow-emerald-500/20" };
    if (rate >= 75) return { label: "OPTIMAL", variant: "secondary" as const, color: "bg-blue-500 shadow-blue-500/20" };
    if (rate >= 60) return { label: "WARNING", variant: "outline" as const, color: "text-amber-500 border-amber-500 shadow-amber-500/10" };
    return { label: "CRITICAL", variant: "destructive" as const, color: "bg-destructive shadow-destructive-500/20" };
  };

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  const handleArchive = async () => {
    if (!employee) return;
    setIsArchiving(true);
    try {
      const response = await fetch(`/api/employees/${employee.user_id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || "Failed to archive");
      }

      setShowArchiveModal(false);
      router.push("/employees/archived");
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Error archiving employee");
      setIsArchiving(false);
    }
  };

  if (loading && !employee) {
    return (
      <AppLayout>
        <div className="space-y-10">
           <div className="flex items-center gap-6">
              <Skeleton className="w-14 h-14 rounded-2xl" />
              <div className="space-y-2">
                 <Skeleton className="h-8 w-64" />
                 <Skeleton className="h-4 w-32" />
              </div>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-32 rounded-[2rem]" />)}
           </div>
           <Skeleton className="h-96 rounded-[2.5rem]" />
        </div>
      </AppLayout>
    );
  }

  if (!employee) return null;

  const status = getAttendanceStatus(employee.attendance_rate);

  return (
    <AppLayout>
      <div className="space-y-10">
        {/* Navigation & Header Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <Button
              onClick={() => router.push("/employees")}
              variant="outline"
              size="icon"
              className="w-14 h-14 rounded-2xl border-muted bg-background hover:bg-muted/30 hover:border-primary transition-all shadow-sm"
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
            <div>
               <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Employees</p>
               <h1 className="text-2xl font-black tracking-tight">Employee Profile</h1>
            </div>
          </div>

          {!employee.is_archived && (
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setShowEditModal(true)}
                variant="outline"
                className="h-14 px-8 rounded-2xl font-black text-xs uppercase tracking-widest border-muted bg-background hover:bg-muted/30"
              >
                <Edit3 className="w-4 h-4 mr-3 text-primary" />
                Modify Profile
              </Button>
              <Button
                onClick={() => setShowArchiveModal(true)}
                disabled={isArchiving}
                variant="outline"
                className="h-14 px-8 rounded-2xl font-black text-xs uppercase tracking-widest border-destructive/20 text-destructive bg-destructive/5 hover:bg-destructive hover:text-white transition-all shadow-lg shadow-destructive/10"
              >
                <Trash2 className="w-4 h-4 mr-3" />
                {isArchiving ? "Deactivating..." : "Deactivate"}
              </Button>
            </div>
          )}
        </div>

        {/* Main Identity Card */}
        <Card className="rounded-[3rem] border-muted bg-background shadow-2xl shadow-primary/5 overflow-hidden relative">
           <CardHeader className="p-10 md:p-14 border-b border-muted bg-muted/5">
              <div className="flex flex-col xl:flex-row xl:justify-between xl:items-start gap-10 w-full">
                {/* Identity Info */}
                <div className="flex flex-col md:flex-row items-start md:items-center gap-10 flex-1 min-w-0">
                  <div className="w-32 h-32 rounded-[2.5rem] bg-primary flex shrink-0 items-center justify-center text-4xl font-black text-primary-foreground shadow-2xl shadow-primary/30 uppercase">
                    {employee.name.slice(0, 2)}
                  </div>
                  
                  <div className="space-y-4 flex-1 min-w-0">
                    <div>
                      <h2 className="text-5xl font-black tracking-tighter text-foreground leading-tight break-words">
                        {employee.name}
                      </h2>
                      <p className="text-xl font-medium text-muted-foreground mt-2 flex items-center gap-2 break-all">
                         <Mail className="w-5 h-5 text-primary/50 shrink-0" />
                         {employee.email}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-8 pt-2">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center shrink-0">
                            <Fingerprint className="w-5 h-5 text-muted-foreground" />
                         </div>
                         <div className="min-w-0">
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest truncate">Employee ID</p>
                            <p className="font-mono font-black text-lg text-primary truncate">{employee.emp_code}</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center shrink-0">
                            <Hash className="w-5 h-5 text-muted-foreground" />
                         </div>
                         <div className="min-w-0">
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest truncate">System ID</p>
                            <p className="font-mono font-black text-lg truncate">#{employee.user_id}</p>
                         </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Actions / Status */}
                <div className="flex flex-col items-start xl:items-end gap-6 shrink-0 pt-2 xl:pt-0">
                  {employee.is_archived && (
                    <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 px-5 py-2 font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-amber-500/5">
                      <ShieldAlert className="w-4 h-4 mr-2" />
                      ARCHIVED RECORD
                    </Badge>
                  )}
                  
                  <div className="flex gap-4">
                    <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                      <SelectTrigger className="h-12 w-40 rounded-xl border-muted bg-muted/20 font-bold focus:ring-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-muted">
                        {months.map((m, i) => <SelectItem key={i} value={i.toString()}>{m}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                      <SelectTrigger className="h-12 w-28 rounded-xl border-muted bg-muted/20 font-bold focus:ring-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-muted">
                        {years.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
           </CardHeader>
        </Card>

        {/* Intelligence Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
           <Card className="rounded-[2.5rem] border-muted shadow-lg bg-background p-8 group hover:border-emerald-500/30 transition-all duration-500">
              <div className="flex items-center justify-between mb-4">
                 <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                    <CheckCircle2 className="w-7 h-7" />
                 </div>
                 <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Days Present</p>
              </div>
              <p className="text-4xl font-black">{employee.present_days}</p>
              <p className="text-xs font-bold text-muted-foreground mt-1 lowercase">Total scan instances</p>
           </Card>

           <Card className="rounded-[2.5rem] border-muted shadow-lg bg-background p-8 group hover:border-blue-500/30 transition-all duration-500">
              <div className="flex items-center justify-between mb-4">
                 <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all">
                    <Calendar className="w-7 h-7" />
                 </div>
                 <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total Days</p>
              </div>
              <p className="text-4xl font-black">{employee.total_days}</p>
              <p className="text-xs font-bold text-muted-foreground mt-1 lowercase">Days in this month</p>
           </Card>

           <Card className="rounded-[2.5rem] border-muted shadow-lg bg-background p-8 group hover:border-primary/30 transition-all duration-500">
              <div className="flex items-center justify-between mb-4">
                 <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                    <TrendingUp className="w-7 h-7" />
                 </div>
                 <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Attendance Rate</p>
              </div>
              <p className="text-4xl font-black">{employee.attendance_rate}%</p>
              <p className="text-xs font-bold text-muted-foreground mt-1 lowercase">Percentage of days present</p>
           </Card>

           <Card className={`rounded-[2.5rem] border-muted shadow-lg bg-background p-8 group hover:border-foreground/30 transition-all duration-500`}>
              <div className="flex items-center justify-between mb-4">
                 <div className={`w-14 h-14 rounded-2xl ${status.color.split(' ')[0]} flex items-center justify-center text-white`}>
                    <ShieldAlert className="w-7 h-7" />
                 </div>
                 <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Rating</p>
              </div>
              <p className="text-2xl font-black uppercase tracking-tighter">{status.label}</p>
              <p className="text-xs font-bold text-muted-foreground mt-2 lowercase">Overall attendance rating</p>
           </Card>
        </div>

        {/* Progress Matrix */}
        <Card className="rounded-[3rem] border-muted bg-muted/5 p-10">
           <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black tracking-tight flex items-center gap-4">
                 <div className="w-1.5 h-8 bg-primary rounded-full" />
                 Attendance Progress
              </h3>
              <p className="text-muted-foreground font-bold">{employee.attendance_rate}% ATTENDANCE</p>
           </div>
           
           <div className="relative pt-4">
              <div className="w-full bg-muted border border-muted rounded-full h-4 overflow-hidden shadow-inner">
                 <div
                   className="bg-primary h-full transition-all duration-1000 ease-in-out shadow-[0_0_20px_rgba(var(--primary),0.5)]"
                   style={{ width: `${Math.min(employee.attendance_rate, 100)}%` }}
                 />
              </div>
              <div className="flex justify-between mt-4 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                 <span>LOW (0%)</span>
                 <span>AVERAGE (50%)</span>
                 <span>PERFECT (100%)</span>
              </div>
           </div>
        </Card>

        {/* Telemetry Logs */}
        <Card className="rounded-[3rem] border-muted overflow-hidden">
           <CardHeader className="p-10 border-b border-muted bg-muted/20">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                 <div>
                    <CardTitle className="text-2xl font-black tracking-tight">Attendance History</CardTitle>
                    <CardDescription className="text-muted-foreground font-bold mt-1 uppercase tracking-widest text-[10px]">
                       Showing history for {months[selectedMonth]} {selectedYear} / {employee.recent_logs.length} Scans Recorded
                    </CardDescription>
                 </div>
                 <div className="md:hidden flex gap-4">
                    <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                        <SelectTrigger className="h-10 rounded-xl bg-background border-muted font-bold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {months.map((m, i) => <SelectItem key={i} value={i.toString()}>{m}</SelectItem>)}
                        </SelectContent>
                    </Select>
                 </div>
              </div>
           </CardHeader>

           <CardContent className="p-0">
              <div className="divide-y divide-muted">
                {employee.recent_logs.length > 0 ? (
                  employee.recent_logs.map((log) => (
                    <div key={log.id} className="p-8 hover:bg-muted/30 transition-all flex items-center justify-between group">
                      <div className="flex items-center gap-6">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                          <Clock className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-lg font-black text-foreground">Attendance Scan</p>
                          <p className="text-sm font-bold text-muted-foreground flex items-center gap-2 mt-1">
                             <Calendar className="w-4 h-4" />
                             {formatCompanyDate(log.timestamp, true)}
                             <span className="mx-2 opacity-30">•</span>
                             <Clock className="w-4 h-4" />
                             {formatCompanyTime(log.timestamp, true)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                         <Badge variant="outline" className="rounded-lg font-black text-[10px] tracking-widest bg-muted/50 border-muted-foreground/20 text-muted-foreground px-4 py-2">
                            SCAN_ID: #{log.id}
                         </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-32 text-center text-muted-foreground">
                    <div className="w-24 h-24 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-8 border border-muted">
                      <AlertCircle className="w-10 h-10 opacity-20" />
                    </div>
                    <h4 className="text-2xl font-black tracking-tight mb-2">No Records Found</h4>
                    <p className="font-medium text-lg opacity-70">No attendance logs found for this period.</p>
                  </div>
                )}
              </div>
           </CardContent>
        </Card>
      </div>

      <EditEmployeeModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        employee={employee ? { user_id: employee.user_id, emp_code: employee.emp_code } : null}
        onSuccess={(newUserId) => {
          if (newUserId !== userId) {
            router.push(`/employees/${newUserId}`);
          } else {
            fetchEmployeeDetails();
          }
        }}
      />

      <ArchiveEmployeeModal
        isOpen={showArchiveModal}
        onClose={() => setShowArchiveModal(false)}
        onConfirm={handleArchive}
        employee={employee ? { user_id: employee.user_id, emp_code: employee.emp_code } : null}
        isArchiving={isArchiving}
      />
    </AppLayout>
  );
}