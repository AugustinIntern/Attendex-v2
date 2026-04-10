"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import PaginationControls from "@/components/PaginationControls";

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

const ITEMS_PER_PAGE = 10;

export default function AttendancePage() {
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchAttendanceLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get total count
      const { count } = await supabase
        .from("attendance_logs")
        .select("*", { count: "exact", head: true });

      setTotalCount(count || 0);

      // Calculate offset
      const offset = (currentPage - 1) * ITEMS_PER_PAGE;

      // Fetch paginated data
      const { data, error: fetchError } = await supabase
        .from("attendance_logs")
        .select("*")
        .order("timestamp", { ascending: false })
        .range(offset, offset + ITEMS_PER_PAGE - 1);

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
  }, [currentPage]);

  useEffect(() => {
    fetchAttendanceLogs();
  }, [fetchAttendanceLogs]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black p-4 sm:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-lg bg-red-50 dark:bg-red-950 p-4 border border-red-200 dark:border-red-800">
            <h2 className="text-lg font-semibold text-red-900 dark:text-red-200 mb-2">
              Error Loading Attendance Logs
            </h2>
            <p className="text-red-800 dark:text-red-300">{error}</p>
            <p className="text-sm text-red-700 dark:text-red-400 mt-3">
              Make sure your Supabase credentials are set in environment
              variables and your database has an &quot;attendance&quot; table.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-black dark:text-white mb-2">
            Attendance Logs
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Total Records: <span className="font-semibold">{totalCount}</span>
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-zinc-600 dark:text-zinc-400">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-700 dark:border-zinc-300"></div>
              <p className="ml-4 inline-block">Loading attendance logs...</p>
            </div>
          </div>
        ) : logs.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 rounded-lg p-8 text-center border border-zinc-200 dark:border-zinc-800">
            <p className="text-zinc-600 dark:text-zinc-400">
              No attendance logs found.
            </p>
          </div>
        ) : (
          <>
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800">
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                        Timestamp
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                        User ID
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                        Device IP
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                        Synced to Zoho
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log, index) => (
                      <tr
                        key={log.idx || index}
                        className="border-b border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <td className="px-4 sm:px-6 py-4 text-sm text-zinc-900 dark:text-zinc-100">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-sm text-zinc-900 dark:text-zinc-100">
                          {log.user_id}
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-sm">
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
                        <td className="px-4 sm:px-6 py-4 text-sm text-zinc-900 dark:text-zinc-100 font-mono">
                          {log.device_ip}
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-sm">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              log.synced_to_zoho
                                ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                                : "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200"
                            }`}
                          >
                            {log.synced_to_zoho ? "Yes" : "No"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-8">
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
