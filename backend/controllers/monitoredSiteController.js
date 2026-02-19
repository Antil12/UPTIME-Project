import axios from "axios";
import MonitoredSite from "../models/MonitoredSite.js";
import SiteCurrentStatus from "../models/SiteCurrentStatus.js";
import SslStatus from "../models/SslStatus.js";
import { getStatusFromCode } from "../utils/statusHelper.js";

/* =====================================================
   GET ALL MONITORED SITES (NO FILTERS ❗)
===================================================== */
export const getMonitoredSites = async (req, res) => {
  try {
    const { category } = req.query; // optional query param

    const matchStage = {};
    if (category) matchStage.category = category;

    const pipeline = [
      { $match: matchStage }, // filter by category if provided
      {
        $lookup: {
          from: "sitecurrentstatuses",
          localField: "_id",
          foreignField: "siteId",
          as: "uptime",
        },
      },
      {
        $unwind: { path: "$uptime", preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: "sslstatuses",
          localField: "_id",
          foreignField: "siteId",
          as: "ssl",
        },
      },
      {
        $unwind: { path: "$ssl", preserveNullAndEmptyArrays: true },
      },
      { $sort: { createdAt: -1 } },
      {
        $project: {
          _id: 1,
          domain: 1,
          url: 1,
          category: 1, // include category
          emailContact: 1,
          phoneContact: 1,
          priority: 1,
          responseThresholdMs: 1,
          createdAt: 1,
          status: { $ifNull: ["$uptime.status", "UNKNOWN"] },
          statusCode: "$uptime.statusCode",
          responseTimeMs: "$uptime.responseTimeMs",
          lastCheckedAt: "$uptime.lastCheckedAt",
          sslStatus: "$ssl.sslStatus",
          sslDaysRemaining: "$ssl.daysRemaining",
          sslValidTo: "$ssl.validTo",
        },
      },
    ];

    const data = await MonitoredSite.aggregate(pipeline);

    res.json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error("❌ getMonitoredSites error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch monitored sites",
    });
  }
};


/* =====================================================
   GET GLOBAL STATUS STATS (FOR STAT CARDS)
===================================================== */
export const getStatusStats = async (req, res) => {
  try {
    const stats = await SiteCurrentStatus.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const result = {
      UP: 0,
      DOWN: 0,
      SLOW: 0,
    };

    stats.forEach((s) => {
      result[s._id] = s.count;
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("❌ getStatusStats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch status stats",
    });
  }
};

/* =====================================================
   GET SITE BY ID
===================================================== */
export const getSiteById = async (req, res) => {
  try {
    const site = await MonitoredSite.findById(req.params.id);

    if (!site) {
      return res.status(404).json({
        success: false,
        message: "Site not found",
      });
    }

    res.json({ success: true, data: site });
  } catch {
    res.status(500).json({
      success: false,
      message: "Failed to fetch site",
    });
  }
};

/* =====================================================
   ADD SITE
===================================================== */
export const addSite = async (req, res) => {
  try {
    const {
      domain,
      url,
      category,
      responseThresholdMs,
      alertChannels,
      regions,
      alertIfAllRegionsDown,
      emailContact,
      phoneContact,
      priority,
    } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: "URL is required",
      });
    }

    const site = await MonitoredSite.create({
      domain,
      url,
      category,
      responseThresholdMs: responseThresholdMs
  ? Number(responseThresholdMs)
  : null,

      alertChannels: alertChannels || [],
      regions: regions || [],
      alertIfAllRegionsDown: alertIfAllRegionsDown || false,

       emailContact: alertChannels?.includes("email")
      ? emailContact
  :     null,
       phoneContact: phoneContact || null,
       priority: Number(priority ?? 0),


    });

    res.status(201).json({
      success: true,
      data: site,
    });

  } catch (error) {
    console.error("❌ addSite error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add site",
    });
  }
};



/* =====================================================
   UPDATE SITE
===================================================== */
// export const updateSite = async (req, res) => {
//   try {
//     const { category } = req.body; // include category

//     const site = await MonitoredSite.findByIdAndUpdate(
//       req.params.id,
//       req.body,
//       { new: true }
//     );

//     if (!site) {
//       return res.status(404).json({
//         success: false,
//         message: "Site not found",
//       });
//     }

//     res.json({ success: true, data: site });
//   } catch {
//     res.status(500).json({
//       success: false,
//       message: "Failed to update site",
//     });
//   }
// };


export const updateSite = async (req, res) => {
  try {
    const {
      domain,
      url,
      category,
      emailContact,
      phoneContact,
      priority,
      responseThresholdMs,
    } = req.body;

    const updatedData = {
      domain,
      url,
      category,
      emailContact: emailContact || null,
      phoneContact: phoneContact || null,
      priority: priority !== undefined ? Number(priority) : 0,
      responseThresholdMs:
        responseThresholdMs !== undefined && responseThresholdMs !== null
          ? Number(responseThresholdMs)
          : null,
    };

    const site = await MonitoredSite.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { new: true }
    );

    if (!site) {
      return res.status(404).json({
        success: false,
        message: "Site not found",
      });
    }

    res.json({
      success: true,
      data: site,
    });
  } catch (error) {
    console.error("❌ updateSite error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update site",
    });
  }
};


/* =====================================================
   DELETE SITE (CLEAN RELATED DATA)
===================================================== */
export const deleteSite = async (req, res) => {
  try {
    const site = await MonitoredSite.findByIdAndDelete(req.params.id);

    if (!site) {
      return res.status(404).json({
        success: false,
        message: "Site not found",
      });
    }

    await SiteCurrentStatus.deleteOne({ siteId: site._id });
    await SslStatus.deleteOne({ siteId: site._id });

    res.json({
      success: true,
      message: "Site deleted successfully",
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Failed to delete site",
    });
  }
};

/* =====================================================
   CHECK & UPDATE SITE CURRENT STATUS
===================================================== */
export const checkAndUpdateSiteStatus = async (req, res) => {
  const { siteId } = req.params;

  try {
    const site = await MonitoredSite.findById(siteId);
    if (!site) {
      return res.status(404).json({
        success: false,
        message: "Site not found",
      });
    }

    let status = "UNKNOWN";
    let statusCode = null;
    let responseTimeMs = null;
    let reason = null;

    const startTime = Date.now();

    try {
      // 🔹 1️⃣ Try HEAD first
      let response;

      try {
        response = await axios.head(site.url, {
          timeout: 10000,
          validateStatus: () => true,
        });
      } catch (headError) {
        console.log("HEAD failed → trying GET fallback");

        // 🔹 2️⃣ Fallback to GET
        response = await axios.get(site.url, {
          timeout: 10000,
          validateStatus: () => true,
        });
      }

      responseTimeMs = Date.now() - startTime;
      statusCode = response.status;

      // 🔹 3️⃣ Decide Status
      if (statusCode >= 200 && statusCode < 400) {
        status = "UP";
      } else if (statusCode >= 400 && statusCode < 500) {
        status = "DOWN";
        reason = "CLIENT ERROR";
      } else if (statusCode >= 500) {
        status = "DOWN";
        reason = "SERVER ERROR";
      }

    } catch (err) {
      responseTimeMs = null;
      statusCode = null;

      if (err.code === "ECONNABORTED") {
        status = "SLOW";
        reason = "TIMEOUT";
      } else {
        status = "DOWN";
        reason = err.message || "REQUEST FAILED";
      }
    }

    // 🔹 4️⃣ Save in DB
    const currentStatus = await SiteCurrentStatus.findOneAndUpdate(
      { siteId },
      {
        siteId,
        status,
        statusCode,
        reason,
        responseTimeMs,
        lastCheckedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      data: currentStatus,
    });

  } catch (error) {
    console.error("❌ checkAndUpdateSiteStatus error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check site status",
    });
  }
};


/* =====================================================
   GET ALL CATEGORIES
===================================================== */
export const getCategories = async (req, res) => {
  try {
    const categories = await MonitoredSite.distinct("category"); // get unique categories
    const allCategories = ["ALL", ...categories.map((c) => c || "UNCATEGORIZED")];
    res.json({ success: true, data: allCategories });
  } catch (error) {
    console.error("❌ getCategories error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch categories" });
  }
};
