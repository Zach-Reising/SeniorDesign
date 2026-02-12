# Crowd Source Litter Pickup

This project uses:

- **Ionic React** for the frontend
- **Supabase** for authentication and database
- **Supabase CLI** for database migrations

---

# 📁 Project Structure

SeniorDesign/
│
├── Src/
│ ├── frontend/
│ │ └── crowdsourcelitter-app/
│ │    └── src/
│ │
│ └── supabase/
│      └── migrations/


- `Src/frontend/crowdsourcelitter-app` → Ionic React application  
- `Src/supabase` → Database configuration and migrations  

---

# 🚀 Ionic React Setup

## 1️⃣ Install Dependencies

From: SeniorDesign/Src/frontend/crowdsourcelitter-app



Run:

```bash
npm install
```

Create a .env file inside: crowdsourcelitter-app/
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key

Run the App:
```bash
npm run dev
```

# 🗄 Supabase CLI Setup (Migrations)

All Supabase commands should be run from: SeniorDesign/Src


## 1️⃣ Initialize Supabase (First Time Only)
```bash
npx supabase init
```

## 2️⃣ Link to Remote Project
```bash
npx supabase link
```

Proceed with the login steps and select the correct project

## 3️⃣ Pull Current Database Schema
```bash
npx supabase db pull
```

This creates a baseline migration inside: supabase/migrations/

If you get an error run the suggested code with npx prefixed in front should look something like:
```bash
 npx supabase migration repair --status reverted 20260123012706
 npx supabase migration repair --status reverted 20260208161835
 npx supabase migration repair --status reverted 20260208171416
 npx supabase migration repair --status reverted 20260208171549
```

# 📝 Creating Migrations
## Create a New Migration
```bash
npx supabase migration new migration_name

```

This creates a new SQL file inside: supabase/migrations/

Edit the SQL inside that file.

## Apply Migrations to Remote Database
```bash
npx supabase db push
```

# Important Notes
Always create migrations instead of editing tables directly in the dashboard.

Commit all files inside supabase/migrations/.

Restart the frontend dev server after changing environment variables.

# Quick Start Summary
```bash
cd Src/frontend/crowdsourcelitter-app
npm install
npm run dev
```

## Work with Database
```bash
cd Src
npx supabase migration new your_migration_name
npx supabase db push
```

