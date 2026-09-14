import express from "express";
import swaggerUi from "swagger-ui-express";
import fs from "fs";
import {
  initializeDatabase,
  getTasks,
  getTaskById,
} from "./repositories/postgres.js";

const app = express();
const PORT = 3000;

// ====================
// OpenAPI / Swagger
// ====================

const openapiDocument = JSON.parse(
  fs.readFileSync("./openapi.json", "utf-8")
);

app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapiDocument));

// ====================
// Middleware
// ====================

app.use(express.json());

// ====================
// Temporary in-memory data
// Will be replaced by SQLite in Stage 1-3
// ====================


// ====================
// Routes
// ====================

app.get("/", (req, res) => {
  res.json({
    name: "Task API",
    version: "1.0",
    endpoints: ["/tasks"],
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
  });
});

app.get("/tasks", async (req, res) => {
  try {
    const tasks = await getTasks();

    res.json(tasks);
  } catch (error) {
    console.error("Failed to get tasks:", error);
    res.status(500).json({ error: "Failed to get tasks" });
  }
});

app.get("/tasks/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const task = await getTaskById(id);

    if (!task) {
      return res.status(404).json({
        error: `Task ${id} not found`,
      });
    }

    res.json(task);
  } catch (error) {
    console.error("Failed to get task:", error);
    res.status(500).json({ error: "Failed to get task" });
  }
});

app.put("/tasks/:id", (req, res) => {
  const id = Number(req.params.id);
  const { title, done } = req.body;

  //Check if task exists
  const task = db 
  .prepare("SELECT * FROM tasks WHERE id = ?")
  .get(id);

  if (!task) {
    return res.status(404).json({
      error: `Task ${id} not found`,
    });
  }

  //Validate request body 
  if ((title === undefined || title === "") && done === undefined) {
    return res.status(400).json({
      error: "Title or done is required",
    });
  }

  if (title !== undefined) {
    if (typeof title !== "string" || title.trim() === "") {
      return res.status(400).json({
        error: "Title Must be a non-empty string",
      });
    }
  }

  if (done !== undefined) {
    if(typeof done !== "boolean") {
      return res.status(400).json({
        error: "Done must be a bolean",
      });
    }
  }

  //Update only The fields provided
  const updatedTitle =  
  title !== undefined ? title.trim() : task.title;

  const updateDone =
  done !== undefined ? Number(done) : task.done;

  db.prepare(`
    UPDATE tasks
    set title = ?, done = ?
    WHERE id = ?
    `).run(updatedTitle, updateDone, id);

    // Return updated task
    const updatedTask = db 
    .prepare(" SELECT * FROM tasks WHERE id = ?")
    .get(id);

    res.json({
      ...updatedTask,
      done: Boolean(updatedTask.done),
    });
});

app.delete("/tasks/:id", (req, res) => {
  const id = Number(req.params.id);

  const task = db
    .prepare("SELECT * FROM tasks WHERE id = ?")
    .get(id);

  if (!task) {
    return res.status(404).json({
      error: `Task ${id} not found`,
    });
  }

  db.prepare("DELETE FROM tasks WHERE id = ?").run(id);

  res.status(204).send();
});

// ====================
// Start server
// ====================

initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Task API running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to initialize database:", error);
    process.exit(1);
  });