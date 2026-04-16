# AttendEx

AttendEx is a modern attendance tracking and employee management web application. It integrates seamlessly with Supabase for backend data storage and synchronizes employee data directly from Zoho People. It is built to monitor live daily presence, analyze historical attendance statistics, and manage missing attendance records.

## Features

- **Dashboard**: A high-level overview displaying today's operational presence, missing personnel, and a live feed of check-ins and check-outs.
- **Employee Directory**: Enables viewing, managing, and searching through active and archived employees fetched from Zoho People.
- **Attendance Logs**: Real-time display of biometric and manual attendance scans.
- **Past Day Attendance**: Allows managers to traverse previous days to review attendance logs. Also enables editing attendance records to resolve discrepancies manually (updates device origin to `admin_fix`) and marks records for re-sync to Zoho.
- **Statistics Page**: Comprehensive visual charts and tables for analyzing historical attendance data on a monthly and daily basis.
- **Zoho People Sync**: Automatically fetches and maps employees from the company's Zoho People account into the local database, removing the need for manual dual data entry.
- **Settings**: Allows admin personnel to manually trigger the Zoho integration sync, view data validation rules, and monitor Zoho API daily credit usage.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router format)
- **Database Backend**: [Supabase](https://supabase.com/) (PostgreSQL)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Integration**: Zoho People API v2

## Database Structure

The Supabase PostgreSQL database consists of the following primary tables:

1. **`attendance_logs`**
   - Stores raw scan data from biometric devices and manual edits.
   - Key Columns: `id` (PK), `user_id` (device code), `timestamp` (UTC time of scan), `device_ip` (origin, e.g. biometric IP or `admin_fix`), `synced_to_zoho_status` (string boolean representing Zoho sync state), `check_type` (1 for Check-in, Out for Check-out).

2. **`user_mapping`**
   - Caches employee profiles downloaded from Zoho People to match against biometric IDs.
   - Key Columns: `user_id` (PK, internal biometric device assigned), `emp_code` (Employee ID bridging to Zoho), `name` (Employee's full name), `email` (Work email address), `is_archived` (Status flag).

3. **`allowedpeople`**
   - Governs administrative access to AttendEx.
   - Key Columns: `id`, `name`, `email` (Authorized admin email logins).

4. **`api_usage`**
   - Used to monitor the Zoho API limits and track synchronization footprint.
   - Key Columns: `idx` (PK), `date` (Active day), `call_count` (Incremental total of API invocations for the day), `updated_at` (Timestamp of last invocation).

## How the Zoho Sync Works

The Zoho People synchronization process handles creating mapping relationships:
1. When a sync is triggered, the app fetches an updated OAuth access token from Zoho using the configured Client ID, Client Secret, and Refresh Token.
2. The server seamlessly asks for the "Employee" form data from the Zoho People API endpoint.
3. The response is processed, updating existing profiles in the `user_mapping` table or inserting new ones by matching the `EmployeeID` field.

## How to Add a New Employee

Adding an employee requires ensuring coordination between external systems (Zoho and biometric device): 
1. **Zoho Setup**: Provide the new hire's information directly into Zoho People. Make absolutely certain they possess a correct, unique `Employee ID`.
2. **Sync App**: Go to the **Settings** page within AttendEx and click the **Start Sync** button to pull their data locally.
3. **Verify**: Visit the Employee Directory tab to confirm they appear within the active list.
4. **Biometrics**: Extract their generated `User ID` / `Emp Code` from the UI and manually register their fingerprints/face on the physical biometric device assigned to that specific User ID.

## Environment Variables

For AttendEx to function, you need to configure an `.env.local` file at the root. Do NOT share these tokens publicly.

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Zoho OAuth Variables
ZOHO_CLIENT_ID=1000....
ZOHO_CLIENT_SECRET=xxx...
ZOHO_REFRESH_TOKEN=1000....

# AttendEx Toggles 
NEXT_PUBLIC_DEBUG_MODE=true # (Optional, unlocks bypass debugging routes)
```

## Running Locally

To work on AttendEx, clone the repository and run the development environment:

1. Ensure [Node.js](https://nodejs.org/) (v18+) is installed.
2. Clone the repository and navigate inside:
   ```bash
   git clone <repository_url>
   cd AttendEx-v2
   ```
3. Install the dependencies using npm:
   ```bash
   npm install
   ```
4. Define your environment variables in `.env.local` according to the template above.
5. Launch the Next.js development server:
   ```bash
   npm run dev
   ```
6. Open [http://localhost:3000](http://localhost:3000) with your web browser.

## Deployment

AttendEx is designed exclusively for [Vercel](https://vercel.com).
1. Push your repository to your Github account.
2. Link the repository to Vercel via their dashboard (`Add New...` -> `Project`).
3. Add the `NEXT_PUBLIC_SUPABASE...` and `ZOHO_...` blocks in the Environment Variables tab.
4. Deploy.

## Zoho API Limitations

The Zoho endpoint limits requests. Your plan enforces a strict **10,000 credit limit per day**. Each invocation made via the App's sync system takes 1 credit. The settings menu visually projects how many are left. Exceeding this limit will block attendance reporting and directory modifications until midnight standard Zoho time when limits refresh.
