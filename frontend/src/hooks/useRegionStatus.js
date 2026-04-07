import { useState, useEffect } from "react";
import axios from "axios";

export function useRegionStatus(siteId) {
  const [regions, setRegions] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!siteId) return;

    axios
      .get(`/api/region-report/${siteId}`)
      .then((res) => setRegions(res.data.regions || {}))
      .catch(() => setRegions({}))
      .finally(() => setLoading(false));
  }, [siteId]);

  return { regions, loading };
}
