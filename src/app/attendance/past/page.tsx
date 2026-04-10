"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { EMPLOYEE_COUNT, getEmployeeCode } from "@/lib/employees";

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

  const formattedDateLabel = useMemo(() => {
    if (!selectedDate) return "Select a date to view attendance";
    return new Date(selectedDate).toLocaleDateString("en-US", {
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
  const absenceCount = EMPLOYEE_COUNT - presentCount;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
          Past Day Attendance
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 mt-1">
          Review attendance logs for a selected day.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-[220px_1fr] items-end">
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Choose a date
          </label>
          <input
            type="date"
            className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-3 text-zinc-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            max={new Date().toISOString().split("T")[0]}
          />
        </div>

        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Viewing day</p>
          <p className="mt-2 text-lg font-semibold text-zinc-900 dark:text-white">
            {formattedDateLabel}
          </p>
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
            {selectedDate
              ? `Showing attendance records for ${new Date(selectedDate).toLocaleDateString()}`
              : "Pick a date to load records."}
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-950 p-6 border border-red-200 dark:border-red-800">
          <p className="text-red-800 dark:text-red-300">{error}</p>
        </div>
      )}

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

      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800">
          <h2 className="font-semibold text-zinc-900 dark:text-white">
            {selectedDate ? `Attendance for ${new Date(selectedDate).toLocaleDateString()}` : "Select a date to view attendance"}
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                Loading selected day attendance...
              </p>
            </div>
          </div>
        ) : !selectedDate ? (
          <div className="p-8 text-center text-zinc-600 dark:text-zinc-400">
            Choose a date from the calendar above to load attendance records.
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-zinc-600 dark:text-zinc-400">
            No attendance records found for this day.
          </div>
        ) : (
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
                      {getEmployeeCode(log.user_id)}
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
        )}
      </div>
    </div>
  );
}
