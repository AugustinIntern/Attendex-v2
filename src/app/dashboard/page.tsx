"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getAllEmployees, getCachedEmployeeCode, getCachedEmployeeCount } from "@/lib/employees";

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

export default function DashboardPage() {
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [employeeCount, setEmployeeCount] = useState(0);

  const fetchAttendanceLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Load employee data first
      const employees = await getAllEmployees();
      setEmployeeCount(employees.length);

      // Calculate today's date range in ISO format.
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const todayStart = `${year}-${month}-${day}T00:00:00`;
      const todayEnd = `${year}-${month}-${day}T23:59:59.999`;

      const { data, error: fetchError } = await supabase
        .from("attendance_logs")
        .select("*")
        .gte("timestamp", todayStart)
        .lte("timestamp", todayEnd)
        .order("timestamp", { ascending: false });

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
      <div className="rounded-lg bg-red-50 dark:bg-red-950 p-6 border border-red-200 dark:border-red-800">
        <h2 className="text-lg font-semibold text-red-900 dark:text-red-200 mb-2">
          Error Loading Dashboard
        </h2>
        <p className="text-red-800 dark:text-red-300">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
          Current Day Dashboard
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 mt-1">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm font-medium">
                Present Summary
              </p>
              <p className="text-4xl font-bold text-green-600 dark:text-green-400 mt-2">
                {presentCount}
              </p>
            </div>
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <span className="text-2xl">✓</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm font-medium">
                Absence Summary
              </p>
              <p className="text-4xl font-bold text-red-600 dark:text-red-400 mt-2">
                {absenceCount}
              </p>
            </div>
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <span className="text-2xl">✕</span>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800">
          <h2 className="font-semibold text-zinc-900 dark:text-white">
            Today&apos;s Attendance
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                Loading attendance logs...
              </p>
            </div>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-zinc-600 dark:text-zinc-400">
              No attendance records for today.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                      Parcel
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                      Type
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, index) => (
                    <tr
                      key={log.idx || index}
                      className="border-b border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm text-zinc-900 dark:text-zinc-100 font-medium">
                        {getCachedEmployeeCode(log.user_id)}
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-900 dark:text-zinc-100">
                        {log.user_id}
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-900 dark:text-zinc-100">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                        -
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            log.check_type === 1
                              ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                              : "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                          }`}
                        >
                          {log.check_type === 1 ? "Check In" : "Check Out"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

                    </>
        )}
      </div>
    </div>
  );
}
