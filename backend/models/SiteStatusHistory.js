// import mongoose from "mongoose";

// const siteStatusHistorySchema = new mongoose.Schema({
//   siteId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "MonitoredSite",
//     required: true,
//   },
//   status: {
//     type: String, // UP, DOWN, SLOW
//     required: true,
//   },
//   responseTimeMs: Number,
//   statusCode: Number,
//   checkedAt: {
//     type: Date,
//     default: Date.now,
//   },
// });

// const SiteStatusHistory =
//   mongoose.models.SiteStatusHistory ||
//   mongoose.model("SiteStatusHistory", siteStatusHistorySchema);

// export default SiteStatusHistory;
