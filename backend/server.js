import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";

dotenv.config();

const app = express();

/* ======================
   CORS CONFIG
====================== */
app.use(
  cors({
    origin: [
      "http://localhost:5173", // Vite
      "http://localhost:3000", // CRA
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());

// Test route (keep this)
app.get("/api/test", (req, res) => {
    setTimeout(() => {
        res.json({ message: "Backend connected 🚀" });
    }, 3000);
  
});

// Connect DB and start server
(async () => {
  await connectDB();
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
})();
