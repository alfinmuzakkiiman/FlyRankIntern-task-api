# Task API

A simple REST API for managing tasks, built with Node.js, Express.js, and PostgreSQL.

This project was developed as part of my internship at **FlyRank AI** across **Week 2 and Week 3**.

In Week 2, I built the CRUD API using an in-memory array. In Week 3, I migrated the storage layer to PostgreSQL and containerized the application and database using Docker Compose while keeping the API endpoints and behavior consistent.

The project focuses on practical backend development concepts, including REST API design, CRUD operations, request validation, HTTP status codes, SQL, database persistence, PostgreSQL, Docker, Docker Compose, Swagger/OpenAPI documentation, and a Git/GitHub Pull Request workflow.

---

# Tech Stack

- Node.js
- Express.js
- PostgreSQL
- `pg`
- `dotenv`
- Docker
- Docker Compose
- Swagger UI
- OpenAPI
- DBeaver
- Git & GitHub

---

# Features

- Create a new task
- Get all tasks
- Get a task by ID
- Update a task
- Delete a task
- Request validation
- HTTP status code handling
- Persistent task storage with PostgreSQL
- Automatic database connection
- Automatic table creation
- Initial seed data only when the table is empty
- Parameterized SQL queries
- Dockerized application
- Dockerized PostgreSQL database
- PostgreSQL persistence using a named Docker volume
- Interactive API documentation with Swagger UI
- Database exploration using `psql` or DBeaver

---

# Getting Started

## Requirements

Make sure you have installed:

- Docker Desktop
- Git

Docker Desktop provides both Docker Engine and Docker Compose.

Check your installation:

```bash
docker --version
docker compose version
git --version
```

Node.js and npm are only required if you want to run or develop the application directly outside Docker.

---

# Quick Start

The application and PostgreSQL database are designed to run together using Docker Compose.

## 1. Clone the repository

```bash
git clone https://github.com/alfinmuzakkiiman/FlyRankIntern-task-api.git
```

Navigate to the project:

```bash
cd FlyRankIntern-task-api
```

## 2. Create the environment file

Copy the example environment file.

### Windows PowerShell

```powershell
Copy-Item .env.example .env
```

### Linux / macOS

```bash
cp .env.example .env
```

The `.env.example` file contains:

```env
DATABASE_URL=postgres://postgres:dev@db:5432/tasks
```

The `.env` file is ignored by Git and should not be committed.

## 3. Start the whole stack

Run:

```bash
docker compose up
```

Or run in detached mode:

```bash
docker compose up -d
```

Docker Compose starts:

- Task API
- PostgreSQL database

The API will be available at:

```text
http://localhost:3000
```

PostgreSQL is exposed to the host on:

```text
localhost:5433
```

Inside the Docker Compose network, the application connects to PostgreSQL using:

```text
db:5432
```

---

# Environment Variables

The application uses the following environment variable:

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgres://postgres:dev@db:5432/tasks` |

The project includes `.env.example` as a template.

The actual `.env` file is ignored by Git:

```gitignore
.env
```

Do not commit real credentials or secrets to the repository.

---

# Docker Compose

The stack is defined in `docker-compose.yml`.

The application runs as the `app` service:

```text
Task API
Port 3000
```

The database runs as the `db` service:

```text
PostgreSQL
Container port 5432
Host port 5433
```

The PostgreSQL data directory is backed by a named Docker volume:

```text
taskdata
```

The volume is mounted at:

```text
/var/lib/postgresql/data
```

This allows PostgreSQL data to survive container recreation.

---

# Database Initialization

The application automatically creates the `tasks` table when the application starts if the table does not already exist.

The schema is:

```sql
CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  done BOOLEAN NOT NULL DEFAULT FALSE
);
```

The application then checks whether the table contains any rows.

If the table is empty, three example tasks are inserted:

```text
Learn Express
Build Task API
Test API endpoints
```

The seed data is inserted only when the table contains zero rows.

This prevents duplicate seed data when the application or containers are restarted while existing database data is still available.

---

# Database Schema

The `tasks` table contains:

| Column | PostgreSQL Type | Description |
|--------|------------------|-------------|
| `id` | `SERIAL` / integer | Primary key and unique task ID |
| `title` | `TEXT` | Task title |
| `done` | `BOOLEAN` | Task completion status |

Example task:

```json
{
  "id": 1,
  "title": "Learn Express",
  "done": false
}
```

---

# Database Viewer

The PostgreSQL database can be inspected using `psql` or a GUI database client such as DBeaver.

To open `psql` inside the running PostgreSQL container:

```bash
docker exec -it taskdb psql -U postgres -d tasks
```

List the tables:

```sql
\dt
```

Describe the `tasks` table:

```sql
\d tasks
```

View all tasks:

```sql
SELECT * FROM tasks ORDER BY id;
```

Example:

```text
 id |         title          | done
----+------------------------+------
  1 | Learn Express          | f
  2 | Build Task API         | f
  3 | Test API endpoints     | t
```

## Database Screenshot

![PostgreSQL Database Viewer](docs/database-viewer.png)

---

# API Documentation

Interactive API documentation is available through Swagger UI:

```text
http://localhost:3000/docs
```

Swagger UI allows the API endpoints to be explored and tested directly from the browser using the **Try it out** feature.

## Swagger UI Screenshot

![Swagger UI](docs/swagger-ui.png)

---

# API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get API information |
| GET | `/health` | Check API health |
| GET | `/tasks` | Get all tasks |
| GET | `/tasks/:id` | Get a task by ID |
| POST | `/tasks` | Create a new task |
| PUT | `/tasks/:id` | Update a task |
| DELETE | `/tasks/:id` | Delete a task |

---

# Task Object

A task has the following structure:

```json
{
  "id": 1,
  "title": "Learn Express",
  "done": false
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | number | Unique task ID |
| `title` | string | Task title |
| `done` | boolean | Task completion status |

---

# API Examples

## Get API Information

```bash
curl -i http://localhost:3000/
```

Example response:

```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
```

```json
{
  "name": "Task API",
  "version": "1.0",
  "endpoints": [
    "/tasks"
  ]
}
```

---

## Health Check

```bash
curl -i http://localhost:3000/health
```

Example response:

```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
```

```json
{
  "status": "ok"
}
```

---

## Get All Tasks

```bash
curl -i http://localhost:3000/tasks
```

Example response:

```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
```

```json
[
  {
    "id": 1,
    "title": "Learn Express",
    "done": false
  },
  {
    "id": 2,
    "title": "Build Task API",
    "done": false
  },
  {
    "id": 3,
    "title": "Test API endpoints",
    "done": true
  }
]
```

The data is read directly from PostgreSQL.

---

## Get a Task by ID

```bash
curl -i http://localhost:3000/tasks/1
```

Example response:

```http
HTTP/1.1 200 OK
```

```json
{
  "id": 1,
  "title": "Learn Express",
  "done": false
}
```

If the task does not exist:

```bash
curl -i http://localhost:3000/tasks/99
```

Response:

```http
HTTP/1.1 404 Not Found
```

```json
{
  "error": "Task 99 not found"
}
```

---

## Create a Task

```bash
curl -i -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Buy milk"}'
```

Example response:

```http
HTTP/1.1 201 Created
Content-Type: application/json; charset=utf-8
```

```json
{
  "id": 4,
  "title": "Buy milk",
  "done": false
}
```

The server automatically:

- Generates the task ID through PostgreSQL
- Trims the title
- Sets `done` to `false`
- Inserts the task into PostgreSQL

---

## Update a Task

```bash
curl -i -X PUT http://localhost:3000/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{"title":"Learn Express Updated","done":true}'
```

Example response:

```http
HTTP/1.1 200 OK
```

```json
{
  "id": 1,
  "title": "Learn Express Updated",
  "done": true
}
```

The update is written to PostgreSQL using an SQL `UPDATE` statement.

---

## Delete a Task

```bash
curl -i -X DELETE http://localhost:3000/tasks/1
```

Example response:

```http
HTTP/1.1 204 No Content
```

The response body is empty because the task was successfully deleted.

The row is also removed from PostgreSQL.

---

# Validation

The API validates incoming request data.

## Create Task Validation

The `title` field is required and must be a non-empty string.

Request:

```bash
curl -i -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{}'
```

Response:

```http
HTTP/1.1 400 Bad Request
```

```json
{
  "error": "Title is required"
}
```

Whitespace-only titles are also rejected.

---

## Update Task Validation

An update must contain at least one of:

- `title`
- `done`

The `title` must be a non-empty string.

The `done` field must be a boolean.

Example invalid body:

```json
{
  "done": "true"
}
```

Response:

```http
HTTP/1.1 400 Bad Request
```

```json
{
  "error": "Done must be a boolean"
}
```

Example invalid title:

```json
{
  "title": ""
}
```

Response:

```json
{
  "error": "Title must be a non-empty string"
}
```

---

# Unknown Task

If a task ID does not exist, the API returns:

```http
HTTP/1.1 404 Not Found
```

Example:

```bash
curl -i http://localhost:3000/tasks/99
```

Response:

```json
{
  "error": "Task 99 not found"
}
```

---

# HTTP Status Codes

| Status Code | Meaning |
|-------------|---------|
| `200` | Request successful |
| `201` | Resource created successfully |
| `204` | Resource deleted successfully |
| `400` | Invalid request or validation error |
| `404` | Resource not found |
| `500` | Internal server/database error |

---

# CRUD Flow

The API supports the complete CRUD lifecycle:

```text
POST /tasks
     ↓
Create a task in PostgreSQL
     ↓
GET /tasks
     ↓
Read all tasks from PostgreSQL
     ↓
GET /tasks/:id
     ↓
Read one task from PostgreSQL
     ↓
PUT /tasks/:id
     ↓
Update the task in PostgreSQL
     ↓
DELETE /tasks/:id
     ↓
Delete the task from PostgreSQL
```

The client-facing API contract remains the same while the storage implementation changed.

---

# Database Architecture

## Week 2: In-Memory Storage

In Week 2, tasks were stored in a JavaScript array:

```text
Client
  ↓
Express API
  ↓
In-memory Array
```

This was useful for learning the API and CRUD flow, but the data existed only while the Node.js process was running.

---

## Week 3: PostgreSQL

The storage layer was migrated to PostgreSQL:

```text
Client
  ↓
Express API
  ↓
PostgreSQL Repository
  ↓
PostgreSQL
```

The application communicates with PostgreSQL through the `pg` package.

The PostgreSQL connection and database operations are kept in:

```text
repositories/postgres.js
```

The API routes call repository functions for database operations.

---

# Parameterized SQL Queries

The PostgreSQL repository uses parameterized queries for values supplied by requests.

For example, finding a task by ID:

```sql
SELECT * FROM tasks WHERE id = $1
```

The ID is passed separately as a query parameter.

Other CRUD operations also use PostgreSQL parameters such as `$1`, `$2`, and `$3`.

This keeps request values separate from the SQL statement instead of constructing SQL through string concatenation.

---

# PostgreSQL Persistence

PostgreSQL data is stored using a named Docker volume:

```text
taskdata
```

The volume is mounted to:

```text
/var/lib/postgresql/data
```

The architecture is:

```text
Task API Container
       ↓
PostgreSQL Container
       ↓
Named Docker Volume
       ↓
Persistent Database Data
```

Because the database uses a named volume, recreating the containers does not remove the stored PostgreSQL data.

For example:

```bash
docker compose down
```

removes the application and database containers, but keeps the named volume.

Starting the stack again:

```bash
docker compose up -d
```

recreates the containers and reconnects PostgreSQL to the existing volume.

Existing tasks remain available.

## Persistence Test

The persistence was tested by first running the application with Docker Compose and creating an additional task.

Then the containers were removed:

```bash
docker compose down
```

The stack was started again:

```bash
docker compose up -d
```

The API was then checked:

```bash
curl http://localhost:3000/tasks
```

The previously created task was still available after the containers were recreated.

This confirms that the PostgreSQL data is stored in the Docker volume rather than only inside the database container.

> Do not use `docker compose down -v` when testing persistence because the `-v` option removes the Compose-managed volumes.

---

# One-Command Stack

The main goal of the Dockerization stage is that a new developer does not need to manually install or configure PostgreSQL.

The expected flow is:

```text
Clone repository
      ↓
Copy .env.example to .env
      ↓
docker compose up
      ↓
Task API + PostgreSQL start
      ↓
Database table is created automatically
      ↓
Seed data is inserted if the table is empty
      ↓
GET /tasks
```

No manual database creation or table setup is required.

---

# Clean Clone Checkpoint

The project is intended to be runnable by a new developer without manual database setup.

The complete flow is:

```bash
git clone https://github.com/alfinmuzakkiiman/FlyRankIntern-task-api.git
cd FlyRankIntern-task-api
```

Create the environment file:

### Windows PowerShell

```powershell
Copy-Item .env.example .env
```

### Linux / macOS

```bash
cp .env.example .env
```

Start the stack:

```bash
docker compose up
```

Then verify the API:

```bash
curl http://localhost:3000/tasks
```

The API should return the seeded tasks.

The database table is created automatically by the application, so no manual PostgreSQL setup is required.

---

# Project Structure

```text
FlyRankIntern-task-api/
├── docs/
│   ├── database-viewer.png
│   └── swagger-ui.png
├── repositories/
│   └── postgres.js
├── .dockerignore
├── .env.example
├── .gitignore
├── docker-compose.yml
├── Dockerfile
├── openapi.json
├── package.json
├── package-lock.json
├── README.md
└── server.js
```

---

# Main Files

| File | Purpose |
|------|---------|
| `server.js` | Express server, routes, validation, and application startup |
| `repositories/postgres.js` | PostgreSQL connection, initialization, seed logic, and database operations |
| `openapi.json` | OpenAPI specification used by Swagger UI |
| `package.json` | Project metadata, scripts, and dependencies |
| `package-lock.json` | Locked dependency versions |
| `Dockerfile` | Defines the Task API container image |
| `docker-compose.yml` | Runs the Task API and PostgreSQL together |
| `.dockerignore` | Files excluded from the Docker build context |
| `.env.example` | Example environment configuration |
| `.gitignore` | Files excluded from Git |
| `docs/swagger-ui.png` | Swagger UI screenshot |
| `docs/database-viewer.png` | PostgreSQL database screenshot |
| `README.md` | Project documentation |

---

# Dockerfile

The application uses a Node.js Alpine image:

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

The Docker image installs dependencies using:

```bash
npm ci
```

and starts the Express application using:

```bash
npm start
```

---

# Docker Compose Services

The Docker Compose stack contains two services:

```text
services:
  app
  db
```

## App

The Task API is exposed on:

```text
localhost:3000
```

## Database

PostgreSQL is exposed on the host at:

```text
localhost:5433
```

The application connects to PostgreSQL internally through:

```text
db:5432
```

The PostgreSQL data is persisted using:

```text
taskdata
```

---

# Stopping the Application

To stop the stack:

```bash
docker compose down
```

This removes the containers and network but keeps the named PostgreSQL volume.

To start the stack again:

```bash
docker compose up -d
```

The existing database data remains available.

> Do not use `docker compose down -v` if you want to preserve the PostgreSQL data. The `-v` option removes the Compose-managed volumes.

---

# Git Workflow

The project was developed incrementally using Git branches and Pull Requests.

## Week 2

```text
Stage 0 → Hello Server
Stage 1 → Root & Health
Stage 2 → Read Tasks
Stage 3 → Create Task
Stage 4 → Update & Delete
Stage 5 → Swagger UI
Stage 6 → Publish & Documentation
Stage 7 → AI Rematch
```

## Week 3

```text
Stage 0 → PostgreSQL Docker setup
Stage 1 → PostgreSQL connection
Stage 2 → PostgreSQL read endpoints
Stage 3 → PostgreSQL CRUD
Stage 4 → Dockerize app + database
Stage 5 → Publish & Documentation
```

Each stage was developed on a separate branch, tested locally, committed, pushed to GitHub, reviewed through a Pull Request, and merged into `main`.

The development workflow was:

```text
Create branch
     ↓
Implement one stage
     ↓
Test locally
     ↓
Self-review
     ↓
Commit
     ↓
Push
     ↓
Pull Request
     ↓
Review
     ↓
Merge into main
```

---

# AI vs Me — Stage 7 Rematch

This section documents the Week 2 AI Rematch experiment.

The experiment compared a hand-built implementation with an AI-generated implementation of the Task API.

## Prompt Used

```text
Build a REST API for managing tasks using Node.js and Express.js.

The API should use an in-memory array as its data storage. Do not use a database or file-based storage.

Use port 3000 and JSON request/response bodies.

The API must provide these endpoints:

1. GET /
   - Return basic information about the API.
   - Return HTTP 200.

2. GET /health
   - Return a simple health status.
   - Return HTTP 200.

3. GET /tasks
   - Return all tasks.
   - Return HTTP 200.

4. GET /tasks/:id
   - Return one task by its numeric ID.
   - If the task does not exist, return HTTP 404 with a JSON error message.

5. POST /tasks
   - Create a new task.
   - The request body must contain a non-empty string called "title".
   - Trim whitespace from the title.
   - Automatically generate the task ID.
   - New tasks must have "done": false by default.
   - Return the created task with HTTP 201.
   - If the title is missing or empty, return HTTP 400 with a JSON error message.

6. PUT /tasks/:id
   - Update an existing task.
   - The request can update "title", "done", or both.
   - "title" must be a non-empty string when provided.
   - "done" must be a boolean when provided.
   - The request body must contain at least one valid field to update.
   - Return the updated task with HTTP 200.
   - If the task ID does not exist, return HTTP 404 with a JSON error message.
   - If the request body is empty or invalid, return HTTP 400 with a JSON error message.

7. DELETE /tasks/:id
   - Delete the task with the specified ID.
   - Return HTTP 204 with an empty response body when successful.
   - If the task does not exist, return HTTP 404 with a JSON error message.

The API should use Express JSON middleware.

Add Swagger UI documentation using swagger-ui-express.

Create an OpenAPI specification describing all API endpoints, request bodies, responses, task schema, and relevant HTTP status codes.

Serve Swagger UI at:

http://localhost:3000/docs

The Swagger UI should allow users to use "Try it out" for the complete CRUD flow.

The project should include:
- server.js
- openapi.json
- package.json
- README.md

Keep the implementation simple and beginner-friendly. Do not add authentication, a database, Docker, TypeScript, or unnecessary dependencies.

After generating the code, explain the project structure and how to install and run the API.
```

## What the AI Did Better

- The generated implementation was compact.
- Input validation was structured clearly.
- HTTP status codes were explicitly handled.
- The generated project provided a useful comparison against the hand-built implementation.

## What the AI Got Wrong or Quietly Changed

### Error Response Format

The hand-built implementation uses:

```json
{
  "error": "..."
}
```

The AI implementation used:

```json
{
  "message": "..."
}
```

The original prompt did not explicitly define the property name for error responses.

### Express Version

The AI selected a different Express version from the hand-built project.

This showed why dependency versions and API response formats should be explicitly specified when asking an AI system to reproduce an existing implementation.

## Prompt Improvement

The prompt was improved by explicitly specifying:

```text
Error responses must follow the format {"error": "<message>"}.
```

and:

```text
Use Express 5.x.
```

The improved prompt reduced ambiguity between the AI-generated implementation and the hand-built implementation.

---

# Learning Outcomes

Through Week 2 and Week 3, I practiced:

- Building REST APIs with Node.js and Express.js
- Understanding HTTP methods
- Implementing CRUD operations
- Handling JSON request bodies
- Validating client input
- Using appropriate HTTP status codes
- Handling unknown resources with `404 Not Found`
- Using `204 No Content` for successful deletion
- Testing APIs with `curl`
- Testing APIs through Swagger UI
- Writing OpenAPI specifications
- Moving from in-memory storage to persistent database storage
- Connecting Node.js to PostgreSQL
- Writing SQL queries
- Using parameterized SQL queries
- Understanding PostgreSQL schema design
- Understanding database initialization and seed data
- Understanding Docker containers
- Using Docker Compose
- Using named Docker volumes
- Verifying database persistence after container recreation
- Exploring PostgreSQL using `psql` and DBeaver
- Writing project documentation
- Using Git branches and commits
- Creating and reviewing Pull Requests
- Merging feature branches into `main`
- Publishing a backend project to GitHub

---

# Week 2 → Week 3 Progress

The project evolved from a simple in-memory CRUD API into a containerized, database-backed CRUD API.

## Week 2

```text
Client
  ↓
Express API
  ↓
JavaScript Array
```

The focus was:

- REST API fundamentals
- CRUD
- Validation
- HTTP status codes
- Swagger/OpenAPI
- Git/GitHub workflow

---

## Week 3

```text
Client
  ↓
Express API
  ↓
PostgreSQL Repository
  ↓
PostgreSQL
  ↓
Docker Volume
```

The focus was:

- Database setup
- PostgreSQL schema
- SQL queries
- Persistent storage
- CRUD operations with SQL
- Repository-based database access
- Docker
- Docker Compose
- Database persistence
- One-command application startup
- Database exploration
- Documentation

The API contract stayed the same while the storage implementation changed.

This was the main practical lesson of the transition:

> The client can continue using the same API while the backend changes how it stores data.

---

# Internship Context

This project was developed as part of my **Week 2 and Week 3 internship at FlyRank AI**.

In Week 2, I built the CRUD API using an in-memory array.

In Week 3, I migrated the storage layer to PostgreSQL and containerized the application and database using Docker Compose.

The project was built incrementally so that each stage introduced one main concept.

The development process was:

```text
Build
  ↓
Test
  ↓
Validate
  ↓
Document
  ↓
Review
  ↓
Commit
  ↓
Pull Request
  ↓
Merge
```

The goal was not only to make the API work, but also to practice a development workflow that can be repeated on larger backend projects.

---

# Week 3 Completion Checklist

- [x] PostgreSQL database running in Docker
- [x] PostgreSQL `tasks` table created automatically
- [x] Three example tasks seeded only when the table is empty
- [x] `GET /tasks` reads from PostgreSQL
- [x] `GET /tasks/:id` reads from PostgreSQL
- [x] `POST /tasks` inserts into PostgreSQL
- [x] `PUT /tasks/:id` updates PostgreSQL
- [x] `DELETE /tasks/:id` deletes from PostgreSQL
- [x] Parameterized SQL queries used
- [x] Unknown task IDs return `404`
- [x] Invalid requests return `400`
- [x] Data survives container recreation
- [x] PostgreSQL data stored using a named Docker volume
- [x] Task API containerized
- [x] PostgreSQL containerized
- [x] Application and database start with Docker Compose
- [x] `.env` ignored by Git
- [x] `.env.example` committed
- [x] Swagger documentation available
- [x] Database viewer screenshot included
- [x] README updated
- [x] Project published to GitHub
- [x] Changes prepared through Git branch and Pull Request workflow

---

# Final Notes

Week 2 established the API fundamentals.

Week 3 changed the storage layer from an in-memory array to PostgreSQL and introduced Docker-based development.

The final result is a CRUD API that keeps the same client-facing endpoints while using a real PostgreSQL database running in Docker.

The application and database can be started together with:

```bash
docker compose up
```

Database data persists through the named Docker volume.

This provides a foundation for future backend work where the API layer, database layer, and deployment environment can continue to evolve independently.