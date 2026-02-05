import mongoose from "mongoose";
import UptimeLog from "../models/UptimeLog.js";

export const getUptimeLogsBySite = async (req, res) => {
  try {
    const { siteId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(siteId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid siteId",
      });
    }

    const logs = await UptimeLog.find({ siteId })
      .sort({ timestamp: 1 }) // oldest first
      .lean();

    const formattedLogs = logs.map((log) => ({
      _id: log._id,
      siteId: log.siteId,
      status: ["UP", "SLOW"].includes(log.status) ? log.status : "DOWN",
      statusCode: log.statusCode ?? null,
      responseTimeMs: log.responseTime ?? null,
      timestamp: log.timestamp, // consistent naming
    }));

    res.status(200).json({
      success: true,
      count: formattedLogs.length,
      data: formattedLogs,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch uptime logs",
      error: error.message,
    });
  }
};
