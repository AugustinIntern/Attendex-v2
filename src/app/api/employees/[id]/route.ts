import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = parseInt(id);
    const { emp_code, user_id: newUserId, is_archived } = await request.json();

    const payload: any = {};
    if (emp_code) {
      if (!/^[A-Z]{3}\d$/.test(emp_code)) {
        return NextResponse.json(
          { error: "Employee code must be in format: XXX# (e.g., MBX8, BLK2)" },
          { status: 400 }
        );
      }
      payload.emp_code = emp_code;
    }

    if (newUserId !== undefined && newUserId !== userId) {
      payload.user_id = newUserId;
    }

    if (is_archived !== undefined) {
      payload.is_archived = is_archived;
    }

    if (Object.keys(payload).length === 0) {
      return NextResponse.json(
        { error: "No fields to update provided" },
        { status: 400 }
      );
    }

    // Attempt to update
    const { data, error } = await supabase
      .from("user_mapping")
      .update(payload)
      .eq("user_id", userId)
      .select();

    if (error) {
      console.error("Error updating employee:", error);
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Device User ID or Employee Code is already in use" },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: "Failed to update employee" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Employee updated successfully",
      employee: data[0]
    });
  } catch (error) {
    console.error("Update employee error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = parseInt(id);

    const { error } = await supabase
      .from("user_mapping")
      .update({ is_archived: true })
      .eq("user_id", userId);

    if (error) {
      console.error("Error archiving employee:", error);
      
      // Specifically handle missing column error from PostgREST/Supabase
      if (error.code === 'PGRST204' || error.message.includes('is_archived')) {
        return NextResponse.json(
          { 
            error: "Database Archiving Not Enabled", 
            details: "The 'is_archived' column is missing from your 'user_mapping' table. Please run: ALTER TABLE user_mapping ADD COLUMN is_archived BOOLEAN DEFAULT false;" 
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: "Failed to archive employee" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Employee deleted successfully" });
  } catch (error) {
    console.error("Delete employee error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
