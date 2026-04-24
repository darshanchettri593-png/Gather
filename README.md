# Gather

Gather is a free community event platform for Siliguri, India. Anyone hosts, anyone joins, no fees, no gatekeeping.

## Tech Stack
- React + Vite + TypeScript
- Tailwind CSS + shadcn/ui components
- Supabase (Auth + Postgres + Storage)

## Setup Steps

### 1. Supabase Project Creation
1. Create a new Supabase project at [database.new](https://database.new)
2. In the sidebar, go to "Authentication" -> "Providers" and enable:
   - Email (Magic Link)
   - Google OAuth (optional, follow Supabase instructions to get Client ID & Secret)

### 2. SQL Migration
In the Supabase SQL editor on your project dashboard, copy and paste the entire contents of the `setup.sql` file and run it. This will create the `profiles`, `events`, and `attendees` tables, add necessary constraints, Row Level Security (RLS) policies, and set up a trigger for automatically syncing auth users to `profiles`.

### 3. Environment Setup
Rename `.env.example` to `.env.local` and add your Supabase credentials:

```bash
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 4. Run Locally
Install dependencies and run the development server:
```bash
npm install
npm run dev
```
