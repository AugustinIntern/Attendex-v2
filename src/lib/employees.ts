import { supabase } from "./supabase";

export interface EmployeeRecord {
  user_id: number;
  emp_code: string;
  name?: string;
  email?: string;
  is_archived?: boolean;
}

// Cache for employee data
let employeeCache: EmployeeRecord[] | null = null;
let cacheTimestamp: number = 0;
let codeMapCache: Map<number, string> | null = null;
let nameMapCache: Map<number, string> | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function fetchEmployeeData(): Promise<EmployeeRecord[]> {
  // Return from cache if still valid
  if (employeeCache && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return employeeCache;
  }

  try {
    let response = await supabase
      .from("user_mapping")
      .select("user_id, emp_code, name, email, is_archived")
      .limit(2000);

    if (response.error && response.error.code === '42703') {
      console.warn("⚠️ COLUMN 'name' or 'email' or 'is_archived' MISSING. Falling back.");
      response = (await supabase
        .from("user_mapping")
        .select("user_id, emp_code")
        .limit(2000)) as any;
    }

    if (response.error) {
      console.error("Error fetching employees from user_mapping:", response.error);
      return employeeCache || [];
    }

    employeeCache = response.data || [];
    cacheTimestamp = Date.now();
    codeMapCache = null; // Invalidate caches
    nameMapCache = null;
    return employeeCache;
  } catch (error) {
    console.error("Error in fetchEmployeeData:", error);
    return employeeCache || [];
  }
}

// Build maps for quick lookups
async function getEmployeeMaps(): Promise<{ codeMap: Map<number, string>, nameMap: Map<number, string> }> {
  if (codeMapCache && nameMapCache) {
    return { codeMap: codeMapCache, nameMap: nameMapCache };
  }

  const employees = await fetchEmployeeData();
  codeMapCache = new Map<number, string>(
    employees.map((employee) => [employee.user_id, employee.emp_code])
  );
  nameMapCache = new Map<number, string>(
    employees.map((employee) => [employee.user_id, employee.name || employee.emp_code])
  );
  return { codeMap: codeMapCache, nameMap: nameMapCache };
}

// Async versions
export async function getEmployeeCode(userId: number): Promise<string> {
  const { codeMap } = await getEmployeeMaps();
  return codeMap.get(userId) ?? `ID: ${userId}`;
}

export async function getEmployeeName(userId: number): Promise<string> {
  const { nameMap } = await getEmployeeMaps();
  return nameMap.get(userId) ?? `User ${userId}`;
}

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

// Sync versions for cached data
export function getCachedEmployeeCode(userId: number): string {
  if (!codeMapCache) return `ID: ${userId}`;
  return codeMapCache.get(userId) ?? `ID: ${userId}`;
}

export function getCachedEmployeeName(userId: number): string {
  if (!nameMapCache) return `User ${userId}`;
  return nameMapCache.get(userId) ?? `User ${userId}`;
}

export function getCachedEmployeeCount(): number {
  return employeeCache?.length ?? 0;
}

// Pre-load the cache on module import for server-side usage
if (typeof window === "undefined") {
  fetchEmployeeData().catch(err => console.error("Failed to pre-fetch employees:", err));
}
