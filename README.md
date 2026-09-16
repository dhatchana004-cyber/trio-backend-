# TRIO Backend API

This is the backend for the TRIO time and attendance application. It is a standalone REST API built with Node.js, Express, TypeScript, and Prisma (PostgreSQL).

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (ensure it is running locally or remotely)
- AWS S3 bucket (or local mocked directory) for selfies

## Setup Instructions

1. **Install dependencies:**
   ```bash
   cd server
   npm install
   ```

2. **Environment Variables:**
   Copy `.env.example` to `.env` and fill in your actual configuration values:
   ```bash
   cp .env.example .env
   ```
   Ensure the `DATABASE_URL` points to your active PostgreSQL instance.

3. **Database Migration:**
   Run Prisma migrations to create the required tables in your database:
   ```bash
   npx prisma migrate dev --name init
   ```

4. **Generate Prisma Client:**
   ```bash
   npx prisma generate
   ```

5. **Start Development Server:**
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:3000` (or whatever `PORT` you configured).

## Example Requests

To manually test the endpoints using Postman or Thunder Client, see the `examples.md` file (which will be generated in the root of the project).
