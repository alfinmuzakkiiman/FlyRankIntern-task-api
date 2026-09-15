import express from "express";
import swaggerUi from "swagger-ui-express";
import fs from "fs";
import {
  initializeDatabase,
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
} from "./repositories/postgres.js";
import supabase from "./repositories/supabase.js";


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

app.post("/tasks", async (req, res) => {
  try {
    const { title } = req.body;

    if (!title || title.trim() === "") {
      return res.status(400).json({
        error: "Title is required",
      });
    }

    const newTask = await createTask(title.trim());

    res.status(201).json(newTask);
  } catch (error) {
    console.error("Failed to create task:", error);
    res.status(500).json({ error: "Failed to create task" });
  }
});

app.put("/tasks/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { title, done } = req.body;

    if (title === undefined && done === undefined) {
      return res.status(400).json({
        error: "Title or done is required",
      });
    }

    if (title !== undefined && (typeof title !== "string" || title.trim() === "")) {
      return res.status(400).json({
        error: "Title must be a non-empty string",
      });
    }

    if (done !== undefined && typeof done !== "boolean") {
      return res.status(400).json({
        error: "Done must be a boolean",
      });
    }

    const existingTask = await getTaskById(id);

    if (!existingTask) {
      return res.status(404).json({
        error: `Task ${id} not found`,
      });
    }

    const updatedTitle = title !== undefined
      ? title.trim()
      : existingTask.title;

    const updatedDone = done !== undefined
      ? done
      : existingTask.done;

    const updatedTask = await updateTask(
      id,
      updatedTitle,
      updatedDone
    );

    res.json(updatedTask);
  } catch (error) {
    console.error("Failed to update task:", error);
    res.status(500).json({ error: "Failed to update task" });
  }
});

app.delete("/tasks/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const deletedTask = await deleteTask(id);

    if (!deletedTask) {
      return res.status(404).json({
        error: `Task ${id} not found`,
      });
    }

    res.status(204).send();
  } catch (error) {
    console.error("Failed to delete task:", error);
    res.status(500).json({ error: "Failed to delete task" });
  }
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