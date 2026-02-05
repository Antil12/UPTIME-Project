import axios from "axios";
import MonitoredSite from "../models/MonitoredSite.js";
import SiteCurrentStatus from "../models/SiteCurrentStatus.js";
import SslStatus from "../models/SslStatus.js";

/* =====================================================
   GET ALL SITES WITH CURRENT STATUS + SSL
===================================================== */
export const getAllSites = async (req, res) => {
  try {
    // 1️⃣ Fetch sites
    const sites = await MonitoredSite.find().sort({ createdAt: -1 });

    const siteIds = sites.map(site => site._id);

    // 2️⃣ Fetch uptime status
    const statuses = await SiteCurrentStatus.find({
      siteId: { $in: siteIds },
    });

    const statusMap = {};
    statuses.forEach(s => {
      statusMap[s.siteId.toString()] = s;
    });

    // 3️⃣ 🔐 Fetch SSL status
    const sslStatuses = await SslStatus.find({
      siteId: { $in: siteIds },
    });

    const sslMap = {};
    sslStatuses.forEach(s => {
      sslMap[s.siteId.toString()] = s;
    });

    // 4️⃣ Merge everything
    const data = sites.map(site => {
      const s = statusMap[site._id.toString()];
      const ssl = sslMap[site._id.toString()];

      return {
        _id: site._id,
        domain: site.domain,
        url: site.url,

        // uptime
        status: s?.status ?? "UNKNOWN",
        statusCode: s?.statusCode ?? null,
        responseTimeMs: s?.responseTimeMs ?? null,
        lastCheckedAt: s?.lastCheckedAt ?? null,

        // ssl
        sslStatus: ssl?.sslStatus ?? null,
        sslDaysRemaining: ssl?.daysRemaining ?? null,
        sslValidTo: ssl?.validTo ?? null,
      };
    });

    res.json({ success: true, count: data.length, data });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch sites",
      error: error.message,
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
      return res.status(404).json({ success: false, message: "Site not found" });
    }

    res.json({ success: true, data: site });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch site",
      error: error.message,
    });
  }
};

/* =====================================================
   ADD NEW SITE
===================================================== */
export const addSite = async (req, res) => {
  try {
    const { domain, url } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: "URL is required",
      });
    }

    const site = await MonitoredSite.create({ domain, url });

    res.status(201).json({ success: true, data: site });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to add site",
      error: error.message,
    });
  }
};

/* =====================================================
   UPDATE SITE
===================================================== */
export const updateSite = async (req, res) => {
  try {
    const site = await MonitoredSite.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!site) {
      return res.status(404).json({ success: false, message: "Site not found" });
    }

    res.json({ success: true, data: site });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update site",
      error: error.message,
    });
  }
};

/* =====================================================
   DELETE SITE
===================================================== */
export const deleteSite = async (req, res) => {
  try {
    const site = await MonitoredSite.findByIdAndDelete(req.params.id);

    if (!site) {
      return res.status(404).json({ success: false, message: "Site not found" });
    }

    await SiteCurrentStatus.deleteOne({ siteId: req.params.id });
    await SslStatus.deleteOne({ siteId: req.params.id });

    res.json({ success: true, message: "Site deleted successfully" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete site",
      error: error.message,
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
      return res.status(404).json({ success: false, message: "Site not found" });
    }

    const startTime = Date.now();
    let status = "DOWN";
    let statusCode = null;
    let responseTimeMs = null;

    try {
      const response = await axios.get(site.url, {
        timeout: 10000,
        validateStatus: () => true,
      });

      responseTimeMs = Date.now() - startTime;
      statusCode = response.status;

      if (statusCode >= 200 && statusCode < 400) {
        status = responseTimeMs > 3000 ? "SLOW" : "UP";
      }
    } catch {
      status = "DOWN";
    }

    const currentStatus = await SiteCurrentStatus.findOneAndUpdate(
      { siteId },
      {
        siteId,
        status,
        statusCode,
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
    res.status(500).json({
      success: false,
      message: "Failed to check site status",
      error: error.message,
    });
  }
};
