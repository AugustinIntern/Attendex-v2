"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getAllEmployees, getEmployeeCode } from "@/lib/employees";
import { supabase } from "@/lib/supabase";
import AppLayout from "@/components/AppLayout";
import EditEmployeeModal from "@/components/EditEmployeeModal";
import ArchiveEmployeeModal from "@/components/ArchiveEmployeeModal";

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

      // Fetch employee from the database via the user_mapping table
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

      // Get attendance logs for selected month
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

      // Calculate attendance statistics
      const uniqueDays = new Set(
        logs?.map((log) => new Date(log.timestamp).toDateString()) || []
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
      <div className="space-y-8">
        {/* Navigation & Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/employees")}
              className="p-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-all shadow-sm"
            >
              <svg className="w-5 h-5 text-zinc-600 dark:text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Employee Profile
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {!employee.is_archived && (
              <>
                <button
                  onClick={() => setShowEditModal(true)}
                  className="px-5 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white text-sm font-semibold rounded-xl transition-all shadow-sm flex items-center gap-2"
                >
                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Edit Profile
                </button>
                <button
                  onClick={() => setShowArchiveModal(true)}
                  disabled={isArchiving}
                  className="px-5 py-2.5 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-sm font-semibold rounded-xl transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                  {isArchiving ? "Archiving..." : "Archive"}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Main Profile Header */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8">
            <div className="flex items-center gap-4">
               <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="px-4 py-2 text-sm font-medium rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
              >
                {months.map((month, index) => (
                  <option key={index} value={index}>{month}</option>
                ))}
              </select>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="px-4 py-2 text-sm font-medium rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
              >
                {years.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-start gap-8">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-3xl font-bold text-white shadow-lg shadow-blue-500/20 uppercase">
              {employee.name.slice(0, 2)}
            </div>
            
            <div className="flex-1 space-y-4">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight">
                    {employee.name}
                  </h1>
                  {employee.is_archived && (
                    <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-600 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                      Archived Account
                    </span>
                  )}
                </div>
                <p className="text-zinc-500 dark:text-zinc-400 font-medium text-lg mt-1">
                  {employee.email}
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-4">
                <div>
                  <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                    Employee Code
                  </p>
                  <p className="text-zinc-900 dark:text-white font-mono mt-1 pr-4 py-2 text-lg">
                    {employee.emp_code}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                    System ID
                  </p>
                  <p className="text-zinc-900 dark:text-white font-mono mt-1 py-2 text-lg">
                    #{employee.user_id}
                  </p>
                </div>
              </div>
            </div>
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
                <div key={log.id} className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
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
                        Log ID: {log.id}
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