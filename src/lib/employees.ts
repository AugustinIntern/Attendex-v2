export interface EmployeeRecord {
  idx: number;
  user_id: number;
  emp_code: string;
}

export const EMPLOYEES: EmployeeRecord[] = [
  { idx: 0, user_id: 1, emp_code: "BLK2" },
  { idx: 1, user_id: 2, emp_code: "MBX8" },
  { idx: 2, user_id: 3, emp_code: "MBX2" },
  { idx: 3, user_id: 4, emp_code: "MBX3" },
  { idx: 4, user_id: 5, emp_code: "BLK1" },
  { idx: 5, user_id: 6, emp_code: "MBX4" },
  { idx: 6, user_id: 7, emp_code: "MBX5" },
  { idx: 7, user_id: 8, emp_code: "MBX6" },
  { idx: 8, user_id: 9, emp_code: "BLK2" },
  { idx: 9, user_id: 10, emp_code: "MBX7" },
  { idx: 10, user_id: 11, emp_code: "CND2" },
  { idx: 11, user_id: 12, emp_code: "BLK3" },
];

export const EMPLOYEE_COUNT = EMPLOYEES.length;

const employeeMap = new Map<number, string>(
  EMPLOYEES.map((employee) => [employee.user_id, employee.emp_code])
);

export function getEmployeeCode(userId: number) {
  return employeeMap.get(userId) ?? `User ${userId}`;
}
