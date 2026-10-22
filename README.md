# ChinoInventorySystem

A modern Point-of-Sale (POS) and inventory management system designed for store owners and tindera/o operations, featuring real-time fast product search, stock management, sales tracking, and administrative analytics.

## Tech Stack

- **Frontend**: React, Vite, Modern CSS
- **Backend**: Java 21, Spring Boot 3.4, Spring Data JPA
- **Database**: PostgreSQL (Supabase ready) / H2

## Architecture

- `/frontend`: Vite + React web application with Tindera / Admin dashboards.
- `/backend`: Spring Boot REST API for inventory, products, sales, and user authentication.

---

## 🚀 Deployment Guide

### Part 1: Deploy Backend to Railway

1. Go to [railway.com](https://railway.com) and create a new project.
2. Select **"Deploy from GitHub repo"** and choose `ChinoInventorySystem`.
3. In your Railway service settings:
   - Railway will automatically detect `railway.json` and build using `backend/Dockerfile`.
   - Alternatively, under **Service Settings > General**, set **Root Directory** to `/backend`.
4. Go to the **Variables** tab on Railway and add your environment variables:
   - `SPRING_DATASOURCE_URL`: `jdbc:postgresql://aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres?sslmode=require`
   - `SPRING_DATASOURCE_USERNAME`: `postgres.fpbxuarfttscxzwstdrj`
   - `SPRING_DATASOURCE_PASSWORD`: `<your-supabase-password>`
   - `SUPABASE_URL`: `https://fpbxuarfttscxzwstdrj.supabase.co`
   - `SUPABASE_PUBLISHABLE_KEY`: `<your-supabase-publishable-key>`
   *(Railway automatically injects the `PORT` variable)*
5. Go to **Settings > Networking** and click **Generate Domain** (e.g. `chino-inventory-backend.up.railway.app`).
6. Copy your public Railway URL!

---

### Part 2: Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
2. Select the `ChinoInventorySystem` repository from GitHub.
3. In the project setup modal:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend` (click Edit and select `frontend`)
4. Expand **Environment Variables** and add:
   - `VITE_API_URL`: Your Railway backend domain from Part 1 (e.g. `https://chino-inventory-backend.up.railway.app`)
5. Click **Deploy**. Vercel will build and deploy your frontend with full SPA routing!

---

## 💻 Local Development

### Prerequisites
- Node.js (v18+)
- Java JDK 21
- Maven

### Running the Backend
```bash
cd backend
./mvnw spring-boot:run
```
Backend runs on `http://localhost:8085`.

### Running the Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on `http://localhost:5173`.
