import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const table = request.nextUrl.searchParams.get("table") || "allowedpeople";
    // Fetch 5 records to see what columns exist across them
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .limit(5);

    if (error) {
      return NextResponse.json({
        error: error.message,
        code: error.code
      });
    }

    if (data && data.length > 0) {
      const columns = new Set<string>();
      data.forEach(d => Object.keys(d).forEach(k => columns.add(k)));
      return NextResponse.json({
        columns: Array.from(columns),
        sampleRecord: data
      });
    }

    return NextResponse.json({
      message: "Table is empty",
      error: "No records found"
    });
  } catch (error) {
    return NextResponse.json({
      error: String(error)
    });
  }
}
