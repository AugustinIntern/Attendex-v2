import AppLayout from "@/components/AppLayout";

export default function PastDayPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
            Past Day Attendance
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-1">
            Review attendance from previous days
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-8 text-center">
          <p className="text-zinc-600 dark:text-zinc-400">
            Past day view coming soon...
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
