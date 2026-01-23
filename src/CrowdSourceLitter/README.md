# CrowdSourceLitter – Development Setup Guide

This document walks you through **everything required to get the CrowdSourceLitter project running**, whether you are developing **locally**, **using Docker**, or **working with Supabase migrations**.

This repo is designed so that:

* No global Supabase install is required
* Docker usage is optional
* Secrets are never committed
* Local and production databases are clearly separated

---

## 📚 Table of Contents

- [CrowdSourceLitter – Development Setup Guide](#crowdsourcelitter--development-setup-guide)
  - [📚 Table of Contents](#-table-of-contents)
  - [✅ Prerequisites](#-prerequisites)
  - [📁 Repository Structure](#-repository-structure)
  - [🧩 Installing .NET](#-installing-net)
  - [🔐 Environment Variables \& Secrets](#-environment-variables--secrets)
    - [Rules](#rules)
    - [`.env.example` (committed)](#envexample-committed)
    - [`.env` (local development only)](#env-local-development-only)
    - [`.env.docker` (Docker only)](#envdocker-docker-only)
  - [🧰 Supabase CLI (Project-Local via npm)](#-supabase-cli-project-local-via-npm)
    - [Initialize npm](#initialize-npm)
    - [Install Supabase CLI](#install-supabase-cli)
    - [Available Supabase Commands](#available-supabase-commands)
  - [▶️ Running the Project Locally (No Docker)](#️-running-the-project-locally-no-docker)
  - [🐳 Running the Project with Docker](#-running-the-project-with-docker)
    - [Start the app](#start-the-app)
    - [Access the site](#access-the-site)
    - [Stop containers](#stop-containers)
  - [🗄 Using Supabase Locally (Migrations \& Testing)](#-using-supabase-locally-migrations--testing)
    - [Start local Supabase](#start-local-supabase)
    - [Create a migration](#create-a-migration)
    - [Apply migration locally](#apply-migration-locally)
    - [Stop local Supabase](#stop-local-supabase)
  - [🚀 Pushing Migrations to Production](#-pushing-migrations-to-production)
  - [📜 Common Commands](#-common-commands)
  - [🛠 Troubleshooting](#-troubleshooting)
    - [App won’t load in Docker](#app-wont-load-in-docker)
    - [Supabase CLI errors](#supabase-cli-errors)
    - [Database connection issues](#database-connection-issues)

---

## ✅ Prerequisites

Install the following **before starting**:

* **Git**
* **.NET SDK 10.0**
* **Docker Desktop** (optional, but recommended)
* **Node.js (LTS)** (for Supabase CLI only)
* **VS Code** (recommended editor)

---

## 📁 Repository Structure

```
CrowdSourceLitter/
├── docker-compose.yml
├── Dockerfile
├── .env.example
├── .env                # LOCAL ONLY (gitignored)
├── .env.docker         # DOCKER ONLY (gitignored)
├── supabase/
│   └── migrations/
├── src/
│   └── CrowdSourceLitter/
│       ├── CrowdSourceLitter.csproj
│       ├── Program.cs
│       ├── Domain/
│       ├── Application/
│       ├── Infrastructure/
│       └── Tests/
└── package.json
```

---

## 🧩 Installing .NET

Download and install **.NET SDK 10.0**:

[https://dotnet.microsoft.com/download](https://dotnet.microsoft.com/download)

Verify installation:

```bash
dotnet --version
```

---

## 🔐 Environment Variables & Secrets

### Rules

* **Never commit secrets**
* `.env` files are gitignored
* Docker and local development use **separate env files**

### `.env.example` (committed)

```env
SupabaseSettings__Url=
SupabaseSettings__AnonKey=
SupabaseSettings__ServiceRoleKey=

ASPNETCORE_ENVIRONMENT=Development
```

### `.env` (local development only)

Used when **not running Docker** and connecting to **local Supabase**:

```env
SupabaseSettings__Url=http://localhost:54321
SupabaseSettings__AnonKey=local-anon-key
SupabaseSettings__ServiceRoleKey=local-service-role-key

ASPNETCORE_ENVIRONMENT=Development
```

### `.env.docker` (Docker only)

Used when running the app inside Docker and connecting to **real Supabase**:

```env
SupabaseSettings__Url=https://<project-ref>.supabase.co
SupabaseSettings__AnonKey=prod-anon-key
SupabaseSettings__ServiceRoleKey=prod-service-role-key

ASPNETCORE_ENVIRONMENT=Development
```

---

## 🧰 Supabase CLI (Project-Local via npm)

Supabase CLI is installed **locally to the repo**, not globally.

### Initialize npm

```bash
npm init -y
```

### Install Supabase CLI

```bash
npm install --save-dev supabase
```

### Available Supabase Commands

```bash
npm run supabase:init
npm run supabase:start
npm run supabase:stop
npm run supabase:migration -- <name>
npm run supabase:push
npm run supabase:pull
npm run supabase:link
```

---

## ▶️ Running the Project Locally (No Docker)

1. Navigate to the project directory:

```bash
cd src/CrowdSourceLitter
```

2. Ensure `.env` exists in this directory

3. Run the app:

```bash
dotnet run
```

4. Open in browser:

```
http://localhost:5000
```

---

## 🐳 Running the Project with Docker

### Start the app

From the repo root:

```bash
docker compose up --build
```

### Access the site

```
http://localhost:5000
```

### Stop containers

```bash
docker compose down
```

---

## 🗄 Using Supabase Locally (Migrations & Testing)

Local Supabase is **optional** and used only for:

* Schema development
* Migration testing

### Start local Supabase

```bash
npm run supabase:start
```

### Create a migration

```bash
npm run supabase:migration -- add_new_feature
```

### Apply migration locally

```bash
npm run supabase:push
```

### Stop local Supabase

```bash
npm run supabase:stop
```

---

## 🚀 Pushing Migrations to Production

⚠️ **Only do this when you are sure**

1. Link to production Supabase:

```bash
npm run supabase:link
```

2. Push migrations:

```bash
npm run supabase:push
```

Supabase will prompt for confirmation before applying.

---

## 📜 Common Commands

| Action         | Command                              |
| -------------- | ------------------------------------ |
| Run locally    | `dotnet run`                         |
| Run Docker     | `docker compose up --build`          |
| Start Supabase | `npm run supabase:start`             |
| Stop Supabase  | `npm run supabase:stop`              |
| New migration  | `npm run supabase:migration -- name` |
| Push migration | `npm run supabase:push`              |

---

## 🛠 Troubleshooting

### App won’t load in Docker

* Ensure app listens on `0.0.0.0`
* Check port mapping in `docker-compose.yml`

### Supabase CLI errors

* Ensure `.env` formatting is correct
* Ensure UTF-8 encoding (no BOM)

### Database connection issues

* Verify correct env file is being used
* Confirm Supabase is running (local vs prod)

---