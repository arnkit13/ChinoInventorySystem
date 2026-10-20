# ChinoInventorySystem

A modern Point-of-Sale (POS) and inventory management system designed for store owners and tindera/o operations, featuring real-time fast product search, stock management, sales tracking, and administrative analytics.

## Tech Stack

- **Frontend**: React, Vite, Modern CSS
- **Backend**: Java, Spring Boot, Spring Data JPA
- **Database**: H2 (In-memory development) / PostgreSQL / Supabase ready

## Architecture

- `/frontend`: Vite + React web application with Tindera / Admin dashboards.
- `/backend`: Spring Boot REST API for inventory, products, sales, and user authentication.

## Getting Started

### Prerequisites
- Node.js (v18+)
- Java JDK 17+
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
