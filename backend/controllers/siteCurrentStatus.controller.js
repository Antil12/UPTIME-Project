import mongoose from "mongoose";
import SiteCurrentStatus from "../models/SiteCurrentStatus.js";


// GET all site statuses
export const getAllSiteStatus = async (req, res) => {
  try {
    const data = await SiteCurrentStatus
      .find()
      .populate("siteId", "domain url");

    res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch site statuses",
      error: error.message,
    });
  }
};



// GET status by siteId
export const getStatusBySiteId = async (req, res) => {
  try {
    const { siteId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(siteId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid siteId",
      });
    }

    const statusDoc = await SiteCurrentStatus
      .findOne({ siteId })
      .populate("siteId", "domain url");

    if (!statusDoc) {
      return res.status(404).json({
        success: false,
        message: "Status not found",
      });
    }

    res.status(200).json({
      success: true,
      data: statusDoc,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch site status",
      error: error.message,
    });
  }
};
