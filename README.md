# Task API

A simple REST API for managing tasks, built with Node.js, Express.js, and SQLite.

This project was developed as part of my internship at **FlyRank AI** across **Week 2 and Week 3**. In Week 2, I built the CRUD API using an in-memory array. In Week 3, I replaced the in-memory storage with a real SQLite database while keeping the API endpoints and behavior consistent.

The project focuses on learning and implementing practical backend development concepts, including REST API design, CRUD operations, request validation, HTTP status codes, database persistence, SQL, Swagger/OpenAPI documentation, and a Git/GitHub Pull Request workflow.

---

## Tech Stack

* Node.js
* Express.js
* SQLite
* better-sqlite3
* Swagger UI
* OpenAPI
* DBeaver
* Git & GitHub

---

## Features

* Create a new task
* Get all tasks
* Get a task by ID
* Update a task
* Delete a task
* Request validation
* HTTP status code handling
* Persistent task storage with SQLite
* Automatic database creation
* Automatic table creation
* Initial seed data only when the table is empty
* Interactive API documentation with Swagger UI
* SQL database exploration using DBeaver

---

# Getting Started

## Requirements

Make sure you have installed:

* Node.js
* npm
* Git
* DBeaver (optional, for viewing and exploring the SQLite database)

Check your installation:

```bash
node --version
npm --version
git --version
```

---

## Installation

Clone the repository:

```bash
git clone https://github.com/alfinmuzakkiiman/FlyRankIntern-task-api.git
```

Navigate to the project directory:

```bash
cd FlyRankIntern-task-api
```

Install the project dependencies:

```bash
npm install
```

The project uses `better-sqlite3` to communicate with SQLite.

---

## Run the Server

Start the API:

```bash
npm start
```

The server will run at:

```text
http://localhost:3000
```

You should see:

```text
Task API running on http://localhost:3000
```

---

## Database Initialization

The SQLite database is stored locally in:

```text
tasks.db
```

The application automatically creates the database file when the server starts if it does not already exist.

The `tasks` table is also created automatically if it does not exist.

The application checks whether the table is empty. If it is empty, three example tasks are inserted:

```text
Learn Express
Build Task API
Test API endpoints
```

The seed data is inserted only when the table contains zero rows.

This means restarting the server does **not** recreate the example tasks when data already exists.

---

## Verify the API

Check the health endpoint:

```bash
curl -i http://localhost:3000/health
```

Example response:

```text
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
```

```json
{
  "status": "ok"
}
```

---

# API Documentation

Interactive API documentation is available through Swagger UI:

```text
http://localhost:3000/docs
```

Swagger UI allows you to explore and test the API directly from your browser using the **Try it out** feature.

## Swagger UI Preview

![Swagger UI](docs/swagger-ui.png)

---

# Database Viewer

The SQLite database can be opened and inspected using DBeaver.

The database contains a `tasks` table with the following columns:

| Column | SQLite Type | Description |
| --- | --- | --- |
| `id` | INTEGER | Primary key and unique task ID |
| `title` | TEXT | Task title |
| `done` | INTEGER | Completion status (`0` = false, `1` = true) |

## Database Viewer Preview

![Database Viewer](docs/database-viewer.png)

The screenshot above shows the SQLite database and the `tasks` table in DBeaver.

---

# API Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
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
| --- | --- | --- |
| `id` | number | Unique task ID |
| `title` | string | Task title |
| `done` | boolean | Task completion status |

Although SQLite stores `done` as an integer (`0` or `1`), the API converts the value back to a JavaScript boolean (`false` or `true`) in its JSON responses.

---

# CRUD Flow

The API supports the complete CRUD lifecycle:

```text
POST /tasks
    ↓
Create a task in SQLite
    ↓
GET /tasks
    ↓
Read all tasks from SQLite
    ↓
GET /tasks/:id
    ↓
Read one task from SQLite
    ↓
PUT /tasks/:id
    ↓
Update the task in SQLite
    ↓
DELETE /tasks/:id
    ↓
Delete the task from SQLite
```

The important change from Week 2 to Week 3 is the storage layer:

```text
Week 2

Client
  ↓
Express API
  ↓
In-memory Array
```

```text
Week 3

Client
  ↓
Express API
  ↓
SQLite Database
```

The client does not need to know that the storage implementation changed.

---

# Example API Requests

## Get All Tasks

```bash
curl -i http://localhost:3000/tasks
```

Example response:

```text
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

The data is read directly from the SQLite database.

---

## Get a Task by ID

```bash
curl -i http://localhost:3000/tasks/1
```

Example response:

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

```text
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

```text
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

* Generates the task ID
* Trims the title
* Sets `done` to `false`
* Inserts the task into the SQLite database

---

## Verify Persistence After Creating a Task

After creating a task, stop the server:

```text
Ctrl + C
```

Start it again:

```bash
npm start
```

Then request:

```bash
curl http://localhost:3000/tasks
```

The created task should still exist because it is stored in `tasks.db` instead of an in-memory array.

---

## Update a Task

```bash
curl -i -X PUT http://localhost:3000/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{"title":"Learn Express Updated","done":true}'
```

Example response:

```text
HTTP/1.1 200 OK
```

```json
{
  "id": 1,
  "title": "Learn Express Updated",
  "done": true
}
```

The update is written to SQLite using an SQL `UPDATE` statement.

---

## Delete a Task

```bash
curl -i -X DELETE http://localhost:3000/tasks/1
```

Example response:

```text
HTTP/1.1 204 No Content
```

The response body is empty because the task was successfully deleted.

The row is also removed from the SQLite database.

---

# Validation

The API validates incoming request data.

## Create Task Validation

The `title` field is required and cannot be empty.

Request:

```bash
curl -i -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{}'
```

Response:

```text
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

* `title`
* `done`

The `title` must be a non-empty string.

The `done` field must be a boolean.

Example invalid body:

```json
{
  "done": "true"
}
```

Response:

```text
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

## Unknown Task

If a task ID does not exist, the API returns `404 Not Found`.

Example:

```bash
curl -i http://localhost:3000/tasks/99
```

Response:

```text
HTTP/1.1 404 Not Found
```

```json
{
  "error": "Task 99 not found"
}
```

---

# HTTP Status Codes

| Status Code | Meaning |
| --- | --- |
| `200` | Request successful |
| `201` | Resource created successfully |
| `204` | Resource deleted successfully |
| `400` | Invalid request or validation error |
| `404` | Resource not found |

---

# Data Storage

## Week 2: In-Memory Storage

In Week 2, tasks were stored in a JavaScript array:

```text
Express API
    ↓
JavaScript Array
```

This was useful for learning the API and CRUD flow, but the data existed only while the Node.js process was running.

Because the data was stored in memory:

* Newly created tasks were lost after a restart.
* Updated tasks returned to the initial state after a restart.
* Deleted tasks returned to the initial example dataset after a restart.

---

## Week 3: SQLite Storage

In Week 3, the storage layer was replaced with SQLite:

```text
Express API
    ↓
better-sqlite3
    ↓
tasks.db
```

The API endpoints remain the same.

The main change is where the data is stored.

### SQLite Schema

```sql
CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  done INTEGER NOT NULL DEFAULT 0
);
```

### Boolean Storage

SQLite does not have a separate boolean storage type in the same way JavaScript does.

The project stores:

```text
0 → false
1 → true
```

The API converts the database value back to a JavaScript boolean before returning JSON.

### Persistence

Because tasks are stored in `tasks.db`, data survives server restarts.

For example:

```text
POST task
   ↓
INSERT into SQLite
   ↓
Stop server
   ↓
Start server
   ↓
GET /tasks
   ↓
Task still exists
```

---

# SQLite Exploration

During Week 3, the SQLite database was manually explored using DBeaver.

The following SQL queries were executed:

## View All Tasks

```sql
SELECT * FROM tasks;
```

## View Completed Tasks

```sql
SELECT * FROM tasks WHERE done = 1;
```

## Count Tasks

```sql
SELECT COUNT(*) FROM tasks;
```

## Mark Tasks as Done

```sql
UPDATE tasks SET done = 1;
```

## Delete Completed Tasks

```sql
DELETE FROM tasks WHERE done = 1;
```

The API was then checked again to verify that database changes were reflected in the API responses.

This helped verify that the API and SQLite database were working with the same underlying data.

---

# Database Initialization Logic

The application creates the table automatically when the server starts:

```sql
CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  done INTEGER NOT NULL DEFAULT 0
);
```

The application then checks the number of rows:

```sql
SELECT COUNT(*) AS count FROM tasks;
```

If the count is zero, the three example tasks are inserted.

Conceptually:

```text
Start application
      ↓
Open tasks.db
      ↓
Create tasks table if missing
      ↓
Count existing tasks
      ↓
Is the table empty?
    /       \
  Yes        No
   ↓          ↓
Seed data   Keep existing data
   \          /
      ↓
 Start API
```

This prevents the seed data from being inserted again every time the server restarts.

---

# Project Structure

```text
FlyRankIntern-task-api/
├── docs/
│   ├── swagger-ui.png
│   └── database-viewer.png
├── tasks.db
├── openapi.json
├── package.json
├── package-lock.json
├── README.md
├── server.js
└── .gitignore
```

## Main Files

| File | Purpose |
| --- | --- |
| `server.js` | Express server, routes, validation, SQLite connection, and database operations |
| `openapi.json` | OpenAPI specification used by Swagger UI |
| `package.json` | Project metadata, scripts, and dependencies |
| `package-lock.json` | Locked dependency versions |
| `tasks.db` | Local SQLite database file |
| `README.md` | Project documentation |
| `docs/swagger-ui.png` | Swagger UI screenshot |
| `docs/database-viewer.png` | SQLite database viewer screenshot |
| `.gitignore` | Files ignored by Git |

---

# Why SQLite?

SQLite was chosen for this stage because it is simple and suitable for a small backend project.

It does not require a separate database server.

The database is stored as a local file:

```text
tasks.db
```

This makes it useful for learning database-backed APIs without adding infrastructure complexity.

The important learning goal for Week 3 was not to build a large database system, but to understand how an API moves from:

```text
In-memory storage
```

to:

```text
Persistent database storage
```

while keeping the API contract consistent.

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
Stage 0 → Create SQLite Database
Stage 1 → Database Read Endpoints
Stage 2 → Insert into Database
Stage 3 → Update & Delete with SQL
Stage 4 → Explored SQLite
Stage 5 → Database Documentation
```

Each stage was developed on a separate branch, tested locally, committed, pushed to GitHub, reviewed through a Pull Request, and merged into `main`.

The Week 3 workflow followed the same development habit:

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

# Learning Outcomes

Through Week 2 and Week 3, I practiced:

* Building REST APIs with Node.js and Express.js
* Understanding HTTP methods
* Implementing CRUD operations
* Handling JSON request bodies
* Validating client input
* Using appropriate HTTP status codes
* Handling unknown resources with `404 Not Found`
* Using `204 No Content` for successful deletion
* Testing APIs with `curl`
* Testing APIs through Swagger UI
* Writing OpenAPI specifications
* Using SQLite for persistent storage
* Using `better-sqlite3` from Node.js
* Writing basic SQL queries
* Understanding SQL `SELECT`, `INSERT`, `UPDATE`, and `DELETE`
* Understanding database initialization and seed data
* Verifying data persistence after server restarts
* Inspecting a SQLite database using DBeaver
* Using Git branches and commits
* Creating and reviewing Pull Requests
* Merging feature branches into `main`
* Publishing a backend project to GitHub

---

# Week 2 → Week 3 Progress

The project evolved from a simple in-memory CRUD API into a database-backed CRUD API.

## Week 2

```text
Client
  ↓
Express API
  ↓
JavaScript Array
```

The focus was:

* REST API fundamentals
* CRUD
* Validation
* HTTP status codes
* Swagger/OpenAPI
* Git/GitHub workflow

## Week 3

```text
Client
  ↓
Express API
  ↓
SQLite
  ↓
tasks.db
```

The focus was:

* Database setup
* SQLite schema
* SQL queries
* Persistent storage
* CRUD operations with SQL
* Database exploration
* Database documentation

The API contract stayed the same while the storage implementation changed.

This was the main practical lesson of the transition: **the client can continue using the same API while the backend changes how it stores data.**

---

# Internship Context

This project was developed as part of my **Week 2 and Week 3 internship at FlyRank AI**.

In Week 2, I built the CRUD API using an in-memory array.

In Week 3, I replaced the in-memory storage with SQLite while keeping the API endpoints and behavior consistent.

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

# AI vs Me (Stage 7 — The AI Rematch)

> **Note:** This section documents the Week 2 AI Rematch experiment. It intentionally describes the in-memory version because that was the architecture used during Stage 7. The SQLite migration was completed separately during Week 3.

## Full Prompt Used

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

## Analysis & Differences

### 1. What did the AI do better?

* **Clean & Compact Code Structure:** The AI formatted input validation compactly (e.g., checking `typeof title !== 'string' || title.trim() === ''` in a single guard clause).
* **Explicit HTTP Status Code calls:** The AI explicitly chained `.status(200)` across all read endpoints (e.g. `res.status(200).json(tasks)`), making status codes completely unambiguous in every response handler.

### 2. What did it get wrong or quietly ignore?

* **Error Response Format:** The hand-built version returns `{ "error": "..." }` while the AI version returned `{ "message": "..." }` because the exact JSON property key for errors was not strictly defined in the prompt.
* **Express Framework Version:** The AI selected Express 4.x (`^4.18.2`) in `package.json`, whereas our hand-built project uses Express 5.x (`^5.2.1`).

### 3. What did your prompt forget to specify — and what did the AI silently decide?

* **Error Payload Key Name:** The prompt stated "return HTTP 400 with a JSON error message", so the AI decided on `{ "message": "..." }` instead of `{ "error": "..." }`.
* **Seed Data Content:** The prompt did not specify initial array data, so the AI silently generated its own sample task items (`Learn Node.js`, `Build Express API`).

## Rematch & Prompt Improvement

* **Prompt Improvement Note:** Specifying `Error responses must follow the format {"error": "<message>"}` and explicitly stating `Use Express 5.x` closed all minor gaps between the AI-generated code and our hand-built API.

---

# Current Architecture

The current project uses:

```text
Client
   ↓
Express.js API
   ↓
better-sqlite3
   ↓
SQLite
   ↓
tasks.db
```

Swagger/OpenAPI provides API documentation:

```text
Client / Developer
       ↓
Swagger UI
       ↓
Express API
       ↓
SQLite
```

---

# Week 3 Completion Checklist

* [x] SQLite database created
* [x] `tasks` table created automatically
* [x] Three example tasks seeded only when the table is empty
* [x] GET `/tasks` reads from SQLite
* [x] GET `/tasks/:id` reads from SQLite
* [x] POST `/tasks` inserts into SQLite
* [x] PUT `/tasks/:id` updates SQLite
* [x] DELETE `/tasks/:id` deletes from SQLite
* [x] Unknown task IDs return `404`
* [x] Invalid requests return `400`
* [x] Data survives server restart
* [x] SQLite explored using DBeaver
* [x] Required SQL queries executed
* [x] README updated
* [x] Swagger screenshot included
* [x] Database viewer screenshot included
* [x] Changes prepared through Git branch and Pull Request workflow

---

# Final Notes

Week 2 established the API fundamentals.

Week 3 changed the storage layer from an in-memory array to a persistent SQLite database.

The main result is a CRUD API that keeps the same client-facing endpoints while storing task data in a real database.

This provides a foundation for future backend work where the API layer and database layer can continue to evolve independently.
