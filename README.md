# Study Abroad Platform Backend (MERN)

A beginner-friendly Express + MongoDB backend for a study-abroad platform.

## Overview
This project provides a simple backend API for:
- user authentication
- student profile access
- program discovery
- recommendation scoring using MongoDB aggregation
- application workflow management

## Features
- JWT authentication (`register`, `login`, protected `profile`)
- Program listing with filtering, pagination, and sorting
- Aggregation-based recommendations from user preferences
- Application workflow with:
  - duplicate prevention (one application per user+program)
  - valid status transitions
  - status history
- In-memory caching for frequent discovery endpoints
- Basic rate limiting on auth/protected/discovery routes
- Validation + centralized error handling
- Critical API tests with Jest + Supertest + in-memory MongoDB

## Tech Stack
- Node.js + Express
- MongoDB + Mongoose
- JWT + bcryptjs
- Jest + Supertest

## Project Structure
```text
.
├── app.js
├── server.js
├── config/
├── controllers/
├── middleware/
├── models/
├── routes/
├── tests/
└── utils/
```

## Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy env file:
   ```bash
   cp .env.example .env
   ```
3. Update `.env` values.
4. Start server:
   ```bash
   npm run dev
   ```
   or
   ```bash
   npm start
   ```

## Environment Variables
See `.env.example`:
- `PORT`
- `MONGO_URI`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`

## Run Tests
```bash
npm test
```

## API Endpoints

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`

### User
- `GET /api/users/profile` (authentication required)

### Programs
- `GET /api/programs`
  - Query: `country`, `fieldOfStudy`, `intake`, `page`, `limit`, `sort`
  - Sorting: `sort=field` (asc), `sort=-field` (desc)
- `GET /api/programs/recommendations` (authentication required)

### Applications
- `POST /api/applications`
- `PATCH /api/applications/:id/status`

## Recommendation Scoring
Recommendations use a MongoDB aggregation pipeline and add score points:
- `+5` preferred country match
- `+4` field of study match
- `+3` tuition within budget
- `+2` intake match
- `+2` IELTS eligibility match

Results are sorted by score descending, then tuition ascending.

## Application Status Rules
Allowed transitions:
- `Applied -> Reviewed`
- `Reviewed -> Accepted` or `Reviewed -> Rejected`
- `Accepted` and `Rejected` are terminal states

Every status update is appended to `statusHistory`.

## Indexing Strategy
- `users.email` unique index for fast login and duplicate prevention
- `programs.country`, `programs.fieldOfStudy`, `programs.intake` indexes for discovery filters
- compound `programs(country, fieldOfStudy, intake)` index for common filter combinations
- compound unique `applications(user, program)` index for duplicate application prevention

## Caching Approach
A lightweight in-memory cache stores successful responses for discovery endpoints for a short TTL (30 seconds). Cache keys include query params and user context to avoid cross-user collisions.

## Performance Considerations
- Uses MongoDB filtering/pagination/sorting directly in queries (no in-memory pagination)
- Aggregation executes recommendation scoring inside MongoDB
- Indexes target common read and uniqueness patterns
- Uses route-level cache for frequently repeated reads

## Assumptions & Decisions
- Recommendations endpoint is protected and primarily uses logged-in user preferences.
- Program management (create/update/delete) is out of scope for this assignment.
- Cache invalidation for program updates is not needed yet because mutation routes are not included in scope.
