# Smoke Dash

A full-stack dashboard application built with modern TypeScript tooling.

---

## Overview

Smoke Dash is a scalable dashboard platform designed for managing users, entities, operations, and audit activity through a modern admin interface.

The project uses:

- Next.js
- TypeScript
- Prisma ORM
- PostgreSQL
- Fastify
- React Query
- Zustand
- JWT Authentication

---

# Features

## Authentication & Authorization

- JWT-based authentication
- Role-based access control
- Protected routes
- Session management

## Dashboard

- Responsive admin dashboard
- Metrics and overview pages
- Entity management
- Pagination and filtering

## Audit Logging

- Track create/update/delete actions
- Entity-level audit history
- User activity tracking
- Timestamped event records

## Data Management

- CRUD operations
- Server-side validation
- Pagination
- Search and filtering
- Transaction-safe database operations

## Developer Experience

- TypeScript across frontend and backend
- Prisma migrations
- ESLint setup
- Structured folder architecture
- Reusable hooks and components

---

# Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js + React + TypeScript |
| Backend | Fastify |
| Database | PostgreSQL |
| ORM | Prisma |
| State Management | Zustand |
| Data Fetching | React Query |
| Authentication | JWT |
| Styling | CSS Modules |

---

# Project Structure

```txt
project-root/
├── backend/
│   ├── prisma/
│   ├── src/
│   ├── routes/
│   ├── services/
│   ├── middleware/
│   └── utils/
│
├── frontend/
│   ├── app/
│   ├── components/
│   ├── hooks/
│   ├── stores/
│   ├── styles/
│   └── types/
│
└── README.md
```

---

# Environment Variables

Create a `.env` file inside the backend directory.

```env
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
JWT_SECRET="your-secret"
PORT=5000
NODE_ENV=development
```

---

# Installation

## Clone the repository

```bash
git clone <your-repository-url>
cd Smoke-Dash
```

## Backend Setup

```bash
cd backend
npm install
```

## Prisma Setup

```bash
npx prisma migrate dev
npx prisma generate
```

## Seed Database

```bash
npm run seed
```

## Start Backend

```bash
npm run dev
```

---

# Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

# Scripts

## Backend

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run test
```

## Frontend

```bash
npm run dev
npm run build
npm run start
npm run lint
```

---

# API Design

The backend follows a service-based architecture:

```txt
Route -> Controller -> Service -> Prisma -> Database
```

This keeps:

- business logic isolated
- controllers lightweight
- database access centralized
- validation easier to maintain

---

# Database

Prisma manages schema migrations and database access.

Example entities:

- Users
- Doctors
- Patients
- Applications
- Bookings
- Audit Logs

---

# Audit Logging System

The audit logging system tracks:

- action type
- entity type
- entity ID
- user ID
- old values
- new values
- timestamps
- IP addresses

Supported actions:

- CREATE
- UPDATE
- DELETE