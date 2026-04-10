"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { EMPLOYEES, getEmployeeCode } from "@/lib/employees";
import { supabase } from "@/lib/supabase";
import AppLayout from "@/components/AppLayout";

interface AttendanceLog {
  idx: number;
  user_id: number;
  timestamp: string;
}

interface EmployeeDetails {
  emp_code: string;
  user_id: number;
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

  useEffect(() => {
    if (userId) {
      fetchEmployeeDetails();
    }
  }, [userId, selectedMonth, selectedYear]);

  const fetchEmployeeDetails = async () => {
    try {
      setLoading(true);

      const employeeData = EMPLOYEES.find(emp => emp.user_id === userId);
      if (!employeeData) {
        router.push("/employees");
        return;
      }

      // Get attendance logs for selected month
      const startOfMonth = new Date(selectedYear, selectedMonth, 1);
      const endOfMonth = new Date(selectedYear, selectedMonth + 1, 0);

      const { data: logs, error } = await supabase
        .from("attendance_logs")
        .select("*")
        .eq("user_id", userId)
        .gte("timestamp", startOfMonth.toISOString())
        .lte("timestamp", endOfMonth.toISOString())
        .order("timestamp", { ascending: false });

      if (error) {
        console.error("Error fetching attendance logs:", error);
        return;
      }

      // Calculate attendance statistics
      const uniqueDays = new Set(
        logs?.map(log => new Date(log.timestamp).toDateString()) || []
      );
      const presentDays = uniqueDays.size;
      const totalDays = new Date(selectedYear, selectedMonth + 1, 0).getDate();
      const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

      setEmployee({
        emp_code: employeeData.emp_code,
        user_id: employeeData.user_id,
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
    if (rate >= 90) return { label: "Excellent", color: "text-green-600 bg-green-50 border-green-200" };
    if (rate >= 75) return { label: "Good", color: "text-blue-600 bg-blue-50 border-blue-200" };
    if (rate >= 60) return { label: "Fair", color: "text-yellow-600 bg-yellow-50 border-yellow-200" };
    return { label: "Poor", color: "text-red-600 bg-red-50 border-red-200" };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-zinc-300 dark:border-zinc-700 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-zinc-600 dark:text-zinc-400">Loading employee details...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!employee) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
            Employee not found
          </h2>
          <button
            onClick={() => router.push("/employees")}
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            ← Back to employees
          </button>
        </div>
      </AppLayout>
    );
  }

  const status = getAttendanceStatus(employee.attendance_rate);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/employees")}
              className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
                {employee.emp_code}
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400">
                Employee ID: {employee.user_id}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
            >
              {months.map((month, index) => (
                <option key={index} value={index}>{month}</option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
            >
              {years.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Present Days</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                  {employee.present_days}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <span className="text-green-600 dark:text-green-400">✓</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Total Days</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                  {employee.total_days}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <span className="text-blue-600 dark:text-blue-400">📅</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Attendance Rate</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                  {employee.attendance_rate}%
                </p>
              </div>
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                <span className="text-purple-600 dark:text-purple-400">📊</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Status</p>
                <p className={`text-lg font-bold ${status.color.split(' ')[0]}`}>
                  {status.label}
                </p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {employee.emp_code.slice(0, 2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Attendance Progress */}
        <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-6">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
            Monthly Attendance Progress
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-600 dark:text-zinc-400">
                {employee.present_days} of {employee.total_days} days present
              </span>
              <span className="text-zinc-900 dark:text-white font-medium">
                {employee.attendance_rate}%
              </span>
            </div>
            <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(employee.attendance_rate, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Recent Attendance Logs */}
        <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
          <div className="p-6 border-b border-zinc-200 dark:border-zinc-700">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
              Attendance Logs - {months[selectedMonth]} {selectedYear}
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
              {employee.recent_logs.length} attendance records found
            </p>
          </div>

          <div className="divide-y divide-zinc-200 dark:divide-zinc-700">
            {employee.recent_logs.length > 0 ? (
              employee.recent_logs.map((log) => (
                <div key={log.idx} className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                        <span className="text-green-600 dark:text-green-400 text-sm">✓</span>
                      </div>
                      <div>
                        <p className="font-medium text-zinc-900 dark:text-white">
                          Attendance Recorded
                        </p>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                          {formatDate(log.timestamp)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Log ID: {log.idx}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center">
                <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-zinc-400">📅</span>
                </div>
                <p className="text-zinc-600 dark:text-zinc-400">
                  No attendance records found for this month
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}