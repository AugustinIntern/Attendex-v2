"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/lib/supabase";
import { getAllEmployees } from "@/lib/employees";
import dynamic from "next/dynamic";
const ResponsiveContainer = dynamic(() => import("recharts").then(m => m.ResponsiveContainer), { ssr: false });
const AreaChart = dynamic(() => import("recharts").then(m => m.AreaChart), { ssr: false });
const Area = dynamic(() => import("recharts").then(m => m.Area), { ssr: false });
const BarChart = dynamic(() => import("recharts").then(m => m.BarChart), { ssr: false });
const Bar = dynamic(() => import("recharts").then(m => m.Bar), { ssr: false });
const XAxis = dynamic(() => import("recharts").then(m => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then(m => m.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import("recharts").then(m => m.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then(m => m.Tooltip), { ssr: false });
const Cell = dynamic(() => import("recharts").then(m => m.Cell), { ssr: false });
import {
  CalendarDays,
  CalendarRange,
  CalendarClock,
  Users,
  Clock,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Calendar,
  Zap,
  Target,
  Activity,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  format,
  eachDayOfInterval,
  parseISO,
  eachMonthOfInterval,
  isSameMonth
} from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getCompanyLocalTime } from "@/lib/utils";

type Period = "week" | "month" | "year";

interface AttendanceLog {
  id: number;
  user_id: number;
  timestamp: string;
  check_type: number;
}

export default function StatisticsPage() {
  const [period, setPeriod] = useState<Period>("month");
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [employeeCount, setEmployeeCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const employees = await getAllEmployees();
      setEmployeeCount(employees.length);

      const now = getCompanyLocalTime(new Date());
      let start: Date;
      let end: Date;

      if (period === "week") {
        start = startOfWeek(now, { weekStartsOn: 1 });
        end = endOfWeek(now, { weekStartsOn: 1 });
      } else if (period === "month") {
        start = startOfMonth(now);
        end = endOfMonth(now);
      } else {
        start = startOfYear(now);
        end = endOfYear(now);
      }

      const { data, error: fetchError } = await supabase
        .from("attendance_logs")
        .select("id, user_id, timestamp, check_type")
        .gte("timestamp", start.toISOString())
        .lte("timestamp", end.toISOString())
        .order("timestamp", { ascending: true })
        .limit(5000);

      if (fetchError) throw fetchError;
      setLogs(data || []);
    } catch (err) {
      console.error("Error fetching statistics:", err);
      setError("FAILED_TELEMETRY_EXTRACTION");
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const statsData = useMemo(() => {
    if (loading || !logs) return null;

    try {
      const now = getCompanyLocalTime(new Date());

      // Pre-compute local dates to prevent O(N^2) format and getCompanyLocalTime operations
      const parsedLogs = logs.map(log => {
        try {
          if (!log.timestamp) return null;
          const localDate = getCompanyLocalTime(log.timestamp);
          if (isNaN(localDate.getTime())) return null;
          return {
            ...log,
            localDate,
            dateStr: format(localDate, "yyyy-MM-dd")
          };
        } catch (e) {
          return null; // Silently discard invalid timestamps
        }
      }).filter(log => log !== null) as (AttendanceLog & { localDate: Date; dateStr: string })[];

      let intervalDay: Date[];
      
      if (period === "week") {
        intervalDay = eachDayOfInterval({
          start: startOfWeek(now, { weekStartsOn: 1 }),
          end: endOfWeek(now, { weekStartsOn: 1 }),
        });
      } else if (period === "month") {
        intervalDay = eachDayOfInterval({
          start: startOfMonth(now),
          end: endOfMonth(now),
        });
      } else {
        intervalDay = eachDayOfInterval({
          start: startOfYear(now),
          end: endOfYear(now),
        });
      }

      const chartData = intervalDay.map(date => {
        const dateStr = format(date, "yyyy-MM-dd");
        const dayLogs = parsedLogs.filter(log => log.dateStr === dateStr);
        const presentIds = new Set(dayLogs.filter(l => l.check_type === 1).map(l => l.user_id));
        
        return {
          name: format(date, "MMM dd"),
          fullDate: dateStr,
          present: presentIds.size,
          absent: Math.max(0, employeeCount - presentIds.size),
          checkins: dayLogs.filter(l => l.check_type === 1).length,
        };
      });

      let displayChartData = chartData;
      if (period === "year") {
        const months = eachMonthOfInterval({
          start: startOfYear(now),
          end: endOfYear(now),
        });
        displayChartData = months.map(m => {
          const monthLogs = parsedLogs.filter(log => isSameMonth(log.localDate, m));
          const uniquePresenceDays = new Set(
            monthLogs.filter(l => l.check_type === 1).map(l => l.dateStr)
          );
          
          const totalPresentInMonth = Array.from(uniquePresenceDays).reduce((acc, dateStr) => {
            const dailyLogs = monthLogs.filter(l => l.dateStr === dateStr);
            return acc + new Set(dailyLogs.filter(l => l.check_type === 1).map(l => l.user_id)).size;
          }, 0);

          const avgPresent = uniquePresenceDays.size > 0 ? Math.round(totalPresentInMonth / uniquePresenceDays.size) : 0;

          return {
            name: format(m, "MMM"),
            fullDate: format(m, "yyyy-MM-dd"),
            present: avgPresent,
            absent: Math.max(0, employeeCount - avgPresent),
            checkins: monthLogs.filter(l => l.check_type === 1).length,
          };
        });
      }

      const totalCheckins = parsedLogs.filter(l => l.check_type === 1).length;
      
      const validPastDaysList = chartData.filter(d => {
        try {
          return parseISO(d.fullDate) <= now;
        } catch {
          return false;
        }
      });
      
      const avgAttendance = chartData.reduce((acc, curr) => acc + curr.present, 0) / (validPastDaysList.length || 1);
      const attendanceRate = employeeCount > 0 ? (avgAttendance / employeeCount) * 100 : 0;

      return {
        displayChartData,
        totalCheckins,
        attendanceRate: Math.round(attendanceRate),
        avgDailyPresent: Math.round(avgAttendance),
        activeEmployees: new Set(parsedLogs.map(l => l.user_id)).size
      };
    } catch (error) {
      console.error("Critical error generating statistics view:", error);
      // Fallback state on total failure
      return {
        displayChartData: [],
        totalCheckins: 0,
        attendanceRate: 0,
        avgDailyPresent: 0,
        activeEmployees: 0
      };
    }
  }, [logs, employeeCount, period, loading]);

  const periods: { id: Period; label: string; icon: any }[] = [
    { id: "week", label: "PHASE: WEEK", icon: CalendarDays },
    { id: "month", label: "PHASE: MONTH", icon: CalendarRange },
    { id: "year", label: "YEAR", icon: CalendarClock },
  ];

  return (
    <AppLayout>
      <div className="space-y-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
             <div className="flex items-center gap-3 mb-2">
                <Badge variant="outline" className="rounded-full border-primary/30 text-primary font-black text-[10px] tracking-widest px-4">ANALYSIS</Badge>
                <div className="h-1 w-12 bg-primary/20 rounded-full" />
             </div>
            <h1 className="text-5xl font-extrabold text-foreground tracking-tighter">
              Attendance Statistics
            </h1>
            <p className="text-muted-foreground mt-2 font-medium max-w-lg">
              Overview of attendance trends and employee presence.
            </p>
          </div>

          <div className="flex bg-muted/30 p-1.5 rounded-2xl border border-muted backdrop-blur-xl">
            {periods.map((p) => (
              <Button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                variant="ghost"
                className={`flex items-center gap-3 px-6 h-12 rounded-xl font-black text-[10px] tracking-widest transition-all duration-300 ${
                  period === p.id
                    ? "bg-primary text-primary-foreground shadow-xl shadow-primary/20"
                    : "text-muted-foreground hover:bg-muted/50"
                }`}
              >
                <p.icon className="w-4 h-4" />
                {p.label}
              </Button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-44 rounded-[2.5rem]" />
            ))}
          </div>
        ) : error ? (
          <Card className="border-destructive/50 bg-destructive/10 rounded-[2.5rem] p-12 text-center">
            <XCircle className="mx-auto text-destructive mb-6 w-16 h-16 opacity-50" />
            <h3 className="text-2xl font-black text-foreground">{error}</h3>
            <Button 
              onClick={fetchData}
              className="mt-6 h-12 px-8 rounded-xl font-black text-xs tracking-widest bg-destructive hover:bg-destructive/90"
            >
              TRY AGAIN
            </Button>
          </Card>
        ) : (
          <>
            {/* Stat Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <Card className="rounded-[2.5rem] border-muted shadow-xl bg-background p-8 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-8">
                    <TrendingUp className="w-5 h-5 text-emerald-500 opacity-20 group-hover:opacity-100 transition-opacity" />
                 </div>
                 <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-6 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                    <Target className="w-7 h-7" />
                 </div>
                 <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Attendance Rate</p>
                 <div className="flex items-end gap-3">
                    <h3 className="text-4xl font-black tracking-tighter">{statsData?.attendanceRate}%</h3>
                    <Badge className="mb-1 bg-emerald-500/20 text-emerald-600 border-none font-black text-[9px] tracking-tighter">
                       <ArrowUpRight className="w-3 h-3 mr-1" />
                       2.1%
                    </Badge>
                 </div>
              </Card>

              <Card className="rounded-[2.5rem] border-muted shadow-xl bg-background p-8 group overflow-hidden">
                 <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-white transition-all">
                    <Activity className="w-7 h-7" />
                 </div>
                 <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Total Scans</p>
                 <h3 className="text-4xl font-black tracking-tighter">{statsData?.totalCheckins}</h3>
                 <p className="text-[10px] font-bold text-muted-foreground mt-2 italic lowercase tracking-wide">Attendance logs recorded</p>
              </Card>

              <Card className="rounded-[2.5rem] border-muted shadow-xl bg-background p-8 group overflow-hidden">
                 <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 mb-6 group-hover:bg-blue-500 group-hover:text-white transition-all">
                    <Users className="w-7 h-7" />
                 </div>
                 <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Avg Presence</p>
                 <h3 className="text-4xl font-black tracking-tighter">{statsData?.avgDailyPresent}</h3>
                 <p className="text-[10px] font-bold text-muted-foreground mt-2 italic lowercase tracking-wide">Average daily attendance</p>
              </Card>

              <Card className="rounded-[2.5rem] border-muted shadow-xl bg-background p-8 group overflow-hidden">
                 <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500 mb-6 group-hover:bg-purple-500 group-hover:text-white transition-all">
                    <Zap className="w-7 h-7" />
                 </div>
                 <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Active Employees</p>
                 <h3 className="text-4xl font-black tracking-tighter">{statsData?.activeEmployees}</h3>
                 <p className="text-[10px] font-bold text-muted-foreground mt-2 italic lowercase tracking-wide">Employees scanned</p>
              </Card>
            </div>

            {/* Visual Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card className="lg:col-span-2 rounded-[3.5rem] border-muted bg-background shadow-2xl p-10">
                <div className="flex items-center justify-between mb-12">
                  <div>
                    <h2 className="text-3xl font-black tracking-tight flex items-center gap-4">
                       <div className="w-1.5 h-8 bg-primary rounded-full shadow-[0_0_15px_rgba(var(--primary),0.5)]" />
                       Attendance Trends
                    </h2>
                    <p className="text-muted-foreground font-bold text-xs uppercase tracking-widest mt-2">
                       Comparison of present vs absent employees
                    </p>
                  </div>
                  <div className="hidden sm:flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                       <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Presence</span>
                    </div>
                  </div>
                </div>

                <div className="w-full" style={{ width: '100%', minHeight: '400px' }}>
                  {isMounted && (
                    <ResponsiveContainer width="100%" height={400}>
                    <AreaChart data={statsData?.displayChartData}>
                      <defs>
                        <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--muted)" opacity={0.5} />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'var(--muted-foreground)', fontSize: 10, fontWeight: 700 }}
                        dy={15}
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'var(--muted-foreground)', fontSize: 10, fontWeight: 700 }}
                        dx={-15}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'var(--background)', 
                          borderRadius: '24px', 
                          border: '1px solid var(--muted)', 
                          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.2)',
                          padding: '20px'
                        }}
                        itemStyle={{ color: 'var(--primary)', fontWeight: 900 }}
                        labelStyle={{ fontWeight: 900, marginBottom: '8px', color: 'var(--foreground)' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="present" 
                        stroke="var(--primary)" 
                        strokeWidth={6}
                        fillOpacity={1} 
                        fill="url(#colorPresent)" 
                        animationDuration={2000}
                        activeDot={{ r: 8, stroke: 'var(--background)', strokeWidth: 4 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                  )}
                </div>
              </Card>

              <Card className="rounded-[3.5rem] border-muted bg-background shadow-2xl p-10 flex flex-col group">
                <h2 className="text-2xl font-black tracking-tight mb-2 group-hover:text-primary transition-colors">
                  Scan Activity
                </h2>
                <p className="text-muted-foreground font-medium text-sm mb-10 lowercase italic">
                  Activity over time
                </p>
                <div className="flex-1 mt-4" style={{ width: '100%', minHeight: '250px' }}>
                  {isMounted && (
                    <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={statsData?.displayChartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--muted)" opacity={0.3} />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'var(--muted-foreground)', fontSize: 9, fontWeight: 700 }}
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'var(--muted-foreground)', fontSize: 9, fontWeight: 700 }}
                      />
                      <Tooltip 
                        cursor={{fill: 'var(--muted)', opacity: 0.1}}
                        contentStyle={{ 
                          backgroundColor: 'var(--background)', 
                          borderRadius: '16px', 
                          border: '1px solid var(--muted)',
                          padding: '12px'
                        }}
                      />
                      <Bar 
                        dataKey="checkins" 
                        fill="var(--primary)" 
                        radius={[12, 12, 0, 0]} 
                        animationDuration={2500}
                      >
                         {statsData?.displayChartData?.map((entry, index) => (
                          <Cell key={`cell-${index}`} fillOpacity={0.4 + (index * 0.1)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  )}
                </div>
                <div className="mt-10 space-y-6">
                   <div className="h-px bg-muted" />
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                            <Clock className="w-5 h-5" />
                         </div>
                         <div>
                             <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Peak Time</p>
                            <p className="text-lg font-black tracking-tight">08:44 AM</p>
                         </div>
                      </div>
                       <Badge variant="outline" className="h-8 rounded-lg font-black text-[9px] tracking-widest bg-emerald-500/10 text-emerald-500 border-none px-3">SYNCED</Badge>
                   </div>
                </div>
              </Card>
            </div>

            {/* Deep Breakdown Table */}
            <Card className="rounded-[3.5rem] border-muted bg-background shadow-2xl overflow-hidden">
               <CardHeader className="p-12 border-b border-muted bg-muted/5 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-3xl font-black tracking-tight">
                       {period === "week" ? "Weekly" : period === "month" ? "Monthly" : "Yearly"} Overview
                    </CardTitle>
                    <CardDescription className="text-muted-foreground font-bold mt-2 uppercase tracking-widest text-xs">
                       Detailed daily breakdown
                    </CardDescription>
                  </div>
                  <Button variant="outline" className="h-12 rounded-xl border-muted bg-background hover:bg-muted/30 font-black text-[10px] tracking-widest">
                     EXPORT_DATA.XLSX
                     <ArrowDownRight className="w-4 h-4 ml-2" />
                  </Button>
               </CardHeader>
               
               <Table>
                 <TableHeader className="bg-muted/20 border-b border-muted">
                   <TableRow className="h-20 hover:bg-transparent">
                     <TableHead className="px-12 font-black uppercase text-xs tracking-[0.2em]">Date</TableHead>
                     <TableHead className="font-black uppercase text-xs tracking-[0.2em] text-emerald-500">Employees Present</TableHead>
                     <TableHead className="font-black uppercase text-xs tracking-[0.2em] text-destructive">Absences</TableHead>
                     <TableHead className="font-black uppercase text-xs tracking-[0.2em]">Scans</TableHead>
                     <TableHead className="px-12 font-black uppercase text-xs tracking-[0.2em] text-right">Status</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {statsData?.displayChartData?.slice().reverse().map((day, idx) => (
                     <TableRow key={idx} className="h-24 hover:bg-muted/20 transition-all group">
                       <TableCell className="px-12 font-black text-lg text-foreground group-hover:text-primary transition-colors">
                          {day.name}
                       </TableCell>
                       <TableCell className="font-black text-xl text-emerald-600">
                          {day.present}
                       </TableCell>
                       <TableCell className="font-bold text-muted-foreground/50">
                          {day.absent}
                       </TableCell>
                       <TableCell className="font-medium text-muted-foreground">
                           {day.checkins} Scans
                       </TableCell>
                       <TableCell className="px-12 text-right">
                          <Badge 
                            variant="outline" 
                            className={`rounded-lg h-9 px-6 font-black text-[10px] tracking-widest border-none ${
                              day.present / employeeCount >= 0.8 
                              ? 'bg-emerald-500 text-white' 
                              : 'bg-orange-500 text-white'
                            }`}
                          >
                             {day.present / employeeCount >= 0.8 ? 'EXCELLENT' : 'LOW'}
                          </Badge>
                       </TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
               </Table>
            </Card>
          </>
        )}
      </div>
    </AppLayout>
  );
}
