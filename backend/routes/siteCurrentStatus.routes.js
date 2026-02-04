        import express from "express";
        import {
        getAllSiteStatus,
        getStatusBySiteId,
        } from "../controllers/siteCurrentStatus.controller.js";

        const router = express.Router();

        // GET all website status
        router.get("/", getAllSiteStatus);

        // GET single website status
        router.get("/:siteId", getStatusBySiteId);

        export default router;
