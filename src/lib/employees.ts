import { supabase } from "./supabase";

export interface EmployeeRecord {
  user_id: number;
  emp_code: string;
  is_archived?: boolean;
}

// Cache for employee data
let employeeCache: EmployeeRecord[] | null = null;
let cacheTimestamp: number = 0;
let codeMapCache: Map<number, string> | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function fetchEmployeeData(): Promise<EmployeeRecord[]> {
  // Return from cache if still valid
  if (employeeCache && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return employeeCache;
  }

  try {
    let response = await supabase
      .from("user_mapping")
      .select("user_id, emp_code, is_archived");

    if (response.error && response.error.code === '42703') {
      console.warn("⚠️ COLUMN 'is_archived' MISSING: Please add it to 'user_mapping' table in Supabase. Falling back to active view.");
      response = await supabase
        .from("user_mapping")
        .select("user_id, emp_code");
    }

    if (response.error) {
      console.error("Error fetching employees from user_mapping:", response.error);
      return employeeCache || [];
    }

    employeeCache = response.data || [];
    cacheTimestamp = Date.now();
    codeMapCache = null; // Invalidate map cache
    return employeeCache;
  } catch (error) {
    console.error("Error in fetchEmployeeData:", error);
    return employeeCache || [];
  }
}

// Build map for quick lookups
async function getEmployeeMap(): Promise<Map<number, string>> {
  if (codeMapCache) {
    return codeMapCache;
  }

  const employees = await fetchEmployeeData();
  codeMapCache = new Map<number, string>(
    employees.map((employee) => [employee.user_id, employee.emp_code])
  );
  return codeMapCache;
}

// Async versions
export async function getEmployeeCode(userId: number): Promise<string> {
  const employeeMap = await getEmployeeMap();
  return employeeMap.get(userId) ?? `User ${userId}`;
}

// Removed getUserIdByIdx as we no longer use idx

export async function getAllEmployees(): Promise<EmployeeRecord[]> {
  const employees = await fetchEmployeeData();
  return employees.filter(emp => !emp.is_archived);
}

export async function getArchivedEmployees(): Promise<EmployeeRecord[]> {
  const employees = await fetchEmployeeData();
  return employees.filter(emp => emp.is_archived);
}

export async function getEmployeeCount(): Promise<number> {
  const employees = await getAllEmployees();
  return employees.length;
}

// Sync versions for cached data (returns empty if not cached yet)
export function getCachedEmployeeCode(userId: number): string {
  if (!codeMapCache) {
    // If no cache, return empty - component should load data first
    return `User ${userId}`;
  }
  return codeMapCache.get(userId) ?? `User ${userId}`;
}

export function getCachedEmployeeCount(): number {
  return employeeCache?.length ?? 0;
}

// Pre-load the cache on module import for server-side usage
if (typeof window === "undefined") {
  // Server-side only - pre-fetch data
  fetchEmployeeData().catch(err => console.error("Failed to pre-fetch employees:", err));
}
