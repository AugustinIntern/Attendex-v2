import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { emp_code, user_id } = await request.json();

    if (!emp_code) {
      return NextResponse.json(
        { error: "Employee code is required" },
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

    // Check if emp_code already exists
    const { data: existingCode, error: codeCheckError } = await supabase
      .from("user_mapping")
      .select("emp_code")
      .eq("emp_code", emp_code)
      .single();

    if (existingCode) {
      return NextResponse.json(
        { error: "An employee with this code already exists" },
        { status: 409 }
      );
    }

    // Add new employee to user_mapping table
    const payload: any = { emp_code: emp_code };
    if (user_id !== undefined) {
      payload.user_id = user_id;
    }
    
    const { data, error } = await supabase
      .from("user_mapping")
      .insert([payload])
      .select();

    if (error) {
      console.error("Error adding employee:", error);
      // Supabase Postgres unique constraint code
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "This Device User ID is already assigned to an employee" },
          { status: 409 }
        );
      }
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const showArchived = searchParams.get("archived") === "true";

    // Get all employees from user_mapping table
    let { data, error } = await supabase
      .from("user_mapping")
      .select("user_id, emp_code, name, email, is_archived")
      .order("user_id");

    if (error && error.code === '42703') {
      console.warn("is_archived column missing, falling back");
      const fallback = await supabase
        .from("user_mapping")
        .select("user_id, emp_code, name, email")
        .order("user_id");
      data = fallback.data as any; // Cast as any to avoid type mismatch on missing column
      error = fallback.error;
    }

    if (error) {
      console.error("Error fetching employees:", error);
      return NextResponse.json(
        { error: "Failed to fetch employees" },
        { status: 500 }
      );
    }

    // Filter based on archived status
    const filteredEmployees = (data || []).filter(emp => 
      showArchived ? emp.is_archived === true : !emp.is_archived
    );

    return NextResponse.json({ employees: filteredEmployees });
  } catch (error) {
    console.error("Fetch employees error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}