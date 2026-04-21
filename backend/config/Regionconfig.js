/**
 * regionConfig.js
 *
 * Single source of truth for all monitored regions.
 *
 * ── Field meanings ────────────────────────────────────────────────────────────
 *  name       → stored in MongoDB (MonitoredSite.regions[], RegionCurrentStatus.region,
 *               RegionUptimeLog.region). Must match EXACTLY — this is the key used
 *               across the entire system including the Lambda env var REGION.
 *  awsRegion  → AWS region code for serverless deploy
 *  label      → human-readable name shown in UI / logs
 */

export const REGIONS = [
  {
    name:      "Asia",
    awsRegion: "ap-south-1",        // Mumbai — closest to India
    label:     "Asia (Mumbai)",
  },
  {
    name:      "North America",
    awsRegion: "us-east-1",         // N. Virginia
    label:     "North America (N. Virginia)",
  },
  {
    name:      "Europe",
    awsRegion: "eu-west-1",         // Ireland
    label:     "Europe (Ireland)",
  },
  {
    name:      "South America",
    awsRegion: "sa-east-1",         // São Paulo
    label:     "South America (São Paulo)",
  },
  {
    name:      "Australia",
    awsRegion: "ap-southeast-2",    // Sydney
    label:     "Australia (Sydney)",
  },
  {
    name:      "Africa",
    awsRegion: "af-south-1",        // Cape Town
    label:     "Africa (Cape Town)",
  },
];

/** Quick O(1) lookup: region name → config object */
export const REGION_MAP = Object.fromEntries(REGIONS.map((r) => [r.name, r]));

/** All valid region name strings — matches MongoDB enum */
export const REGION_NAMES = REGIONS.map((r) => r.name);