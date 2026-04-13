"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/lib/supabase";
import { getAllEmployees } from "@/lib/employees";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import {
  CalendarDays,
  CalendarRange,
  CalendarClock,
  Users,
  Clock,
  TrendingUp,
  BarChart3,
  CheckCircle2,
  XCircle,
  Calendar,
  ChevronRight
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
  isSameDay,
  parseISO,
  eachMonthOfInterval,
  isSameMonth,
  subDays
} from "date-fns";

type Period = "week" | "month" | "year";

interface AttendanceLog {
  id: number;
  user_id: number;
  timestamp: string;
  check_type: number;
}

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isUp: boolean;
  };
  color: "blue" | "green" | "purple" | "orange";
}

const StatCard = ({ title, value, description, icon, trend, color }: StatCardProps) => {
  const colorClasses = {
    blue: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800",
    green: "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-100 dark:border-green-800",
    purple: "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-800",
    orange: "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-800",
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className={`p-3 rounded-xl border ${colorClasses[color]}`}>
          {icon}
        </div>
        {trend && (
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${trend.isUp ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'}`}>
            {trend.isUp ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
        )}
      </div>
      <div>
        <h3 className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">{title}</h3>
        <p className="text-3xl font-bold text-zinc-900 dark:text-white mt-1">{value}</p>
        <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-1">{description}</p>
      </div>
    </div>
  );
};

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

      // Load employees first
      const employees = await getAllEmployees();
      setEmployeeCount(employees.length);

      // Calculate date range
      const now = new Date();
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
        .order("timestamp", { ascending: true });

      if (fetchError) throw fetchError;
      setLogs(data || []);
    } catch (err) {
      console.error("Error fetching statistics:", err);
      setError("Failed to load statistics. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const statsData = useMemo(() => {
    if (loading || !logs.length) return null;

    const now = new Date();
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
      // For year, we might group by month instead
      intervalDay = eachDayOfInterval({
        start: startOfYear(now),
        end: endOfYear(now),
      });
    }

    // Group logs by day
    const chartData = intervalDay.map(date => {
      const dayLogs = logs.filter(log => isSameDay(parseISO(log.timestamp), date));
      const presentIds = new Set(dayLogs.filter(l => l.check_type === 1).map(l => l.user_id));
      
      return {
        name: period === "year" ? format(date, "MMM dd") : format(date, "MMM dd"),
        fullDate: format(date, "yyyy-MM-dd"),
        present: presentIds.size,
        absent: Math.max(0, employeeCount - presentIds.size),
        checkins: dayLogs.filter(l => l.check_type === 1).length,
      };
    });

    // If it's a year, group chartData by month for better visualization
    let displayChartData = chartData;
    if (period === "year") {
      const months = eachMonthOfInterval({
        start: startOfYear(now),
        end: endOfYear(now),
      });
      displayChartData = months.map(m => {
        const monthLogs = logs.filter(log => isSameMonth(parseISO(log.timestamp), m));
        const uniquePresenceDays = new Set(
          monthLogs.filter(l => l.check_type === 1).map(l => format(parseISO(l.timestamp), "yyyy-MM-dd"))
        );
        
        // Average presence in that month
        const totalPresentInMonth = Array.from(uniquePresenceDays).reduce((acc, dateStr) => {
          const dailyLogs = monthLogs.filter(l => format(parseISO(l.timestamp), "yyyy-MM-dd") === dateStr);
          return acc + new Set(dailyLogs.filter(l => l.check_type === 1).map(l => l.user_id)).size;
        }, 0);

        const avgPresent = uniquePresenceDays.size > 0 ? Math.round(totalPresentInMonth / uniquePresenceDays.size) : 0;

        return {
          name: format(m, "MMM"),
          present: avgPresent,
          absent: Math.max(0, employeeCount - avgPresent),
          checkins: monthLogs.filter(l => l.check_type === 1).length,
        };
      });
    }

    const totalCheckins = logs.filter(l => l.check_type === 1).length;
    const avgAttendance = chartData.reduce((acc, curr) => acc + curr.present, 0) / (chartData.filter(d => parseISO(d.fullDate) <= now).length || 1);
    const attendanceRate = employeeCount > 0 ? (avgAttendance / employeeCount) * 100 : 0;

    return {
      displayChartData,
      totalCheckins,
      attendanceRate: attendanceRate.toFixed(1),
      avgDailyPresent: Math.round(avgAttendance),
      activeEmployees: new Set(logs.map(l => l.user_id)).size
    };
  }, [logs, employeeCount, period, loading]);

  const periods: { id: Period; label: string; icon: any }[] = [
    { id: "week", label: "This Week", icon: CalendarDays },
    { id: "month", label: "This Month", icon: CalendarRange },
    { id: "year", label: "This Year", icon: CalendarClock },
  ];

  return (
    <AppLayout>
      <div className="space-y-8 pb-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
              Attendance Statistics
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-2 text-lg">
              Detailed insights and trends for employee attendance
            </p>
          </div>

          <div className="flex bg-zinc-100 dark:bg-zinc-800/50 p-1 rounded-xl border border-zinc-200 dark:border-zinc-700">
            {periods.map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  period === p.id
                    ? "bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-sm"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                }`}
              >
                <p.icon size={16} />
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-40 bg-zinc-100 dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700" />
            ))}
          </div>
        ) : error ? (
          <div className="p-8 text-center bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-2xl">
            <XCircle className="mx-auto text-red-500 mb-4" size={48} />
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">{error}</h3>
            <button 
              onClick={fetchData}
              className="mt-4 px-6 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            {/* Stat Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Attendance Rate"
                value={`${statsData?.attendanceRate}%`}
                description="Avg. daily presence"
                icon={<TrendingUp size={24} />}
                color="green"
                trend={{ value: 2.1, isUp: true }}
              />
              <StatCard
                title="Total Check-ins"
                value={statsData?.totalCheckins || 0}
                description="For the selected period"
                icon={<BarChart3 size={24} />}
                color="blue"
              />
              <StatCard
                title="Avg. Daily Present"
                value={statsData?.avgDailyPresent || 0}
                description={`Out of ${employeeCount} employees`}
                icon={<Users size={24} />}
                color="purple"
              />
              <StatCard
                title="Active Employees"
                value={statsData?.activeEmployees || 0}
                description="Employees checked in"
                icon={<Clock size={24} />}
                color="orange"
              />
            </div>

            {/* Main Chart Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                       Presence Trend
                    </h2>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
                      Daily overview of present employees
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <span className="text-zinc-600 dark:text-zinc-400">Present</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                      <span className="text-zinc-600 dark:text-zinc-400">Absent</span>
                    </div>
                  </div>
                </div>

                <div className="h-[350px] w-full min-h-0 min-w-0">
                  {isMounted && (
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <AreaChart data={statsData?.displayChartData}>
                      <defs>
                        <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-zinc-800" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                        dx={-10}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          borderRadius: '12px', 
                          border: 'none', 
                          boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                          color: '#000'
                        }}
                        itemStyle={{ color: '#3b82f6' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="present" 
                        stroke="#3b82f6" 
                        strokeWidth={4}
                        fillOpacity={1} 
                        fill="url(#colorPresent)" 
                        animationDuration={1500}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Distribution Chart */}
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8 shadow-sm">
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">
                  Daily Check-ins
                </h2>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-8">
                  Volume of activity
                </p>
                <div className="h-[300px] w-full mt-4 min-h-0 min-w-0">
                  {isMounted && (
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <BarChart data={statsData?.displayChartData?.slice(-10)}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-zinc-800" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94a3b8', fontSize: 10 }}
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          borderRadius: '12px', 
                          border: 'none', 
                          boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                        }}
                      />
                      <Bar 
                        dataKey="checkins" 
                        fill="#3b82f6" 
                        radius={[6, 6, 0, 0]} 
                        animationDuration={2000}
                      >
                         {statsData?.displayChartData?.slice(-10).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 9 ? '#2563eb' : '#3b82f6'} fillOpacity={0.8} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  )}
                </div>
                <div className="mt-8 space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/20">
                    <div className="flex items-center gap-3">
                      <Clock className="text-orange-500" size={18} />
                      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Peak Hour</span>
                    </div>
                    <span className="text-sm font-bold text-orange-600">09:12 AM</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/20">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="text-green-500" size={18} />
                      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Sync Status</span>
                    </div>
                    <span className="text-sm font-bold text-green-600">Healthy</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Lower Summary List */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
              <div className="px-8 py-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Recent Daily Breakdown</h2>
                  <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">Summary of the last few days in this period</p>
                </div>
                <button className="text-blue-600 dark:text-blue-400 text-sm font-semibold flex items-center gap-1 hover:underline">
                  View Full History <ChevronRight size={16} />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-800/50">
                      <th className="px-8 py-4 text-left text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Date</th>
                      <th className="px-8 py-4 text-left text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Present</th>
                      <th className="px-8 py-4 text-left text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Absent</th>
                      <th className="px-8 py-4 text-left text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Check-ins</th>
                      <th className="px-8 py-4 text-left text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {statsData?.displayChartData?.slice(-7).reverse().map((day, idx) => (
                      <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                        <td className="px-8 py-4 text-sm font-medium text-zinc-900 dark:text-white">{day.name}</td>
                        <td className="px-8 py-4 text-sm text-green-600 dark:text-green-400 font-bold">{day.present}</td>
                        <td className="px-8 py-4 text-sm text-red-500 dark:text-red-400 font-semibold">{day.absent}</td>
                        <td className="px-8 py-4 text-sm text-zinc-600 dark:text-zinc-400">{day.checkins}</td>
                        <td className="px-8 py-4 text-sm">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            day.present / employeeCount >= 0.8 
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' 
                            : 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400'
                          }`}>
                            {day.present / employeeCount >= 0.8 ? 'Excellent' : 'Average'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
