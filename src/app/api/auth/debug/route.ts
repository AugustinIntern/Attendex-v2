import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    // First, let's see what tables exist
    const { data: tables, error: tablesError } = await supabase
      .from("allowedpeople")
      .select("*")
      .limit(1);

    if (tablesError) {
      console.error("Table query error:", tablesError);

      // Try alternative table names
      const alternativeTables = ["allowed_people", "allowedpeople", "users", "allowed_users"];

      for (const tableName of alternativeTables) {
        try {
          const { data, error } = await supabase
            .from(tableName)
            .select("*")
            .limit(1);

          if (!error) {
            return NextResponse.json({
              foundTable: tableName,
              sampleData: data,
              message: `Found table: ${tableName}`
            });
          }
        } catch (e) {
          // Continue trying other tables
        }
      }

      return NextResponse.json({
        error: "Could not find allowed_people table or any alternative",
        supabaseError: tablesError,
        triedTables: alternativeTables
      }, { status: 500 });
    }

    // Get all records from the correct table
    const { data, error } = await supabase
      .from("allowedpeople")
      .select("email, admin, idx");

    if (error) {
      console.error("Data query error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      count: data?.length || 0,
      records: data,
      tableName: "allowedpeople"
    });
  } catch (error) {
    console.error("Debug endpoint error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error },
      { status: 500 }
    );
  }
}
