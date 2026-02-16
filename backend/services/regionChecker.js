import axios from "axios";

export const checkRegions = async (site) => {
  const results = {};

  await Promise.all(
    site.regions.map(async (region) => {
      try {
        const response = await axios.get(site.url, {
          timeout: 10000,
          validateStatus: () => true,
        });

        results[region] = response.status >= 400 ? "DOWN" : "UP";
      } catch {
        results[region] = "DOWN";
      }
    })
  );

  return results;
};
