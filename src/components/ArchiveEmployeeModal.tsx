"use client";

import { useState } from "react";

interface Employee {
  user_id: number;
  emp_code: string;
}

interface ArchiveEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  employee: Employee | null;
  isArchiving: boolean;
}

export default function ArchiveEmployeeModal({
  isOpen,
  onClose,
  onConfirm,
  employee,
  isArchiving,
}: ArchiveEmployeeModalProps) {
  const [confirmText, setConfirmText] = useState("");

  if (!isOpen || !employee) return null;

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmText === employee.emp_code) {
      onConfirm();
    }
  };

  const isMatch = confirmText === employee.emp_code;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-xl max-w-md w-full border border-zinc-200 dark:border-zinc-700">
        <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-700">
          <h2 className="text-xl font-semibold text-amber-600 dark:text-amber-400">
            Confirm Archival
          </h2>
          <button
            onClick={onClose}
            disabled={isArchiving}
            className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleConfirm} className="p-6 space-y-4">
          <p className="text-zinc-600 dark:text-zinc-300 text-sm">
            Archiving will remove this employee from the active list but keep all their
            attendance records. You can restore them later from the Archive section.
            Please confirm for <span className="font-bold text-zinc-900 dark:text-white">{employee.emp_code}</span>.
          </p>

          <div>
            <label htmlFor="confirmText" className="block text-sm font-medium text-zinc-900 dark:text-white mb-2">
              Please type <span className="font-bold font-mono bg-zinc-100 dark:bg-zinc-700 px-1 py-0.5 rounded">{employee.emp_code}</span> to confirm.
            </label>
            <input
              id="confirmText"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={employee.emp_code}
              className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white placeholder-zinc-500 dark:placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              required
              disabled={isArchiving}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isArchiving}
              className="flex-1 px-4 py-2 border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isMatch || isArchiving}
              className="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isArchiving ? "Archiving..." : "Archive Employee"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
