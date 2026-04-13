import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const clientId = process.env.ZOHO_CLIENT_ID;
    const clientSecret = process.env.ZOHO_CLIENT_SECRET;
    const refreshToken = process.env.ZOHO_REFRESH_TOKEN;

    if (!clientId || !clientSecret || !refreshToken) {
      throw new Error("Zoho credentials missing in environment variables");
    }

    // 1. Refresh Zoho Access Token
    // Strictly omitting scope as requested. Ensuring URL encoded body.
    const tokenParams = new URLSearchParams();
    tokenParams.append("refresh_token", refreshToken);
    tokenParams.append("client_id", clientId);
    tokenParams.append("client_secret", clientSecret);
    tokenParams.append("grant_type", "refresh_token");

    const tokenResponse = await fetch("https://accounts.zoho.com/oauth/v2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: tokenParams.toString(),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenData.access_token) {
      console.error("Zoho Token Error:", tokenData);
      return NextResponse.json({ 
        success: false, 
        error: `Failed to refresh Zoho token: ${tokenData.error || "Unknown error"}` 
      }, { status: 400 });
    }

    const accessToken = tokenData.access_token;

    // 2. Fetch Employees from Zoho People
    const employeesResponse = await fetch("https://people.zoho.com/people/api/forms/employee/getRecords", {
      headers: {
        Authorization: `Zoho-oauthtoken ${accessToken}`,
      },
    });

    const employeesData = await employeesResponse.json();
    
    // Check for Zoho-specific errors in the response body
    if (employeesData.response?.errors || employeesData.error) {
      const zohoError = employeesData.response?.errors || employeesData.error;
      console.error("Zoho API returned an error:", employeesData);
      return NextResponse.json({
        success: false,
        error: `Zoho API Error: ${zohoError.message || JSON.stringify(zohoError)}`,
        details: employeesData
      }, { status: 400 });
    }

    // Per user instructions, records are at response.result
    const zohoEmployees = employeesData.response?.result;

    if (!zohoEmployees || !Array.isArray(zohoEmployees)) {
      throw new Error("Failed to parse Zoho records (expected response.result array)");
    }

    let updatedCount = 0;
    let errors = [];

    // 3. Update Supabase user_mapping
    for (const recordWrapper of zohoEmployees) {
      try {
        const values = Object.values(recordWrapper);
        if (!values.length || !Array.isArray(values[0]) || !values[0].length) continue;
        
        const employee = values[0][0];
        
        const empCode = employee.EmployeeID;
        const firstName = employee.FirstName || "";
        const lastName = employee.LastName || "";
        const name = `${firstName} ${lastName}`.trim();
        const email = employee.EmailID || "";

        if (!empCode) continue;

        const { data: existingRows, error: findError } = await supabase
          .from("user_mapping")
          .select("user_id")
          .eq("emp_code", empCode);

        if (findError) throw findError;

        if (existingRows && existingRows.length > 0) {
          for (const row of existingRows) {
            const { error: updateError } = await supabase
              .from("user_mapping")
              .update({ name, email })
              .eq("user_id", row.user_id);

            if (updateError) throw updateError;
          }
          updatedCount++;
        } else {
          const { error: insertError } = await supabase
            .from("user_mapping")
            .insert({
              emp_code: empCode,
              name: name,
              email: email,
              is_archived: false
            });

          if (insertError) throw insertError;
          updatedCount++;
        }
      } catch (err) {
        errors.push({ error: String(err) });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${updatedCount} employees.`,
      details: {
        total: zohoEmployees.length,
        updated: updatedCount,
        errors: errors.length > 0 ? errors : undefined
      }
    });
  } catch (error) {
    console.error("Sync Error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
