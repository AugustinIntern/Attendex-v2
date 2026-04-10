"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import AppLayout from "@/components/AppLayout";
import AddEmployeeModal from "@/components/AddEmployeeModal";

interface Employee {
  idx: number;
  user_id: number;
  emp_code: string;
  email: string;
  admin: boolean;
}

interface EmployeeStats {
  user_id: number;
  total_days: number;
  present_days: number;
  attendance_rate: number;
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
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchEmployeeStats();
  }, []);

  const fetchEmployeeStats = async () => {
    try {
      setLoading(true);

      // First, fetch all employees from the API
      const employeesResponse = await fetch("/api/employees");
      const employeesData = await employeesResponse.json();

      if (!employeesResponse.ok) {
        console.error("Error fetching employees:", employeesData.error);
        return;
      }

      const employeeList = employeesData.employees || [];
      setEmployees(employeeList);

      // Get attendance logs for the current month
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

      // Calculate stats for each employee
      const stats: EmployeeStats[] = employeeList.map((employee: Employee) => {
        const employeeLogs = logs?.filter(log => log.user_id === employee.user_id) || [];
        const uniqueDays = new Set(
          employeeLogs.map(log => new Date(log.timestamp).toDateString())
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
      const empCode = employee.emp_code.toLowerCase();
      const searchLower = searchTerm.toLowerCase();
      return empCode.includes(searchLower);
    });
  }, [employees, searchTerm]);

  const getAttendanceStatus = (rate: number) => {
    if (rate >= 90) return { label: "Excellent", color: "text-green-600 bg-green-50" };
    if (rate >= 75) return { label: "Good", color: "text-blue-600 bg-blue-50" };
    if (rate >= 60) return { label: "Fair", color: "text-yellow-600 bg-yellow-50" };
    return { label: "Poor", color: "text-red-600 bg-red-50" };
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
              Employees
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 mt-1">
              Manage and view employee information and attendance statistics
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                {employees.length}
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Total Employees
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold rounded-lg transition-all flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Employee
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-4">
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search employees by code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white placeholder-zinc-500 dark:placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Employee Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEmployees.map((employee) => {
            const stats = employeeStats.find(s => s.user_id === employee.user_id);
            const status = stats ? getAttendanceStatus(stats.attendance_rate) : null;

            return (
              <Link
                key={employee.idx}
                href={`/employees/${employee.user_id}`}
                className="block"
              >
                <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-6 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 transition-all cursor-pointer">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                        {employee.emp_code}
                      </h3>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Employee ID: {employee.user_id}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {employee.emp_code.slice(0, 2)}
                      </span>
                    </div>
                  </div>

                  {loading ? (
                    <div className="space-y-2">
                      <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse"></div>
                      <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse w-3/4"></div>
                    </div>
                  ) : stats ? (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-zinc-600 dark:text-zinc-400">
                          This Month
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${status?.color}`}>
                          {status?.label}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                            {stats.present_days}
                          </p>
                          <p className="text-xs text-zinc-600 dark:text-zinc-400">
                            Present Days
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                            {stats.attendance_rate}%
                          </p>
                          <p className="text-xs text-zinc-600 dark:text-zinc-400">
                            Attendance Rate
                          </p>
                        </div>
                      </div>

                      <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(stats.attendance_rate, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        No attendance data available
                      </p>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {filteredEmployees.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">👥</span>
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
              No employees found
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400">
              {searchTerm ? "Try adjusting your search terms" : "No employees available"}
            </p>
          </div>
        )}
      </div>

      {/* Add Employee Modal */}
      <AddEmployeeModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          fetchEmployeeStats(); // Refresh the employee list
        }}
      />
    </AppLayout>
  );
}
