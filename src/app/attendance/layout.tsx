import AppLayout from "@/components/AppLayout";

export default function AttendanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout>{children}</AppLayout>;
}
