import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { emp_code, user_id } = await request.json();

    if (!emp_code || !user_id) {
      return NextResponse.json(
        { error: "Employee code and user ID are required" },
        { status: 400 }
      );
    }

    // Validate emp_code format (should be like "MBX8", "BLK2", etc.)
    if (!/^[A-Z]{3}\d$/.test(emp_code)) {
      return NextResponse.json(
        { error: "Employee code must be in format: XXX# (e.g., MBX8, BLK2)" },
        { status: 400 }
      );
    }

    // Check if user_id already exists
    const { data: existingEmployee, error: checkError } = await supabase
      .from("allowedpeople")
      .select("user_id")
      .eq("user_id", user_id)
      .single();

    if (existingEmployee) {
      return NextResponse.json(
        { error: "An employee with this user ID already exists" },
        { status: 409 }
      );
    }

    // Check if emp_code already exists
    const { data: existingCode, error: codeCheckError } = await supabase
      .from("allowedpeople")
      .select("emp_code")
      .eq("emp_code", emp_code)
      .single();

    if (existingCode) {
      return NextResponse.json(
        { error: "An employee with this code already exists" },
        { status: 409 }
      );
    }

    // Add new employee to allowedpeople table
    const { data, error } = await supabase
      .from("allowedpeople")
      .insert([
        {
          email: `${emp_code.toLowerCase()}@company.com`, // Generate email
          password: "password123", // Default password
          admin: false, // New employees are not admins by default
          user_id: user_id,
          emp_code: emp_code,
        }
      ])
      .select();

    if (error) {
      console.error("Error adding employee:", error);
      return NextResponse.json(
        { error: "Failed to add employee to database" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Employee added successfully",
      employee: data[0]
    });
  } catch (error) {
    console.error("Add employee error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Get all employees from allowedpeople table
    const { data, error } = await supabase
      .from("allowedpeople")
      .select("idx, user_id, emp_code, email, admin")
      .order("idx");

    if (error) {
      console.error("Error fetching employees:", error);
      return NextResponse.json(
        { error: "Failed to fetch employees" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      employees: data,
      count: data?.length || 0
    });
  } catch (error) {
    console.error("Get employees error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}