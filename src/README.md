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

# Trash Scoring Pipeline

This repo includes a background worker that runs segmentation inference on uploaded image rows and writes report-level trash scores/ranks.

## 1️⃣ Apply DB Migration

From: `SeniorDesign/Src`

```bash
npx supabase db push
```

This applies the migration that adds:
- `images.inference_status`, `images.trash_coverage`, `images.trash_instances`, `images.processed_at`
- `reports.avg_trash_coverage`, `reports.avg_trash_instances`
- `reports.trash_coverage_rank`, `reports.trash_instances_rank`

## 2️⃣ Install Python dependencies

From: `SeniorDesign/Src/model_training`

```bash
pip install -r requirements.txt
```

## 3️⃣ Run the inference worker

The worker script is: `model_training/photo_inference_worker.py`

Example:

```bash
python photo_inference_worker.py \
	--supabase-url "$SUPABASE_URL" \
	--supabase-service-key "$SUPABASE_SERVICE_ROLE_KEY" \
	--model yolo_trash_seg.pt
```

Behavior:
- Polls `images` rows with `inference_status = 'pending'`
- Runs YOLO segmentation on each uploaded photo
- Writes per-image scores (`trash_coverage`, `trash_instances`)
- Recomputes report averages and updates report rank columns after each image

Use `--once` to process a single batch and exit.

