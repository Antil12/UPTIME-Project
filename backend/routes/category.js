// // routes/category.js
// import express from "express";
// import MonitoredSite from "../models/MonitoredSite.js";

// const router = express.Router();

// // GET all unique categories
// router.get("/", async (req, res) => {
//   try {
//     const categories = await MonitoredSite.distinct("category");
//     // optional: remove null or empty
//     const filtered = categories.filter((c) => c && c.trim() !== "");
//     res.json({ success: true, data: filtered });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false, message: "Failed to fetch categories" });
//   }
// });

// export default router;
