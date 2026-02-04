import mongoose from "mongoose"

const uptimeDailyStatSchema = new mongoose.Schema({

    siteId: { type: mongoose.Schema.Types.ObjectId, ref: "MonitoredSite", required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  totalChecks: { type: Number, default: 0 },
  upCount: { type: Number, default: 0 },
  downCount: { type: Number, default: 0 },
  slowCount: { type: Number, default: 0 },
  avgResponseTimeMs: { type: Number, default: 0 },
  uptimePercentage: { type: Number, default: 100 },
    
});

export default mongoose.model("uptimeDailyStat",uptimeDailyStatSchema)