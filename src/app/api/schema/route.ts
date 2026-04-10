import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    // Fetch one record to see what columns exist
    const { data, error } = await supabase
      .from("allowedpeople")
      .select("*")
      .limit(1);

    if (error) {
      return NextResponse.json({
        error: error.message,
        code: error.code
      });
    }

    if (data && data.length > 0) {
      const columns = Object.keys(data[0]);
      return NextResponse.json({
        columns: columns,
        sampleRecord: data[0]
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
