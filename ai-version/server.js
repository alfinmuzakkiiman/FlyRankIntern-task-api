import express from 'express';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';

const app = express();
const PORT = 3000;

app.use(express.json());

// Load OpenAPI specification
const openapiDocument = JSON.parse(fs.readFileSync('./openapi.json', 'utf-8'));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiDocument));

// In-memory tasks database
let tasks = [
  { id: 1, title: 'Learn Node.js', done: false },
  { id: 2, title: 'Build Express API', done: true }
];

// 1. GET / - Root info
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'Task API',
    version: '1.0.0',
    description: 'REST API for managing tasks'
  });
});

// 2. GET /health - Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// 3. GET /tasks - Get all tasks
app.get('/tasks', (req, res) => {
  res.status(200).json(tasks);
});

// 4. GET /tasks/:id - Get task by ID
app.get('/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const task = tasks.find(t => t.id === id);

  if (!task) {
    return res.status(404).json({ message: `Task with ID ${id} not found` });
  }

  res.status(200).json(task);
});

// 5. POST /tasks - Create a new task
app.post('/tasks', (req, res) => {
  let { title } = req.body;

  if (!title || typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ message: 'Title is required and must be a non-empty string' });
  }

  title = title.trim();
  const newId = tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) + 1 : 1;

  const newTask = {
    id: newId,
    title,
    done: false
  };

  tasks.push(newTask);
  res.status(201).json(newTask);
});

// 6. PUT /tasks/:id - Update task
app.put('/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const task = tasks.find(t => t.id === id);

  if (!task) {
    return res.status(404).json({ message: `Task with ID ${id} not found` });
  }

  const { title, done } = req.body;

  if (title === undefined && done === undefined) {
    return res.status(400).json({ message: 'At least one field (title or done) must be provided' });
  }

  if (title !== undefined) {
    if (typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({ message: 'Title must be a non-empty string' });
    }
    task.title = title.trim();
  }

  if (done !== undefined) {
    if (typeof done !== 'boolean') {
      return res.status(400).json({ message: 'Done must be a boolean value' });
    }
    task.done = done;
  }

  res.status(200).json(task);
});

// 7. DELETE /tasks/:id - Delete task
app.delete('/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = tasks.findIndex(t => t.id === id);

  if (index === -1) {
    return res.status(404).json({ message: `Task with ID ${id} not found` });
  }

  tasks.splice(index, 1);
  res.status(204).send();
});

app.listen(PORT, () => {
  console.log(`AI Server listening at http://localhost:${PORT}`);
});
