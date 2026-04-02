import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import RegionPageUI from "../components/RegionPageUI";

const Region = ({ theme }) => {
  const { region } = useParams();
  const navigate = useNavigate();

  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(false);

  const decodedRegion = decodeURIComponent(region || "");

  useEffect(() => {
    const fetchSites = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `/monitoredsite/regions/${encodeURIComponent(decodedRegion)}`
        );
        setSites(res.data?.data || []);
      } catch (err) {
        console.error("Failed to fetch region sites:", err);
        setSites([]);
      } finally {
        setLoading(false);
      }
    };

    if (decodedRegion) {
      fetchSites();
    }
  }, [decodedRegion]);

  return (
    <RegionPageUI
      decodedRegion={decodedRegion}
      sites={sites}
      loading={loading}
      onBack={() => navigate("/regions")}
      theme={theme}
    />
  );
};

export default Region;