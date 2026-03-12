import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Database from "better-sqlite3";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database("feedback.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS feedback (
    id TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    category TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    admin_reply TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  
  // Submit feedback
  app.post("/api/feedback", (req, res) => {
    const { content, category } = req.body;
    if (!content || !category) {
      return res.status(400).json({ error: "Missing content or category" });
    }
    const id = Math.random().toString(36).substring(2, 10).toUpperCase();
    const stmt = db.prepare("INSERT INTO feedback (id, content, category) VALUES (?, ?, ?)");
    stmt.run(id, content, category);
    res.json({ id });
  });

  // Track feedback
  app.get("/api/feedback/:id", (req, res) => {
    const stmt = db.prepare("SELECT * FROM feedback WHERE id = ?");
    const feedback = stmt.get(req.params.id);
    if (!feedback) {
      return res.status(404).json({ error: "Not found" });
    }
    res.json(feedback);
  });

  // Admin Login (Simple check)
  app.post("/api/admin/login", (req, res) => {
    const { password } = req.body;
    if (password === "admin") {
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false });
    }
  });

  // Admin: List all feedback
  app.get("/api/admin/feedback", (req, res) => {
    const stmt = db.prepare("SELECT * FROM feedback ORDER BY created_at DESC");
    const feedbacks = stmt.all();
    res.json(feedbacks);
  });

  // Admin: Update status
  app.patch("/api/admin/feedback/:id", (req, res) => {
    const { status } = req.body;
    const stmt = db.prepare("UPDATE feedback SET status = ? WHERE id = ?");
    const result = stmt.run(status, req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: "Not found" });
    }
    res.json({ success: true });
  });

  // Admin: Update reply
  app.patch("/api/admin/feedback/:id/reply", (req, res) => {
    const { reply } = req.body;
    const stmt = db.prepare("UPDATE feedback SET admin_reply = ? WHERE id = ?");
    const result = stmt.run(reply, req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: "Not found" });
    }
    res.json({ success: true });
  });

  // Admin: Clear content (Keep record but remove text)
  app.patch("/api/admin/feedback/:id/clear", (req, res) => {
    const stmt = db.prepare("UPDATE feedback SET content = '[ข้อความนี้ถูกลบโดยผู้ดูแลระบบ]' WHERE id = ?");
    const result = stmt.run(req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: "Not found" });
    }
    res.json({ success: true });
  });

  // Admin: Delete feedback
  app.delete("/api/admin/feedback/:id", (req, res) => {
    const stmt = db.prepare("DELETE FROM feedback WHERE id = ?");
    const result = stmt.run(req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: "Not found" });
    }
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
