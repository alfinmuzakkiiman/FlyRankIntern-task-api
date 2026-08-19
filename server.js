import express from "express";

const app = express();

const PORT = 3000;

app.get("/", (req, res) => {
  res.send("Task API is running!");
});

app.listen(PORT, () => {
  console.log(`Task API running on http://localhost:${PORT}`);
});